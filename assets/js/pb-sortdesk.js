/* pb-sortdesk.js — 录入分拣台（R1-B 拆出） */
"use strict";

/* ---------------- 录入分拣台（I22）：素材池 + Excel 式行编辑 + 批量导入 ---------------- */

const SORT_POOL_DIR = "文件夹批量录入";
const SORT_DONE_DIR = "已录入";
const SORT_SLOTS = [["1-stand", "站位"], ["2-aim", "瞄点"], ["4-result", "落点&效果"]];
const SORT_IMG_RE = /\.(png|jpe?g|webp)$/i;
const sortSt = {
  open: false, rows: [], pool: new Map(), groupParents: new Map(),
  selectedUid: null,       // 快速分拣目标行（I24：预览按 1/2/4 入坑的目标）
  preview: null,           // 当前大图预览的池 key（I24）
  importing: false, skipNoImg: false, sortEl: null,
  globalMap: localStorage.getItem("pb-sort-map") ?? "",   // ""=全部素材；具体地图=池过滤+行兜底（I29）
};

// I35：media 目录改名迁移（逐文件读→写新路径→删旧→删空目录；幂等：旧目录不存在即完成）。
// 返回迁移文件数。map 同时变化时新目录的 map 段一并换。
async function migrateMediaDir(oldMap, oldId, newMap, newId) {
  const media = await rootDirHandle.getDirectoryHandle("media");
  let srcMap = null;
  try { srcMap = await media.getDirectoryHandle(oldMap); } catch { return 0; }
  let src = null;
  try { src = await srcMap.getDirectoryHandle(oldId); } catch { return 0; }
  const dstMap = newMap === oldMap ? srcMap : await media.getDirectoryHandle(newMap, { create: true });
  const dst = await dstMap.getDirectoryHandle(newId, { create: true });
  let n = 0;
  for await (const [name, h] of src.entries()) {
    if (h.kind !== "file") continue;
    const f = await h.getFile();
    const fh = await dst.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(f);
    await w.close();
    await h.remove();
    n++;
  }
  try { await srcMap.removeEntry(oldId, { recursive: true }); } catch { /* 目录已空/已删 */ }
  return n;
}

// I35：id 改名全量迁移（幂等可重试）。ready＝磁盘步骤立即做；非 ready＝磁盘挂起（_renamedFrom
// 标记，🔑 后由 flushPendingEntries 补做）。浏览器侧键迁移（favs/覆盖层/pending-images/搁置区）
// 与内存 data.entries/diskEntries 换 id 无论如何都立即做。返回 {ok, movedN, msg}。
async function renameEntry(oldId, newId, opts = {}) {
  if (oldId === newId) return { ok: true, movedN: 0 };
  const ready = rootPerm === "ready" && rootDirHandle;
  let movedN = 0;
  // —— 浏览器侧（无条件，先做）——
  const favs = favList();
  if (favs.includes(oldId)) localStorage.setItem(FAVS_KEY, JSON.stringify(favs.map(x => (x === oldId ? newId : x))));
  const ov = entryOverrides();
  ov.deleted = [...new Set([...(ov.deleted || []).filter(x => x !== newId), oldId])];   // 旧 .md 待删/对旧 data.js 隐藏
  if (ov.edited?.[oldId]) { ov.edited[newId] = { ...ov.edited[oldId], id: newId, _renamedFrom: oldId }; delete ov.edited[oldId]; }
  if (ov.savedAt?.[oldId]) { ov.savedAt[newId] = ov.savedAt[oldId]; delete ov.savedAt[oldId]; }
  if (ov.written?.[oldId]) { ov.written[newId] = ov.written[oldId]; delete ov.written[oldId]; }
  saveEntryOverrides(ov);
  for (const { key, blob, ext } of await allIdbImages()) {
    if (key.startsWith(oldId + "/")) {
      await putIdbImage(`${newId}/${key.slice(oldId.length + 1)}`, blob, ext);
      await removeIdbImage(key);
    }
  }
  const rst = retiredStore();
  if (rst.entries[oldId]) { rst.entries[newId] = rst.entries[oldId]; delete rst.entries[oldId]; saveRetiredStore(rst); }
  // 内存换 id（渲染与保存基线同源）
  for (const it of data.entries) if (it.id === oldId) it.id = newId;
  for (const it of diskEntries) if (it.id === oldId) it.id = newId;
  // —— 磁盘侧（ready 立即；非 ready 挂起给 flush）——
  if (ready) {
    const e = opts.entry || null;
    if (e) await writeEntryFile(e);            // 新 .md（编辑器保存路径会再写一次，幂等无害）
    await deleteEntryFile(oldId);              // 旧 .md（不存在则静默）
    movedN = await migrateMediaDir(opts.oldMap || (e ? e.map : ""), oldId, opts.newMap || (e ? e.map : ""), newId);
    // related 引用改写（受影响条目立即写回）
    for (const it of data.entries) {
      if (!Array.isArray(it.related) || !it.related.includes(oldId)) continue;
      it.related = it.related.map(x => (x === oldId ? newId : x));
      await writeEntryFile(it);
      const o2 = entryOverrides();
      o2.edited = o2.edited || {}; o2.edited[it.id] = { ...it };
      o2.savedAt[it.id] = isoNow(); o2.written[it.id] = true;
      saveEntryOverrides(o2);
    }
    // tactics uses 改写（文本替换；tactics 目录通常为空，尽力而为）
    try {
      const tdir = await rootDirHandle.getDirectoryHandle("tactics");
      for await (const [name, h] of tdir.entries()) {
        if (h.kind !== "file" || !name.endsWith(".md")) continue;
        const txt = await (await h.getFile()).text();
        if (txt.includes(oldId)) {
          const fh = await h.createWritable();
          await w_close(fh, txt.split(oldId).join(newId));
        }
      }
    } catch { /* tactics 迁移失败不阻断主流程 */ }
  }
  return { ok: true, movedN };
  async function w_close(fh, content) { await fh.write(content); await fh.close(); }
}

