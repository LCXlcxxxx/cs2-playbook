/* pb-editor.js — 条目/战术板/报点编辑器与设置弹层（R1-B 拆出） */
"use strict";

/* ---------------- 道具条目编辑器 ---------------- */

function entryEditor(idOrNew) {
  const isNew = idOrNew === "__new__";
  const orig = isNew ? null : data.entries.find(e => e.id === idOrNew);
  if (!isNew && !orig) { state.editingId = null; const d = document.createElement("div"); return d; }

  const el = document.createElement("article");
  el.className = "card entry-editor";  const e = orig || {
    id: "", map: state.map || "de_mirage", side: "T", type: "smoke",
    click: "lmb", move: "stand", action: "direct",
    origin: "", target: "", title: "", oneline: "",
    difficulty: "normal", phase: ["default"], status: "draft",
    spots: [], tags: [], related: [],
    source: { kind: "video", creator: "", url: "" },
    notes: "", images: [],
  };

  // 报点三字段编辑态（I13）：起点单选 / 目标多选 / 关联多选。
  // 旧条目 target 是逗号串（如「二箱，电梯位」）→ 打开时拆成多值，保存后落成数组
  const splitNames = s => String(s || "").split(/[,，、]/).map(x => x.trim()).filter(Boolean);
  let originSel = e.origin || "";
  let targetSel = Array.isArray(e.target) ? e.target.filter(Boolean) : splitNames(e.target);
  let spotsSel = [...(e.spots || [])];
  let tagsSel = [...(e.tags || [])];   // I48：战术标签编辑态（chips），保存写回同一 tags 字段
  let setsSel = [...(e.sets || [])];   // I47：战术包（套装名自由输入，全库已有名自动补全）
  // I51：难度三档编辑态。diffLocked=手动点选后本次编辑锁定（再改投法/tags 不覆盖；重开编辑器恢复推荐）
  let diffSel = diffEnum(e.difficulty);
  let diffLocked = false;
  const allSets = [...new Set(data.entries.flatMap(x => Array.isArray(x.sets) ? x.sets : []))]
    .filter(Boolean).sort((a, b) => a.localeCompare(b, "zh"));
  let idCustom = false;   // I35：新建时用户展开高级并手改 id 才走自定义校验，否则全自动

  // I40：Ctrl+V 贴图上下文——编辑器打开期间记录 {e, orig, el} 与最后聚焦的槽位行
  pasteEditorCtx = { e, orig, el };
  el.addEventListener("focusin", ev => {
    const row = ev.target.closest(".slot-edit");
    if (row) pasteEditorCtx.slot = row.dataset.slot;
  });

  const opt = (arr, cur) => arr.map(([v, cn]) =>
    `<option value="${v}" ${cur === v ? "selected" : ""}>${cn}</option>`).join("");
  const slotRow = ([slot, label]) => {
    const img = (e.images || []).find(i => i.slot === slot);
    return `
      <div class="slot-edit" data-slot="${slot}">
        <span class="slot-name">${label}</span>
        <span class="slot-file">${img ? escapeHtml(String(img.path).split("/").pop().split("?")[0]) : "缺图"}</span>
        <label class="editor-btn">替换图片
          <input type="file" accept=".png,.jpg,.jpeg,.webp" hidden data-imgslot="${slot}">
        </label>
      </div>`;
  };

  el.innerHTML = `
    <div class="card-head"><h2>${isNew ? "新增道具" : "编辑道具"}</h2>
      <span class="badge-status ${e.status}">${STATUS_CN[e.status] || e.status}</span>
      <span class="toolbar-tip">状态可在此切换；「已实测」请确认真的在游戏里复现过</span>
    </div>
    <div class="form-grid">
      ${isNew ? `<label>　<span class="set-tip">id 自动生成（如 mirage-t-smoke-01），一般不用管　<a href="javascript:void(0)" class="manual-link" id="ef-id-toggle">高级 ▸ 自定义 id</a></span>
        <input id="ef-id" hidden placeholder="留空＝自动生成"></label>` : ""}
      <label>标题<input id="ef-title" value="${escapeHtml(e.title)}"></label>
      <label>一句话怎么扔（大字）<input id="ef-oneline" value="${escapeHtml(e.oneline)}"></label>
      <label>起点（报点名，单选）
        <span class="chips-row" id="ef-origin-chips"></span>
        <span class="pick-row">
          <button type="button" class="editor-btn" data-pick="origin">📍 在地图上选</button>
          <a href="javascript:void(0)" class="manual-link" data-manual="origin">手动输入…</a>
          <input class="manual-in" data-manual-in="origin" hidden placeholder="输入报点名，回车确认">
        </span>
      </label>
      <label>目标（报点名，可多选）
        <span class="chips-row" id="ef-target-chips"></span>
        <span class="pick-row">
          <button type="button" class="editor-btn" data-pick="target">📍 在地图上选</button>
          <a href="javascript:void(0)" class="manual-link" data-manual="target">手动输入…</a>
          <input class="manual-in" data-manual-in="target" hidden placeholder="多个报点用逗号隔开，回车确认">
        </span>
      </label>
      <label>键位<select id="ef-click">${opt(schemaEnumPairs("entry", "click") || [["lmb", "左键"], ["rmb", "右键"], ["both", "双键"]], e.click)}</select></label>
      <label>移动<select id="ef-move">${opt(moveChoices(schemaEnumPairs("entry", "move") || [["stand", "原地"], ["crouch", "蹲下"], ["w", "W 前进"], ["walk-step", "W 一步"], ["shift", "Shift"], ["shift-w", "Shift+W"], ["run", "跑"]]), e.move)}</select></label>
      <label>　<span class="set-tip">更多移动方式在顶部 ⚙ 设置里添加</span></label>
      <label>投掷<select id="ef-action">${opt(schemaEnumPairs("entry", "action") || [["direct", "直接投"], ["jump", "跳投"], ["crouch-jump", "蹲跳投"]], e.action)}</select></label>
      <label>难度<span class="diff-radio" id="ef-difficulty" role="radiogroup" aria-label="难度（三档单选）">
        ${DIFF_ORDER.map(d => `<button type="button" class="diff-opt diff-${d}" data-diff="${d}"><i class="diff-dot"></i>${DIFF_CN[d]}</button>`).join("")}
        <span class="set-tip">快捷键 1/2/3</span>
      </span></label>
      <label>类型<select id="ef-type">${opt(schemaEnumPairs("entry", "type") || [["smoke", "烟雾"], ["flash", "闪光"], ["molotov", "燃烧"], ["he", "高爆"]], e.type)}</select></label>
      <label>阵营<select id="ef-side">${opt(schemaEnumPairs("entry", "side") || [["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]], e.side || "T")}</select></label>
      <label>状态<select id="ef-status">${opt(schemaEnumPairs("entry", "status") || [["draft", "待验证"], ["verified", "已实测"], ["broken", "已失效"], ["retired", "弃用"]], e.status)}</select></label>
      <label>实测日期（状态=已实测时生效）<input id="ef-checked" value="${escapeHtml(e.checked || new Date().toISOString().slice(0, 10))}" placeholder="YYYY-MM-DD"></label>
      <label>阶段（多选）<span class="checks" id="ef-phase">${PHASE_OPTS.map(([v, cn]) =>
        `<label class="chk"><input type="checkbox" value="${v}" ${(e.phase || []).includes(v) ? "checked" : ""}>${cn}</label>`).join("")}</span></label>
      <label>标签（战术标签，回车或点建议添加）
        <span class="chips-row" id="ef-tag-chips"></span>
        <input id="ef-tag-in" class="sets-in" style="flex:1" autocomplete="off" placeholder="输入标签回车添加，如：单向 / 瞬爆 / 过点">
        <!-- 注：勿用 .manual-in——I13 手动输入委托按类绑定会抢 Enter 并清值/隐藏（I47 同款坑，复用 .sets-in 样式） -->
        <span class="tag-suggest" id="ef-tag-suggest"></span>
      </label>
      <label>战术包（可多选，跨 phase 的打法套装分组）
        <span class="chips-row" id="ef-sets-chips"></span>
        <span class="pick-row">
          <input id="ef-sets-in" class="sets-in" style="flex:1" list="ef-sets-dl" autocomplete="off"
                 placeholder="输入套装名，回车添加（输入时会提示已有的套装）">
          <datalist id="ef-sets-dl"></datalist>
        </span>
      </label>
      <label>报点关联（多选，用于报点图过滤）
        <span class="chips-row" id="ef-spots-chips"></span>
        <span class="pick-row">
          <button type="button" class="editor-btn" data-pick="spots">📍 在地图上选</button>
          <a href="javascript:void(0)" class="manual-link" data-manual="spots">手动输入…</a>
          <input class="manual-in" data-manual-in="spots" hidden placeholder="多个报点用逗号隔开，回车确认">
        </span>
      </label>
      <label>来源 UP 主<input id="ef-creator" value="${escapeHtml(e.source?.creator || "")}"></label>
      <label>来源链接<input id="ef-url" value="${escapeHtml(e.source?.url || "")}"></label>
    </div>
    <label class="notes-label">注意事项<textarea id="ef-notes" rows="4">${escapeHtml(e.notes || "")}</textarea></label>
    <div class="slots-edit">${EDITABLE_SLOTS.map(slotRow).join("")}</div>
    <div class="editor-hint" id="ef-hint">${rootPerm === "ready"
      ? "已关联项目文件夹：保存会直接写回 data/entries/*.md，替换图片写回 media/。"
      : rootPerm === "need-permission"
        ? "项目文件夹授权已过期：到道具列表点一次「🔑 重新授权」即可恢复写回。"
        : "未关联项目文件夹：保存先在浏览器本地生效；点工具栏「📁 关联」后可直接写回文件。"} 双击「同步并打包.bat」更新发布包。</div>
    <div class="editor-actions">
      <button class="editor-btn primary" id="ef-save">保存</button>
      <button class="editor-btn" id="ef-cancel">取消</button>
      ${!isNew ? `<button class="editor-btn danger" id="ef-delete">删除此条目</button>` : ""}
    </div>`;

  // 报点 chips 渲染与地图选点弹窗（I13）
  const chipX = (k, i) => `<button type="button" class="chip-x" data-chipx="${k}" data-i="${i}" title="移除">×</button>`;
  function renderPickChips() {
    const empty = t => `<span class="chip-empty">${t}</span>`;
    $("#ef-origin-chips", el).innerHTML = originSel
      ? `<span class="chip on">${escapeHtml(originSel)}${chipX("origin", 0)}</span>`
      : empty("未选起点");
    $("#ef-target-chips", el).innerHTML = targetSel.length
      ? targetSel.map((v, i) => `<span class="chip on">${escapeHtml(v)}${chipX("target", i)}</span>`).join("")
      : empty("未选目标");
    $("#ef-spots-chips", el).innerHTML = spotsSel.length
      ? spotsSel.map((v, i) => `<span class="chip on">${escapeHtml(v)}${chipX("spots", i)}</span>`).join("")
      : empty("未关联");
    $("#ef-sets-chips", el).innerHTML = setsSel.length
      ? setsSel.map((v, i) => `<span class="chip on">📦 ${escapeHtml(v)}${chipX("sets", i)}</span>`).join("")
      : empty("未分组");
    $("#ef-sets-dl", el).innerHTML = allSets.map(s => `<option value="${escapeHtml(s)}"></option>`).join("");
  }
  renderPickChips();

  // chips × 移除（委托）
  el.addEventListener("click", ev => {
    const x = ev.target.closest("[data-chipx]");
    if (x) {
      const { chipx: k, i } = x.dataset;
      if (k === "origin") originSel = "";
      if (k === "target") targetSel.splice(Number(i), 1);
      if (k === "spots") spotsSel.splice(Number(i), 1);
      if (k === "sets") setsSel.splice(Number(i), 1);
      renderPickChips();
      return;
    }
    const link = ev.target.closest("[data-manual]");
    if (link) {
      const inEl = $(`[data-manual-in="${link.dataset.manual}"]`, el);
      inEl.hidden = false;
      inEl.focus();
      return;
    }
    if (ev.target.closest("#ef-id-toggle")) {
      const idIn = $("#ef-id", el);
      idIn.hidden = !idIn.hidden;
      if (!idIn.hidden) { idCustom = true; idIn.value = autoEntryId({ map: e.map, side: e.side || "T", type: e.type }); idIn.focus(); }
      return;
    }
    const pick = ev.target.closest("[data-pick]");
    if (pick) {
      const k = pick.dataset.pick;
      openCalloutPicker({
        map: e.map,
        startTab: k,
        origin: originSel,
        targets: [...targetSel],
        spots: [...spotsSel],
        onDone: res => {
          originSel = res.origin;
          targetSel = res.target;
          spotsSel = res.spots;
          renderPickChips();
        },
      });
    }
  });
  // 手动输入：回车提交（起点替换；目标/关联按逗号拆分追加、去重）
  $$(".manual-in", el).forEach(inEl => {
    const commit = () => {
      const k = inEl.dataset.manualIn;
      const vals = splitNames(inEl.value);
      inEl.value = "";
      inEl.hidden = true;
      if (!vals.length) return;
      if (k === "origin") originSel = vals[0];
      if (k === "target") targetSel = [...new Set([...targetSel, ...vals])];
      if (k === "spots") spotsSel = [...new Set([...spotsSel, ...vals])];
      renderPickChips();
    };
    inEl.addEventListener("keydown", ev => {
      if (ev.key === "Enter") { ev.preventDefault(); commit(); }
      if (ev.key === "Escape") { ev.stopPropagation(); inEl.value = ""; inEl.hidden = true; }
    });
    inEl.addEventListener("blur", () => { if (inEl.value.trim()) commit(); else inEl.hidden = true; });
  });

  // 战术包输入（I47）：回车/失焦提交，逗号分隔可一次加多个；datalist 提示全库已有套装名。
  // 名内不允许逗号（.md 行内数组按逗号拆值，含逗号的套装名往返会失真——lint 也查这条）。
  const setsIn = $("#ef-sets-in", el);
  const commitSets = () => {
    const vals = setsIn.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    setsIn.value = "";
    let added = false;
    for (const v of vals) if (!setsSel.includes(v)) { setsSel.push(v); added = true; }
    if (added) renderPickChips();
  };
  setsIn.addEventListener("keydown", ev => {
    if (ev.key === "Enter") { ev.preventDefault(); commitSets(); }
    if (ev.key === "Escape") { ev.stopPropagation(); setsIn.value = ""; }
  });
  setsIn.addEventListener("blur", commitSets);

  // 标签 chips（I48）：回车/逗号/失焦提交，Backspace 空输入删末位；建议=常用词+全库已有标签（按输入过滤）
  const COMMON_TAGS = ["单向", "瞬爆", "满封", "灭火", "自助", "过点", "低容错"];   // I51：低容错=智能默认升「困难」的词表项
  function renderTagChips() {
    $("#ef-tag-chips", el).innerHTML = tagsSel.length
      ? tagsSel.map((v, i) => `<span class="chip on">${escapeHtml(v)}<button type="button" class="chip-x" data-tagx="${i}" title="移除">×</button></span>`).join("")
      : `<span class="chip-empty">无标签（可选）</span>`;
    const q = ($("#ef-tag-in", el).value || "").trim().toLowerCase();
    const lib = new Map();
    for (const x of data.entries) for (const t of (x.tags || [])) { const k = String(t).trim(); if (k) lib.set(k, (lib.get(k) || 0) + 1); }
    const pool = [];
    for (const t of COMMON_TAGS) if (!tagsSel.includes(t) && !pool.includes(t)) pool.push(t);
    for (const t of [...lib.keys()].sort((a, b) => (lib.get(b) - lib.get(a)) || a.localeCompare(b, "zh")))
      if (!tagsSel.includes(t) && !pool.includes(t)) pool.push(t);
    const hit = pool.filter(t => !q || t.toLowerCase().includes(q)).slice(0, 16);
    $("#ef-tag-suggest", el).innerHTML = hit.length
      ? hit.map(t => `<button type="button" class="tag-sug">${escapeHtml(t)}</button>`).join("")
      : (q ? `<span class="chip-empty">没有匹配的已有标签，回车直接创建「${escapeHtml(q)}」</span>` : "");
  }
  const tagIn = $("#ef-tag-in", el);
  const commitTags = () => {
    const vals = tagIn.value.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    tagIn.value = "";
    let added = false;
    for (const v of vals) if (!tagsSel.includes(v)) { tagsSel.push(v); added = true; }
    if (added || vals.length) renderTagChips();
    applySuggested();   // I51：tags 变化可能触发智能默认（低容错→困难），手动锁定时不覆盖
  };
  tagIn.addEventListener("keydown", ev => {
    if (ev.key === "Enter" || ev.key === "," || ev.key === "，") { ev.preventDefault(); commitTags(); }
    else if (ev.key === "Backspace" && !tagIn.value && tagsSel.length) { tagsSel.pop(); renderTagChips(); }
    else if (ev.key === "Escape") { ev.stopPropagation(); tagIn.value = ""; renderTagChips(); }
  });
  tagIn.addEventListener("blur", commitTags);
  tagIn.addEventListener("input", renderTagChips);
  $("#ef-tag-chips", el).addEventListener("click", ev => {
    const x = ev.target.closest("[data-tagx]");
    if (x) { tagsSel.splice(Number(x.dataset.tagx), 1); renderTagChips(); applySuggested(); }
  });
  // 建议用 mousedown+preventDefault：先于 blur，防止失焦提交重绘建议区吞掉本次点击
  $("#ef-tag-suggest", el).addEventListener("mousedown", ev => {
    const b = ev.target.closest(".tag-sug");
    if (!b) return;
    ev.preventDefault();
    if (!tagsSel.includes(b.textContent)) { tagsSel.push(b.textContent); renderTagChips(); applySuggested(); }
  });
  renderTagChips();

  // 难度三档单选（I51）：按钮 Radio + 智能默认——仅新建且未手动选过时按投法推导：
  // 跳投系或原地/蹲下直投=简单；移动投（w/walk-step/shift/shift-w/run）=中等，tags 勾「低容错」升困难。
  // 手动点选即锁定本次编辑（再改投法/tags 不覆盖）；编辑已有条目绝不自动改（保留已录值）。
  const renderDiffRadio = () => {
    $$("#ef-difficulty .diff-opt", el).forEach(b => {
      b.classList.toggle("on", b.dataset.diff === diffSel);
      b.setAttribute("aria-checked", b.dataset.diff === diffSel ? "true" : "false");
    });
  };
  const suggestDifficulty = () => {
    const act = $("#ef-action", el).value, mv = $("#ef-move", el).value;
    if (act === "jump" || act === "crouch-jump") return "easy";
    if (mv === "stand" || mv === "crouch") return "easy";
    return tagsSel.includes("低容错") ? "hard" : "normal";
  };
  const applySuggested = () => {
    if (!isNew || diffLocked) return;
    diffSel = suggestDifficulty();
    renderDiffRadio();
  };
  $("#ef-difficulty", el).addEventListener("click", ev => {
    const b = ev.target.closest("[data-diff]");
    if (!b) return;
    diffLocked = true;
    diffSel = b.dataset.diff;
    renderDiffRadio();
  });
  ["ef-action", "ef-move"].forEach(id => $("#" + id, el).addEventListener("change", applySuggested));
  applySuggested();   // 新建即给推荐初值（默认 原地+直投=简单）；已有条目不动
  renderDiffRadio();   // 已有条目也要亮起当前档（applySuggested 对非新建早退不渲染）

  // 图片替换
  $$("input[data-imgslot]", el).forEach(inp => inp.addEventListener("change", async () => {
    const file = inp.files[0];
    if (!file) return;
    if (rootPerm !== "ready") { $("#ef-hint", el).textContent = rootPerm === "need-permission"
      ? "项目文件夹授权已过期：到道具列表点「🔑 重新授权」后再替换图片。"
      : "替换图片需要先关联项目文件夹（工具栏 📁 按钮）。"; return; }
    const slot = inp.dataset.imgslot;
    const { blob, ext } = await compressToSlot(file);
    const bare = await writeEntryImage(e, slot, blob, ext);
    if (!bare) return;
    const path = `media/${e.map}/${e.id}/${bare}`;   // I36：拼全相对路径，否则编辑器替换后立即黑图
    e.images = (e.images || []).filter(i => i.slot !== slot);
    e.images.push({ slot, label: slotLabel(slot), path });
    e.images.sort((a, b) => (a.slot < b.slot ? -1 : 1));
    persistEntryEdits(e, orig);   // 只更新覆盖层，不弹提示
    markEntryWritten(e.id);   // 图片已直接写盘（I19）
    $("#ef-hint", el).textContent = `${slotLabel(slot)} 已写回 media/ ✓`;
    inp.closest(".slot-edit").querySelector(".slot-file").textContent = path;
  }));

  $("#ef-cancel", el).addEventListener("click", () => { state.editingId = null; render(); });

  if (!isNew) $("#ef-delete", el).addEventListener("click", async ev => {
    const btn = ev.currentTarget;
    if (btn.dataset.arm !== "1") {           // 两段式确认，避免误删
      btn.dataset.arm = "1";
      btn.textContent = "再点一次确认删除";
      setTimeout(() => { btn.dataset.arm = ""; btn.textContent = "删除此条目"; }, 3000);
      return;
    }
    btn.dataset.arm = "";
    btn.textContent = "删除此条目";
    const ov = entryOverrides();
    ov.deleted = [...(ov.deleted || []), e.id];
    ov.edited = ov.edited || {}; delete ov.edited[e.id];
    ov.added = (ov.added || []).filter(a => a.id !== e.id);
    ov.savedAt = ov.savedAt || {}; ov.savedAt[e.id] = isoNow();
    ov.written = ov.written || {}; ov.written[e.id] = false;
    saveEntryOverrides(ov);
    const wrote = await deleteEntryFile(e.id);
    if (wrote) markEntryWritten(e.id);   // 文件已删：暂存转显示缓存（I19）
    applyEntryOverrides();
    state.editingId = null;
    render();
    toast(wrote ? "已删除（.md 文件同步删除）" : "本浏览器已删除；关联项目文件夹后才能删文件");
  });

  $("#ef-save", el).addEventListener("click", async () => {
    const val = id => $("#" + id, el).value.trim();
    // 空一句话自动生成（I31）：起点→目标，投法（与卡片徽章同款中文）；填了就用用户的
    let onelineVal = val("ef-oneline");
    if (!onelineVal) {
      const tg = targetSel.length ? targetSel.join(" / ") : "";
      onelineVal = `${originSel}→${tg}，${throwBadge(val("ef-click"), val("ef-move"), val("ef-action"))}`;
      toast(`一句话怎么扔 已自动生成：${onelineVal}（可再编辑润色）`);
    }
    // 基线用磁盘原始条目（I19）：只改标题保存时，其他字段落磁盘值而非浏览器旧影子值
    const entry = {
      ...(diskEntries.find(x => x.id === e.id) || e),
      title: val("ef-title") || "未命名",
      oneline: onelineVal,
      origin: originSel,
      // 多值写行内数组，单值仍写标量（与 pb.py 双向兼容）
      target: targetSel.length === 0 ? "" : targetSel.length === 1 ? targetSel[0] : [...targetSel],
      click: val("ef-click"), move: val("ef-move"), action: val("ef-action"),
      side: val("ef-side"),   // 阵营（I25：编辑器暴露 side 字段，与 I23 过滤联动）
      difficulty: diffSel,   // I51：三档枚举（编辑态由 Radio/智能默认维护，恒为合法值）
      type: val("ef-type"),
      phase: $$("#ef-phase input:checked", el).map(i => i.value),
      tags: (() => { commitTags(); return tagsSel.slice(); })(),   // I48：chips 编辑态（失焦前未提交的输入先补进）
      spots: [...spotsSel],
      images: e.images || [],   // 例外：沿用当前内存值（可能含 idb: 暂存路径，I19）
      source: { kind: e.source?.kind || "video", creator: val("ef-creator"), url: val("ef-url") },
      notes: $("#ef-notes", el).value.trim(),
    };
    // 战术包（I47）：有成员写数组；全删光时若盘上原本有 sets 则落 [] 清掉，
    // 盘上本就没有则不写键（.md 零噪音，与「未挂套装的条目渲染完全一致」验收对齐）
    entry.sets = setsSel.length ? [...setsSel] : (Array.isArray(entry.sets) ? [] : undefined);
    // 状态与实测日期（verified 强制日期；其他状态清除）
    entry.status = val("ef-status");
    if (entry.status === "verified") {
      const d = val("ef-checked");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { toast("已实测状态需要实测日期（YYYY-MM-DD）"); return; }
      entry.checked = d;
    } else {
      delete entry.checked;
    }
    let autoIdGiven = false;
    if (isNew) {
      entry.status = "draft";   // 新增条目一律 draft（AGENTS.md）
      delete entry.checked;
      if (idCustom && entry.id) {
        // 高级自定义 id：保留原有校验
        if (!/^[a-z0-9-]+$/.test(entry.id)) { toast("id 只能是小写字母/数字/连字符"); return; }
        const short = entry.map.startsWith("de_") ? entry.map.slice(3) : entry.map;
        if (!entry.id.startsWith(`${short}-${entry.side.toLowerCase()}-${entry.type}-`)) {
          toast(`id 应以 ${short}-${entry.side.toLowerCase()}-${entry.type}- 开头`); return;
        }
        if (data.entries.some(x => x.id === entry.id)) { toast("id 已存在"); return; }
      } else {
        entry.id = autoEntryId({ map: entry.map, side: entry.side, type: entry.type });
        autoIdGiven = true;   // 保存成功后 toast 告知
      }
    }
    // I35：改 map/side/type → 前缀不符自动改名迁移（.md/media/引用/浏览器键），不再报错卡住
    if (!isNew) {
      const short = entry.map.startsWith("de_") ? entry.map.slice(3) : entry.map;
      const expectBase = `${short}-${entry.side.toLowerCase()}-${entry.type}-`;
      if (!entry.id.startsWith(expectBase)) {
        const oldId = entry.id;
        const newId = autoEntryId({ map: entry.map, side: entry.side, type: entry.type }, [oldId]);
        const mig = await renameEntry(oldId, newId, { entry, oldMap: orig?.map || entry.map, newMap: entry.map });
        entry.id = newId;
        toast(`id 已自动改为 ${newId}，图片与引用已同步迁移 ✓${mig.movedN ? `（迁移 ${mig.movedN} 张图）` : ""}`);
      }
    }
    persistEntryEdits(entry, orig);
    const wrote = await writeEntryFile(entry);
    if (wrote) markEntryWritten(entry.id);   // 写盘成功：暂存转显示缓存（I19）
    applyEntryOverrides();
    state.editingId = null;
    render();
    if (isNew) window.scrollTo({ top: 0, behavior: "smooth" });
    if (isNew && autoIdGiven) toast(`id 已自动生成：${entry.id}${wrote ? "，已写入文件 ✓" : "（未关联项目文件夹，暂存浏览器）"}`);
    else if (!wrote) toast("已保存在本浏览器 ✓ 关联项目文件夹后可自动写回 .md 文件（双击「同步并打包.bat」前发布包不更新）");
  });

  // I34：编辑器打开即读盘（已关联且非新增）——表单初值与保存基线以盘上 .md 为准，
  // 不再被陈旧 data.js/暂存合并值骗。读取/解析失败静默回落现状（合并值）。
  if (!isNew && rootPerm === "ready" && rootDirHandle) {
    (async () => {
      try {
        const dir = await entriesDir(false);
        const fh = await dir.getFileHandle(`${idOrNew}.md`);
        const disk = parseEntryMd(await (await fh.getFile()).text());
        if (!disk || disk.id !== idOrNew) return;
        disk.images = e.images;   // .md 不存 images，保留当前槽位引用
        const FIELDS = ["title", "oneline", "origin", "target", "click", "move", "action",
          "side", "difficulty", "type", "status", "checked", "phase", "tags", "sets", "spots", "related", "notes"];
        const changed = FIELDS.some(k => JSON.stringify(disk[k] ?? "") !== JSON.stringify(e[k] ?? ""))
          || JSON.stringify(disk.source || {}) !== JSON.stringify(e.source || {});
        // 保存基线同步为盘值
        const di = diskEntries.findIndex(x => x.id === idOrNew);
        if (di >= 0) diskEntries[di] = { ...disk, images: e.images };
        if (!changed || state.editingId !== idOrNew) { Object.assign(e, disk); return; }
        Object.assign(e, disk);
        if (originSel !== undefined) {   // 静默校准表单（一次性；三字段编辑态同步）
          originSel = e.origin || "";
          targetSel = Array.isArray(e.target) ? e.target.filter(Boolean) : splitNames(e.target);
          spotsSel = [...(e.spots || [])];
          setsSel = [...(e.sets || [])];
          renderPickChips();
          $("#ef-title", el).value = e.title || "";
          $("#ef-oneline", el).value = e.oneline || "";
          tagsSel = [...(e.tags || [])];
          renderTagChips();
          $("#ef-notes", el).value = e.notes || "";
          $("#ef-checked", el).value = e.checked || "";
          for (const [sid, key] of [["ef-click", "click"], ["ef-move", "move"], ["ef-action", "action"],
            ["ef-side", "side"], ["ef-type", "type"], ["ef-status", "status"]]) {
            const selEl = $("#" + sid, el);
            if (selEl) selEl.value = String(e[key] ?? selEl.value);
          }
          $$("#ef-phase input", el).forEach(c => { c.checked = (e.phase || []).includes(c.value); });
          if (!diffLocked) { diffSel = diffEnum(e.difficulty); renderDiffRadio(); }   // I51：难度按盘值校准（手动已选则不动）
          const badge = $(".card-head .badge-status", el);
          if (badge) { badge.className = `badge-status ${e.status}`; badge.textContent = STATUS_CN[e.status] || e.status; }
          toast("已按文件最新内容显示（页面数据较旧，保存后双击 bat 同步）");
        }
      } catch { /* 读盘/解析失败：静默回落现状 */ }
    })();
  }

  return el;
}

