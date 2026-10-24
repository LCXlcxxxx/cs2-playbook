/* pb-sync.js — I19 暂存（IndexedDB）/FS Access 写盘/退役搁置/朋友修改回流引擎（R1-B 拆出，整体隔离） */
"use strict";

let rootDirHandle = null;   // 项目根目录句柄（📁 关联后获得）

function entryOverrides() {
  // 结构（I19）：{ edited:{id:{...}}, added:[{...}], deleted:[id], savedAt:{id:"…Z"}, written:{id:bool} }
  // 旧结构（无 savedAt）读到时一次性迁移：补 savedAt=当前时刻并立即写回
  try {
    const ov = JSON.parse(localStorage.getItem(ENTRY_OV_KEY) || "{}");
    if (ov && typeof ov === "object" && !Array.isArray(ov)) {
      if (!ov.savedAt && (ov.edited || ov.added || ov.deleted)) {
        const now = isoNow();
        const savedAt = {};
        for (const id of Object.keys(ov.edited || {})) savedAt[id] = now;
        for (const a of ov.added || []) savedAt[a.id] = now;
        for (const id of ov.deleted || []) savedAt[id] = now;
        ov.savedAt = savedAt;
        localStorage.setItem(ENTRY_OV_KEY, JSON.stringify(ov));
      }
      return ov;
    }
  } catch { /* 忽略坏数据 */ }
  return {};
}
function saveEntryOverrides(ov) {
  localStorage.setItem(ENTRY_OV_KEY, JSON.stringify(ov));
}

// 战术板覆盖层（I39）：结构与条目覆盖层完全同构 {edited, added, deleted, savedAt, written}，
// 共用 I19 的退役/补写/搁置语义；差异只在写盘目标 tactics/*.md 与 data.tactics。
function tacticOverrides() {
  try {
    const ov = JSON.parse(localStorage.getItem(TACTIC_OV_KEY) || "{}");
    if (ov && typeof ov === "object" && !Array.isArray(ov)) {
      if (!ov.savedAt && (ov.edited || ov.added || ov.deleted)) {
        const now = isoNow();
        const savedAt = {};
        for (const id of Object.keys(ov.edited || {})) savedAt[id] = now;
        for (const a of ov.added || []) savedAt[a.id] = now;
        for (const id of ov.deleted || []) savedAt[id] = now;
        ov.savedAt = savedAt;
        localStorage.setItem(TACTIC_OV_KEY, JSON.stringify(ov));
      }
      return ov;
    }
  } catch { /* 忽略坏数据 */ }
  return {};
}
function saveTacticOverrides(ov) {
  localStorage.setItem(TACTIC_OV_KEY, JSON.stringify(ov));
}
function applyTacticOverrides() {
  if (!data) return;
  const ov = tacticOverrides();
  let list = data.tactics.filter(t => !(ov.deleted || []).includes(t.id));
  list = list.map(t => {
    const ed = ov.edited?.[t.id];
    return ed ? { ...t, ...ed } : t;
  });
  for (const added of ov.added || []) {
    if (ov.edited?.[added.id]) continue;   // 防御：added 再编辑转 edited 后不得重复 push（I39 同构教训）
    list.push({ ...added });
  }
  data.tactics = list;
}

/* ---- 搁置区（I19）：退役 ≠ 删除，留底可导出 ---- */
function retiredStore() {
  try {
    const v = JSON.parse(localStorage.getItem(RETIRED_KEY) || "{}");
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return { entries: v.entries || {}, callouts: v.callouts || {}, tactics: v.tactics || {} };
    }
  } catch { /* 忽略坏数据 */ }
  return { entries: {}, callouts: {}, tactics: {} };
}
function saveRetiredStore(st) {
  localStorage.setItem(RETIRED_KEY, JSON.stringify(st));
}

// 「文件是唯一真相」对账（I19）：data.js 的 builtAt ≥ 暂存 savedAt ⇒ 文件已收录该修改，
// 暂存自动退役进搁置区（显示回落磁盘值）。R4：无 builtAt 的旧产物视为 0，一律不退役。
function retireStaleOverrides() {
  const builtAt = (data && typeof data.builtAt === "string") ? data.builtAt : "";
  if (!builtAt) return 0;
  let retiredN = 0;
  const now = isoNow();

  // 条目覆盖层：edited / added / deleted 共用 savedAt 映射
  const ov = entryOverrides();
  ov.added = ov.added || [];
  ov.deleted = ov.deleted || [];
  ov.edited = ov.edited || {};
  const written = ov.written || {};
  let ovDirty = false;
  for (const [id, at] of Object.entries(ov.savedAt || {})) {
    if (!(builtAt >= at)) continue;
    const st = retiredStore();
    let item = null;
    if (ov.edited[id]) item = { ...ov.edited[id] };
    else { const a = ov.added.find(x => x.id === id); if (a) item = { ...a }; }
    if (!item && ov.deleted.includes(id)) item = { id, deleted: true };
    if (item) { st.entries[id] = { item, retiredAt: now }; saveRetiredStore(st); }
    delete ov.savedAt[id];
    delete written[id];
    delete ov.edited[id];
    const ai = ov.added.findIndex(x => x.id === id);
    if (ai >= 0) ov.added.splice(ai, 1);
    const di = ov.deleted.indexOf(id);
    if (di >= 0) ov.deleted.splice(di, 1);
    ovDirty = true;
    retiredN++;
  }
  if (ovDirty) {
    ov.written = written;
    saveEntryOverrides(ov);
  }

  // 报点覆盖层：按图整份退役（savedAt 挂在图快照上）
  const cov = calloutsOverlay();
  let covDirty = false;
  for (const [mapKey, snap] of Object.entries(cov)) {
    if (!snap || !(builtAt >= snap.savedAt)) continue;
    const st = retiredStore();
    st.callouts[mapKey] = { item: { ...snap }, retiredAt: now };
    saveRetiredStore(st);
    delete cov[mapKey];
    covDirty = true;
    retiredN++;
  }
  if (covDirty) localStorage.setItem(EDITOR_KEY, JSON.stringify(cov));

  // 战术板覆盖层（I39）：与条目段同构，退役进搁置区 tactics 段
  const tov = tacticOverrides();
  tov.added = tov.added || [];
  tov.deleted = tov.deleted || [];
  tov.edited = tov.edited || {};
  const twritten = tov.written || {};
  let tovDirty = false;
  for (const [id, at] of Object.entries(tov.savedAt || {})) {
    if (!(builtAt >= at)) continue;
    const st = retiredStore();
    let item = null;
    if (tov.edited[id]) item = { ...tov.edited[id] };
    else { const a = tov.added.find(x => x.id === id); if (a) item = { ...a }; }
    if (!item && tov.deleted.includes(id)) item = { id, deleted: true };
    if (item) { st.tactics[id] = { item, retiredAt: now }; saveRetiredStore(st); }
    delete tov.savedAt[id];
    delete twritten[id];
    delete tov.edited[id];
    const ai = tov.added.findIndex(x => x.id === id);
    if (ai >= 0) tov.added.splice(ai, 1);
    const di = tov.deleted.indexOf(id);
    if (di >= 0) tov.deleted.splice(di, 1);
    tovDirty = true;
    retiredN++;
  }
  if (tovDirty) {
    tov.written = twritten;
    saveTacticOverrides(tov);
  }

  if (retiredN) {
    setTimeout(() => toast(`${retiredN} 条浏览器旧修改已被文件更新取代，已自动归档留底（⚙ 设置可查看/导出）`), 600);
  }
  return retiredN;
}


function applyEntryOverrides() {
  if (!data) return;
  const ov = entryOverrides();
  let list = data.entries.filter(e => !(ov.deleted || []).includes(e.id));
  list = list.map(e => {
    const ed = ov.edited?.[e.id];
    if (!ed) return e;
    const merged = { ...e, ...ed };
    merged.throw_badge = throwBadge(merged.click, merged.move, merged.action);
    merged.difficulty = diffEnum(merged.difficulty);   // I51：旧覆盖层的数字难度归一（兜底，正常应为枚举）
    return merged;
  });
  for (const added of ov.added || []) {
    if (ov.edited?.[added.id]) continue;   // 防御：同上（条目侧同构 bug，I39 顺手补）
    const a = { ...added, throw_badge: throwBadge(added.click, added.move, added.action) };
    a.difficulty = diffEnum(a.difficulty);   // I51：同上兜底
    list.push(a);
  }
  data.entries = list;
}