// I35：统一自动编号。<map去前缀>-<side小写>-<type>-<两位序号>；序号取该前缀下未被占用
// （data.entries 全量 + 分拣台各行 + extraUsed）的最小号，1..99 逐试，全占用兜底时间戳尾巴。
// id 不承载语义（起点/目标/标题随意改不影响 id）；改 map/side/type 由 ef-save 的 renameEntry 迁移。
function autoEntryId({ map, side, type }, extraUsed) {
  const short = String(map || "").startsWith("de_") ? map.slice(3) : String(map || "");
  const base = `${short}-${String(side || "t").toLowerCase()}-${type}-`;
  const used = new Set(data.entries.map(x => x.id));
  for (const r of (sortSt.rows || [])) if (r.id) used.add(r.id);
  for (const x of extraUsed || []) used.add(x);
  for (let n = 1; n <= 99; n++) {
    const nn = String(n).padStart(2, "0");
    if (!used.has(base + nn)) return base + nn;
  }
  return base + Date.now().toString(36).slice(-4);
}

// 子文件夹名 → 地图：与 maps.json 的 cn 做归一化宽匹配（Ⅱ/III/II 写法差异）
function sortNormCn(s) {
  return String(s || "").trim().replace(/Ⅱ/g, "II").replace(/Ⅲ/g, "III").toLowerCase();
}
function sortMapFromGroup(group) {
  const g = sortNormCn(group);
  if (!g) return "";
  for (const [key, m] of Object.entries(data.maps)) {
    const cn = sortNormCn(m.cn || "");
    if (cn && (cn === g || cn.includes(g) || g.includes(cn))) return key;
  }
  return "";
}

// 递归扫描 文件夹批量录入/（跳过 已录入/），按子文件夹分组、组内按文件名排序
async function sortScanPool() {
  sortSt.pool.clear();
  sortSt.groupParents.clear();
  if (rootPerm !== "ready" || !rootDirHandle) return;
  let poolRoot = null;
  try { poolRoot = await rootDirHandle.getDirectoryHandle(SORT_POOL_DIR); }
  catch { return; }   // 没有素材文件夹 = 空池
  const walk = async (dir, parentDir, group) => {
    const names = [];
    const dirs = [];
    for await (const [name, h] of dir.entries()) {
      if (h.kind === "file" && SORT_IMG_RE.test(name)) names.push([name, h]);
      else if (h.kind === "directory" && name !== SORT_DONE_DIR) dirs.push([name, h]);
    }
    names.sort((a, b) => a[0].localeCompare(b[0], "zh"));
    for (const [name, h] of names) {
      sortSt.pool.set(group + "/" + name, { group, name, handle: h, parentDir, url: null });
    }
    for (const [name, h] of dirs) {
      sortSt.groupParents.set(group ? group + "/" + name : name, dir);
      await walk(h, dir, group ? group + "/" + name : name);
    }
  };
  sortSt.groupParents.set("", poolRoot);
  await walk(poolRoot, poolRoot, "");
}

async function sortPoolThumb(item) {
  if (!item.url) {
    try {
      const f = await item.handle.getFile();
      item.url = URL.createObjectURL(f);
    } catch { return ""; }
  }
  return item.url;
}

function sortRowMap(row) {
  for (const s of Object.values(row.slots || {})) {   // I44：row.slots 缺字段防御
    if (s?.src === "pool") {
      const m = sortMapFromGroup(s.group);
      if (m) return { map: m, group: s.group };
    }
  }
  return { map: sortSt.globalMap, group: "" };   // globalMap=""（全部素材）且无池图 → 行地图未定，导入时拦截
}

// id 全自动生成（I24/I35）：委托 autoEntryId（side 参与前缀，CT 行不再硬编码 -t-）。
// extraUsed：导入循环里传入"本批已导入的 id"（I30 修正——刚导入的条目尚未进 data.entries）。
function sortAutoId(row, extraUsed) {
  if (row.idTouched && row.id) return;
  row.id = autoEntryId({ map: sortRowMap(row).map, side: row.side || "T", type: row.type }, extraUsed);
}

function sortAddRow() {
  const row = {
    uid: "r" + Date.now() + Math.random().toString(36).slice(2, 6),
    title: "", origin: "", targets: [], id: "", idTouched: false, adv: false,
    side: "T", type: "smoke", click: "lmb", move: "stand", action: "jump",
    phase: "default", verified: true, notes: "",
    slots: { "1-stand": null, "2-aim": null, "4-result": null },
  };
  sortAutoId(row);
  sortSt.rows.push(row);
  return row;
}

// 放图进槽：payload = {kind:"pool", item} | {kind:"file", file}
async function sortPutToSlot(row, slotName, payload) {
  let item = null;
  try {
    if (payload.kind === "pool") {
      const f = await payload.item.handle.getFile();
      const { blob, ext } = await compressToSlot(f);
      item = { src: "pool", group: payload.item.group, name: payload.item.name,
               blob, ext, url: URL.createObjectURL(blob), poolKey: payload.item.group + "/" + payload.item.name,
               poolItem: payload.item };   // 归还素材池时需要完整原对象（handle 等）
      sortSt.pool.delete(item.poolKey);   // 一图一坑：放下即从池移除
    } else {
      const { blob, ext } = await compressToSlot(payload.file);
      item = { src: "file", group: "", name: payload.file.name || "图片", blob, ext, url: URL.createObjectURL(blob), poolKey: null };
    }
  } catch { toast("图片读取失败"); return; }
  const old = row.slots[slotName];
  if (old?.src === "pool" && old.poolKey && !sortSt.pool.has(old.poolKey)) {
    // 换图时旧池图归还素材池
    sortSt.pool.set(old.poolKey, old.poolItem);
  }
  if (old?.url) URL.revokeObjectURL(old.url);
  row.slots[slotName] = item;
  sortAutoId(row);   // 地图确定后 id 定型（I24）
}

// 一点多用（I30）：已入坑的池图复制一份回素材池（槽内图保留；克隆与原图共享 handle，
// poolKey 唯一即可无损往返既有归还链路——× 取下/换图/删行按各自 poolKey 原样还原）
function sortCopyBackToPool(row, slotName) {
  const s = row.slots[slotName];
  if (!s || s.src !== "pool" || !s.poolKey || !s.poolItem) { toast("只有从素材池放入的图才能复制"); return; }
  const base = s.poolKey;
  let n = 1;
  while (sortSt.pool.has(`${base}::c${n}`)) n++;
  const cloneKey = `${base}::c${n}`;
  sortSt.pool.set(cloneKey, s.poolItem);   // 共享同一 poolItem（不重读文件）
  drawSortStation();
  toast(`已复制一份回素材池 ✓（${sortSt.pool.get(cloneKey).name}）——从池里分给下一行`);
}