function persistEntryEdits(entry, orig) {
  const ov = entryOverrides();
  ov.edited = ov.edited || {};
  if (orig && orig.id === entry.id) {
    ov.edited[entry.id] = { ...entry };   // 全量保存已编辑字段
    ov.added = (ov.added || []).filter(a => a.id !== entry.id);   // added 再编辑：转 edited 防 apply 重复（I39 同构教训）
  } else {
    ov.added = (ov.added || []).filter(a => a.id !== entry.id);
    ov.added.push({ ...entry });
  }
  ov.savedAt = ov.savedAt || {};
  ov.written = ov.written || {};
  ov.savedAt[entry.id] = isoNow();
  ov.written[entry.id] = false;   // 新改动待写盘（I19）；写盘成功后由 markEntryWritten 置回 true
  saveEntryOverrides(ov);
}

/* ---------------- 地图选点弹窗（I13）---------------- */

const PICK_TABS = [["origin", "起点（单选）"], ["target", "目标（多选）"], ["spots", "关联（多选）"]];
let pickerClose = null;   // 当前弹窗关闭函数（捕获阶段 Esc 先于全局 onKey 消费掉）

// R3-L1④：最近报点（每图取 5 个展示；选点确认时更新——分拣台与条目编辑器两条链路共用此弹窗）
function recentSpotsFor(mapKey) {
  try {
    const all = JSON.parse(localStorage.getItem("pb-recent-spots") || "{}");
    return (all[mapKey] || []).slice(0, 5);
  } catch { return []; }
}
function pushRecentSpots(mapKey, res) {
  try {
    const all = JSON.parse(localStorage.getItem("pb-recent-spots") || "{}");
    const arr = all[mapKey] || [];
    for (const n of [res.origin, ...(res.target || [])].filter(Boolean)) {
      const i = arr.indexOf(n);
      if (i >= 0) arr.splice(i, 1);
      arr.unshift(n);
    }
    all[mapKey] = arr.slice(0, 8);
    localStorage.setItem("pb-recent-spots", JSON.stringify(all));
  } catch { /* 忽略 */ }
}