/* ---- 项目根目录句柄（📁 关联；用于写 .md 与图片） ---- */
function idbOpenRoot() {
  return new Promise((res, rej) => {
    const o = indexedDB.open("pb-fs", 2);
    o.onupgradeneeded = () => {
      const db = o.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("pending-images")) db.createObjectStore("pending-images");
    };
    o.onsuccess = () => res(o.result);
    o.onerror = () => rej(o.error);
  });
}
async function idbRootGet(key) {
  const db = await idbOpenRoot();
  return new Promise((res, rej) => {
    const t = db.transaction("kv").objectStore("kv").get(key);
    t.onsuccess = () => res(t.result);
    t.onerror = () => rej(t.error);
  });
}
async function idbRootSet(key, val) {
  const db = await idbOpenRoot();
  return new Promise((res, rej) => {
    const t = db.transaction("kv", "readwrite").objectStore("kv").put(val, key);
    t.onsuccess = () => res();
    t.onerror = () => rej(t.error);
  });
}
let rootPerm = "none";   // none | need-permission | ready（I17：句柄不再丢弃）
async function initRootHandle() {
  if (!window.showDirectoryPicker) { rootPerm = "none"; return false; }
  try { rootDirHandle = (await idbRootGet("root")) || null; } catch { rootDirHandle = null; }
  if (!rootDirHandle) { rootPerm = "none"; return false; }
  try {
    // 权限过期（浏览器重启后常见）只标记状态，句柄保留——点顶栏「🔑」一键恢复（I17/I42）
    rootPerm = (await rootDirHandle.queryPermission({ mode: "readwrite" })) === "granted"
      ? "ready" : "need-permission";
  } catch { rootPerm = "need-permission"; }
  refreshTopbarAuth();   // I42：状态变化即刷顶栏按钮
  return rootPerm === "ready";
}
async function linkRootDir() {
  if (!window.showDirectoryPicker) return false;
  try {
    const h = await showDirectoryPicker();
    rootDirHandle = h;
    await idbRootSet("root", h);
    rootPerm = "ready";
    return true;
  } catch { return false; }
}
async function entriesDir(create = false) {
  if (!rootDirHandle || rootPerm !== "ready") return null;   // 权限过期视为未关联（I17）
  // I45：写入路径（create=true）时 data 级也补建——与 writeEntryImage 同类（队长版 data/ 常在，
  // 但写链路不应依赖「碰巧存在」）；读取路径不 create
  const d = await rootDirHandle.getDirectoryHandle("data", create ? { create: true } : undefined);
  return d.getDirectoryHandle("entries", { create });
}
async function writeEntryFile(e) {
  try {
    const dir = await entriesDir(true);
    if (!dir) return false;
    const fh = await dir.getFileHandle(`${e.id}.md`, { create: true });
    const w = await fh.createWritable();
    await w.write(dumpEntryMd(e));
    await w.close();
    return true;
  } catch (err) {
    // I44：句柄失效（rootPerm 旗标仍是 ready 但浏览器已回收授权）或磁盘错误不再炸调用方——
    // NotAllowedError 降权进「需重新授权」态并指引 🔑；其余失败 toast 后返回 false，
    // 调用方既有 wrote=false → 覆盖层待写管线接住（徽标提示，开机补写）。
    if (err?.name === "NotAllowedError" || /notallowed|permission/i.test(err?.name || "")) {
      rootPerm = "need-permission";
      refreshTopbarAuth();
      toast("项目文件夹授权已过期，请点顶栏 🔑 重新授权");
    } else {
      toast(`条目写盘失败：${err?.message || err}`);
    }
    return false;
  }
}
async function deleteEntryFile(id) {
  const dir = await entriesDir(false);
  if (!dir) return false;
  try { await (await dir.getFileHandle(`${id}.md`)).remove(); return true; }
  catch { return false; }
}

/* ---- 战术板写盘（I39）：与条目同款语义，目标 tactics/*.md ---- */
async function tacticsDir(create = false) {
  if (!rootDirHandle || rootPerm !== "ready") return null;
  return rootDirHandle.getDirectoryHandle("tactics", { create });
}
async function writeTacticFile(t) {
  const dir = await tacticsDir(true);
  if (!dir) return false;
  const fh = await dir.getFileHandle(`${t.id}.md`, { create: true });
  const w = await fh.createWritable();
  await w.write(dumpTacticMd(t));
  await w.close();
  return true;
}
async function deleteTacticFile(id) {
  const dir = await tacticsDir(false);
  if (!dir) return false;
  try { await (await dir.getFileHandle(`${id}.md`)).remove(); return true; }
  catch { return false; }
}

// dumpTacticMd（I39）：frontmatter 键序 id/map/side/title/window/status/checked?/uses/timeline
// + 正文原文；与 pb.py load_doc（parse_block/_flow/dump_doc 标量规则）严格互逆。

async function writeEntryImage(entry, slot, blob, ext) {
  if (!rootDirHandle || rootPerm !== "ready") return null;   // 权限过期视为未关联（I17）
  try {
    // I45：media/ 与 media/<map>/ 两级补 create:true——新图（如 de_inferno）首次录入时目录不存在，
    // 此前直接 NotFoundError 三图全失败（Dust2/Mirage 目录早已存在所以从未暴露）。create 幂等，老图零影响。
    const media = await rootDirHandle.getDirectoryHandle("media", { create: true })
      .then(d => d.getDirectoryHandle(entry.map, { create: true }))
      .then(d => d.getDirectoryHandle(entry.id, { create: true }));
    const fh = await media.getFileHandle(`${slot}.${ext}`, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
    return `${slot}.${ext}`;
  } catch (err) {
    // I44：单图写盘失败不炸整批——NotAllowedError 降权指引 🔑，其余 toast；调用方 imgFail 路径接住
    if (err?.name === "NotAllowedError" || /notallowed|permission/i.test(err?.name || "")) {
      rootPerm = "need-permission";
      refreshTopbarAuth();
      toast("项目文件夹授权已过期，请点顶栏 🔑 重新授权");
    } else {
      toast(`图片写盘失败（${slotLabel(slot)}）：${err?.message || err}`);
    }
    return null;
  }
}

function extFromFile(file) {
  let ext = (file.name.split(".").pop() || "png").toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  return ["png", "jpg", "webp"].includes(ext) ? ext : "png";
}

/* ---- 图片：压缩、IndexedDB 暂存、槽位增删 ---- */
const idbURLCache = {};

function idbImgOpen() {
  return new Promise((res, rej) => {
    const o = indexedDB.open("pb-fs", 2);
    o.onupgradeneeded = () => {
      const db = o.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("pending-images")) db.createObjectStore("pending-images");
    };
    o.onsuccess = () => res(o.result);
    o.onerror = () => rej(o.error);
  });
}
async function putIdbImage(key, blob, ext) {
  const db = await idbImgOpen();
  return new Promise((res, rej) => {
    const t = db.transaction("pending-images", "readwrite").objectStore("pending-images").put({ blob, ext }, key);
    t.onsuccess = () => res();
    t.onerror = () => rej(t.error);
  });
}
async function getIdbImage(key) {
  const db = await idbImgOpen();
  return new Promise((res, rej) => {
    const t = db.transaction("pending-images").objectStore("pending-images").get(key);
    t.onsuccess = () => res(t.result);
    t.onerror = () => rej(t.error);
  });
}
async function removeIdbImage(key) {
  const db = await idbImgOpen();
  return new Promise((res, rej) => {
    const t = db.transaction("pending-images", "readwrite").objectStore("pending-images").delete(key);
    t.onsuccess = () => res();
    t.onerror = () => rej(t.error);
  });
}
async function allIdbImages() {
  const db = await idbImgOpen();
  return new Promise((res, rej) => {
    const store = db.transaction("pending-images").objectStore("pending-images");
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    let keys = null, vals = null;
    const done = () => {
      if (keys && vals) res(keys.map((k, i) => ({ key: k, blob: vals[i]?.blob, ext: vals[i]?.ext })));
    };
    keysReq.onsuccess = () => { keys = keysReq.result; done(); };
    valsReq.onsuccess = () => { vals = valsReq.result; done(); };
    keysReq.onerror = () => rej(keysReq.error);
    valsReq.onerror = () => rej(valsReq.error);
  });
}
async function pendingImageCount() {
  try { return (await allIdbImages()).length; } catch { return 0; }
}