function sortRemoveRow(uid) {  const i = sortSt.rows.findIndex(r => r.uid === uid);
  if (i < 0) return;
  const row = sortSt.rows[i];
  for (const s of Object.values(row.slots)) {
    if (s?.src === "pool" && s.poolKey) sortSt.pool.set(s.poolKey, s.poolItem);   // 归还素材池
    if (s?.url) URL.revokeObjectURL(s.url);
  }
  if (sortSt.selectedUid === uid) sortSt.selectedUid = null;
  sortSt.rows.splice(i, 1);
}

// 行校验：返回问题文案数组（空 = 可导）。id 全自动生成（I24），只拦手改冲突与缺起点
function sortRowProblems(row, usedIds) {
  const ps = [];
  if (!sortRowMap(row).map) ps.push("缺地图（先放一张素材图，或在右上角选全局地图）");
  const id = (row.id || "").trim();
  if (!/^[a-z0-9-]+$/.test(id)) ps.push("id 含非法字符");
  else if (usedIds.has(id)) ps.push("id 已存在（冲突）");
  if (!(row.origin || "").trim()) ps.push("缺起点");   // I44：origin 缺字段防御
  return ps;
}

function sortRowHasAllImages(row) {
  return Object.values(row.slots || {}).every(Boolean);   // I44：slots 缺字段防御
}

// 组内素材全部消费且无其他行引用 → 子文件夹移入 已录入/（I42：只认磁盘真值，见下方判定顺序）
async function sortMaybeMoveGroup(group) {
  if (!group) return null;
  for (const row of sortSt.rows) {
    for (const s of Object.values(row.slots)) {
      if (s?.src === "pool" && s.group === group) return `「${group}」还有行未导入，暂不移入已录入`;
    }
  }
  // R3 批次 0（I42 修）：归档条件改为「行无引用 + 池无剩余（全量不过滤）」——
  // I42 原判定 diskLeft>0 永真：导入副本留在源文件夹，磁盘枚举恒 ≥1 → 除空文件夹外组永不归档。
  // 修法=池全量无剩余（不受 globalMap 过滤影响）即全部图片均已入坑并导入，磁盘上的源文件是导入副本，安全归档。
  let poolRemaining = 0;
  for (const [, item] of sortSt.pool) { if (item.group === group) poolRemaining++; }
  if (poolRemaining > 0) return `「${group}」还有 ${poolRemaining} 张未入坑，文件夹保留在素材池`;
  // 池无剩余 → 安全归档（复制源文件夹到 已录入/ 后删源目录）
  const parentDir = sortSt.groupParents.get(group) || (rootDirHandle
    ? await rootDirHandle.getDirectoryHandle(SORT_POOL_DIR).catch(() => null) : null);
  if (!parentDir) return null;
  try {
    const doneDir = await parentDir.getDirectoryHandle(SORT_DONE_DIR, { create: true });
    const srcDir = await parentDir.getDirectoryHandle(group);
    const doneSub = await doneDir.getDirectoryHandle(group, { create: true });
    for await (const [name, h] of srcDir.entries()) {
      if (h.kind !== "file") continue;
      const f = await h.getFile();
      const fh = await doneSub.getFileHandle(name, { create: true });
      const w = await fh.createWritable();
      await w.write(f);
      await w.close();
    }
    await parentDir.removeEntry(group, { recursive: true });
    return "moved";
  } catch {
    return "move-fail";
  }
}