function openCalloutPicker({ map, startTab, origin, targets, spots, onDone, onCancel, tabs, reusePrev }) {
  if (pickerClose) pickerClose();
  const list = allCallouts()[map] || [];
  const mapInfo = data.maps[map] || {};
  const sel = { origin: origin || "", target: new Set(targets || []), spots: new Set(spots || []) };
  const TABS = Array.isArray(tabs) && tabs.length ? PICK_TABS.filter(([k]) => tabs.includes(k)) : PICK_TABS;
  let curTab = TABS.some(([k]) => k === startTab) ? startTab : TABS[0][0];
  let confirmed = false;   // I33：区分「完成」与取消/Esc/遮罩关闭——后者触发 onCancel

  const ov = document.createElement("div");
  ov.className = "picker-overlay";
  // 分拣台(z70)之上：修「选起点/选目标点击无反应」（I24）；大图预览(z85)打开时再抬一层（I33）
  ov.style.zIndex = sortSt.preview ? 90 : (sortSt.open ? 80 : "");
  ov.innerHTML = `
    <div class="picker-card">
      <div class="picker-head">
        <div class="picker-tabs">${TABS.map(([k, cn]) =>
          `<button type="button" class="picker-tab" data-tab="${k}">${cn}</button>`).join("")}</div>
        <input class="picker-search" placeholder="搜索报点名（拼音首字母也行，实时过滤）">
      </div>
      <div class="picker-quick" id="picker-quick" hidden></div>
      <div class="picker-map">
        <img class="radar" src="${mapInfo.radar}" alt="雷达底图" draggable="false">
        ${list.map((c, i) => `
          <button type="button" class="callout-label" data-pi="${i}"
                  style="left:${c.u * 100}%;top:${c.v * 100}%">${escapeHtml(c.name)}</button>`).join("")}
      </div>
      <div class="picker-foot">
        <span class="picker-status"></span>
        <span class="picker-actions">
          <button type="button" class="editor-btn" data-pcancel="1">取消</button>
          <button type="button" class="editor-btn primary" data-pok="1">完成</button>
        </span>
      </div>
    </div>`;
  document.body.appendChild(ov);

  const isPicked = name =>
    curTab === "origin" ? sel.origin === name : sel[curTab].has(name);
  const statusText = () => {
    const parts = [];
    if (TABS.some(([k]) => k === "origin")) parts.push(sel.origin ? `起点 ${sel.origin}` : "起点未选");
    if (TABS.some(([k]) => k === "target")) parts.push(`目标 ${sel.target.size} 个`);
    if (TABS.some(([k]) => k === "spots")) parts.push(`关联 ${sel.spots.size} 个`);
    return parts.join(" · ") || "";
  };

  // R3-L1④：快捷行——「沿用上一行」+ 最近报点 chips（起点=直接选定；目标=加入；只加不删）
  function applyQuick(name) {
    if (curTab === "origin") sel.origin = name;
    else if (sel[curTab]) sel[curTab].add(name);
    refresh();
  }
  function drawQuick() {
    const box = $("#picker-quick", ov);
    if (!box) return;
    const rec = recentSpotsFor(map);
    let html = "";
    if (reusePrev && reusePrev.value) html += `<button type="button" class="pb-qk reuse" data-qk="${escapeHtml(reusePrev.value)}" title="一键沿用上一行的起点">⧉ 沿用上一行：${escapeHtml(reusePrev.label || reusePrev.value)}</button>`;
    if (rec.length) html += `<span class="pb-qk-cap">最近</span>` + rec.map(n => `<button type="button" class="pb-qk" data-qk="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");
    box.innerHTML = html;
    box.hidden = !html;
  }

  function refresh() {
    $$(".picker-tab", ov).forEach(b => b.classList.toggle("active", b.dataset.tab === curTab));
    const kw = ($(".picker-search", ov).value || "").trim().toLowerCase();
    $$(".callout-label", ov).forEach(btn => {
      const c = list[Number(btn.dataset.pi)];
      // R3-L1④：hay 加拼音全拼/首字母（build 注入 pyf/pyi；用户自加点无拼音自动跳过）
      const hay = [c.name, ...(c.search || []), ...(c.pyf || []), ...(c.pyi || [])].join(" ").toLowerCase();
      btn.hidden = !!kw && !hay.includes(kw);
      btn.classList.toggle("picked", isPicked(c.name));
    });
    drawQuick();
    $(".picker-status", ov).textContent = statusText();
  }

  function close() {
    document.removeEventListener("keydown", onPickerKey, true);
    state.picking = false;
    pickerClose = null;
    ov.remove();
    if (!confirmed) onCancel?.();   // I33：取消/Esc/遮罩关闭回调（确认不触发）
  }
  function onPickerKey(ev) {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); }
  }
  document.addEventListener("keydown", onPickerKey, true);

  ov.addEventListener("click", ev => {
    if (ev.target === ov) { close(); return; }   // 点遮罩空白 = 取消
    const lab = ev.target.closest(".callout-label");
    if (lab) {
      const name = list[Number(lab.dataset.pi)].name;
      if (curTab === "origin") sel.origin = sel.origin === name ? "" : name;
      else if (sel[curTab].has(name)) sel[curTab].delete(name);
      else sel[curTab].add(name);
      refresh();
      return;
    }
    const qk = ev.target.closest("[data-qk]");
    if (qk) { applyQuick(qk.dataset.qk); return; }
    const tab = ev.target.closest(".picker-tab");
    if (tab) { curTab = tab.dataset.tab; refresh(); return; }
    if (ev.target.closest("[data-pok]")) {
      const res = { origin: sel.origin, target: [...sel.target], spots: [...sel.spots] };
      confirmed = true;   // I33：确认关闭不触发 onCancel
      pushRecentSpots(map, res);   // R3-L1④：最近报点随确认更新（两条链路共用此弹窗）
      close();
      onDone(res);
      return;
    }
    if (ev.target.closest("[data-pcancel]")) close();
  });
  $(".picker-search", ov).addEventListener("input", refresh);

  state.picking = true;
  pickerClose = close;
  refresh();
  $(".picker-search", ov).focus();
}

// 共用选点组件（I24/I33）：mode 只决定弹窗初始页签；写回=「非空即写」完整 res——
// 起点非空写起点、目标非空数组写目标（弹窗内一次选全，修「切页签选的目标丢失」）。
// 页签白名单固定 origin+target（「关联」在分拣台导入时自动=起点+目标去重，展示纯误导）。
// 条目编辑器继续用 openCalloutPicker 三页签形态（行为不变）。
function openSpotPicker(mapKey, { mode = "origin", initial = "", onDone, onCancel, reusePrev = null }) {
  openCalloutPicker({
    map: mapKey,
    startTab: mode === "target" ? "target" : "origin",
    origin: mode === "origin" ? initial : "",
    targets: mode === "target" ? [].concat(initial || []) : [],
    spots: [],
    tabs: ["origin", "target"],
    reusePrev,   // R3-L1④：分拣台起点选择时传「沿用上一行」（不传=现行为零变化）
    onDone: res => onDone?.(res),
    onCancel,
  });
}

/* ---------------- 全局设置弹层（I17）---------------- */

function openSettings() {
  if (pickerClose) pickerClose();
  migrateMoveExtra();   // I28：清与内置同名的自定义项（如旧预置「蹲下」）
  const ov = document.createElement("div");
  ov.className = "picker-overlay";
  ov.innerHTML = `
    <div class="picker-card settings-card">
      <div class="card-head"><h2>设置</h2></div>
      <div class="set-row">
        <div class="set-label">📖 册子待办<span class="set-tip">哪几颗缺图、没实测，点一下就跳到那颗道具去补</span></div>
        <div id="set-todo"></div>
      </div>
      <label class="set-row">
        <input type="checkbox" id="set-archived" ${state.showArchived ? "checked" : ""}>
        显示失效与弃用条目
      </label>
      <div class="set-row pb-mng">
        <div class="set-label">地图排序<span class="set-tip">第一位＝打开时的默认地图；顶栏下拉按此顺序显示</span></div>
        <div id="set-map-order" class="map-order"></div>
      </div>
      <div class="set-row pb-mng">
        <div class="set-label">自定义移动方式<span class="set-tip">出现在编辑器「移动」下拉与投法徽章里</span></div>
        <span class="chips-row" id="set-moves"></span>
        <span class="pick-row">
          <input class="manual-in" id="set-move-in" placeholder="输入名称回车添加，如：蹲下" style="max-width:320px">
        </span>
      </div>
      <div class="set-row pb-mng">
        <div class="set-label">自定义筛选<span class="set-tip">把常用标签一键变成顶栏筛选按钮，数量不限——点按钮=只看带该标签的道具</span></div>
        <span class="chips-row" id="set-customchips"></span>
        <span class="chips-row" id="set-customchip-lib"></span>
        <span class="pick-row">
          <input class="manual-in" id="set-customchip-in" placeholder="输入标签回车添加，如：回防" style="max-width:320px">
        </span>
      </div>
      <div class="set-row">
        <div class="set-label">被搁置的本地修改<span class="set-tip">文件更新后，没来得及写进文件的浏览器旧修改自动移到这里留底，绝不丢失</span></div>
        <span class="chips-row" id="set-retired"></span>
        <span class="pick-row">
          <button type="button" class="editor-btn" id="set-retired-export">导出留底（JSON）</button>
          <button type="button" class="editor-btn danger" id="set-retired-clear">清空搁置区</button>
        </span>
      </div>
      <div class="set-row pb-mng">
        <div class="set-label">📤 分享我的修改<span class="set-tip">把本浏览器里录的道具/改动打包成 JSON 发给队长，收进大家的册子</span></div>
        <span class="pick-row">
          <button type="button" class="editor-btn" id="set-share" disabled>📤 把我的修改分享给队长</button>
          <span class="set-tip" id="set-share-note"></span>
        </span>
        <span class="pick-row" id="set-share-form" hidden>
          <input class="manual-in" id="set-share-name" placeholder="你的昵称（必填，随修改包发给队长）">
          <button type="button" class="editor-btn primary" id="set-share-export">⬇ 导出修改包</button>
        </span>
      </div>
      <div class="set-row pb-mng">
        <div class="set-label">📥 导入朋友的修改<span class="set-tip">选朋友发来的修改包 JSON，预览勾选后收编（导入一律「待验证」）</span></div>
        <span class="pick-row">
          <button type="button" class="editor-btn" id="set-import">📥 导入朋友的修改</button>
          <input type="file" id="set-import-file" accept=".json,application/json" hidden>
        </span>
      </div>
      <div class="set-row">
        <span class="pick-row">
          <button type="button" class="editor-btn" id="set-help">📖 使用说明</button>
          <span class="set-tip">怎么用、修改存在哪、常见问题——大白话一页讲清</span>
        </span>
      </div>
      <div class="picker-foot">
        <span class="picker-status">设置保存在本浏览器</span>
        <button type="button" class="editor-btn primary" id="set-done">完成</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  function drawMoves() {
    $("#set-moves", ov).innerHTML = moveExtra().map((m, i) =>
      `<span class="chip on">${escapeHtml(m)}<button type="button" class="chip-x" data-mx="${i}" title="删除">×</button></span>`).join("")
      || `<span class="chip-empty">暂无自定义项</span>`;
  }
  // 册子待办（I40）：内存即时算，不读 report.md；口径=当前失效开关下的可见条目
  function drawTodo() {
    const visible = data.entries.filter(e => state.showArchived || !["broken", "retired"].includes(e.status));
    const groups = [
      { key: "verified", label: "已实测", color: "ok", items: [] },
      { key: "draft", label: "待验证", color: "", items: [] },
      { key: "broken", label: "已失效", color: "warn", items: [] },
      { key: "missing", label: "缺基础图", color: "warn", items: [] },
    ];
    for (const e of visible) {
      if (e.status === "verified") groups[0].items.push(e);
      else if (e.status === "draft") groups[1].items.push(e);
      else groups[2].items.push(e);
      const slots = BASE_SLOTS.filter(s => !(e.images || []).some(i => i.slot === s));
      if (slots.length) groups[3].items.push({ ...e, _missing: slots });
    }
    const box = $("#set-todo", ov);
    if (!visible.length) { box.innerHTML = `<span class="chip-empty">还没有录入道具</span>`; return; }
    if (!groups[1].items.length && !groups[2].items.length && !groups[3].items.length) {
      box.innerHTML = `<div class="todo-ok">✓ 册子很健康：没有待办（已实测 ${groups[0].items.length} 颗）</div>`;
      return;
    }
    box.innerHTML = groups.map(g => `
      <div class="todo-group" data-g="${g.key}">
        <button type="button" class="todo-count ${g.color}" data-g="${g.key}">
          ${g.label} ${g.items.length} 颗${g.items.length ? " ▾" : ""}
        </button>
        <div class="todo-items" hidden>
          ${g.items.map(e => `
            <button type="button" class="todo-item" data-jump="${e.id}">
              <img src="${(TYPE_INFO[e.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">${escapeHtml(e.title)}
              <span class="set-tip">${escapeHtml((data.maps[e.map] || {}).cn || e.map)}</span>
              ${g.key === "missing" ? `<span class="todo-slots">${(e._missing || []).map(s => slotLabel(s)).join("、")}</span>` : ""}
            </button>`).join("")}
        </div>
      </div>`).join("");
    $$(".todo-count", box).forEach(btn => btn.addEventListener("click", () => {
      const items = btn.parentElement.querySelector(".todo-items");
      if (items) items.hidden = !items.hidden;
    }));
    $$(".todo-item", box).forEach(btn => btn.addEventListener("click", () => {
      close();
      jumpToEntry(btn.dataset.jump);
    }));
  }
  drawTodo();
  function drawMapOrder() {
    const arr = mapOrder();
    $("#set-map-order", ov).innerHTML = arr.map((m, i) => `
      <div class="map-order-row ${i === 0 ? "default" : ""}">
        <span class="mo-name">${i === 0 ? `<b>${escapeHtml(data.maps[m]?.cn || m)}</b> <span class="set-tip">默认</span>` : escapeHtml(data.maps[m]?.cn || m)}</span>
        <button type="button" class="editor-btn mini" data-mo-up="${i}" ${i === 0 ? "disabled" : ""} title="上移">↑</button>
        <button type="button" class="editor-btn mini" data-mo-down="${i}" ${i === arr.length - 1 ? "disabled" : ""} title="下移">↓</button>
      </div>`).join("");
  }
  function drawRetired() {
    const st = retiredStore();
    const en = Object.keys(st.entries).length;
    const co = Object.keys(st.callouts).length;
    $("#set-retired", ov).innerHTML = (en || co)
      ? `<span class="chip on">条目修改 ${en} 条</span><span class="chip on">报点修改 ${co} 张图</span>`
      : `<span class="chip-empty">暂无搁置记录</span>`;
  }
  function close() {
    document.removeEventListener("keydown", onKey2, true);
    state.picking = false;
    pickerClose = null;
    ov.remove();
    render();   // 「显示失效条目」等变更立即生效
  }
  function onKey2(ev) {
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); }
  }
  document.addEventListener("keydown", onKey2, true);

  $("#set-archived", ov).addEventListener("change", ev => {
    state.showArchived = ev.target.checked;
    localStorage.setItem("pb-show-archived", ev.target.checked ? "1" : "0");
    render();
  });
  ov.addEventListener("click", async ev => {
    if (ev.target === ov) { close(); return; }
    const x = ev.target.closest("[data-mx]");
    if (x) {
      const arr = moveExtra();
      arr.splice(Number(x.dataset.mx), 1);
      saveMoveExtra(arr);
      drawMoves();
      return;
    }
    const moUp = ev.target.closest("[data-mo-up]");
    if (moUp) {
      moveMapOrder(Number(moUp.dataset.moUp), -1);
      drawMapOrder();
      return;
    }
    const moDown = ev.target.closest("[data-mo-down]");
    if (moDown) {
      moveMapOrder(Number(moDown.dataset.moDown), 1);
      drawMapOrder();
      return;
    }
    if (ev.target.closest("#set-retired-export")) {
      const blob = new Blob([JSON.stringify(retiredStore(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pb-retired-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    const clr = ev.target.closest("#set-retired-clear");
    if (clr) {
      // 两段确认：搁置区是「绝不无声消失」的最后留底，清空必须显式
      if (clr.dataset.arm !== "1") {
        clr.dataset.arm = "1";
        clr.textContent = "再点一次确认清空";
        setTimeout(() => { clr.dataset.arm = ""; clr.textContent = "清空搁置区"; }, 4000);
        return;
      }
      localStorage.removeItem(RETIRED_KEY);
      drawRetired();
      refreshSyncBadge();
      toast("搁置区已清空");
      return;
    }
    if (ev.target.closest("#set-share")) {
      // 展开昵称表单（记住上次昵称）；无可分享内容时按钮置灰
      $("#set-share-form", ov).hidden = false;
      const nameIn = $("#set-share-name", ov);
      if (!nameIn.value) nameIn.value = localStorage.getItem(SHARE_NAME_KEY) || "";
      nameIn.focus();
      return;
    }
    if (ev.target.closest("#set-share-export")) {
      const nick = $("#set-share-name", ov).value.trim();
      if (!nick) { toast("先填昵称（会随修改包发给队长）"); $("#set-share-name", ov).focus(); return; }
      localStorage.setItem(SHARE_NAME_KEY, nick);
      try { await doExportShare(nick); } catch { toast("导出失败（图片读取异常？稍后再试）"); }
      return;
    }
    if (ev.target.closest("#set-import")) {
      $("#set-import-file", ov).click();
      return;
    }
    if (ev.target.closest("#set-help")) {
      window.open("help.html");   // 大白话使用说明（I21，file:// 下可用）
      return;
    }
    if (ev.target.closest("#set-done")) close();
  });
  $("#set-import-file", ov).addEventListener("change", async ev => {
    const file = ev.target.files[0];
    ev.target.value = "";   // 允许重复选同一文件
    if (!file) return;
    let pkg = null;
    try {
      pkg = JSON.parse(await file.text());
    } catch { pkg = null; }
    if (!pkg || pkg.format !== SHARE_FORMAT) { toast("不是有效的修改包（格式不对或文件损坏）"); return; }
    openImportPreview(pkg);
  });
  $("#set-move-in", ov).addEventListener("keydown", ev => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();
    const v = ev.target.value.trim();
    if (!v) return;
    const arr = moveExtra();
    if (!arr.includes(v)) { arr.push(v); saveMoveExtra(arr); }
    ev.target.value = "";
    drawMoves();
  });

  // 自定义筛选 chips（R3-L3）：从全库标签点选或输入新词 → 顶栏筛选带即时增删（数量不限）
  function drawCustomChips() {
    const words = customChipWords();
    $("#set-customchips", ov).innerHTML = words.length
      ? words.map(w => `<span class="chip on">${escapeHtml(w)}<button type="button" class="chip-x" data-cchip-x="${escapeHtml(w)}" title="移除该筛选按钮">×</button></span>`).join("")
      : `<span class="chip-empty">还没有自定义筛选按钮</span>`;
    const lib = new Map();
    for (const x of data.entries) for (const t of (x.tags || [])) { const k = String(t).trim(); if (k) lib.set(k, (lib.get(k) || 0) + 1); }
    const pool = [...lib.keys()].sort((a, b) => (lib.get(b) - lib.get(a)) || a.localeCompare(b, "zh"))
      .filter(t => !words.includes(t)).slice(0, 16);
    $("#set-customchip-lib", ov).innerHTML = pool.length
      ? pool.map(t => `<button type="button" class="tag-sug" data-cchip-add="${escapeHtml(t)}" title="添加为顶栏筛选按钮">${escapeHtml(t)} ＋</button>`).join("")
      : (words.length ? `<span class="chip-empty">常用标签都加过了——下面输入新词创建</span>` : "");
  }
  ov.addEventListener("click", ev => {
    const add = ev.target.closest("[data-cchip-add]");
    const del = ev.target.closest("[data-cchip-x]");
    if (add) {
      const words = customChipWords();
      if (!words.includes(add.dataset.cchipAdd)) { words.push(add.dataset.cchipAdd); saveCustomChipWords(words); }
      drawCustomChips(); buildChipFilterRow(); render();
      return;
    }
    if (del) {
      saveCustomChipWords(customChipWords().filter(w => w !== del.dataset.cchipX));
      state.filterChips.delete("tag-" + del.dataset.cchipX);   // 若正选中，顺带清掉（chipMatch 对悬挂 id 本就安全，双保险）
      drawCustomChips(); buildChipFilterRow(); render();
    }
  });
  $("#set-customchip-in", ov).addEventListener("keydown", ev => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();
    const v = ev.target.value.trim();
    if (!v) return;
    const words = customChipWords();
    if (!words.includes(v)) { words.push(v); saveCustomChipWords(words); }
    ev.target.value = "";
    drawCustomChips(); buildChipFilterRow(); render();
  });

  drawMoves();
  drawCustomChips();
  drawRetired();
  drawMapOrder();   // 地图排序（I29）
  // 分享按钮可用性：有条目暂存/暂存图/报点快照才可分享（I20）
  shareableCount().then(n => {
    const btn = $("#set-share", ov);
    if (!btn) return;
    if (n > 0) btn.disabled = false;
    else $("#set-share-note", ov).textContent = "还没有修改可分享";
  });
  state.picking = true;
  pickerClose = close;
}


/* ---------------- 报点编辑器 ---------------- */

function calloutEditor() {
  const mapsWithRadar = mapOrder().filter(m => data.maps[m].radar_exists);   // I29：与顶栏同序
  const el = document.createElement("article");
  el.className = "card editor-card";
  el.innerHTML = `
    <div class="card-head">
      <h2>报点编辑器</h2>
      <select id="editor-map"></select>
      <button class="editor-btn" id="editor-add">＋ 新增（点图放置）</button>
      <span id="editor-fs-slot"></span>
      <button class="editor-btn" id="editor-export" hidden>导出 callouts.json</button>
      <button class="editor-btn" id="editor-reset">还原默认</button>
      <button class="editor-btn primary" id="editor-done">完成</button>
    </div>
    <div class="editor-hint" id="editor-hint"></div>
    <div class="radar-wrap map-wrap" id="editor-wrap"></div>
    <div class="editor-list" id="editor-list"></div>`;

  const mapSel = $("#editor-map", el);
  mapSel.innerHTML = mapsWithRadar.map(m =>
    `<option value="${m}" ${m === (state.editorMap || "de_mirage") ? "selected" : ""}>${data.maps[m].cn || m}</option>`).join("");
  mapSel.addEventListener("change", () => {
    state.editorMap = mapSel.value;
    refreshEditor(el);
  });

  initFsHandle().then(() => { refreshFsButton(); refreshTopbarAuth(); });   // I42：顶栏 🔗 同步刷新
  // 自动保存按钮（仅 need-link 首次关联出现；need-permission 已收编顶栏 🔗，I42）——委托绑定
  $("#editor-fs-slot", el).addEventListener("click", async ev => {
    const btn = ev.target.closest("#editor-fs");
    if (!btn) return;
    if (fsStatus === "need-permission") {
      toast("点顶栏的「🔗 自动保存」按钮即可一键恢复");
      return;
    }
    if (await linkCalloutsFile()) { refreshFsButton(); refreshTopbarAuth(); }
  });
  $("#editor-add", el).addEventListener("click", () => {
    state.editorPlacing = true;
    $("#editor-hint", el).textContent = "请在图上点击要放置的位置……";
  });
  $("#editor-done", el).addEventListener("click", async () => {
    // 退出前把挂着的防抖写盘强制落一次（I15）
    if (fsWriteTimer) {
      clearTimeout(fsWriteTimer);
      fsWriteTimer = null;
      await writeCalloutsFileNow();
    }
    state.editor = false;
    state.editorPlacing = false;
    render();
  });
  $("#editor-reset", el).addEventListener("click", ev => {
    // 两段确认（I18）：一键清空会丢掉所有自改报点（含自加点），必须防误触
    const btn = ev.currentTarget;
    if (btn.dataset.arm !== "1") {
      btn.dataset.arm = "1";
      btn.textContent = "再点确认：清空本浏览器的报点修改";
      setTimeout(() => { btn.dataset.arm = ""; btn.textContent = "还原默认"; }, 4000);
      return;
    }
    btn.dataset.arm = "";
    btn.textContent = "还原默认";
    localStorage.removeItem(EDITOR_KEY);
    refreshEditor(el);
    refreshFsButton();
    toast("已还原默认报点（你的修改若已自动保存过，data/callouts.json 文件不受影响）。已自动保存进文件的报点仍在文件里；要从文件删除请在编辑器里删除该报点");
  });
  $("#editor-export", el).addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(allCallouts(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "callouts.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  refreshEditor(el);
  return el;
}

// 自动保存状态区（I15）：ready=被动小字；未关联/过期=可点按钮；仅此浏览器不支持时才出现「导出」回退
function refreshFsButton() {
  const slot = document.getElementById("editor-fs-slot");
  if (!slot) return;
  const exportBtn = document.getElementById("editor-export");
  if (exportBtn) exportBtn.hidden = fsStatus !== "unsupported";
  const hint = document.getElementById("editor-hint");
  const hasOverlay = !!(localStorage.getItem(EDITOR_KEY) && localStorage.getItem(EDITOR_KEY) !== "{}");
  if (fsStatus === "ready") {
    slot.innerHTML = `<span class="fs-state">自动保存已开启</span>`;
    if (hint && !state.editorPlacing)
      hint.textContent = "拖动/加删/改名即实时保存到项目文件，首页与选点图同步更新；双击「同步并打包.bat」更新发布包。";
  } else if (fsStatus === "unsupported") {
    slot.innerHTML = `<span class="fs-state">此浏览器不支持自动保存</span>`;
    if (hint) hint.textContent = "改动保存在浏览器本地；需要同步到文件时用「导出 callouts.json」按钮。";
  } else {
    // I42：「重新连接自动保存」收编到顶栏 🔗（need-permission 态顶栏出现按钮）；编辑器只留
    // 首次「开启自动保存」（need-link 有场景上下文），need-permission 显示被动指引。
    if (fsStatus === "need-permission") {
      slot.innerHTML = `<span class="fs-state">自动保存待重连——点顶栏「🔗 自动保存」一键恢复</span>`;
      if (hint && !state.editorPlacing)
        hint.textContent = "自动保存连接已断开：点顶栏「🔗 自动保存」一键恢复（授权过期是浏览器正常行为）。";
      return;
    }
    slot.innerHTML = `<button class="editor-btn primary" id="editor-fs">开启自动保存</button>`;
    if (hint && !state.editorPlacing) {
      hint.textContent = hasOverlay
        ? "你有报点修改暂存在本浏览器（未防丢失）——点「开启自动保存」选择项目里的 data/callouts.json 写入文件。"
        : "点「开启自动保存」选择项目里的 data/callouts.json，之后改动实时自动保存、全局生效。";
    }
  }
}

function refreshEditor(el) {
  const mapKey = state.editorMap || "de_mirage";
  const mapInfo = data.maps[mapKey] || {};
  const wrap = $("#editor-wrap", el);
  const calloutsAll = allCallouts();
  const list = calloutsAll[mapKey] || [];

  wrap.innerHTML = `
    <img class="radar" src="${mapInfo.radar}" alt="雷达底图" draggable="false">
    <div class="callout-layer">
    ${list.map((c, i) => `
      <button class="callout-label draggable" data-idx="${i}"
              style="left:${c.u * 100}%;top:${c.v * 100}%">${escapeHtml(c.name)}</button>`).join("")}
    </div>
    ${state.editorPlacing ? `<div class="placing-mark">点击放置新报点</div>` : ""}`;

  // 拖拽 + 点击跳行（位移 <4px 视为点击，在 startDrag 的 pointerup 里触发）
  $$(".callout-label", wrap).forEach(btn => {
    btn.addEventListener("pointerdown", ev => startDrag(ev, btn, el, mapKey));
  });
  // 放置新报点
  wrap.onclick = ev => {
    if (!state.editorPlacing || ev.target !== wrap && !ev.target.classList.contains("radar")) return;
    const rect = wrap.querySelector(".radar").getBoundingClientRect();
    const u = +((ev.clientX - rect.left) / rect.width).toFixed(4);
    const v = +((ev.clientY - rect.top) / rect.height).toFixed(4);
    const arr = editableCalloutsFor(mapKey);
    const name = `新报点${arr.length + 1}`;
    arr.push({ name, search: [name], u, v });
    saveCalloutsForMap(mapKey, arr);
    state.editorPlacing = false;
    refreshEditor(el);
    refreshFsButton();   // 恢复自动保存状态提示（放置提示用完即撤，I15）
  };

  // 列表
  const listEl = $("#editor-list", el);
  listEl.innerHTML = list.map((c, i) => `
    <div class="editor-row" data-idx="${i}">
      <input class="f-name" value="${escapeHtml(c.name)}" title="报点名">
      <input class="f-search" value="${escapeHtml((c.search || []).join(","))}"
             title="搜索词（逗号分隔），点击该报点时按这些词精确匹配条目的 spots">
      <span class="f-pos">u${c.u.toFixed(3)} v${c.v.toFixed(3)}</span>
      <button class="editor-btn danger" data-del="${i}">删除</button>
    </div>`).join("");

  $$(".editor-row", listEl).forEach(row => {
    const i = Number(row.dataset.idx);
    // 反向联动：编辑行聚焦 → 地图对应标签闪高亮
    row.addEventListener("focusin", () => {
      const btn = $(`#editor-wrap .callout-label[data-idx="${i}"]`, el);
      if (btn) {
        btn.classList.remove("label-flash");
        void btn.offsetWidth;   // 重启动画
        btn.classList.add("label-flash");
        setTimeout(() => btn.classList.remove("label-flash"), 1500);
      }
    });
    $(".f-name", row).addEventListener("change", ev => {
      const arr = editableCalloutsFor(mapKey);
      const c = arr[i];
      const oldName = c.name;
      c.name = ev.target.value.trim() || c.name;
      if (oldName !== c.name) recordRemovedCallout(mapKey, oldName);   // 改名 = 文件里删旧名并入新名（I19）
      if (!c.search.includes(c.name)) c.search.push(c.name);
      saveCalloutsForMap(mapKey, arr);
      refreshEditor(el);
    });
    $(".f-search", row).addEventListener("change", ev => {
      const arr = editableCalloutsFor(mapKey);
      arr[i].search = ev.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      saveCalloutsForMap(mapKey, arr);
    });
    $(`[data-del]`, row).addEventListener("click", () => {
      const arr = editableCalloutsFor(mapKey);
      const [victim] = arr.splice(i, 1);
      recordRemovedCallout(mapKey, victim?.name);   // 记入 removed：写盘并集时从文件剔除（I19）
      saveCalloutsForMap(mapKey, arr);
      refreshEditor(el);
    });
  });

  // hint 文案由 refreshFsButton 按自动保存状态统一管理（I15），此处不再覆盖
}

function startDrag(ev, btn, el, mapKey) {
  ev.preventDefault();
  ev.stopPropagation();
  const wrap = $("#editor-wrap", el);
  const img = wrap.querySelector(".radar");
  const idx = Number(btn.dataset.idx);
  const startPos = { x: ev.clientX, y: ev.clientY };
  let moved = 0;
  btn.setPointerCapture(ev.pointerId);
  btn.classList.add("dragging");

  const move = e => {
    moved = Math.max(moved, Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y));
    const rect = img.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const v = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    btn.style.left = u * 100 + "%";
    btn.style.top = v * 100 + "%";
    const arr = editableCalloutsFor(mapKey);
    arr[idx].u = +u.toFixed(4);
    arr[idx].v = +v.toFixed(4);
    saveCalloutsForMap(mapKey, arr);
    const row = $(`.editor-row[data-idx="${idx}"] .f-pos`, el);
    if (row) row.textContent = `u${u.toFixed(3)} v${v.toFixed(3)}`;
  };
  const up = () => {
    btn.classList.remove("dragging");
    btn.removeEventListener("pointermove", move);
    btn.removeEventListener("pointerup", up);
    // 位移 <4px 视为点击（非拖拽）→ 跳到编辑行
    if (moved < 4) jumpToEditorRow(el, idx);
  };
  btn.addEventListener("pointermove", move);
  btn.addEventListener("pointerup", up);
}

// 点地图报点标签 → 编辑列表滚到对应行 + 高亮 + 聚焦名称框
function jumpToEditorRow(el, idx) {
  const row = $(`.editor-row[data-idx="${idx}"]`, el);
  if (!row) return;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.remove("row-flash");
  void row.offsetWidth;   // 重启动画
  row.classList.add("row-flash");
  setTimeout(() => row.classList.remove("row-flash"), 1500);
  const name = $(".f-name", row);
  if (name) {
    name.focus();
    const L = name.value.length;
    try { name.setSelectionRange(L, L); } catch { }
  }
}


/* ---------------- 战术板编辑器（I39：零命令行补洞，语义对齐道具编辑器） ---------------- */

// 自动 id：`<short>-plan-<两位序号>`（扫 data.tactics + 覆盖层 added 取最小空号；-default 板不受影响）
function autoTacticId(map) {
  const short = String(map || "").startsWith("de_") ? map.slice(3) : String(map || "");
  const ov = tacticOverrides();
  const used = new Set([...(data.tactics || []).map(x => x.id), ...(ov.added || []).map(a => a.id)]);
  for (let n = 1; n <= 99; n++) {
    const id = `${short}-plan-${String(n).padStart(2, "0")}`;
    if (!used.has(id)) return id;
  }
  return `${short}-plan-${Date.now().toString(36).slice(-4)}`;
}

function persistTacticEdits(tactic, orig) {
  const ov = tacticOverrides();
  ov.edited = ov.edited || {};
  if (orig && orig.id === tactic.id) {
    ov.edited[tactic.id] = { ...tactic };
    // added 的板再编辑：全量转 edited 并从 added 移除，否则 applyTacticOverrides 会重复 push（I39 验收发现）
    ov.added = (ov.added || []).filter(a => a.id !== tactic.id);
  } else {
    ov.added = (ov.added || []).filter(a => a.id !== tactic.id);
    ov.added.push({ ...tactic });
  }
  ov.savedAt = ov.savedAt || {};
  ov.written = ov.written || {};
  ov.savedAt[tactic.id] = isoNow();
  ov.written[tactic.id] = false;
  saveTacticOverrides(ov);
}

function tacticEditor(idOrNew) {
  const isNew = idOrNew === "__new__";
  const orig = isNew ? null : data.tactics.find(t => t.id === idOrNew);
  if (!isNew && !orig) { state.tacticEditId = null; return document.createElement("div"); }

  const el = document.createElement("article");
  el.className = "card entry-editor tactic-editor";
  const t = orig || {
    id: "", map: state.map || "de_dust2", side: "both", title: "",
    window: "整局", status: "draft", uses: [], roles: [], timeline: [], body: "",
  };

  let usesSel = [...(t.uses || [])];
  // I41：步骤行 {t 存值, rawT 非规范原值, role 1-5, text, use}；rolesRows=角色与出生位（≤5）
  let tlRows = (Array.isArray(t.timeline) ? t.timeline : []).map(s => {
    const raw = String(s.t || "").trim();
    const okT = /^([0-1]):([0-5]\d)$/.test(raw) && (() => { const m = raw.split(":"); return (+m[0] * 60 + +m[1]) <= 115; })();
    return { t: okT ? raw : "", rawT: okT ? "" : (s.t || ""), role: s.role || 0, text: s.text || "", use: s.use || "" };
  });
  let rolesRows = (Array.isArray(t.roles) ? t.roles : []).slice(0, 5).map(r => ({ name: r.name || "" }));   // I42：出生位已移除
  const sameMapEntries = () => data.entries.filter(e => e.map === t.map && e.status !== "retired");
  const opt = (arr, cur) => arr.map(([v, cn]) =>
    `<option value="${v}" ${cur === v ? "selected" : ""}>${cn}</option>`).join("");
  const secOpts = (max, cur) => Array.from({ length: max + 1 }, (_, s) =>
    `<option value="${String(s).padStart(2, "0")}" ${String(cur).padStart(2, "0") === String(s).padStart(2, "0") ? "selected" : ""}>${String(s).padStart(2, "0")}</option>`).join("");

  el.innerHTML = `
    <div class="card-head"><h2>${isNew ? "新增战术板" : "编辑战术板"}</h2>
      <span class="badge-status ${t.status}">${STATUS_CN[t.status] || t.status}</span>
      <span class="toolbar-tip">保存后写入 tactics/${escapeHtml(t.id || "<自动 id>")}.md，双击「同步并打包.bat」进发布包</span>
    </div>
    <div class="form-grid">
      <label>标题<input id="tf-title" value="${escapeHtml(t.title)}"></label>
      <label>地图<select id="tf-map" ${isNew ? "" : `disabled title="已有板不改地图（id 与地图绑定）"`}>${mapOrder().map(m =>
        `<option value="${m}" ${t.map === m ? "selected" : ""}>${escapeHtml(data.maps[m]?.cn || m)}</option>`).join("")}</select></label>
      <label>阵营<select id="tf-side">${opt(schemaEnumPairs("tactic", "side") || [["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]], t.side)}</select></label>
      <label>时间窗<input id="tf-window" value="${escapeHtml(t.window || "")}" placeholder="如 1:55-1:20 或 整局"></label>
      <label>状态<select id="tf-status">${opt([["draft", "待验证"], ["verified", "已实测"]], t.status || "draft")}</select></label>
      <label>实测日期（状态=已实测时生效）<input id="tf-checked" value="${escapeHtml(t.checked || new Date().toISOString().slice(0, 10))}" placeholder="YYYY-MM-DD"></label>
      <label>引用道具（这块板用到的道具，卡片下方缩略条）
        <span class="chips-row" id="tf-uses-chips"></span>
        <span class="pick-row">
          <select id="tf-uses-sel" class="tlr-use"></select>
          <button type="button" class="editor-btn" id="tf-uses-add">＋ 添加</button>
        </span>
      </label>
    </div>
    <div class="set-row tl-edit-block">
      <div class="set-label">时间轴步骤<span class="set-tip">倒计时选时间（1:55=开局，0:00=回合结束）、可挂道具、可分给角色；按剩余时间自动排序，↑↓ 只调同刻先后</span></div>
      <div id="tl-rows"></div>
      <span class="pick-row"><button type="button" class="editor-btn" id="tl-add">＋ 加一行</button></span>
    </div>
    <div class="set-row tl-edit-block">
      <div class="set-label">角色（可选，最多 5 个）<span class="set-tip">给角色起名（如「1号 狙」）；地图上 ①②③ 自动站在各自第一个动作的道具起点</span></div>
      <div id="role-rows"></div>
      <span class="pick-row"><button type="button" class="editor-btn" id="role-add">＋ 加一个角色</button></span>
    </div>
    <label class="notes-label">正文要点（用 ## 分节，一行一个要点）<textarea id="tf-body" rows="10">${escapeHtml(t.body || "")}</textarea></label>
    <div class="editor-hint" id="tf-hint">${rootPerm === "ready"
      ? "已关联项目文件夹：保存直接写回 tactics/*.md。"
      : "未关联项目文件夹：保存先在浏览器生效；关联后自动写回文件。"} 双击「同步并打包.bat」更新发布包。</div>
    <div class="editor-actions">
      <button class="editor-btn primary" id="tf-save">保存</button>
      <button class="editor-btn" id="tf-cancel">取消</button>
      ${!isNew ? `<button class="editor-btn danger" id="tf-delete">删除这块板</button>` : ""}
    </div>`;

  function drawUses() {
    $("#tf-uses-chips", el).innerHTML = usesSel.length
      ? usesSel.map((uid, i) => {
        const e = data.entries.find(x => x.id === uid);
        return `<span class="chip on">${escapeHtml(e ? e.title : uid)}<button type="button" class="chip-x" data-usex="${i}" title="移除">×</button></span>`;
      }).join("")
      : `<span class="chip-empty">暂无引用道具</span>`;
    const selEl = $("#tf-uses-sel", el);
    const es = sameMapEntries();
    selEl.innerHTML = es.length
      ? es.map(e => `<option value="${e.id}">${escapeHtml(e.title)}（${escapeHtml(e.throw_badge || "")}）</option>`).join("")
      : `<option value="">（该图还没有道具）</option>`;
  }
  function drawTlRows() {
    $("#tl-rows", el).innerHTML = tlRows.length ? tlRows.map((r, i) => {
      const norm = !r.rawT;
      const mm = norm ? parseInt(String(r.t).split(":")[0] || "0", 10) : 0;
      const ss = norm ? parseInt(String(r.t).split(":")[1] || "0", 10) : 0;
      const secMax = mm === 1 ? 55 : 59;   // 1 分列秒只到 55（一局 1:55）
      return `
      <div class="tl-row" data-i="${i}">
        ${r.rawT ? `<span class="tl-warn" title="时间不是 M:SS 格式，滚轮重选即修复">⚠ ${escapeHtml(r.rawT)}</span>` : ""}
        <span class="tlr-clock" title="倒计时（1:55=开局，0:00=回合结束）">
          <select class="tlr-min" data-i="${i}"><option value="0" ${mm === 0 ? "selected" : ""}>0</option><option value="1" ${mm === 1 ? "selected" : ""}>1</option></select>
          <b>:</b>
          <select class="tlr-sec" data-i="${i}">${secOpts(secMax, ss)}</select>
        </span>
        <span class="tlr-roles" title="分给哪个角色">
          ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="tlr-role ${r.role === n ? "on" : ""}" data-rolerole="${n}" data-i="${i}"
            ${n > rolesRows.length ? `disabled title="先在下方「角色与出生位」加角色${n}"` : `title="${escapeHtml(rolesRows[n - 1]?.name || `角色${n}`)}"`}>${["①", "②", "③", "④", "⑤"][n - 1]}</button>`).join("")}
          <button type="button" class="tlr-role none ${!r.role ? "on" : ""}" data-rolerole="0" data-i="${i}" title="未指派">无</button>
        </span>
        <input class="tlr-text" value="${escapeHtml(r.text)}" placeholder="做什么（留空自动生成）">
        <select class="tlr-use" data-i="${i}"><option value="">不挂道具</option>${sameMapEntries().map(e =>
          `<option value="${e.id}" ${r.use === e.id ? "selected" : ""}>${escapeHtml(e.title)}</option>`).join("")}</select>
        <button type="button" class="editor-btn mini" data-tlup="${i}" ${i === 0 ? "disabled" : ""} title="同刻内提前">↑</button>
        <button type="button" class="editor-btn mini" data-tldown="${i}" ${i === tlRows.length - 1 ? "disabled" : ""} title="同刻内靠后">↓</button>
        <button type="button" class="editor-btn mini danger" data-tldel="${i}" title="删除这一行">✕</button>
      </div>`;
    }).join("")
      : `<div class="chip-empty">还没有步骤——点「＋ 加一行」开始编排</div>`;
  }
  function drawRoleRows() {
    $("#role-rows", el).innerHTML = rolesRows.length ? rolesRows.map((r, i) => `
      <div class="role-row" data-i="${i}">
        <input class="rr-name" value="${escapeHtml(r.name)}" placeholder="角色${i + 1}" maxlength="8">
        <span class="rr-hint">站在第一个动作的起点</span>
        <button type="button" class="editor-btn mini danger" data-roledel="${i}" title="删除角色（步骤里的指派会变未指派）">✕</button>
      </div>`).join("")
      : `<div class="chip-empty">还没配置角色——分给角色 1 前先加一个</div>`;
  }
  drawRoleRows();
  // 行内输入实时写回 tlRows/rolesRows（保存时统一校验）
  $("#tl-rows", el).addEventListener("input", ev => {
    const row = ev.target.closest(".tl-row");
    if (!row) return;
    const i = Number(row.dataset.i);
    if (ev.target.classList.contains("tlr-text")) tlRows[i].text = ev.target.value;
  });
  $("#tl-rows", el).addEventListener("change", ev => {
    const row = ev.target.closest(".tl-row");
    if (!row) return;
    const i = Number(row.dataset.i);
    if (ev.target.classList.contains("tlr-min") || ev.target.classList.contains("tlr-sec")) {
      const minSel = row.querySelector(".tlr-min");
      const secSel = row.querySelector(".tlr-sec");
      let mm = parseInt(minSel.value, 10) || 0;
      let ss = parseInt(secSel.value, 10) || 0;
      if (mm === 1 && ss > 55) {   // 一局 1:55：1 分列秒截到 55
        ss = 55;
        secSel.innerHTML = secOpts(55, ss);
      }
      tlRows[i].t = `${mm}:${String(ss).padStart(2, "0")}`;
      tlRows[i].rawT = "";   // 滚轮重选即修复 ⚠
    }
    if (ev.target.classList.contains("tlr-use")) tlRows[i].use = ev.target.value;
  });
  $("#tl-rows", el).addEventListener("click", ev => {
    const roleBtn = ev.target.closest("[data-rolerole]");
    if (roleBtn) {
      const i = Number(roleBtn.dataset.i);
      tlRows[i].role = Number(roleBtn.dataset.rolerole) || 0;
      drawTlRows();
      return;
    }
    const up = ev.target.closest("[data-tlup]");
    const down = ev.target.closest("[data-tldown]");
    const del = ev.target.closest("[data-tldel]");
    if (up) { const i = Number(up.dataset.tlup); [tlRows[i - 1], tlRows[i]] = [tlRows[i], tlRows[i - 1]]; drawTlRows(); }
    if (down) { const i = Number(down.dataset.tldown); [tlRows[i + 1], tlRows[i]] = [tlRows[i], tlRows[i + 1]]; drawTlRows(); }
    if (del) { tlRows.splice(Number(del.dataset.tldel), 1); drawTlRows(); }
  });
  // 角色行（I42：只填名字，出生位已移除）
  $("#role-add", el).addEventListener("click", () => {
    if (rolesRows.length >= 5) { toast("最多 5 个角色"); return; }
    rolesRows.push({ name: "" });
    drawRoleRows();
    drawTlRows();   // 新角色解锁对应 chip
  });
  $("#role-rows", el).addEventListener("input", ev => {
    const row = ev.target.closest(".role-row");
    if (row && ev.target.classList.contains("rr-name")) rolesRows[Number(row.dataset.i)].name = ev.target.value;
  });
  $("#role-rows", el).addEventListener("click", ev => {
    const row = ev.target.closest(".role-row");
    if (!row) return;
    const i = Number(row.dataset.i);
    const del = ev.target.closest("[data-roledel]");
    if (del) {
      rolesRows.splice(i, 1);
      drawRoleRows();
      drawTlRows();
    }
  });
  $("#tl-add", el).addEventListener("click", () => { tlRows.push({ t: "1:55", rawT: "", role: 0, text: "", use: "" }); drawTlRows(); });
  $("#tf-uses-add", el).addEventListener("click", () => {
    const v = $("#tf-uses-sel", el).value;
    if (!v) return;
    if (!usesSel.includes(v)) usesSel.push(v);
    drawUses();
  });
  el.addEventListener("click", ev => {
    const x = ev.target.closest("[data-usex]");
    if (x) { usesSel.splice(Number(x.dataset.usex), 1); drawUses(); }
  });
  drawUses();
  drawTlRows();

  $("#tf-cancel", el).addEventListener("click", () => { state.tacticEditId = null; render(); });
  $("#tf-save", el).addEventListener("click", async () => {
    const val = id => $("#" + id, el).value.trim();
    const title = val("tf-title");
    if (!title) { toast("标题不能为空"); return; }
    // timeline 校验（I41：text 可空显示自动生成；非规范旧 t 保留存值带 ⚠）
    const steps = [];
    for (const r of tlRows) {
      const tt = (r.rawT || r.t || "").trim();
      const text = (r.text || "").trim();
      const use = (r.use || "").trim();
      const role = Number(r.role) || 0;
      if (!tt && !text && !use && !role) continue;
      if (!tt) { toast("时间轴每一行都要选时间（滚轮）——不要的行直接 ✕ 删掉"); return; }
      if (role > rolesRows.length) { toast(`步骤指派了角色${role}，但「角色」区里只有 ${rolesRows.length} 个角色`); return; }
      steps.push({ t: tt, ...(role ? { role } : {}), ...(text ? { text } : {}), ...(use ? { use } : {}) });
    }
    if (steps.length > 20) { toast("时间轴最多 20 步"); return; }
    const rolesClean = rolesRows
      .map(r => ({ ...(r.name.trim() ? { name: r.name.trim() } : {}) }))
      .filter(r => r.name);
    const status = val("tf-status");
    const tactic = {
      id: t.id, map: $("#tf-map", el).value, side: val("tf-side"),
      title, window: val("tf-window") || "整局", status,
      uses: [...usesSel],
      ...(rolesClean.length ? { roles: rolesClean } : {}),
      ...(steps.length ? { timeline: steps } : {}),
      body: $("#tf-body", el).value.replace(/\r\n/g, "\n").trim(),
    };
    if (status === "verified") {
      const d = val("tf-checked");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { toast("已实测状态需要实测日期（YYYY-MM-DD）"); return; }
      tactic.checked = d;
    }
    if (isNew) {
      tactic.id = autoTacticId(tactic.map);
      tactic.status = "draft";
      delete tactic.checked;   // 新增板一律 draft（新增条目同款红线）
    }
    persistTacticEdits(tactic, orig);
    const wrote = await writeTacticFile(tactic);
    if (wrote) markTacticWritten(tactic.id);
    applyTacticOverrides();
    state.tacticEditId = null;
    state.tlBoard = tactic.id;   // 时间轴层直接看到刚编的板
    render();
    toast(isNew
      ? `已创建战术板 ${tactic.id}${wrote ? "，已写入文件 ✓" : "（未关联项目文件夹，暂存浏览器）"}`
      : wrote ? "已保存并写回 tactics 文件 ✓" : "已保存在本浏览器 ✓ 关联项目文件夹后自动写回");
  });
  if (!isNew) {
    $("#tf-delete", el).addEventListener("click", async ev => {
      const btn = ev.currentTarget;
      if (btn.dataset.arm !== "1") {
        btn.dataset.arm = "1";
        btn.textContent = "确认删除？（不可撤销）";
        setTimeout(() => { if (btn.isConnected) { btn.dataset.arm = ""; btn.textContent = "删除这块板"; } }, 3000);
        return;
      }
      const ov = tacticOverrides();
      ov.deleted = [...new Set([...(ov.deleted || []), t.id])];
      ov.savedAt = ov.savedAt || {};
      ov.savedAt[t.id] = isoNow();
      ov.written = ov.written || {};
      ov.written[t.id] = false;
      saveTacticOverrides(ov);
      const ok = await deleteTacticFile(t.id);
      if (ok) markTacticWritten(t.id);
      applyTacticOverrides();
      if (state.tlBoard === t.id) state.tlBoard = null;
      state.tacticEditId = null;
      render();
      refreshSyncBadge();
      toast(ok ? "战术板已删除并写盘 ✓" : "战术板已删除（浏览器内）；关联项目文件夹后写盘");
    });
    // I34 同款：打开即读盘（ready 且非新增）——表单以 tactics/<id>.md 为准
    if (rootPerm === "ready" && rootDirHandle) {
      (async () => {
        try {
          const dir = await tacticsDir(false);
          const fh = await dir.getFileHandle(`${idOrNew}.md`);
          const disk = parseTacticMd(await (await fh.getFile()).text());
          if (!disk || disk.id !== idOrNew) return;
          const FIELDS = ["title", "window", "status", "checked", "uses", "timeline", "roles", "body", "side"];
          const changed = FIELDS.some(k => JSON.stringify(disk[k] ?? "") !== JSON.stringify(t[k] ?? ""));
          if (!changed || state.tacticEditId !== idOrNew) { Object.assign(t, disk); return; }
          Object.assign(t, disk);
          usesSel = [...(t.uses || [])];
          tlRows = (Array.isArray(t.timeline) ? t.timeline : []).map(s => {
            const raw = String(s.t || "").trim();
            const okT = /^([0-1]):([0-5]\d)$/.test(raw) && (() => { const m = raw.split(":"); return (+m[0] * 60 + +m[1]) <= 115; })();
            return { t: okT ? raw : "", rawT: okT ? "" : (s.t || ""), role: s.role || 0, text: s.text || "", use: s.use || "" };
          });
          rolesRows = (Array.isArray(t.roles) ? t.roles : []).slice(0, 5).map(r => ({ name: r.name || "" }));   // I42：旧 spawn 值不迁移，保存一次该板即自然清除
          $("#tf-title", el).value = t.title || "";
          $("#tf-window", el).value = t.window || "";
          $("#tf-body", el).value = t.body || "";
          $("#tf-checked", el).value = t.checked || "";
          $("#tf-status", el).value = t.status || "draft";
          $("#tf-side", el).value = t.side || "both";
          drawUses();
          drawRoleRows();
          drawTlRows();
          toast("已按文件最新内容显示（页面数据较旧，保存后双击 bat 同步）");
        } catch { /* 读盘/解析失败：静默回落现状 */ }
      })();
    }
  }
  return el;
}

PB.files.push("pb-editor.js");   // R1-B 模块登记