function idbObjectURL(key) {
  if (idbURLCache[key]) return idbURLCache[key];
  getIdbImage(key).then(rec => {
    if (rec?.blob && !idbURLCache[key]) {
      idbURLCache[key] = URL.createObjectURL(rec.blob);
      render();
    }
  });
  return "assets/icons/icon-he.svg";   // 加载占位
}

async function compressToSlot(file) {
  // 宽 >1920 等比压到 1920 输出 jpg(0.85)；否则保留原文件
  let blob = file, ext = extFromFile(file);
  try {
    const bmp = await createImageBitmap(file);
    if (bmp.width > 1920) {
      const scale = 1920 / bmp.width;
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.85));
      ext = "jpg";
    }
  } catch { /* 解码失败按原文件存 */ }
  return { blob, ext };
}

function slotLabel(slot) {
  const hit = EDITABLE_SLOTS.find(s => s[0] === slot);
  if (hit) return hit[1];
  const extra = { "5-alt": "备选站位", "5-demo": "演示" };   // 与 pb.py EXTRA_SLOT_LABELS 同步
  return extra[slot] || slot;
}

async function uploadSlotImage(entry, slot, file) {
  const { blob, ext } = await compressToSlot(file);
  let path;
  if (rootDirHandle && rootPerm === "ready") {
    const bare = await writeEntryImage(entry, slot, blob, ext);
    if (!bare) { toast("写盘失败（关联的项目文件夹不可写？）"); return; }
    // writeEntryImage 返回裸文件名（I36）：拼全相对路径再入 images，否则显示端 404 黑图
    path = `media/${entry.map}/${entry.id}/${bare}`;
  } else {
    path = `idb:${entry.id}/${slot}`;
    await putIdbImage(`${entry.id}/${slot}`, blob, ext);
  }
  const images = (entry.images || []).filter(x => x.slot !== slot);
  images.push({ slot, label: slotLabel(slot), path });
  images.sort((a, b) => (a.slot < b.slot ? -1 : 1));
  persistEntryEdits({ ...entry, images }, entry);
  if (path && !String(path).startsWith("idb:")) markEntryWritten(entry.id);   // 图片已直接写盘（I19）
  applyEntryOverrides();
  render();
  refreshSyncBadge();
  toast(rootDirHandle ? `${slotLabel(slot)} 已写入 media/ ✓` : `${slotLabel(slot)} 已暂存浏览器（未同步，关联项目文件夹后写盘）`);
}

async function deleteSlotImage(entry, slot) {
  const old = (entry.images || []).find(x => x.slot === slot);
  const images = (entry.images || []).filter(x => x.slot !== slot);
  persistEntryEdits({ ...entry, images }, entry);
  let fileGone = false;
  if (old && !String(old.path).startsWith("idb:")) {
    try {
      const media = await rootDirHandle.getDirectoryHandle("media")
        .then(d => d.getDirectoryHandle(entry.map))
        .then(d => d.getDirectoryHandle(entry.id));
      for (const ext of ["png", "jpg", "webp"]) {
        try { await (await media.getFileHandle(`${slot}.${ext}`)).remove(); fileGone = true; break; } catch { }
      }
    } catch { }
  } else if (old) {
    await removeIdbImage(String(old.path).slice(4));
    fileGone = true;
  }
  if (fileGone && rootPerm === "ready") markEntryWritten(entry.id);   // 已直接删文件（I19）
  applyEntryOverrides();
  render();
  refreshSyncBadge();
  toast("已删除扩展槽位");
}

/* ---- Ctrl+V 直接贴图进图槽（I40）：只认图片剪贴板，文字粘贴零影响 ---- */

// 编辑器内贴图：局部更新（不 render，防未保存表单丢失）；ready 写盘 / 非 ready idb 暂存
async function pasteIntoEditor(slot, file) {
  const { e, orig, el } = pasteEditorCtx;
  if (!e?.id) { toast("新道具先点「保存」拿到 id，再贴图"); return; }
  const { blob, ext } = await compressToSlot(file);
  let path;
  if (rootPerm === "ready" && rootDirHandle) {
    const bare = await writeEntryImage(e, slot, blob, ext);
    if (!bare) { toast("写盘失败（关联的项目文件夹不可写？）"); return; }
    path = `media/${e.map}/${e.id}/${bare}`;   // I36 全路径语义
    markEntryWritten(e.id);
  } else {
    path = `idb:${e.id}/${slot}`;
    await putIdbImage(`${e.id}/${slot}`, blob, ext);
  }
  e.images = (e.images || []).filter(i => i.slot !== slot);
  e.images.push({ slot, label: slotLabel(slot), path });
  e.images.sort((a, b) => (a.slot < b.slot ? -1 : 1));
  persistEntryEdits(e, orig);
  const rowEl = el.querySelector(`.slot-edit[data-slot="${slot}"] .slot-file`);
  if (rowEl) rowEl.textContent = String(path).split("/").pop();
  const hint = $("#ef-hint", el);
  if (hint) hint.textContent = `${slotLabel(slot)} 已贴入 ✓（${rootPerm === "ready" ? "已写回 media/" : "暂存浏览器，关联项目文件夹后写盘"}）`;
  refreshSyncBadge();
}

// 分拣台贴图：交给分拣台现行槽位写入，缩略图随 drawSortStation 刷新
async function pasteIntoSortStation(slot, file) {
  const row = sortSt.rows.find(r => r.uid === sortSt.lastSpSlot.uid);
  if (!row) { toast("那一行已经不在了——重新点一下要填的图槽再 Ctrl+V"); return; }
  await sortPutToSlot(row, slot, { kind: "file", file });
  drawSortStation();
  toast(`${slotLabel(slot)} 已贴入 ✓`);
}