// 批量导入：逐行校验→写盘→汇总
async function sortImportAll() {
  if (sortSt.importing) return;
  sortSt.importing = true;
  try {
    await initRootHandle();   // I44：先刷新权限旗标——过期提前暴露，走优雅降级而非中途炸
    const problems = [];
    const usedIds = new Set(data.entries.map(x => x.id));
    const doneGroups = [];
    let ok = 0, skip = 0, autoOnelineN = 0;
    const ov = entryOverrides();
    ov.added = ov.added || [];
    ov.savedAt = ov.savedAt || {};
    ov.written = ov.written || {};
    for (const row of [...sortSt.rows]) {
      // I44：逐行容错——单行失败不炸整批；失败行不做出队/归还/usedIds.add，留在表格里可修复重导
      try {
        sortAutoId(row, usedIds);   // id 兜底生成（I24；I30 修正：传入本批已用号防重算冲突）
        const ps = sortRowProblems(row, usedIds);
        const noImg = !sortRowHasAllImages(row);
        if (ps.length || (noImg && sortSt.skipNoImg)) {
          skip++;
          // I44：空行单独给醒目文案（主诉「没反应」的观感多半是这类行静默跳过）
          const emptyRow = !String(row.title || "").trim() && !String(row.origin || "").trim()
            && !(row.targets || []).length && !Object.values(row.slots || {}).some(Boolean);
          problems.push(emptyRow
            ? `「未命名行」这一行还是空的——先点素材图放大，按 1/2/4 入坑`
            : `「${row.title || row.id || "未命名行"}」跳过：${ps.length ? ps.join("、") : "缺图（勾选了跳过缺图行）"}`);
          continue;
        }
      const { map } = sortRowMap(row);
      const targets = row.targets.filter(Boolean);
      const spots = [...new Set([row.origin, ...targets].filter(Boolean))];
      // 空备注自动生成（I31）：起点→目标，投法（与卡片徽章同款中文）；零输入零拦截
      let oneline = row.notes.trim();
      let autoOneline = false;
      if (!oneline) {
        const tg = targets.length ? targets.join(" / ") : "";
        oneline = `${row.origin.trim()}→${tg}，${throwBadge(row.click, row.move, row.action)}`;
        autoOneline = true;
      }
      const entry = {
        id: row.id.trim(), map, side: row.side || "T", type: row.type,
        click: row.click, move: row.move, action: row.action,
        origin: row.origin.trim(),
        target: targets.length === 1 ? targets[0] : targets.length ? targets : "",
        title: row.title.trim() || "未命名",
        oneline,
        difficulty: "normal", phase: [row.phase], status: row.verified ? "verified" : "draft",
        spots, tags: [], related: [],
        source: { kind: "self", creator: "自己", url: "" },
        notes: "",
      };
      if (autoOneline) autoOnelineN++;
      if (entry.status === "verified") entry.checked = new Date().toISOString().slice(0, 10);
      // 图片：走既有写盘管线（已关联）或 IndexedDB 待写图（未关联）
      const images = [];
      let imgFail = false;
      for (const [slotName, s] of Object.entries(row.slots)) {
        if (!s) continue;
        let path = null;
        if (rootPerm === "ready" && rootDirHandle) {
          const bare = await writeEntryImage(entry, slotName, s.blob, s.ext);
          // writeEntryImage 返回裸文件名（I32）：拼全相对路径再入 images，否则显示端 404 黑图
          path = bare ? `media/${entry.map}/${entry.id}/${bare}` : null;
        } else {
          await putIdbImage(`${entry.id}/${slotName}`, s.blob, s.ext);
          path = `idb:${entry.id}/${slotName}`;
        }
        if (path) images.push({ slot: slotName, label: slotLabel(slotName), path });
        else imgFail = true;
      }
      entry.images = images;
      // 条目写盘：已关联走 writeEntryFile；未关联进覆盖层待写。
      // 无论成败都入覆盖层：写盘成功=显示缓存（written=true，下次 build 退役），
      // 失败=待写（written=false，徽标提示，开机补写）
      let wrote = false;
      if (rootPerm === "ready" && rootDirHandle) wrote = await writeEntryFile(entry);
      ov.added.push({ ...entry });
      ov.savedAt[entry.id] = isoNow();
      ov.written[entry.id] = wrote;
      usedIds.add(entry.id);
      if (imgFail) problems.push(`「${entry.title}」有图片写盘失败（其余已导入）`);
      // 成功行出队 + 归还其行内未用的池图（无）+ 记组
      sortSt.rows.splice(sortSt.rows.indexOf(row), 1);
      for (const s of Object.values(row.slots)) if (s?.url) URL.revokeObjectURL(s.url);
      const groups = new Set(Object.values(row.slots).filter(s => s?.src === "pool").map(s => s.group));
      doneGroups.push(...groups);
      ok++;
      } catch (err) {
        // I44：该行导入失败——留在表格可修复重导，其余行照常
        skip++;
        problems.push(`「${row.title || row.id || "未命名行"}」导入失败：${err?.message || err}`);
      }
    }
    saveEntryOverrides(ov);
    applyEntryOverrides();
    // 组收尾：素材已空的子文件夹移入 已录入/
    // I46：分类拆分——「还有…未入坑/还有行未导入」＝归档状态备注（info，进 notes）；
    // 「移入已录入失败（文件可能被占用）」＝真问题（进 problems）。判定逻辑（I42 磁盘真值）不动。
    let movedN = 0;
    const notes = [];
    for (const g of [...new Set(doneGroups)]) {
      const r = await sortMaybeMoveGroup(g);
      if (r === "moved") movedN++;
      else if (r === "move-fail") problems.push(`「${g}」移入「${SORT_DONE_DIR}」失败（文件可能被占用）`);
      else if (r && r.includes("还有")) notes.push(`${r}——全都入册后会自动移入『${SORT_DONE_DIR}』留档`);
      else if (r) problems.push(r);   // null=无提示
    }
    render();
    refreshSyncBadge();
    drawSortStation();
    const movedNote = movedN ? `；「已全部入册」的 ${movedN} 个素材文件夹移入「${SORT_DONE_DIR}/」留档（图没删，想重录可从那里拷回）` : "";
    const autoNote = autoOnelineN ? `（其中 ${autoOnelineN} 条一句话自动生成，可在编辑器润色）` : "";
    if (problems.length || notes.length) {
      // I44/I46：有行被拦下/失败时弹居中结果弹层逐行列原因（备注独立小节弱化展示）——不再只刷左下角一行小字
      sortSt.lastProblems = [...problems, ...notes.map(n => `备注：${n}`)];
      const btn = document.getElementById("sort-import");
      if (btn && problems.length) {
        btn.classList.remove("shake");
        void btn.offsetWidth;   // 重启动画
        btn.classList.add("shake");
        setTimeout(() => btn.classList.remove("shake"), 600);
      }
      openImportResult(ok, problems, notes, autoNote, movedNote);
    } else {
      toast(`成功导入 ${ok} 条${autoNote}${movedNote}${ok ? "——双击「同步并打包.bat」固化" : ""}`);
    }
  } finally {
    sortSt.importing = false;
  }
}

// I44：导入结果弹层（居中，逐行列出行名+原因；「知道了」关闭）
// I46：problems（真拦截）与 notes（归档状态备注）分开展示——头部计数只算真问题
function openImportResult(ok, problems, notes, autoNote, movedNote) {
  document.getElementById("import-result")?.remove();
  const ov = document.createElement("div");
  ov.className = "sort-preview";
  ov.id = "import-result";
  ov.innerHTML = `
    <div class="import-result-card">
      <div class="ir-head">${ok ? `已导入 ${ok} 条` : "一条都没导入"}${problems.length ? `<span> / ${problems.length} 条被拦下</span>` : ""}</div>
      ${autoNote ? `<div class="ir-sub">${autoNote.replace(/[（）]/g, "")}</div>` : ""}
      ${movedNote ? `<div class="ir-sub">${movedNote.replace(/^；/, "")}</div>` : ""}
      ${problems.length ? `<div class="ir-list">${problems.map(p => `<div class="ir-line">${escapeHtml(p)}</div>`).join("")}</div>` : ""}
      ${notes.length ? `<div class="ir-notes">${notes.map(n => `<div class="ir-note">ℹ ${escapeHtml(n)}</div>`).join("")}</div>` : ""}
      <div class="ir-foot"><button type="button" class="editor-btn primary" id="ir-ok">知道了</button></div>
    </div>`;
  document.body.appendChild(ov);
  $("#ir-ok", ov).addEventListener("click", () => ov.remove());
  ov.addEventListener("click", ev => { if (ev.target === ov) ov.remove(); });
}

function sortCellSelect(value, opts, attr, row) {
  return `<select data-row="${row.uid}" data-k="${attr}">${opts.map(([v, cn]) =>
    `<option value="${v}" ${value === v ? "selected" : ""}>${cn}</option>`).join("")}</select>`;
}

function openSortStation() {
  if (sortSt.open) return;
  sortSt.open = true;
  if (!sortSt.rows.length) sortAddRow();
  const el = document.createElement("div");
  el.className = "sort-overlay";
  el.id = "sort-station";
  el.innerHTML = `
    <div class="sort-head">
      <button class="editor-btn" id="sort-back">← 返回</button>
      <h2>📥 录入分拣台</h2>
      <span class="sort-flow">① 行选中 → ② 点素材大图：1 站位入坑顺手选起点、4 落点入坑顺手选目标（只弹一次）→ ③ 全部导入；关联报点=起点+目标自动生成</span>
      <label class="sort-global-map">素材范围／行地图兜底
        <select id="sort-global-map"></select>
      </label>
      <span class="sort-pool-state" id="sort-pool-state"></span>
    </div>
    <div class="sort-pool" id="sort-pool"></div>
    <div class="sort-table-wrap" id="sort-table"></div>
    <div class="sort-foot">
      <div class="sort-problems" id="sort-problems"></div>
      <div class="sort-actions">
        <label class="chk"><input type="checkbox" id="sort-skip-noimg"> 跳过缺图行</label>
        <button class="editor-btn" id="sort-add-row">＋ 加行</button>
        <button class="editor-btn primary" id="sort-import">全部导入</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  sortSt.sortEl = el;

  const mapSel = $("#sort-global-map", el);
  // 首项「全部素材」（I29）：选择同时决定素材池的地图过滤范围与行地图兜底
  mapSel.innerHTML = `<option value="" ${sortSt.globalMap === "" ? "selected" : ""}>全部素材</option>` +
    mapOrder().filter(m => data.maps[m].radar_exists)
      .map(m => `<option value="${m}" ${m === sortSt.globalMap ? "selected" : ""}>${data.maps[m].cn || m}</option>`).join("");
  mapSel.addEventListener("change", () => {
    sortSt.globalMap = mapSel.value;
    localStorage.setItem("pb-sort-map", mapSel.value);
    for (const row of sortSt.rows) if (!row.idTouched) { row.id = ""; sortAutoId(row); }
    drawSortStation();
  });

  $("#sort-back", el).addEventListener("click", closeSortStation);
  $("#sort-add-row", el).addEventListener("click", () => { sortAddRow(); drawSortStation(); });
  $("#sort-skip-noimg", el).addEventListener("change", ev => { sortSt.skipNoImg = ev.target.checked; });
  $("#sort-import", el).addEventListener("click", () => {
    // I44：最后一道兜底——async 异常不再凭空消失
    sortImportAll().catch(err => {
      console.error(err);
      toast(`导入出错：${err?.message || err}（详情见控制台）`);
    });
  });

  // Esc 关闭（document 捕获；大图预览/槽复看/选点/设置弹窗打开时让位，I33 加 viewer 判定）
  sortSt.onSortKey = ev => {
    if (ev.key === "Escape" && !state.picking && !sortSt.preview && !document.getElementById("sort-view")) {
      ev.stopPropagation(); closeSortStation();
    }
  };
  document.addEventListener("keydown", sortSt.onSortKey, true);
  // 共享上传 input：点槽上传
  const upInput = document.createElement("input");
  upInput.type = "file";
  upInput.accept = ".png,.jpg,.jpeg,.webp,image/*";
  upInput.hidden = true;
  el.appendChild(upInput);
  let upTarget = null;
  upInput.addEventListener("change", async () => {
    const f = upInput.files[0];
    upInput.value = "";
    if (!f || !upTarget) return;
    const row = sortSt.rows.find(r => r.uid === upTarget.uid);
    if (!row) return;
    await sortPutToSlot(row, upTarget.slot, { kind: "file", file: f });
    drawSortStation();
  });
  el.addEventListener("click", ev => {
    // 行首选中圆圈（I26 主入口）：只点它才切换目标行
    const rp = ev.target.closest("[data-rowpick]");
    if (rp) {
      const uid = rp.dataset.rowpick;
      sortSt.selectedUid = sortSt.selectedUid === uid ? null : uid;
      drawSortStation();
      return;
    }
    // 查看大图（I33）：只读层，Esc/遮罩关闭；槽内图不动
    const vw = ev.target.closest("[data-viewslot]");
    if (vw) {
      const row = sortSt.rows.find(r => r.uid === vw.dataset.row);
      const s = row?.slots[vw.dataset.slot];
      if (s?.url) openSlotViewer(row, vw.dataset.slot, s);
      return;
    }
    const cp = ev.target.closest("[data-cpslot]");
    if (cp) {
      const row = sortSt.rows.find(r => r.uid === cp.dataset.row);
      if (!row) return;
      sortCopyBackToPool(row, cp.dataset.slot);
      return;
    }
    const clr = ev.target.closest("[data-clrslot]");
    if (clr) {
      const row = sortSt.rows.find(r => r.uid === clr.dataset.row);
      if (!row) return;
      const s = row.slots[clr.dataset.slot];
      if (s?.src === "pool" && s.poolKey) sortSt.pool.set(s.poolKey, s.poolItem);
      if (s?.url) URL.revokeObjectURL(s.url);
      row.slots[clr.dataset.slot] = null;
      drawSortStation();
      return;
    }
    const poolImg = ev.target.closest(".pool-item");
    if (poolImg) {
      // 点缩略图 = 打开大图预览（I24：预览里按 1/2/4 入坑）
      if (sortSt.pool.has(poolImg.dataset.key)) openSortPreview(poolImg.dataset.key);
      return;
    }
    const del = ev.target.closest("[data-delrow]");
    if (del) { sortRemoveRow(del.dataset.delrow); drawSortStation(); return; }
    const pick = ev.target.closest("[data-pickrow]");
    if (pick) {
      const row = sortSt.rows.find(r => r.uid === pick.dataset.pickrow);
      if (!row) return;
      const { map } = sortRowMap(row);
      if (!map || !data.maps[map]?.radar_exists) { toast("该行还没有确定地图：先放一张带子文件夹的素材图，或用顶部全局地图"); return; }
      // 共用选点组件（I33 双向写回）：mode 只决定初始页签，起点/目标一次选全不丢
      openSpotPicker(map, {
        mode: pick.dataset.mode === "target" ? "target" : "origin",
        initial: pick.dataset.mode === "target" ? [...row.targets] : row.origin,
        onDone: res => {
          if (res.origin) row.origin = res.origin;
          if (Array.isArray(res.target) && res.target.length) row.targets = res.target;
          drawSortStation();
        },
        onCancel: () => drawSortStation(),
      });
      return;
    }
    const adv = ev.target.closest("[data-advanced]");
    if (adv) {
      const row = sortSt.rows.find(r => r.uid === adv.dataset.advrow);
      if (row) { row.adv = !row.adv; drawSortStation(); }
      return;
    }
    const slotBox = ev.target.closest(".slot-box");
    if (slotBox) {
      const row = sortSt.rows.find(r => r.uid === slotBox.dataset.row);
      if (!row) return;
      sortSt.lastSpSlot = { uid: row.uid, slot: slotBox.dataset.slot };   // I40：Ctrl+V 贴图目标
      upTarget = { uid: row.uid, slot: slotBox.dataset.slot };
      upInput.click();
      return;
    }
    // 行选中兜底：点行空白区也可切换；交互元素（下拉/输入/按钮/链接等）一律不穿透（I26 修点击穿透）
    const tr = ev.target.closest(".sort-table tbody tr");
    if (tr && !ev.target.closest("select, option, input, button, label, a, .cell-pick, .cell-adv, .cell-id-tag")) {
      const uid = tr.dataset.uid;
      sortSt.selectedUid = sortSt.selectedUid === uid ? null : uid;
      drawSortStation();
    }
  });
  // 拖文件进槽
  el.addEventListener("dragover", ev => {
    const box = ev.target.closest(".slot-box");
    if (box) { ev.preventDefault(); box.classList.add("drag-over"); }
  });
  el.addEventListener("dragleave", ev => {
    const box = ev.target.closest(".slot-box");
    if (box) box.classList.remove("drag-over");
  });
  el.addEventListener("drop", async ev => {
    const box = ev.target.closest(".slot-box");
    if (!box) return;
    ev.preventDefault();
    box.classList.remove("drag-over");
    const f = [...(ev.dataTransfer?.files || [])].find(x => SORT_IMG_RE.test(x.name));
    if (!f) { toast("请拖图片文件（png/jpg/webp）"); return; }
    const row = sortSt.rows.find(r => r.uid === box.dataset.row);
    if (!row) return;
    await sortPutToSlot(row, box.dataset.slot, { kind: "file", file: f });
    drawSortStation();
  });
  // 表格输入
  el.addEventListener("change", ev => {
    const t = ev.target.closest("input[data-row],select[data-row]");
    if (!t) return;
    const row = sortSt.rows.find(r => r.uid === t.dataset.row);
    if (!row) return;
    const k = t.dataset.k;
    if (k === "id") { row.id = t.value.trim().toLowerCase(); row.idTouched = true; }
    else if (k === "verified") row.verified = t.checked;
    else row[k] = t.value;
    if (k === "type" && !row.idTouched) {
      sortAutoId(row);
      const idTag = el.querySelector(`[data-idtag="${row.uid}"]`);
      if (idTag) idTag.textContent = row.id;
    }
  });

  drawSortStation();
  sortScanPool().then(() => { if (sortSt.open) drawSortStation(); });   // 扫描完成后刷新素材池
}

/* ---- 槽位大图复看（I33）：只读层，Esc/遮罩/关闭均可 ---- */

function closeSlotViewer() {
  document.getElementById("sort-view")?.remove();
  if (sortSt.onViewKey) document.removeEventListener("keydown", sortSt.onViewKey, true);
}

function openSlotViewer(row, slotName, s) {
  closeSlotViewer();
  const el = document.createElement("div");
  el.className = "sort-preview";
  el.id = "sort-view";
  el.innerHTML = `
    <div class="sp-stage"><img src="${s.url}" alt="" draggable="false"></div>
    <div class="sp-bar">
      <span class="sp-name">${escapeHtml(slotLabel(slotName))} · ${escapeHtml(s.name || "")}</span>
      <span class="sp-target">${escapeHtml(row.title || row.id)}</span>
      <span class="sp-btns"><button type="button" class="editor-btn" id="sv-close">关闭（Esc）</button></span>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", ev => {
    if (ev.target.closest("#sv-close") || ev.target === el) closeSlotViewer();
  });
  sortSt.onViewKey = ev => {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); closeSlotViewer(); }
  };
  document.addEventListener("keydown", sortSt.onViewKey, true);
}