async function onPaste(ev) {
  const imgItem = [...(ev.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
  if (!imgItem) return;   // 无图：不拦，文字粘贴照常
  const blob = imgItem.getAsFile();
  if (!blob) return;
  ev.preventDefault();
  const file = new File([blob], "clipboard.png", { type: blob.type || "image/png" });

  // a) 道具编辑器打开 → 最后聚焦的槽位行（缺省=第一个缺失基础槽）
  if (state.editingId && pasteEditorCtx) {
    const slot = pasteEditorCtx.slot || firstMissingSlot(pasteEditorCtx.e) || BASE_SLOTS[0];
    await pasteIntoEditor(slot, file);
    return;
  }
  // b) 详情页 → 当前翻图槽位
  if (state.tab === "entries" && state.entryView?.id) {
    const e = data.entries.find(x => x.id === state.entryView.id);
    if (e) {
      const slot = viewerSlotByEntry[e.id] || firstMissingSlot(e) || BASE_SLOTS[0];
      await uploadSlotImage(e, slot, file);   // 自带「已写入/已暂存」toast（覆盖即替换语义）
      return;
    }
  }
  // c) 分拣台 → 最后点过的槽位
  if (sortSt.open && sortSt.lastSpSlot) {
    await pasteIntoSortStation(sortSt.lastSpSlot.slot, file);
    return;
  }
  toast("先在道具详情/编辑器里点一下要填的图槽，再 Ctrl+V");
}

// 同步核心（I16）：把 IndexedDB 待写盘图片写入项目文件夹。silent=启动自动补写（成功不打扰）
async function syncAllPending(silent = false) {
  const recs = await allIdbImages();
  let n = 0, fail = 0;
  for (const { key, blob, ext } of recs) {
    const [entryId, slot] = String(key).split("/");
    const entry = data.entries.find(x => x.id === entryId);
    if (!entry) { await removeIdbImage(key); delete idbURLCache[key]; continue; }   // 条目已删，清孤儿
    const path = await writeEntryImage(entry, slot, blob, ext);
    if (!path) { fail++; continue; }
    const ov = entryOverrides();
    const im = ov.edited?.[entryId]?.images?.find(x => x.path === `idb:${key}`);
    if (im) im.path = `media/${entry.map}/${entryId}/${path}`;
    saveEntryOverrides(ov);
    await removeIdbImage(key);
    delete idbURLCache[key];
    n++;
  }
  if (n) { applyEntryOverrides(); render(); }
  refreshSyncBadge();
  if (!silent) toast(n ? `已同步 ${n} 张图片到 media/ ✓（再双击「同步并打包.bat」刷新发布包）` : "没有待同步图片");
  else if (fail) toast(`有 ${fail} 张图片自动写盘失败，点右上角徽标重试`);
  return { ok: n, fail };
}

// 启动自动补写盘（I16/I19）：已关联项目文件夹时，先把上次没写完的图片静默写掉，
// 再补写条目（I19：edited/added 写 .md、deleted 删 .md，补齐 I16 只补图片的缺口）
async function autoSyncOnBoot() {
  try {
    // I42 修复（用户实测反馈）：boot 时即初始化报点自动保存状态——此前 initFsHandle 只在
    // 「⚙ 编辑报点」里调用，初始页面 fsStatus 停在 init，顶栏 🔗 按钮要进编辑器才出现。
    await initFsHandle();
    refreshTopbarAuth();
    if (!(await initRootHandle())) return;   // 未关联/需重新授权：保持徽标，等用户手动
    await syncAllPending(true);
    const n = await flushPendingEntries();
    const tn = await flushPendingTactics();   // I39：战术板补写
    if (n || tn) {
      applyEntryOverrides();
      applyTacticOverrides();
      refreshSyncBadge();
      const parts = [n ? `${n} 条条目修改` : "", tn ? `${tn} 块战术板修改` : ""].filter(Boolean).join("、");
      toast(`已把${parts}自动写回项目文件 ✓ 双击「同步并打包.bat」刷新页面与发布包`);
    }
    refreshSyncBadge();
  } catch { /* 静默：徽标保留，用户可点 */ }
}

/* ---- 标记已实测（网页内替代 pb verify） ---- */
async function setEntryStatus(id, status) {
  const cur = data.entries.find(x => x.id === id);
  if (!cur) return;
  const next = { ...cur, status };
  if (status === "verified") next.checked = new Date().toISOString().slice(0, 10);
  else delete next.checked;
  persistEntryEdits(next, cur);
  const wrote = await writeEntryFile(next);
  if (wrote) markEntryWritten(id);   // 写盘成功：暂存转显示缓存（savedAt 刷新，等 build 退役，I19）
  applyEntryOverrides();
  render();
  refreshSyncBadge();
  toast(wrote ? `已标记「${STATUS_CN[status]}」并写回条目文件 ✓`
              : `已在浏览器标记「${STATUS_CN[status]}」（关联项目文件夹后写回文件）`);
}

// I42：顶栏一键重连按钮组——权限过期（need-permission）才显示；ready/none/unsupported 不显示。
// 收编原编辑器「重新连接自动保存」与道具工具栏「🔑 重新授权项目文件夹」两处操作。
function refreshTopbarAuth() {
  const box = document.getElementById("topbar-auth");
  if (!box) return;
  let html = "";
  if (rootPerm === "need-permission" && rootDirHandle) {
    html += `<button class="editor-btn mini auth-btn" id="tb-reauth" title="重新授权项目文件夹——浏览器重启后授权会过期，点一次「允许」即恢复，不用重选文件夹">🔑 项目文件夹</button>`;
  }
  if (fsStatus === "need-permission" && fsHandle) {
    html += `<button class="editor-btn mini auth-btn" id="tb-refsync" title="重新连接报点自动保存——点一次「允许」即恢复实时写回 data/callouts.json">🔗 自动保存</button>`;
  }
  box.innerHTML = html;
  $("#tb-reauth", box)?.addEventListener("click", async () => {
    try {
      const p = await rootDirHandle.requestPermission({ mode: "readwrite" });
      if (p === "granted") {
        rootPerm = "ready";
        toast("已重新授权 ✓ 编辑与图片将直接写回项目文件");
        render();
      } else {
        toast("未授权；稍后点顶栏 🔑 再试");
      }
    } catch { /* 用户关闭弹窗 */ }
    refreshTopbarAuth();
    refreshSyncBadge();
  });
  $("#tb-refsync", box)?.addEventListener("click", async () => {
    await reconnectCalloutsFile();   // I15 现有恢复逻辑（requestPermission + 写回）
    refreshTopbarAuth();
    refreshSyncBadge();
  });
}

async function refreshSyncBadge() {
  const badge = document.getElementById("sync-badge");
  if (!badge) return;
  const pendingN = await pendingWorkCount();
  const rst = retiredStore();
  const retiredN = Object.keys(rst.entries).length + Object.keys(rst.callouts).length
    + Object.keys(rst.tactics || {}).length;
  badge.hidden = !(pendingN > 0 || retiredN > 0);
  badge.textContent = pendingN > 0
    ? `● ${pendingN} 条修改待写入文件`
    : retiredN > 0 ? `● ${retiredN} 条修改已搁置（文件曾更新）` : "";
  refreshTopbarAuth();   // I42：顶栏 🔑/🔗 按钮显隐与徽标同源刷新
}

// 徽标点击（I19）：有待写且已授权 → 全量补写（图片+条目+报点）；有待写未授权 → 提示重新授权；
// 只有搁置 → 打开 ⚙ 设置查看/导出
async function onSyncBadgeClick() {
  const pendingN = await pendingWorkCount();
  if (pendingN > 0) {
    if (rootPerm !== "ready") {
      toast("这些修改要先写回项目文件（点 🔑 重新授权后自动写入）；bat 只负责把项目文件刷进页面和发布包");
      return;
    }
    const imgs = await syncAllPending(true);
    const entries = await flushPendingEntries();
    const tacs = await flushPendingTactics();   // I39
    let co = 0;
    if (fsHandle) co = (await writeCalloutsFileNow()) ? 1 : 0;
    const parts = [];
    if (imgs.ok) parts.push(`${imgs.ok} 张图片`);
    if (entries) parts.push(`${entries} 条条目`);
    if (tacs) parts.push(`${tacs} 块战术板`);
    if (co) parts.push("报点");
    if (parts.length) toast(`已写入项目文件 ✓（${parts.join("、")}）；双击「同步并打包.bat」刷新页面与发布包`);
    else toast("没有可写盘的内容（报点自动保存需在报点编辑器里「开启自动保存」）");
    refreshSyncBadge();
    render();
    return;
  }
  openSettings();
}


/* ---------------- 朋友修改回流（I20）：📤 导出修改包 / 📥 队长导入 ---------------- */

const SHARE_FORMAT = "cs2-playbook-share/1";
const SHARE_NAME_KEY = "pb-share-name";

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).slice(String(r.result).indexOf(",") + 1));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
function base64ToBlob(b64, ext) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: ext === "jpg" ? "image/jpeg" : `image/${ext}` });
}

// 可分享的内容量：条目新增/编辑 + 浏览器暂存图 + 报点图快照（删除不分享，不计）
async function shareableCount() {
  const ov = entryOverrides();
  let n = Object.keys(ov.edited || {}).length + (ov.added || []).length;
  n += Object.keys(calloutsOverlay()).length;
  n += await pendingImageCount();
  return n;
}

function shareImagesOf(e, idbRecs) {
  // 只打包浏览器暂存图（idb:）；media/ 路径图队长侧本来就有
  const out = [];
  for (const im of e.images || []) {
    const p = String(im.path || "");
    if (!p.startsWith("idb:")) continue;
    const rec = idbRecs[p.slice(4)];
    if (!rec) continue;
    out.push((async () => ({
      slot: im.slot,
      label: im.label || slotLabel(im.slot),
      ext: rec.ext,
      data: await blobToBase64(rec.blob),
    }))());
  }
  return out;
}

async function buildSharePackage(nick) {
  const ov = entryOverrides();
  const idbRecs = {};
  for (const { key, blob, ext } of await allIdbImages()) idbRecs[key] = { blob, ext };
  const entries = [];
  const push = async (e, op) => {
    const { throw_badge, missing, ...rest } = e;
    const imgs = await Promise.all(shareImagesOf(e, idbRecs));
    entries.push({ ...rest, _op: op, images: imgs });
  };
  for (const a of ov.added || []) await push(a, "add");
  for (const e of Object.values(ov.edited || {})) await push(e, "edit");
  const pkg = { format: SHARE_FORMAT, from: nick, exportedAt: isoNow(), entries };
  const callouts = {};
  for (const [mapKey, snap] of Object.entries(calloutsOverlay())) {
    if (Array.isArray(snap.points) && snap.points.length) {
      callouts[mapKey] = snap.points.map(c => ({ name: c.name, search: c.search || [c.name], u: c.u, v: c.v }));
    }
  }
  if (Object.keys(callouts).length) pkg.callouts = callouts;
  return pkg;
}