/* ---- 素材大图预览 + 键盘快速入坑（I24）---- */

const SORT_SLOT_KEYS = { "1": "1-stand", "2": "2-aim", "4": "4-result" };

function sortPoolKeys() { return [...sortSt.pool.keys()]; }

// 当前筛选范围内的池 key（I29：预览跳转/三连只在该范围内循环）
function sortFilteredKeys() {
  const keys = sortPoolKeys();
  if (!sortSt.globalMap) return keys;
  return keys.filter(k => {
    const item = sortSt.pool.get(k);
    return item && sortMapFromGroup(item.group) === sortSt.globalMap;
  });
}

function openSortPreview(key) {
  sortSt.preview = key;
  drawSortPreview();
}

function closeSortPreview() {
  sortSt.preview = null;
  document.getElementById("sort-preview")?.remove();
  if (sortSt.onPreviewKey) document.removeEventListener("keydown", sortSt.onPreviewKey, true);
}

function sortPreviewStep(dir) {
  if (!sortSt.preview) return;
  const keys = sortFilteredKeys();
  if (!keys.length) { closeSortPreview(); return; }
  let i = keys.indexOf(sortSt.preview);
  i = (i + dir + keys.length) % keys.length;
  sortSt.preview = keys[i];
  drawSortPreview();
}

async function sortPreviewAssign(slotName) {
  const row = sortSt.rows.find(r => r.uid === sortSt.selectedUid);
  if (!row) { toast("先在表格点选目标行"); return; }
  const item = sortSt.pool.get(sortSt.preview);
  if (!item) { closeSortPreview(); return; }
  await sortPutToSlot(row, slotName, { kind: "pool", item });
  drawSortStation();
  // 池空检查（当前筛选范围）
  if (!sortFilteredKeys().length) {
    closeSortPreview();
    toast(sortSt.globalMap
      ? `「${data.maps[sortSt.globalMap]?.cn || sortSt.globalMap}」的素材已分拣完 ✓（切回「全部素材」可继续其他地图）`
      : "全部素材已分拣完 ✓");
    return;
  }
  // 入坑即选点（I33）：1 站位→起点为空时弹地图；4 落点&效果→目标为空时弹地图；2 瞄点纯入坑。
  // 确认或取消后都跳下一张（图已入坑，不回流）；字段已有值不弹（防一条三图弹两次）。
  const needOrigin = slotName === "1-stand" && !row.origin?.trim();
  const needTarget = slotName === "4-result" && !(row.targets?.length);
  const { map } = sortRowMap(row);
  if ((needOrigin || needTarget) && map && data.maps[map]?.radar_exists) {
    openSpotPicker(map, {
      mode: needOrigin ? "origin" : "target",
      initial: needOrigin ? row.origin : [...row.targets],
      onDone: res => {
        if (res.origin) row.origin = res.origin;
        if (Array.isArray(res.target) && res.target.length) row.targets = res.target;
        drawSortStation();
        sortPreviewStep(1);   // 内部重渲底栏（行标识随起点/目标更新）
      },
      onCancel: () => sortPreviewStep(1),
    });
    return;   // 跳转交给弹窗回调
  }
  sortPreviewStep(1);   // 自动跳下一张未分配的图——三连按完成一条
}

async function drawSortPreview() {
  document.getElementById("sort-preview")?.remove();
  if (sortSt.onPreviewKey) document.removeEventListener("keydown", sortSt.onPreviewKey, true);
  if (!sortSt.preview) return;
  const item = sortSt.pool.get(sortSt.preview);
  if (!item) { sortSt.preview = null; return; }
  const url = await sortPoolThumb(item);
  const stageHtml = url
    ? `<img src="${url}" alt="" draggable="false">`
    : `<div class="pool-thumb-empty">这张图读不到（文件可能被移动）——跳过或删行</div>`;   // I44：不产生 src=""
  const selRow = sortSt.rows.find(r => r.uid === sortSt.selectedUid);
  const el = document.createElement("div");
  el.className = "sort-preview";
  el.id = "sort-preview";
  el.innerHTML = `
    <div class="sp-stage">${stageHtml}</div>
    <div class="sp-bar">
      <span class="sp-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
      <span class="sp-target">${selRow ? `→ ${escapeHtml(selRow.title || selRow.id)}` : `<b>未选目标行</b>（表格里点一行）`}</span>
      <span class="sp-btns">
        ${SORT_SLOTS.map(([slot, label]) => `<button class="editor-btn" data-sp-slot="${slot}">${slot.startsWith("1") ? "1" : slot.startsWith("2") ? "2" : "4"} ${label}</button>`).join("")}
        <button class="editor-btn" data-sp-skip>跳过 →</button>
        <button class="editor-btn" data-sp-addrow title="新建一行并立即作为目标行，随后 1/2/4 直接给新行入坑">＋ 加行</button>
        <button class="editor-btn" id="sp-close">关闭</button>
      </span>
      <span class="sp-tip">键盘 1/2/4 入坑 · ←/→ 翻图 · Esc 关闭</span>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", ev => {
    const b = ev.target.closest("[data-sp-slot]");
    if (b) { sortPreviewAssign(b.dataset.spSlot); return; }
    if (ev.target.closest("[data-sp-addrow]")) {
      // 预览里直接加行（I26）：新建行立即成为目标行，预览保持打开——1/2/4 直接给新行入坑
      const row = sortAddRow();
      sortSt.selectedUid = row.uid;
      drawSortStation();    // 表格出新行
      drawSortPreview();    // 底栏「→ 行标识」同步为新行 id/标题，预览保持打开
      toast(`已加行 ${row.id}，按 1/2/4 直接给新行入坑`);
      return;
    }
    if (ev.target.closest("[data-sp-skip]")) { sortPreviewStep(1); return; }
    if (ev.target.closest("#sp-close") || ev.target === el) closeSortPreview();
  });
  sortSt.onPreviewKey = ev => {
    if (state.picking) return;   // 选点弹窗打开时 1/2/4/Esc 让位（防误入坑/误关预览，I33）
    if (inInputCheck()) return;
    const slot = SORT_SLOT_KEYS[ev.key];
    if (slot) { ev.preventDefault(); ev.stopPropagation(); sortPreviewAssign(slot); return; }
    if (ev.key === "ArrowLeft") { ev.preventDefault(); ev.stopPropagation(); sortPreviewStep(-1); }
    else if (ev.key === "ArrowRight" || ev.key === "Enter") { ev.preventDefault(); ev.stopPropagation(); sortPreviewStep(1); }
    else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); closeSortPreview(); }
  };
  document.addEventListener("keydown", sortSt.onPreviewKey, true);
}

function closeSortStation() {
  sortSt.open = false;
  closeSortPreview();
  closeSlotViewer();
  sortSt.selectedUid = null;
  if (sortSt.onSortKey) document.removeEventListener("keydown", sortSt.onSortKey, true);
  sortSt.sortEl?.remove();
  sortSt.sortEl = null;
}

async function drawSortStation() {
  const el = sortSt.sortEl;
  if (!el || !sortSt.open) return;
  // 素材池（I29：按顶部下拉的地图范围过滤；""=全部素材）
  const poolEl = $("#sort-pool", el);
  const stateEl = $("#sort-pool-state", el);
  const visibleKeys = sortFilteredKeys();
  const groups = new Map();
  for (const key of visibleKeys) {
    const item = sortSt.pool.get(key);
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group).push([key, item]);
  }
  let poolHtml = "";
  for (const [group, items] of groups) {
    const mapKey = sortMapFromGroup(group);
    poolHtml += `<div class="pool-group"><div class="pool-group-name">${escapeHtml(group || "（根目录）")}` +
      (mapKey ? `<span class="pool-map-tag">→ ${escapeHtml(data.maps[mapKey]?.cn || mapKey)}</span>` : `<span class="pool-map-tag warn">地图未识别</span>`) + `</div><div class="pool-grid">` +
      (await Promise.all(items.map(async ([key, item]) => {
        // I44：缩略图读取失败不产生 src=""（file:// 下会被当请求页面自身，控制台红字噪音）
        const thumb = await sortPoolThumb(item);
        const thumbHtml = thumb
          ? `<img src="${thumb}" alt="" draggable="false">`
          : `<span class="pool-thumb-empty">图读不到</span>`;
        return `<button class="pool-item ${sortSt.preview === key ? "picked" : ""}" data-key="${escapeHtml(key)}" title="${escapeHtml(item.name)}（点开大图预览）">
           ${thumbHtml}
           ${key.includes("::c") ? `<span class="pool-copy-mark" title="副本（原图仍在某槽或池中）">⧉</span>` : ""}
           <span class="pool-name">${escapeHtml(item.name)}</span>
         </button>`;
      }))).join("") + `</div></div>`;
  }
  poolEl.innerHTML = poolHtml || `<div class="pool-empty">${
    rootPerm !== "ready"
      ? "素材池需要先「关联项目文件夹」才能扫描（项目根目录下的「文件夹批量录入」）。也可以直接把图片拖进下面的图坑，或点坑上传。"
      : sortSt.pool.size && sortSt.globalMap
        ? `当前筛选（${escapeHtml(data.maps[sortSt.globalMap]?.cn || sortSt.globalMap)}）的素材已分拣完——切回「全部素材」可看其他地图的图。`
        : `「${SORT_POOL_DIR}」文件夹是空的（或没有图片）——把素材图按子文件夹分好放进去，点工具栏「📥 分拣台」重新进入即可刷新。`}</div>`;
  if (stateEl) stateEl.textContent = `素材池 ${visibleKeys.length} 张` + (sortSt.globalMap ? `（${escapeHtml(data.maps[sortSt.globalMap]?.cn || sortSt.globalMap)}）` : "");

  // 表格
  const tableEl = $("#sort-table", el);
  const rowsHtml = sortSt.rows.map(row => {
    const { group } = sortRowMap(row);
    const cells = SORT_SLOTS.map(([slot, label]) => {
      const s = row.slots[slot];
      return `<td><div class="slot-box ${s ? "has" : ""}" data-row="${row.uid}" data-slot="${slot}" title="点槽上传 / 拖图进坑">
        ${s ? `<img src="${s.url}" alt="" draggable="false"><button class="slot-view" data-viewslot data-row="${row.uid}" data-slot="${slot}" title="查看大图">🔍</button>${s.src === "pool" && s.poolKey ? `<button class="slot-copy" data-cpslot data-row="${row.uid}" data-slot="${slot}" title="复制一份回素材池（本图保留，给下一行用）">⧉</button>` : ""}<button class="slot-clr" data-clrslot data-row="${row.uid}" data-slot="${slot}" title="取下（素材池图会归还原池）">×</button>`
            : `<span class="slot-add">＋</span>`}
        <span class="slot-label">${label}</span>
      </div></td>`;
    }).join("");
    const idHtml = row.adv
      ? `<input class="cell id" data-row="${row.uid}" data-k="id" value="${escapeHtml(row.id)}" title="进阶：手改 id（改后不再自动生成）">
         <span class="cell-map">${group ? escapeHtml(group) : "用全局地图"}</span>`
      : `<span class="cell-id-tag" data-idtag="${row.uid}" title="id 是道具的文件名，不参与搜索/地图选点/钻取">${escapeHtml(row.id)}</span>
         <span class="cell-map">${group ? escapeHtml(group) : "用全局地图"}</span>
         <button class="cell-adv" data-advanced data-advrow="${row.uid}">高级</button>`;
    return `<tr data-uid="${row.uid}" class="${sortSt.selectedUid === row.uid ? "sel" : ""}">
      <td class="cell-pickrow">
        <button class="row-pick ${sortSt.selectedUid === row.uid ? "on" : ""}" data-rowpick="${row.uid}"
                title="${sortSt.selectedUid === row.uid ? "取消选中（再点行首圆圈）" : "选中为快速分拣目标行"}">${sortSt.selectedUid === row.uid ? "●" : "○"}</button>
        <button class="editor-btn danger mini" data-delrow="${row.uid}" title="删除该行（素材图归还池）">删</button>
      </td>
      <td><input class="cell" data-row="${row.uid}" data-k="title" value="${escapeHtml(row.title)}" placeholder="标题">${idHtml}</td>
      <td><button class="cell-pick" data-pickrow="${row.uid}" data-mode="origin">${row.origin ? escapeHtml(row.origin) : "＋ 选起点"}</button></td>
      <td><button class="cell-pick" data-pickrow="${row.uid}" data-mode="target">${row.targets.length ? escapeHtml(row.targets.join("、")) : "＋ 选目标"}</button></td>
      <td>${sortCellSelect(row.side, [["T", "T"], ["CT", "CT"], ["both", "双方"]], "side", row)}</td>
      <td>${sortCellSelect(row.type, [["smoke", "烟"], ["flash", "闪"], ["molotov", "火"], ["he", "雷"]], "type", row)}</td>
      <td>${sortCellSelect(row.click, [["lmb", "左键"], ["rmb", "右键"], ["both", "双键"]], "click", row)}</td>
      <td>${sortCellSelect(row.move, moveChoices([["stand", "原地"], ["crouch", "蹲下"], ["w", "W"], ["walk-step", "W一步"], ["shift", "Shift"], ["shift-w", "Shift+W"], ["run", "跑"]]), "move", row)}</td>
      <td>${sortCellSelect(row.action, [["direct", "直投"], ["jump", "跳投"], ["crouch-jump", "蹲跳投"]], "action", row)}</td>
      <td>${sortCellSelect(row.phase, PHASE_OPTS, "phase", row)}</td>
      <td class="cell-v"><input type="checkbox" data-row="${row.uid}" data-k="verified" ${row.verified ? "checked" : ""} title="勾选=导入即「已实测」（记今天日期）"></td>
      <td><input class="cell wide" data-row="${row.uid}" data-k="notes" value="${escapeHtml(row.notes)}" placeholder="一句话怎么扔（卡片大字）"></td>
      ${cells}
    </tr>`;
  }).join("");
  tableEl.innerHTML = `
    <div class="sort-table-note">id 是道具的文件名，自动生成、不参与搜索/地图选点/钻取，无需填写；起点和目标才是在地图上点选的。点表格里的行选中它，再点素材图放大后按 1/2/4 入坑。</div>
    <table class="sort-table">
      <thead><tr>
        <th></th><th>标题</th><th>起点</th><th>目标</th>
        <th>阵营</th><th>类型</th><th>键位</th><th>移动</th><th>投掷</th><th>阶段</th><th>已实测✓</th><th>备注(一句话)</th>
        <th>站位</th><th>瞄点</th><th>落点&效果</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;

  // 问题区
  const probEl = $("#sort-problems", el);
  const usedIds = new Set(data.entries.map(x => x.id));
  const lines = [];
  for (const row of sortSt.rows) {
    const ps = sortRowProblems(row, usedIds);
    if (ps.length) lines.push(`「${row.title || row.id || "新行"}」：${ps.join("、")}`);
    else if (!sortRowHasAllImages(row)) lines.push(`「${row.title || row.id}」：缺图${sortSt.skipNoImg ? "（将跳过）" : "（仍会导入，可之后补图）"}`);
  }
  if (sortSt.lastProblems?.length) { lines.push(...sortSt.lastProblems); sortSt.lastProblems = null; }
  probEl.innerHTML = lines.length
    ? lines.map(l => `<div class="sort-problem">⚠ ${escapeHtml(l)}</div>`).join("")
    : `<div class="sort-problem ok">✓ 当前行都可以导入</div>`;
}

PB.files.push("pb-sortdesk.js");   // R1-B 模块登记