function downloadJsonFile(name, obj) {
  const text = JSON.stringify(obj);
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return text.length;
}

async function doExportShare(nick) {
  const pkg = await buildSharePackage(nick);
  const nEntries = pkg.entries.length;
  const nImgs = pkg.entries.reduce((s, e) => s + e.images.length, 0);
  const safeNick = nick.replace(/[\\/:*?"<>|]/g, "_");
  const d = new Date();
  const dateTag = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const size = downloadJsonFile(`cs2-修改包-${safeNick}-${dateTag}.json`, pkg);
  let msg = `修改包已导出 ✓（${nEntries} 条、${nImgs} 张图${pkg.callouts ? `、报点 ${Object.keys(pkg.callouts).length} 图` : ""}）——发给队长即可`;
  if (size > 10 * 1024 * 1024) msg = "修改包较大（>10MB），微信发送可能较慢，建议分批录入。" + msg;
  toast(msg);
}

// 非标准投法值提示（lint 会给 WARN 不挡门，队长预览里可见）
function throwWarns(e) {
  const warns = [];
  if (!["lmb", "rmb", "both"].includes(e.click)) warns.push(`键位「${e.click}」非标准`);
  if (!["direct", "jump", "crouch-jump"].includes(e.action)) warns.push(`投掷「${e.action}」非标准`);
  if (!["stand", "crouch", "w", "walk-step", "shift", "shift-w", "run", ...moveExtra()].includes(e.move)) warns.push(`移动「${e.move}」非标准`);
  return warns;
}

// 导入前数据净化：枚举外的值落回默认，difficulty 兜底归一三档（I51：数字旧值按 1-2/3/4-5 折算）——保证导入后 pb lint 0 ERROR
function sanitizeImportEntry(e) {
  if (!["T", "CT", "both"].includes(e.side)) e.side = "T";
  if (!["smoke", "flash", "molotov", "he"].includes(e.type)) e.type = "smoke";
  if (!["lmb", "rmb", "both"].includes(e.click)) e.click = "lmb";
  if (!["direct", "jump", "crouch-jump"].includes(e.action)) e.action = "direct";
  e.phase = (Array.isArray(e.phase) ? e.phase : [e.phase]).filter(p => PHASE_ORDER.includes(p));
  if (!e.phase.length) e.phase = ["default"];
  e.difficulty = diffEnum(e.difficulty);   // I51：三档枚举（数字/未知值归一）
  // I47：sets 往返——规范化为去空格字符串数组；空数组不留键（.md 少一行噪音）
  if (e.sets !== undefined) {
    e.sets = Array.isArray(e.sets) ? e.sets.map(s => String(s).trim()).filter(Boolean) : [];
    if (!e.sets.length) delete e.sets;
  }
  return e;
}

// 解析修改包 → 导入计划（勾选状态挂在条目上；新增/新报点默认勾，更新默认不勾）
function planImport(pkg) {
  const plan = { from: pkg.from || "朋友", adds: [], edits: [], callouts: [], skipped: [] };
  const existingIds = new Set(data.entries.map(x => x.id));
  for (const raw of pkg.entries || []) {
    const e = sanitizeImportEntry({ ...raw });
    const wantsEdit = raw._op === "edit";
    delete e.throw_badge;
    delete e.missing;
    e.images = Array.isArray(raw.images) ? raw.images.filter(im => im && im.slot && im.data) : [];
    const cur = data.entries.find(x => x.id === e.id);
    if (!data.maps[e.map]) { plan.skipped.push(`${e.title || e.id}（地图 ${e.map} 未注册）`); continue; }
    if (wantsEdit && cur) {
      const diffs = [];
      if ((e.oneline || "") !== (cur.oneline || "")) diffs.push(`一句话：${cur.oneline || "（空）"} → ${e.oneline || "（空）"}`);
      const tbF = throwBadge(e.click, e.move, e.action), tbC = throwBadge(cur.click, cur.move, cur.action);
      if (tbF !== tbC) diffs.push(`投法：${tbC} → ${tbF}`);
      if ((e.origin || "") !== (cur.origin || "")) diffs.push(`起点：${cur.origin || "（空）"} → ${e.origin || "（空）"}`);
      if (targetDisplay(e) !== targetDisplay(cur)) diffs.push(`目标：${targetDisplay(cur)} → ${targetDisplay(e)}`);
      const setsF = (e.sets || []).join("、"), setsC = (cur.sets || []).join("、");   // I47：套装归属变化过目
      if (setsF !== setsC) diffs.push(`战术包：${setsC ? `「${setsC}」` : "（无）"} → ${setsF ? `「${setsF}」` : "（无）"}`);
      plan.edits.push({ entry: e, cur, diffs, checked: false });
    } else {
      let id = e.id || `dust2-t-smoke-friend${Date.now()}`;
      let renamedFrom = null;
      if (existingIds.has(id)) {
        renamedFrom = id;
        let i = 2;
        while (existingIds.has(`${id}-f${i}`)) i++;
        id = `${id}-f${i}`;
      }
      existingIds.add(id);
      plan.adds.push({ entry: e, finalId: id, renamedFrom, checked: true });
    }
  }
  const all = allCallouts();
  for (const [mapKey, pts] of Object.entries(pkg.callouts || {})) {
    if (!Array.isArray(pts) || !pts.length) continue;
    if (!data.maps[mapKey]?.radar_exists) continue;   // 没底图的图不收（也没法核对）
    const have = new Set(((all[mapKey]) || []).map(c => normSpot(c.name)));
    const fresh = pts.filter(p => p && p.name && !have.has(normSpot(p.name)));   // 同名点一律以队长侧为准
    if (fresh.length) plan.callouts.push({ map: mapKey, points: fresh, checked: true });
  }
  return plan;
}

function importPlanCounts(plan) {
  return {
    addN: plan.adds.filter(x => x.checked).length,
    editN: plan.edits.filter(x => x.checked).length,
    kN: plan.callouts.filter(x => x.checked).reduce((s, c) => s + c.points.length, 0),
  };
}

// 执行导入：逐条写盘，成功即从计划中移除；任何一步失败 → 停止并保留未完成项（预览态可重试）
async function runImport(plan) {
  if (rootPerm !== "ready") { toast("点工具栏 🔑 重新授权项目文件夹后再导入"); return null; }
  let okN = 0, okK = 0;
  const ov = entryOverrides();
  ov.added = ov.added || [];
  ov.edited = ov.edited || {};
  ov.savedAt = ov.savedAt || {};
  ov.written = ov.written || {};
  let failed = false;
  try {
    while (plan.adds.length) {
      const item = plan.adds[0];
      if (!item.checked) break;   // 未勾选的停在队首，保留在预览
      const e = sanitizeImportEntry({ ...item.entry });
      e.id = item.finalId;
      e.status = "draft";          // 铁律：朋友录入 ≠ 已实测
      delete e.checked;
      e.source = { kind: "friend", creator: plan.from, url: "" };
      const images = [];
      for (const im of e.images) {
        const path = await writeEntryImage(e, im.slot, base64ToBlob(im.data, im.ext || "png"), im.ext || "png");
        if (path) images.push({ slot: im.slot, label: im.label || slotLabel(im.slot), path: `media/${e.map}/${e.id}/${path}` });
      }
      e.images = images;
      if (!(await writeEntryFile(e))) throw new Error("entry write");
      ov.added.push({ ...e });
      ov.savedAt[e.id] = isoNow();
      ov.written[e.id] = true;     // 已在磁盘：仅作显示缓存，下次 build 退役
      ov.deleted = (ov.deleted || []).filter(x => x !== e.id);   // 若此前暂存过删除，收编即撤销
      plan.adds.shift();
      okN++;
    }
    while (plan.edits.length) {
      const item = plan.edits[0];
      if (!item.checked) break;
      const { entry: f, cur } = item;
      const merged = { ...cur };
      for (const k of ["title", "oneline", "origin", "target", "click", "move", "action", "difficulty", "type", "phase", "tags", "sets", "spots", "notes", "related"]) {
        if (f[k] !== undefined) merged[k] = f[k];
      }
      merged.status = cur.status;                    // 铁律：不覆盖队长侧实测状态
      if (cur.checked) merged.checked = cur.checked; else delete merged.checked;
      const src = { ...(cur.source || {}) };
      src.kind = src.kind || "friend";
      const creators = String(src.creator || "").split(/[,，]/).map(s => s.trim()).filter(Boolean);
      if (!creators.includes(plan.from)) creators.push(plan.from);   // 追加不替换
      src.creator = creators.join(", ");
      merged.source = src;
      for (const im of f.images) {                   // 仅朋友带了新图的槽位替换
        const path = await writeEntryImage(merged, im.slot, base64ToBlob(im.data, im.ext || "png"), im.ext || "png");
        if (!path) continue;
        merged.images = (merged.images || []).filter(x => x.slot !== im.slot);
        merged.images.push({ slot: im.slot, label: im.label || slotLabel(im.slot), path: `media/${merged.map}/${merged.id}/${path}` });
        merged.images.sort((a, b) => (a.slot < b.slot ? -1 : 1));
      }
      if (!(await writeEntryFile(merged))) throw new Error("entry write");
      ov.edited[merged.id] = { ...merged };
      ov.savedAt[merged.id] = isoNow();
      ov.written[merged.id] = true;
      plan.edits.shift();
      okN++;
    }
    const coChecked = plan.callouts.filter(c => c.checked);
    if (coChecked.length) {
      const cov = calloutsOverlay();
      for (const item of coChecked) {
        const snap = cov[item.map] || { savedAt: isoNow(), points: [], removed: [], written: false };
        const have = new Set(snap.points.map(p => normSpot(p.name)));
        for (const p of item.points) {
          if (!have.has(normSpot(p.name))) { snap.points.push({ ...p }); have.add(normSpot(p.name)); }
        }
        snap.savedAt = isoNow();
        snap.written = false;
        cov[item.map] = snap;
        okK += item.points.length;
      }
      localStorage.setItem(EDITOR_KEY, JSON.stringify(cov));
      if (fsStatus === "ready") {
        if (!(await writeCalloutsFileNow())) throw new Error("callouts write");
      }
      for (const item of coChecked) {
        const i = plan.callouts.indexOf(item);
        if (i >= 0) plan.callouts.splice(i, 1);
      }
    }
  } catch {
    failed = true;
  }
  saveEntryOverrides(ov);
  applyEntryOverrides();
  render();
  refreshSyncBadge();
  return { okN, okK, failed };
}

// 队长侧导入预览弹层（复用选点弹窗 overlay 风格，Esc 可关）
function openImportPreview(pkg) {
  if (pickerClose) pickerClose();
  const plan = planImport(pkg);
  const ovEl = document.createElement("div");
  ovEl.className = "picker-overlay";
  const empty = !plan.adds.length && !plan.edits.length && !plan.callouts.length;
  ovEl.innerHTML = `
    <div class="picker-card import-card">
      <div class="card-head"><h2>📥 导入朋友的修改</h2>
        <span class="badge-phase">来自 ${escapeHtml(plan.from)}${pkg.exportedAt ? ` · ${escapeHtml(String(pkg.exportedAt).slice(0, 10))}` : ""}</span>
      </div>
      <div class="import-list" id="imp-list"></div>
      <div class="picker-foot">
        <span class="picker-status" id="imp-status"></span>
        <span class="picker-actions">
          <button type="button" class="editor-btn" id="imp-cancel">取消</button>
          <button type="button" class="editor-btn primary" id="imp-ok" ${empty ? "disabled" : ""}>导入勾选项</button>
        </span>
      </div>
    </div>`;
  document.body.appendChild(ovEl);
  if (plan.skipped.length) {
    toast(`有 ${plan.skipped.length} 条无法收编（${plan.skipped[0]}${plan.skipped.length > 1 ? " 等" : ""}）`);
  }

  const TYPE_ICON = t => (TYPE_INFO[t] || {}).icon || "";
  function draw() {
    const parts = [];
    if (plan.adds.length) {
      parts.push(`<div class="imp-group-title">新增 ${plan.adds.length} 条（默认勾选，导入即待验证）</div>`);
      parts.push(plan.adds.map((it, i) => `
        <label class="imp-row">
          <input type="checkbox" data-k="adds" data-i="${i}" ${it.checked ? "checked" : ""}>
          <span class="imp-main">
            <span class="imp-line"><img class="type-ico" src="${TYPE_ICON(it.entry.type)}" alt="">
              <b>${escapeHtml(it.entry.title || it.finalId)}</b>
              <span class="badge-throw">${escapeHtml(throwBadge(it.entry.click, it.entry.move, it.entry.action))}</span>
              ${it.renamedFrom ? `<span class="imp-sub">id 与现有重复 → 导入为 ${escapeHtml(it.finalId)}</span>` : ""}
            </span>
            <span class="imp-sub">${escapeHtml(it.entry.origin || "")} → ${escapeHtml(targetDisplay(it.entry))}${it.entry.images.length ? ` · 带 ${it.entry.images.length} 张图` : ""}</span>
            ${throwWarns(it.entry).map(w => `<span class="imp-warn">⚠ ${escapeHtml(w)}（导入仍为待验证）</span>`).join("")}
          </span>
        </label>`).join(""));
    }
    if (plan.edits.length) {
      parts.push(`<div class="imp-group-title">更新 ${plan.edits.length} 条（默认不勾——朋友的改动你过目了再收）</div>`);
      parts.push(plan.edits.map((it, i) => `
        <label class="imp-row">
          <input type="checkbox" data-k="edits" data-i="${i}" ${it.checked ? "checked" : ""}>
          <span class="imp-main">
            <span class="imp-line"><img class="type-ico" src="${TYPE_ICON(it.entry.type)}" alt="">
              <b>${escapeHtml(it.entry.title || it.cur.id)}</b>
              <span class="badge-throw">${escapeHtml(throwBadge(it.entry.click, it.entry.move, it.entry.action))}</span>
            </span>
            <span class="imp-sub">现状：${escapeHtml(it.cur.oneline || "")}</span>
            ${it.diffs.map(d => `<span class="imp-diff">${escapeHtml(d)}</span>`).join("")}
            ${it.entry.images.length ? `<span class="imp-sub">带 ${it.entry.images.length} 张新图（导入时替换对应槽位）</span>` : ""}
            ${throwWarns(it.entry).map(w => `<span class="imp-warn">⚠ ${escapeHtml(w)}</span>`).join("")}
          </span>
        </label>`).join(""));
    }
    if (plan.callouts.length) {
      const kN = plan.callouts.reduce((s, c) => s + c.points.length, 0);
      parts.push(`<div class="imp-group-title">新报点 ${kN} 个（${plan.callouts.length} 图；同名点以你这边为准，不动）</div>`);
      parts.push(plan.callouts.map((it, i) => `
        <label class="imp-row">
          <input type="checkbox" data-k="callouts" data-i="${i}" ${it.checked ? "checked" : ""}>
          <span class="imp-main">
            <span class="imp-line"><b>${escapeHtml((data.maps[it.map] || {}).cn || it.map)}</b>
              <span class="imp-sub">新增 ${it.points.length} 个</span></span>
            <span class="imp-sub">${escapeHtml(it.points.map(p => p.name).join("、"))}</span>
          </span>
        </label>`).join(""));
    }
    $("#imp-list", ovEl).innerHTML = parts.join("") ||
      `<div class="imp-group-title">这份修改包没有可收编的内容（可能你这边已经都有了）</div>`;
    const c = importPlanCounts(plan);
    $("#imp-status", ovEl).textContent = `将导入：新增 ${c.addN} · 更新 ${c.editN} · 新报点 ${c.kN} 个`;
  }

  function close() {
    document.removeEventListener("keydown", onImpKey, true);
    state.picking = false;
    pickerClose = null;
    ovEl.remove();
  }
  function onImpKey(ev) {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); }
  }
  document.addEventListener("keydown", onImpKey, true);

  ovEl.addEventListener("click", ev => {
    if (ev.target === ovEl) { close(); return; }
    if (ev.target.closest("input[data-k]")) return;   // checkbox 走 change 事件
    if (ev.target.closest("#imp-cancel")) { close(); return; }
    if (ev.target.closest("#imp-ok")) confirmImport();
  });
  ovEl.addEventListener("change", ev => {
    const box = ev.target.closest("input[data-k]");
    if (!box) return;
    plan[box.dataset.k][Number(box.dataset.i)].checked = box.checked;
    const c = importPlanCounts(plan);
    $("#imp-status", ovEl).textContent = `将导入：新增 ${c.addN} · 更新 ${c.editN} · 新报点 ${c.kN} 个`;
  });

  async function confirmImport() {
    if (rootPerm !== "ready") {
      toast("点工具栏 🔑 重新授权项目文件夹后再导入");
      return;
    }
    const btn = $("#imp-ok", ovEl);
    btn.disabled = true;
    btn.textContent = "导入中…";
    const res = await runImport(plan);
    if (!res) { btn.disabled = false; btn.textContent = "导入勾选项"; return; }
    if (res.failed) {
      btn.disabled = false;
      btn.textContent = "继续导入剩余项";
      toast(`写盘失败：已成功 ${res.okN} 条 / ${res.okK} 个报点——其余项保留在列表，授权恢复后点「继续导入剩余项」重试`);
      draw();
      return;
    }
    close();
    toast(`已导入 ${res.okN} 条（待验证）/ ${res.okK} 个新报点 → 双击「同步并打包.bat」后进入发布包`);
  }

  draw();
  state.picking = true;
  pickerClose = close;
}


function idbOpen() {
  return new Promise((res, rej) => {
    const o = indexedDB.open("pb-fs", 2);
    o.onupgradeneeded = () => {
      const db = o.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("pending-images")) db.createObjectStore("pending-images");
    };
    o.onsuccess = () => res(o.result);
    o.onerror = () => rej(o.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const t = db.transaction("kv").objectStore("kv").get(key);
    t.onsuccess = () => res(t.result);
    t.onerror = () => rej(t.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const t = db.transaction("kv", "readwrite").objectStore("kv").put(val, key);
    t.onsuccess = () => res();
    t.onerror = () => rej(t.error);
  });
}

let fsHandle = null;      // 关联的 data/callouts.json 文件句柄（IndexedDB 持久化）
let fsStatus = "init";    // ready | need-permission | need-link | unsupported | init

async function initFsHandle() {
  if (!window.showOpenFilePicker) { fsStatus = "unsupported"; return; }
  try {
    fsHandle = (await idbGet("callouts")) || null;
  } catch { fsHandle = null; }
  if (!fsHandle) { fsStatus = "need-link"; return; }
  try {
    fsStatus = (await fsHandle.queryPermission({ mode: "readwrite" })) === "granted"
      ? "ready" : "need-permission";
  } catch { fsStatus = "need-link"; }
}

async function linkCalloutsFile() {
  try {
    const [h] = await showOpenFilePicker({
      types: [{ description: "callouts.json", accept: { "application/json": [".json"] } }],
    });
    fsHandle = h;
    await idbSet("callouts", h);
    fsStatus = "ready";
    await writeCalloutsFileNow();
    return true;
  } catch { return false; }   // 用户取消或不支持
}

async function writeCalloutsFileNow() {
  if (!fsHandle) return false;
  try {
    if ((await fsHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
      fsStatus = "need-permission";
      return false;
    }
    // 读-改-写（I19 关键防踩踏）：先读磁盘当前内容做底，绝不基于 data.js 旧数据回写——
    // 文件比 data.js 新时不丢点（如 A大油桶），别人没动过的图整份原样保留
    let disk = null;
    try {
      const f = await fsHandle.getFile();
      disk = JSON.parse(await f.text());
    } catch {
      toast("callouts.json 读取/解析失败，已中止自动保存以防覆盖（请找开发会话检查该文件）");
      return false;
    }
    if (!disk || typeof disk !== "object" || Array.isArray(disk)) disk = {};
    const ov = calloutsOverlay();
    const out = {};
    for (const k of Object.keys(disk)) out[k] = disk[k];   // 键序保持磁盘原样
    for (const [k, snap] of Object.entries(ov)) {
      if (k.startsWith("_")) continue;
      if (!snap || !Array.isArray(snap.points)) continue;
      const dArr = Array.isArray(disk[k]) ? disk[k] : [];
      const base = dArr.map(c => ({ ...c }));
      const byName = new Map(base.map(c => [normSpot(c.name), c]));
      for (const p of snap.points) {
        const key = normSpot(p.name);
        byName.set(key, byName.has(key) ? { ...byName.get(key), ...p } : { ...p });   // 同名覆盖字段，异名并入
      }
      let merged = [...byName.values()];
      // 剔除 removed 名单（编辑器删除/改名记录）；与现有点同名的 removed 条目作废（删除后又加回/改回的场景）
      const ptKeys = new Set(snap.points.map(p => normSpot(p.name)));
      const rm = new Set((snap.removed || []).map(normSpot).filter(x => !ptKeys.has(x)));
      if (rm.size) merged = merged.filter(c => !rm.has(normSpot(c.name)));
      out[k] = merged;
    }
    const w = await fsHandle.createWritable();
    await w.write(JSON.stringify(out, null, 2));
    await w.close();
    markCalloutsWritten();
    return true;
  } catch {
    fsStatus = "need-permission";
    refreshFsButton();   // 按钮态与小字同步变回「重新连接自动保存」（I15）
    toast("自动保存失败，请点上方按钮重新连接");
    return false;
  }
}

let fsWriteTimer = null;   // 自动保存防抖定时器（补回被误删的声明，I15）

// I42：重新连接报点自动保存（原编辑器「重新连接自动保存」逻辑收编，顶栏 🔗 与编辑器共用）
async function reconnectCalloutsFile() {
  if (!fsHandle) { toast("还没有开启过自动保存——到报点编辑器里点「开启自动保存」选一次 data/callouts.json"); return; }
  try {
    const p = await fsHandle.requestPermission({ mode: "readwrite" });
    if (p === "granted") {
      fsStatus = "ready";
      refreshTopbarAuth();
      if (await writeCalloutsFileNow()) toast("报点自动保存已重新连接 ✓");
      else toast("已连接，暂无可写内容");
    } else {
      toast("未授权；稍后点顶栏 🔗 再试");
    }
  } catch { /* 用户关闭弹窗 */ }
}

function scheduleCalloutsFileWrite() {
  if (fsStatus !== "ready") return;
  clearTimeout(fsWriteTimer);
  fsWriteTimer = setTimeout(async () => {
    if (await writeCalloutsFileNow()) {
      const tip = $("#editor-hint");
      if (tip) tip.textContent = "拖动标签调位置，改动实时自动保存。";   // 安静即正确，成功不打扰（I15）
    } else {
      const tip = $("#editor-hint");
      if (tip) tip.textContent = "自动保存连接已断开，点「重新连接自动保存」恢复。";
    }
  }, 800);   // 防抖：拖拽过程不刷盘，停手 0.8s 后写一次
}

function calloutsOverlay() {
  // 本地叠加层（I19 结构）：{ [map]: { savedAt:"…Z", points:[...], removed:[名], written:bool } }
  // 旧结构 { [map]: [points] } 读到时一次性迁移：包成新对象、savedAt=当前时刻并立即写回
  try {
    const raw = JSON.parse(localStorage.getItem(EDITOR_KEY) || "{}");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      let migrated = false;
      const ov = {};
      for (const [k, v] of Object.entries(raw)) {
        if (Array.isArray(v)) {   // 旧结构
          ov[k] = { savedAt: isoNow(), points: v, removed: [], written: false };
          migrated = true;
        } else if (v && typeof v === "object" && Array.isArray(v.points)) {
          ov[k] = {
            savedAt: typeof v.savedAt === "string" ? v.savedAt : isoNow(),
            points: v.points,
            removed: Array.isArray(v.removed) ? v.removed : [],
            written: v.written === true,
          };
          if (typeof v.savedAt !== "string") migrated = true;
        }
      }
      if (migrated) localStorage.setItem(EDITOR_KEY, JSON.stringify(ov));
      return ov;
    }
  } catch { /* 忽略坏数据 */ }
  return {};
}

function allCallouts() {
  // 合并语义：内置数据为底，本地叠加层按地图覆盖（旧快照只含 Mirage 时自动只覆盖 Mirage）
  const merged = { ...(data.callouts || {}) };
  for (const [k, v] of Object.entries(calloutsOverlay())) {
    if (k.startsWith("_")) continue;
    if (Array.isArray(v.points) && v.points.length) merged[k] = v.points;
  }
  return merged;
}

function saveCalloutsForMap(mapKey, arr) {
  // 按地图保存叠加层：arr 必须是调用方持有的数组副本，绝不能传 allCallouts() 合并结果
  const ov = calloutsOverlay();
  const prev = ov[mapKey] || {};
  ov[mapKey] = {
    savedAt: isoNow(),
    points: arr,
    removed: Array.isArray(prev.removed) ? prev.removed : [],
    written: false,   // 新改动待写盘；writeCalloutsFileNow 成功后置 true
  };
  localStorage.setItem(EDITOR_KEY, JSON.stringify(ov));
  scheduleCalloutsFileWrite();   // 已关联文件时自动写回合并后的全量数据
  refreshFsButton();   // 未开启自动保存时，有暂存改动即提醒（I18）
}

// 编辑器删除/改名记入 removed 名单（I19）：写盘并集时把文件里的旧点剔除
function recordRemovedCallout(mapKey, name) {
  if (!name) return;
  const ov = calloutsOverlay();
  const snap = ov[mapKey] || { savedAt: isoNow(), points: [], removed: [], written: false };
  const key = normSpot(name);
  snap.removed = Array.isArray(snap.removed) ? snap.removed : [];
  if (!snap.removed.some(n => normSpot(n) === key)) snap.removed.push(name);
  snap.savedAt = isoNow();
  snap.written = false;
  ov[mapKey] = snap;
  localStorage.setItem(EDITOR_KEY, JSON.stringify(ov));
}

function editableCalloutsFor(mapKey) {
  // 取「可编辑数组」：优先本地叠加层该图；否则用内置数据副本（保证新点在完整列表上加）
  const ov = calloutsOverlay();
  if (Array.isArray(ov[mapKey]?.points)) return ov[mapKey].points.slice();
  return ((data.callouts || {})[mapKey] || []).slice();
}

// 写盘成功后的记帐（I19）：刷新 savedAt（显示缓存语义，等下次 build 退役）+ 标记已写
function markCalloutsWritten() {
  const ov = calloutsOverlay();
  let dirty = false;
  for (const snap of Object.values(ov)) {
    if (snap && snap.written !== true) { snap.written = true; snap.savedAt = isoNow(); dirty = true; }
  }
  if (dirty) localStorage.setItem(EDITOR_KEY, JSON.stringify(ov));
}

// 条目写盘成功后的记帐（I19）：刷新 savedAt + 标记已写（显示缓存直到 build 退役）
function markEntryWritten(id) {
  const ov = entryOverrides();
  const has = ov.savedAt?.[id] || ov.edited?.[id] || (ov.added || []).some(a => a.id === id)
    || (ov.deleted || []).includes(id);
  if (!has) return;
  ov.savedAt = ov.savedAt || {};
  ov.written = ov.written || {};
  ov.savedAt[id] = isoNow();
  ov.written[id] = true;
  saveEntryOverrides(ov);
}

// 战术板写盘成功后的记帐（I39）：与 markEntryWritten 同构
function markTacticWritten(id) {
  const ov = tacticOverrides();
  const has = ov.savedAt?.[id] || ov.edited?.[id] || (ov.added || []).some(a => a.id === id)
    || (ov.deleted || []).includes(id);
  if (!has) return;
  ov.savedAt = ov.savedAt || {};
  ov.written = ov.written || {};
  ov.savedAt[id] = isoNow();
  ov.written[id] = true;
  saveTacticOverrides(ov);
}

// 待写盘工作量（I19）：待写条目 + 战术板（I39） + 待写报点图 + 待写图片（搁置区单独计，不混入）
async function pendingWorkCount() {
  let n = 0;
  const ov = entryOverrides();
  for (const id of Object.keys(ov.savedAt || {})) {
    if (!ov.written?.[id]) n++;
  }
  const tov = tacticOverrides();   // I39
  for (const id of Object.keys(tov.savedAt || {})) {
    if (!tov.written?.[id]) n++;
  }
  for (const snap of Object.values(calloutsOverlay())) {
    if (snap && snap.written !== true) n++;
  }
  n += await pendingImageCount();
  return n;
}

// 开机/点击补写条目（I19：补齐 I16 只补图片的缺口）：edited/added 写 .md，deleted 删 .md，
// 成功后刷新 savedAt + written（保持显示缓存语义，等下次 build 退役）
async function flushPendingEntries() {
  const ov = entryOverrides();
  const ids = new Set([
    ...Object.keys(ov.edited || {}),
    ...(ov.added || []).map(a => a.id),
    ...(ov.deleted || []),
  ]);
  let n = 0;
  for (const id of ids) {
    if (ov.written?.[id]) continue;   // 已成功写盘的显示缓存不重复写
    let ok = false;
    if ((ov.deleted || []).includes(id)) {
      ok = await deleteEntryFile(id);
    } else {
      const item = ov.edited?.[id] || (ov.added || []).find(a => a.id === id);
      if (item) ok = await writeEntryFile(item);
    }
    if (!ok) continue;
    n++;
    ov.savedAt = ov.savedAt || {};
    ov.written = ov.written || {};
    ov.savedAt[id] = isoNow();
    ov.written[id] = true;
  }
  // I35：补做改名挂起的磁盘步骤（media 迁移 + 删旧 .md；新 .md 已由上面 edited/added 循环写出）
  for (const [id, item] of Object.entries(ov.edited || {})) {
    const from = item?._renamedFrom;
    if (!from || ov.written?.[id] !== true) continue;
    try {
      await migrateMediaDir(item.map, from, item.map, id);
      await deleteEntryFile(from);
      delete item._renamedFrom;
      n++;
    } catch { /* 磁盘仍不可写：保留 _renamedFrom，下次 🔑 再补 */ }
  }
  if (n) saveEntryOverrides(ov);
  return n;
}

// 开机/点击补写战术板（I39）：与 flushPendingEntries 同构，写 tactics/*.md
async function flushPendingTactics() {
  const ov = tacticOverrides();
  const ids = new Set([
    ...Object.keys(ov.edited || {}),
    ...(ov.added || []).map(a => a.id),
    ...(ov.deleted || []),
  ]);
  let n = 0;
  for (const id of ids) {
    if (ov.written?.[id]) continue;
    let ok = false;
    if ((ov.deleted || []).includes(id)) {
      ok = await deleteTacticFile(id);
    } else {
      const item = ov.edited?.[id] || (ov.added || []).find(a => a.id === id);
      if (item) ok = await writeTacticFile(item);
    }
    if (!ok) continue;
    n++;
    ov.savedAt = ov.savedAt || {};
    ov.written = ov.written || {};
    ov.savedAt[id] = isoNow();
    ov.written[id] = true;
  }
  if (n) saveTacticOverrides(ov);
  return n;
}


/* ---- 重置本地编辑（以磁盘为准）：清条目覆盖层 + IndexedDB 待写图 ---- */
async function resetLocalEdits(btn) {
  // 三段推进：""→1（警示）→2（列后果）→执行。按当前段精确分发，
  // 不能用 arm!=="1" 判第一段——arm=2 时会永远弹回第一段，执行段不可达（I13 修复）
  if (btn.dataset.arm === "2") {
    btn.dataset.arm = "";
    btn.textContent = "↺ 重置本地编辑（以磁盘为准）";
    localStorage.removeItem("pb-entries-v1");
    for (const { key } of await allIdbImages()) await removeIdbImage(key);
    sessionStorage.setItem("pb-reset-done", "1");
    location.reload();   // 整页重载：data.entries 已被覆盖层合并污染（合并不逆），必须从磁盘全新构建
    return;
  }
  if (btn.dataset.arm === "1") {
    btn.dataset.arm = "2";
    btn.textContent = "再点确认：将丢失 字段编辑/已实测标记/未同步图片";
    setTimeout(() => {
      if (btn.isConnected) { btn.dataset.arm = ""; btn.textContent = "↺ 重置本地编辑（以磁盘为准）"; }
    }, 4000);
    return;
  }
  btn.dataset.arm = "1";
  btn.textContent = "确认丢弃？未同步的修改会丢失";
  setTimeout(() => {
    if (btn.isConnected) { btn.dataset.arm = ""; btn.textContent = "↺ 重置本地编辑（以磁盘为准）"; }
  }, 4000);
}

PB.files.push("pb-sync.js");   // R1-B 模块登记
