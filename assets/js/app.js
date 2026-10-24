/* app.js — 瘦壳：init/boot/render 路由/全局键盘（R1-B 拆分收尾；加载序必须最后） */
"use strict";

function init() {
  migrateMoveExtra();   // I28：清旧预置「蹲下」等与内置同名的自定义移动项
  // 默认地图（I29）：pb-map 记忆合法则用记忆（I14）；无记忆/非法/旧存档空值 → pb-map-order 第一位
  const order = mapOrder();
  const saved = localStorage.getItem("pb-map");
  if (!saved || !order.includes(saved)) {
    state.map = order[0] || "de_dust2";
    localStorage.setItem("pb-map", state.map);
  }
  // 地图下拉（I29：无「全部地图」聚合项；顺序按 ⚙ 自定义排序）
  buildMapSelect();
  const mapSel = $("#map-filter");
  mapSel.addEventListener("change", () => {
    state.map = mapSel.value;
    localStorage.setItem("pb-map", mapSel.value);
    render();
  });

  $("#tabs").addEventListener("click", ev => {
    const btn = ev.target.closest("button[data-tab]");
    if (!btn) return;
    state.tab = btn.dataset.tab;
    $$("#tabs button").forEach(b => b.classList.toggle("active", b === btn));
    render();
  });

  $("#type-filter").addEventListener("click", ev => {
    const btn = ev.target.closest("button[data-type]");
    if (!btn) return;
    const t = btn.dataset.type;
    state.types.has(t) ? state.types.delete(t) : state.types.add(t);
    btn.classList.toggle("active", state.types.has(t));
    render();
  });

  // 📦 只看战术包（I47）：列表切到套装折叠视图（未分组条目收进「未分组」），再点还原普通列表
  $("#sets-toggle").addEventListener("click", () => {
    state.setsOnly = !state.setsOnly;
    refreshSetsToggle();
    render();
  });

  // 阵营过滤（I23）：全部/T/CT，both 两侧都显示；会话内有效不持久化
  $$("#side-filter button").forEach(btn => btn.addEventListener("click", () => {
    state.side = btn.dataset.side;
    $$("#side-filter button").forEach(b => b.classList.toggle("active", b === btn));
    render();
  }));

  const search = $("#search");
  search.addEventListener("input", () => {
    state.search = search.value.trim();
    state.searchTerms = null;   // 手动输入优先于报点过滤
    state.spot = null;
    render();
  });

  // 快捷筛选 chips（I50）：固定集合 init 一次渲染；同 dim 互斥单选、跨 dim AND、与搜索词 AND
  const chipWrap = $("#chip-filter");
  chipWrap.innerHTML = FILTER_CHIPS.map(c => `<button class="fchip" data-fchip="${c.id}">${c.label}</button>`).join("")
    + `<button class="fchip-clear" data-fchipclear hidden>✕ 清除</button>`;
  chipWrap.addEventListener("click", ev => {
    if (ev.target.closest("[data-fchipclear]")) {
      state.filterChips.clear();
      refreshChipFilter();
      render();
      return;
    }
    const btn = ev.target.closest("[data-fchip]");
    if (!btn) return;
    const chip = FILTER_CHIP_BY_ID.get(btn.dataset.fchip);
    if (!chip) return;
    if (state.filterChips.has(chip.id)) {
      state.filterChips.delete(chip.id);   // 再点已选中的=取消
    } else {
      for (const other of FILTER_CHIPS) if (other.dim === chip.dim) state.filterChips.delete(other.id);
      state.filterChips.add(chip.id);
    }
    refreshChipFilter();
    render();
  });
  window.addEventListener("resize", refreshChipFilter);   // 溢出渐隐随窗口宽度实时重算（I50）

  $("#btn-settings").addEventListener("click", openSettings);   // 全局设置（I17）

  document.addEventListener("keydown", onKey);
  document.addEventListener("paste", onPaste);   // I40：Ctrl+V 贴图进图槽
  // I44：全局兜底——异步静默失败显性化（落 I13 教训「unhandledrejection 是抓 async 静默失败的唯一手段」）
  window.addEventListener("unhandledrejection", e => {
    console.error(e.reason);
    toast(`出错了：${e.reason?.message || e.reason}（详情见控制台）`);
  });

  const lb = $("#lightbox");
  lb.addEventListener("click", ev => {
    if (ev.target.classList.contains("lb-zone")) return;   // 切换区有自己的监听
    closeLightbox();
  });
  $(".lb-zone.left", lb).addEventListener("click", ev => {
    ev.stopPropagation();
    lightboxStep(-1);
  });
  $(".lb-zone.right", lb).addEventListener("click", ev => {
    ev.stopPropagation();
    lightboxStep(1);
  });

  diskEntries = JSON.parse(JSON.stringify(data.entries));   // 磁盘基线：必须在覆盖层合并前抓取（I19）
  retireStaleOverrides();   // 「文件是唯一真相」对账：文件已收录的暂存退役进搁置区（I19）
  applyEntryOverrides();   // 本地编辑覆盖层（含增删）先生效
  applyTacticOverrides();   // 战术板覆盖层（I39）
  if (sessionStorage.getItem("pb-reset-done")) {
    sessionStorage.removeItem("pb-reset-done");
    toast("已重置本地编辑，当前显示磁盘数据 ✓（磁盘文件不受影响）");
  }
  render();
  autoSyncOnBoot();   // 启动自动补写盘：上次没写完的图片静默写掉，徽标自然消失（I16）
}


/* ---------------- 渲染 ---------------- */

function render() {
  const cards = $("#cards");
  cards.innerHTML = "";
  state.focusIdx = -1;
  refreshSetsToggle();   // 📦 开关视觉态与 state 同步（I47，程序化切换后也正确）
  refreshChipFilter();   // chips 行显隐/选中态/清除钮（I50）

  let visible;
  let mapCard = null;
  entryListPlaceholder = false;
  if (state.tab === "entries") {
    // 编辑器优先（列表/详情里点「编辑」都要能进来）
    if (state.editingId) {
      cards.appendChild(entryEditor(state.editingId));
      visible = [];
    } else if (state.entryView) {
      // 二级详情页
      visible = data.entries.filter(entryMatch);
      const page = entryDetailPage(visible);
      if (page) cards.appendChild(page);
      else { state.entryView = null; render(); return; }
    } else {
      // 一级：紧凑列表页
      if (state.drill && state.drillTarget) {
        const crumb = document.createElement("div");
        crumb.className = "drill-crumb card";
        crumb.innerHTML = `
          <button class="editor-btn" id="drill-back">← 换个目标</button>
          <button class="editor-btn" id="drill-exit">退出钻取</button>
          <span class="drill-path">${state.drill.mode === "target"
            ? `${escapeHtml(state.drillTarget)}（起点）→ <b>${escapeHtml(state.drill.name)}</b>（目标）`
            : `${escapeHtml(state.drill.name)}（起点）→ <b>${escapeHtml(state.drillTarget)}</b>（目标）`}</span>
          <span class="toolbar-tip">点行进详情；详情页 ←/→ 切换上/下一条</span>`;
        cards.appendChild(crumb);
        $("#drill-back", crumb).addEventListener("click", () => {
          state.drillTarget = null; state.tab = "tactics"; render();
        });
        $("#drill-exit", crumb).addEventListener("click", clearDrill);
      } else {
      const bar = document.createElement("div");
      bar.className = "entries-toolbar";
      // I42：「🔑 重新授权项目文件夹」已收编到顶栏（need-permission 时顶栏出现）；这里只留
      // ready 提示与首次关联入口。need-permission 时该按钮隐藏并提示去顶栏。
      const rootBtn = rootPerm === "ready" ? "✔ 项目文件夹已关联"
        : rootPerm === "need-permission" ? "🔑 授权已过期——点顶栏「🔑 项目文件夹」一键恢复"
        : "📁 关联项目文件夹（选项目根目录，含 index.html）";
      bar.innerHTML = `
        <button class="editor-btn" id="btn-add-entry">＋ 新增道具</button>
        <button class="editor-btn" id="btn-sort">📥 分拣台（批量录入）</button>
        <button class="editor-btn" id="btn-link-root" ${rootPerm === "need-permission" ? 'title="请点顶栏「🔑 项目文件夹」一键恢复"' : 'title="选择项目根目录（D:\\...\\CS2，含 index.html 的那个文件夹）"'}>${rootBtn}</button>
        <button class="editor-btn danger" id="btn-reset-local">↺ 重置本地编辑（以磁盘为准）</button>
        <span class="toolbar-tip">编辑先保存在浏览器；关联文件夹并双击「同步并打包.bat」后固化到项目</span>`;
      cards.appendChild(bar);
      $("#btn-add-entry", bar).addEventListener("click", () => { state.editingId = "__new__"; render(); });
      $("#btn-sort", bar).addEventListener("click", () => openSortStation());
      $("#btn-link-root", bar).addEventListener("click", async () => {
        if (rootPerm === "ready") return;
        if (rootPerm === "need-permission") { toast("点顶栏的「🔑 项目文件夹」按钮即可一键恢复授权"); return; }
        if (await linkRootDir()) { toast("已关联项目根目录 ✓ 浏览器重启后点顶栏「🔑」即可恢复"); render(); }
      });
      $("#btn-reset-local", bar).addEventListener("click", ev => resetLocalEdits(ev.currentTarget));
      }
      visible = data.entries.filter(entryMatch);
      // 选中的地图一条道具都没有：给占位提示而不是空列表
      let usedPlaceholder = false;
      if (!visible.length && state.map && !data.entries.some(e => e.map === state.map)) {
        usedPlaceholder = true;
        const ph = document.createElement("div");
        ph.className = "empty-panel";
        ph.innerHTML = `<p>「${escapeHtml((data.maps[state.map] || {}).cn || state.map)}」还没有录入道具。</p>
          <p>可点上方「＋ 新增道具」开始收录，或先去战术板看该图报点。</p>`;
        cards.appendChild(ph);
      }
      if (visible.length) cards.appendChild(entryListPanel(visible));
      if (usedPlaceholder) visible = [];   // 让通用空态不再重复出现
    }
  } else if (state.editor) {
    cards.appendChild(calloutEditor());
    visible = [];
  } else if (state.drill) {
    // 钻取第二级：只显示该起点可丢到的目标点
    cards.appendChild(drillCard());
    visible = [];
  } else {
    // 互动地图（报点标注，点击起点进入钻取）+ 各战术板顺序卡
    if (state.tacticEditId) {   // 战术板编辑器优先（I39）
      cards.appendChild(tacticEditor(state.tacticEditId));
      visible = [];
    } else {
      mapCard = calloutMapCard();
      if (mapCard) cards.appendChild(mapCard);
      visible = data.tactics.filter(tacticMatch);
      visible.forEach(t => cards.appendChild(tacticCard(t)));
    }
  }

  // 道具列表页刚显示过「该图还没有录入道具」占位时，不再叠加通用空态
  const none = visible.length === 0 && !mapCard && !state.editor && !state.drill
    && !(state.drill && state.drillTarget) && !entryListPlaceholder;
  $("#empty-filter").hidden = !none;
  if (none) {
    $("#empty-filter p").innerHTML =
      `${state.tab === "entries" ? "没有匹配的条目" : "没有匹配的战术板"}。<span class="kbd">Esc</span> 清空筛选`;
  }
  refreshSyncBadge();
  refreshAnchorNav();   // I49：留白锚点导航随渲染重建——分组增减（收藏/过滤/套装）自动跟随
}


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
      <label>键位<select id="ef-click">${opt([["lmb", "左键"], ["rmb", "右键"], ["both", "双键"]], e.click)}</select></label>
      <label>移动<select id="ef-move">${opt(moveChoices([["stand", "原地"], ["crouch", "蹲下"], ["w", "W 前进"], ["walk-step", "W 一步"], ["shift", "Shift"], ["shift-w", "Shift+W"], ["run", "跑"]]), e.move)}</select></label>
      <label>　<span class="set-tip">更多移动方式在顶部 ⚙ 设置里添加</span></label>
      <label>投掷<select id="ef-action">${opt([["direct", "直接投"], ["jump", "跳投"], ["crouch-jump", "蹲跳投"]], e.action)}</select></label>
      <label>难度<span class="diff-radio" id="ef-difficulty" role="radiogroup" aria-label="难度（三档单选）">
        ${DIFF_ORDER.map(d => `<button type="button" class="diff-opt diff-${d}" data-diff="${d}"><i class="diff-dot"></i>${DIFF_CN[d]}</button>`).join("")}
        <span class="set-tip">快捷键 1/2/3</span>
      </span></label>
      <label>类型<select id="ef-type">${opt([["smoke", "烟雾"], ["flash", "闪光"], ["molotov", "燃烧"], ["he", "高爆"]], e.type)}</select></label>
      <label>阵营<select id="ef-side">${opt([["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]], e.side || "T")}</select></label>
      <label>状态<select id="ef-status">${opt([["draft", "待验证"], ["verified", "已实测"], ["broken", "已失效"], ["retired", "弃用"]], e.status)}</select></label>
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

function openCalloutPicker({ map, startTab, origin, targets, spots, onDone, onCancel, tabs }) {
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
        <input class="picker-search" placeholder="搜索报点名（实时过滤）">
      </div>
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

  function refresh() {
    $$(".picker-tab", ov).forEach(b => b.classList.toggle("active", b.dataset.tab === curTab));
    const kw = ($(".picker-search", ov).value || "").trim().toLowerCase();
    $$(".callout-label", ov).forEach(btn => {
      const c = list[Number(btn.dataset.pi)];
      const hay = [c.name, ...(c.search || [])].join(" ").toLowerCase();
      btn.hidden = !!kw && !hay.includes(kw);
      btn.classList.toggle("picked", isPicked(c.name));
    });
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
    const tab = ev.target.closest(".picker-tab");
    if (tab) { curTab = tab.dataset.tab; refresh(); return; }
    if (ev.target.closest("[data-pok]")) {
      const res = { origin: sel.origin, target: [...sel.target], spots: [...sel.spots] };
      confirmed = true;   // I33：确认关闭不触发 onCancel
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
function openSpotPicker(mapKey, { mode = "origin", initial = "", onDone, onCancel }) {
  openCalloutPicker({
    map: mapKey,
    startTab: mode === "target" ? "target" : "origin",
    origin: mode === "origin" ? initial : "",
    targets: mode === "target" ? [].concat(initial || []) : [],
    spots: [],
    tabs: ["origin", "target"],
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
      <div class="set-row">
        <div class="set-label">地图排序<span class="set-tip">第一位＝打开时的默认地图；顶栏下拉按此顺序显示</span></div>
        <div id="set-map-order" class="map-order"></div>
      </div>
      <div class="set-row">
        <div class="set-label">自定义移动方式<span class="set-tip">出现在编辑器「移动」下拉与投法徽章里</span></div>
        <span class="chips-row" id="set-moves"></span>
        <span class="pick-row">
          <input class="manual-in" id="set-move-in" placeholder="输入名称回车添加，如：蹲下" style="max-width:320px">
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
      <div class="set-row">
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
      <div class="set-row">
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

  drawMoves();
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


/* ---------------- 钻取第二级：起点 → 可达目标地图 ---------------- */

function setDrillMode(mode) {
  state.drillMode = mode;
  localStorage.setItem("pb-drill-mode", mode);
}

function clearDrill() {
  state.drill = null;
  state.drillTarget = null;
  render();
}

function drillEntries() {
  // 起点模式：以 drill.name 为起点；目标模式：以 drill.name 为目标
  return data.entries.filter(e => {
    if (e.map !== state.drill.map) return false;
    return state.drill.mode === "target"
      ? targetIs(e, state.drill.name)
      : originIs(e, state.drill.name);
  });
}

function drillCard() {
  const mapInfo = data.maps[state.drill.map] || {};
  const matches = drillEntries();
  const modeTarget = state.drill.mode === "target";

  // 二级标签：起点模式按目标分组，目标模式按起点分组（均严格同名，不合并子串相似点位）；
  // 标签位置：名字能严格匹配到的报点 → 该坐标；否则用条目 spots 里第一个非已选点、
  // 且能严格匹配到的报点坐标
  const groupKey = modeTarget ? "origin" : "target";
  const groups = [];
  for (const e of matches) {
    const key = modeTarget ? e.origin : e.target;
    let g = groups.find(x => x.name === key);
    if (!g) { g = { name: key, entries: [] }; groups.push(g); }
    g.entries.push(e);
  }
  for (const g of groups) {
    const co = calloutFor(g.name, state.drill.map);
    if (co) { g.u = co.u; g.v = co.v; continue; }
    for (const e of g.entries) {
      const alt = (e.spots || []).find(s =>
        s !== g.name && s !== state.drill.name && calloutFor(s, state.drill.map));
      if (alt) {
        const co2 = calloutFor(alt, state.drill.map);
        g.u = co2.u; g.v = co2.v;
        break;
      }
    }
    g.u = g.u ?? 0.5; g.v = g.v ?? -0.08;
  }

  const dirText = modeTarget
    ? `能丢到「${escapeHtml(state.drill.name)}」的起点`
    : `从「${escapeHtml(state.drill.name)}」能丢到`;
  const labelKind = modeTarget ? "起点位置" : "目标位置";

  const el = document.createElement("article");
  el.className = "card map-card drill-map";
  el.innerHTML = `
    <div class="card-head">
      <button class="editor-btn" id="drill-level1">← 返回全图</button>
      <h2>${escapeHtml(data.maps[state.drill.map]?.cn || "")} · ${dirText}</h2>
      <span class="badge-phase">点击${labelKind} = 查看该点位的道具</span>
      <button class="editor-btn" id="drill-exit2">退出钻取</button>
    </div>
    <div class="radar-wrap map-wrap">
      <img class="radar" src="${mapInfo.radar}" alt="雷达底图">
      ${groups.map((g, i) => `
        <button class="callout-label target-label" data-i="${i}"
                style="left:${g.u * 100}%;top:${g.v * 100}%">${escapeHtml(g.name)}（${g.entries.length}）</button>`).join("")}
    </div>
    <div class="map-note">只显示已收录的、${dirText}的位置。</div>`;

  $("#drill-level1", el).addEventListener("click", clearDrill);
  $("#drill-exit2", el).addEventListener("click", clearDrill);
  $$(".target-label", el).forEach(btn => btn.addEventListener("click", () => {
    state.drillTarget = groups[Number(btn.dataset.i)].name;
    state.tab = "entries";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  return el;
}

function calloutFor(name, mapKey) {
  // 严格匹配：报点名本体或其规范名（A1 = "A1/A 门"）
  return ((allCallouts() || {})[mapKey] || []).find(c =>
    c.name === name || canonicalCallout(c.name) === name) || null;
}


function calloutMapCard() {
  const mapKey = state.map || "de_mirage";
  const callouts = (allCallouts() || {})[mapKey];
  const mapInfo = data.maps[mapKey] || {};
  if (!mapInfo.radar_exists) return null;

  // 无报点的图（如 Nuke/Vertigo）也显示底图，方便进入编辑器手动放置
  if (!callouts || !callouts.length) {
    const el = document.createElement("article");
    el.className = "card map-card";
    el.innerHTML = `
      <div class="card-head">
        <h2>${escapeHtml(mapInfo.cn || mapKey)} · 报点图</h2>
        <span class="badge-phase">该地图还没有报点</span>
        <button class="editor-btn" id="add-tactic">＋ 新增战术板</button>
        <button class="editor-btn" id="open-editor">⚙ 编辑报点</button>
      </div>
      <div class="radar-wrap map-wrap">
        <img class="radar" src="${mapInfo.radar}" alt="雷达底图">
      </div>
      <div class="map-note">点「⚙ 编辑报点」→「＋ 新增（点图放置）」即可开始标注。</div>`;
    $("#open-editor", el).addEventListener("click", () => {
      state.editor = true;
      state.tab = "tactics";
      render();
    });
    $("#add-tactic", el).addEventListener("click", () => {
      state.tacticEditId = "__new__";
      state.tab = "tactics";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return el;
  }

  const modeOrigin = state.drillMode === "origin";
  const modeTarget = state.drillMode === "target";
  const modeAll = !modeOrigin && !modeTarget;   // all=普通视图（I16）
  // I38：图层切换（callouts=报点层 / nades=道具层），pb-map-layer 持久化；I39 加 timeline=时间轴层
  const nadesMode = state.mapLayer === "nades";
  const tlMode = state.mapLayer === "timeline";
  const overlayMode = nadesMode || tlMode;   // 覆盖层模式下隐藏钻取按钮与报点标签层
  // 类型过滤（烟/闪/火/雷任一激活）或阵营过滤（I23）时，战术板地图只显示与可见条目
  // （entryMatch：地图+阵营+类型+失效开关的交集）相关的报点（I14/I16/I23）：
  // 起点模式只显起点、目标模式只显目标（严格同名，spots 不参与）、普通视图显并集（spots 参与）
  const typeFiltered = state.types.size > 0 || !!state.side;
  const visibleEntries = typeFiltered ? data.entries.filter(entryMatch) : null;
  const hitOrigin = (e, c) => originIs(e, c.name);
  const hitTarget = (e, c) => targetIs(e, c.name) ||
    (Array.isArray(e.target) && e.target.some(t => strictSpotMatch(c, t)));
  const hitSpots = (e, c) => Array.isArray(e.spots) && e.spots.some(s => strictSpotMatch(c, s));
  const relevant = c => !typeFiltered || visibleEntries.some(e => e.map === mapKey &&
    (modeOrigin ? hitOrigin(e, c)
      : modeTarget ? hitTarget(e, c)
      : hitOrigin(e, c) || hitTarget(e, c) || hitSpots(e, c)));
  const el = document.createElement("article");
  el.className = "card map-card";
  el.innerHTML = `
    <div class="card-head">
      <h2>${escapeHtml(mapInfo.cn || mapKey)} · 报点图</h2>
      <span class="badge-phase">${nadesMode
        ? "道具模式：图标=落点，点图标看从哪丢、再点开道具"
        : tlMode
        ? "时间轴模式：按 1→2→3 顺序走一遍道具套路"
        : modeOrigin
        ? "点地名 = 以此处为起点，查看能丢到的目标"
        : modeTarget
          ? "点地名 = 以此处为目标，查看能丢到这里的起点"
          : "普通视图：显示与当前道具相关的报点"}</span>
      <span class="layer-btns">
        <button class="editor-btn layer-btn ${!overlayMode ? "primary" : ""}" data-layer="callouts"
                title="报点名标签层（可钻取/筛选）">📍 报点</button>
        <button class="editor-btn layer-btn ${nadesMode ? "primary" : ""}" data-layer="nades"
                title="道具落点图层（随过滤联动）">💥 道具</button>
        <button class="editor-btn layer-btn ${tlMode ? "primary" : ""}" data-layer="timeline"
                title="按时间轴顺序在地图上走一遍道具套路（I39）">🕒 时间轴</button>
      </span>
      ${overlayMode ? "" : `<span class="mode-btns">
        <button class="editor-btn mode-btn ${modeAll ? "primary" : ""}" data-mode="all"
                title="显示全部相关报点（含仅报点关联的）">◎ 全部</button>
        <button class="editor-btn mode-btn ${modeOrigin ? "primary" : ""}" data-mode="origin"
                title="点击地名作为道具起点">🚀 道具起点</button>
        <button class="editor-btn mode-btn ${modeTarget ? "primary" : ""}" data-mode="target"
                title="点击地名作为道具目标">🎯 道具目标</button>
      </span>`}
      ${nadesMode ? `<button class="editor-btn ${state.pinEdit ? "primary" : ""}" id="pin-edit"
                title="拖动落点图标 / 起点手柄微调显示位置（报点本身不动）；再点退出">✏️ 调点</button>` : ""}
      <button class="editor-btn" id="add-tactic">＋ 新增战术板</button>
      <button class="editor-btn" id="open-editor">⚙ 编辑报点</button>
    </div>
    <div class="radar-wrap map-wrap">
      <img class="radar" src="${mapInfo.radar}" alt="雷达底图">
      ${nadesMode
        ? `<div class="nade-layer" id="nade-layer"></div>
           <svg class="nade-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
           <div class="nade-popup" id="nade-popup" hidden></div>`
        : tlMode
        ? `<div class="tl-layer"></div>
           <svg class="nade-lines tl-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>`
        : `<div class="callout-layer">
      ${callouts.map((c, i) => {
        if (!relevant(c)) return "";
        const pool = typeFiltered ? visibleEntries : data.entries;   // 角标也按可见条目算（I16）
        const asOrigin = pool.some(x => x.map === mapKey && originIs(x, c.name));
        const asTarget = pool.some(x => x.map === mapKey && targetIs(x, c.name));
        const enterable = modeOrigin ? asOrigin : modeTarget ? asTarget : (asOrigin || asTarget);
        const mark = !enterable ? "" : modeOrigin
          ? `<span class="co-mark o">↗</span>`
          : modeTarget
            ? `<span class="co-mark t">●</span>`
            : `${asOrigin ? `<span class="co-mark o">↗</span>` : ""}${asTarget ? `<span class="co-mark t">●</span>` : ""}`;
        return `
          <button class="callout-label" data-idx="${i}"
                  style="left:${c.u * 100}%;top:${c.v * 100}%">${escapeHtml(c.name)}${mark}</button>`;
      }).join("")}
      </div>`}
    </div>
    <div class="map-note">${nadesMode
      ? "点落点图标＝查看起点连线与道具清单；再点同一图标/空白处取消。"
      : tlMode
      ? ""   // 时间轴层的提示由 setupTimelineLayer 按 boards/steps 状态填
      : typeFiltered
      ? "按类型过滤中：只显示与当前可见道具相关的报点。"
      : "点位可在编辑器里拖拽调整，改动实时自动保存。"}</div>
    ${tlMode ? `<div class="tl-strips"></div>` : ""}`;
  $$(".layer-btn", el).forEach(btn => btn.addEventListener("click", () => {
    state.mapLayer = btn.dataset.layer;
    localStorage.setItem("pb-map-layer", state.mapLayer);
    render();
  }));
  $("#pin-edit", el)?.addEventListener("click", () => {   // I41：调点开关（仅道具层）
    state.pinEdit = !state.pinEdit;
    render();
  });
  $$(".mode-btn", el).forEach(btn => btn.addEventListener("click", () => {
    setDrillMode(btn.dataset.mode);
    render();
  }));
  $$(".callout-label", el).forEach(btn =>
    btn.addEventListener("click", () => {
      const c = callouts[Number(btn.dataset.idx)];
      // 普通视图（全部）：点报点 = 报点筛选，列出该点相关的所有道具（I16）
      if (modeAll) { filterByCallout(mapKey, c); return; }
      // 按当前模式钻取：起点模式找 origin 匹配，目标模式找 target 匹配（严格同名）
      const fromHere = modeOrigin
        ? data.entries.filter(e => e.map === mapKey && originIs(e, c.name))
        : data.entries.filter(e => e.map === mapKey && targetIs(e, c.name));
      if (fromHere.length) {
        state.drill = { map: mapKey, name: c.name, mode: state.drillMode };
        state.drillTarget = null;
        state.tab = "tactics";
        render();
      } else {
        filterByCallout(mapKey, c);
      }
    }));
  $("#open-editor", el).addEventListener("click", () => {
    state.editor = true;
    state.tab = "tactics";
    render();
  });
  $("#add-tactic", el).addEventListener("click", () => {   // I39：网页内新增战术板
    state.tacticEditId = "__new__";
    state.tab = "tactics";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  if (nadesMode) setupNadeLayer(el, mapKey);
  else if (tlMode) setupTimelineLayer(el, mapKey);
  return el;
}

/* ---------------- I38：道具图层（落点图标/连线/清单）+ I41 调点 ---------------- */

let nadeClear = null;      // 当前道具层选中项的取消函数；无选中/卡片重渲染时为 null
let nadeEscBound = false;  // Esc 分层监听器全局只注册一次（setupNadeLayer 随 render 反复进入）

// 展开 visible 条目为 (条目 × target 报点) 落点集合；坐标=pin 覆写（I41）否则报点，对不上的跳过并计数。
// 聚合按调后坐标重算（同报点不同 pin 不再合并；调过的条目拖回来会自然重新聚合）。
function collectNadeSpots(mapKey, entries) {
  const callouts = (allCallouts() || {})[mapKey] || [];
  const spots = new Map();   // key=坐标 → {u, v, name, items: [{e, target}]}
  let unmatched = 0;
  for (const e of entries) {
    for (const tv of targetVals(e)) {
      const c = callouts.find(cc => cc.name === tv || strictSpotMatch(cc, tv));
      if (!c) { unmatched++; continue; }
      const pos = pinOrCallout(e, "target", tv) || { u: c.u, v: c.v };
      const key = `${pos.u.toFixed(4)},${pos.v.toFixed(4)}`;
      if (!spots.has(key)) spots.set(key, { u: pos.u, v: pos.v, name: c.name, items: [] });
      spots.get(key).items.push({ e, target: tv });
    }
  }
  return { spots: [...spots.values()], unmatched };
}

// I41：pin 内存读写 + 0.8s 防抖走 I19 管线持久化（persistEntryEdits → ready 写 .md → savedAt/written）
const pinSaveTimers = new Map();
// applyEntryOverrides 会整体替换 data.entries 里的条目对象——pin 读写必须取当前活对象，
// 否则调点态的 flat 旧引用会改到已被合并替换的影子（↺ 清不干净的根因，热修）
const entryLive = e => data.entries.find(x => x.id === e.id) || e;
function setPin(entry, kind, targetName, pos) {
  if (kind === "origin") entry.pin_origin = [pos.u, pos.v];
  else {
    entry.pin_targets = entry.pin_targets || {};
    entry.pin_targets[targetName] = [pos.u, pos.v];
  }
}
function clearPin(entry, kind, targetName) {
  if (kind === "origin") delete entry.pin_origin;
  else if (entry.pin_targets) {
    delete entry.pin_targets[targetName];
    if (!Object.keys(entry.pin_targets).length) delete entry.pin_targets;
  }
}
function schedulePinSave(entry) {
  clearTimeout(pinSaveTimers.get(entry.id));
  pinSaveTimers.set(entry.id, setTimeout(async () => {
    pinSaveTimers.delete(entry.id);
    persistEntryEdits(entry, entry);
    const wrote = await writeEntryFile(entry);
    if (wrote) markEntryWritten(entry.id);
    applyEntryOverrides();
    refreshSyncBadge();
  }, 800));
}

// 道具图层：浏览态=聚合图标（×N），点图标看该落点全部 起点(pin)→落点(pin) 虚线 + popup 清单；
// ✏️ 调点态（I42 修正：每颗道具独立图标）——逐颗单独拖落点、选中后单独拖起点手柄，0.8s 防抖持久化。
// 再点同一图标/空白/Esc 取消。
function setupNadeLayer(el, mapKey) {
  nadeClear = null;   // 卡片重渲染＝无选中（含空态提前返回的路径）
  const entries = data.entries.filter(entryMatch);   // I38：全管线（地图/阵营/类型/搜索/失效开关）
  const callouts = (allCallouts() || {})[mapKey] || [];   // 连线起点坐标要用（与 collectNadeSpots 同源）
  const { spots, unmatched } = collectNadeSpots(mapKey, entries);
  const layer = $("#nade-layer", el);
  const svg = $(".nade-lines", el);
  const popup = $("#nade-popup", el);
  const note = $(".map-note", el);
  const radar = $("img.radar", el);
  const originOf = e => pinOrCallout(e, "origin") ||
    callouts.find(cc => cc.name === e.origin || strictSpotMatch(cc, e.origin)) || null;
  let clearSel = () => {};   // 分支各自实现（el 点击/Esc 统一走最新引用）

  if (state.pinEdit) {
    // 调点态：每（条目×目标）一枚独立图标（坐标=pin 覆写否则报点；对不上报点的跳过）
    const flat = entries.flatMap(e => targetVals(e).flatMap(tv => {
      const c = callouts.find(cc => cc.name === tv || strictSpotMatch(cc, tv));
      if (!c) return [];
      const pos = pinOrCallout(e, "target", tv) || { u: c.u, v: c.v };
      return [{ e, tv, calloutName: c.name, u: pos.u, v: pos.v }];
    }));
    // 重叠自动散开（仅显示不存点）：报点=区域级，多颗同区域默认堆在报点中心；
    // 调点态按圆环错开让每颗可立即抓取，拖到真实落点才存 pin，没拖的退出即收回
    const clusters = new Map();
    for (const it of flat) {
      const k = `${it.u.toFixed(3)},${it.v.toFixed(3)}`;
      if (!clusters.has(k)) clusters.set(k, []);
      clusters.get(k).push(it);
    }
    for (const [, arr] of clusters) {
      if (arr.length < 2) continue;
      const n = arr.length;
      arr.forEach((it, i) => {
        const ang = (2 * Math.PI * i) / n - Math.PI / 2;
        it.u = Math.min(1, Math.max(0, +(it.u + 0.026 * Math.cos(ang)).toFixed(4)));
        it.v = Math.min(1, Math.max(0, +(it.v + 0.026 * Math.sin(ang)).toFixed(4)));
      });
    }
    if (note) note.innerHTML = flat.length
      ? "调点中：每颗道具独立图标（同区域的重叠道具已自动散开）——拖图标到真实落点＝精准定位并记住；先点一颗，再拖白点手柄＝调它的起点显示位。没拖过的不记位置，报点本身不变。"
      : "本图没有可调的道具落点。";
    if (!flat.length) return;
    if (!layer || !svg || !popup) return;
    layer.innerHTML = flat.map((it, i) => {
      const sideCls = it.e.side === "CT" ? "ct" : "t";
      return `<button class="nade-icon side-${sideCls} pinnable" data-fi="${i}"
                style="left:${it.u * 100}%;top:${it.v * 100}%"
                title="${escapeHtml(it.e.title)}（${escapeHtml(it.e.throw_badge)}）&#10;拖动＝调整这颗的落点显示位">
          <img src="${(TYPE_INFO[it.e.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">
        </button>`;
    }).join("");
    let sel = null;
    function drawSel() {
      const o = originOf(sel.e);
      svg.innerHTML = o
        ? `<line x1="${o.u * 100}" y1="${o.v * 100}" x2="${sel.u * 100}" y2="${sel.v * 100}"/>`
        : "";
      layer.querySelectorAll(".pin-handle").forEach(h => h.remove());
      if (o) {
        const h = document.createElement("button");
        h.className = "pin-handle";
        h.style.left = `${o.u * 100}%`;
        h.style.top = `${o.v * 100}%`;
        h.title = `起点：${sel.e.origin} · 拖动＝调整这颗的起点显示位`;
        layer.appendChild(h);
      }
      // I42 热修（用户实测：调点框遮挡地图）：调点态不弹底部大框（说明已在下方提示行），
      // 「↺ 回报点」缩成小按钮挂在选中图标旁（贴右缘自动翻到左侧）
      popup.hidden = true;
      layer.querySelectorAll(".pin-reset-chip").forEach(x => x.remove());
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pin-reset-chip";
      chip.textContent = "↺ 回报点";
      chip.title = "这颗的起点+落点都恢复到报点坐标";
      chip.style.left = `${sel.u * 100}%`;
      chip.style.top = `${sel.v * 100}%`;
      chip.style.transform = sel.u > 0.78
        ? "translate(calc(-100% - 20px), -50%)"
        : "translate(20px, -50%)";
      layer.appendChild(chip);
    }
    clearSel = () => {
      nadeClear = null;
      sel = null;
      svg.innerHTML = "";
      popup.hidden = true;
      layer.querySelectorAll(".pin-handle").forEach(h => h.remove());
      layer.querySelectorAll(".pin-reset-chip").forEach(x => x.remove());
      layer.querySelectorAll(".nade-icon.sel").forEach(b => b.classList.remove("sel"));
    };
    // 这颗的落点图标拖拽（位移<4px=点击选中；拖动只改它自己的 pin）
    layer.querySelectorAll(".nade-icon").forEach(ic => {
      ic.addEventListener("pointerdown", ev => {
        ev.stopPropagation();
        const it = flat[Number(ic.dataset.fi)];
        let moved = false;
        const sx = ev.clientX, sy = ev.clientY;
        const base = { u: it.u, v: it.v };
        const move = ev2 => {
          const dx = ev2.clientX - sx, dy = ev2.clientY - sy;
          if (!moved && Math.hypot(dx, dy) < 4) return;
          moved = true;
          const rect = radar.getBoundingClientRect();
          const u = Math.min(1, Math.max(0, base.u + dx / rect.width));
          const v = Math.min(1, Math.max(0, base.v + dy / rect.height));
          const pos = { u: +u.toFixed(4), v: +v.toFixed(4) };
          it.u = pos.u; it.v = pos.v;
          ic.style.left = `${pos.u * 100}%`;
          ic.style.top = `${pos.v * 100}%`;
          if (sel === it) drawSel();   // 连线终点实时跟随
          const live = entryLive(it.e);
          setPin(live, "target", it.tv, pos);
          schedulePinSave(live);
        };
        const up = () => {
          document.removeEventListener("pointermove", move);
          document.removeEventListener("pointerup", up);
        };
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
      });
    });
    // 起点手柄拖拽（选中那颗的手柄，动态创建 → 委托到 layer）
    layer.addEventListener("pointerdown", ev => {
      const h = ev.target.closest(".pin-handle");
      if (!h || !sel) return;
      ev.stopPropagation();
      const o = originOf(sel.e);
      if (!o) return;
      const rect = radar.getBoundingClientRect();
      const move = ev2 => {
        const pu = Math.min(1, Math.max(0, (ev2.clientX - rect.left) / rect.width));
        const pv = Math.min(1, Math.max(0, (ev2.clientY - rect.top) / rect.height));
        const pos = { u: +pu.toFixed(4), v: +pv.toFixed(4) };
        o.u = pos.u; o.v = pos.v;
        h.style.left = `${pos.u * 100}%`;
        h.style.top = `${pos.v * 100}%`;
        svg.innerHTML = `<line x1="${o.u * 100}" y1="${o.v * 100}" x2="${sel.u * 100}" y2="${sel.v * 100}"/>`;
        const live = entryLive(sel.e);
        setPin(live, "origin", "", pos);
        schedulePinSave(live);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
    layer.addEventListener("click", ev => {
      const chip = ev.target.closest(".pin-reset-chip");
      if (chip) {   // ↺ 这颗用回报点坐标（保持选中；小按钮不遮图）
        ev.stopPropagation();
        const c = callouts.find(cc => cc.name === sel.calloutName || strictSpotMatch(cc, sel.calloutName));
        const live = entryLive(sel.e);
        clearPin(live, "origin", "");
        clearPin(live, "target", sel.tv);
        schedulePinSave(live);
        if (c) { sel.u = c.u; sel.v = c.v; }
        const ic0 = layer.querySelector(".nade-icon.sel");
        if (ic0) { ic0.style.left = `${sel.u * 100}%`; ic0.style.top = `${sel.v * 100}%`; }
        drawSel();
        ic0?.classList.add("sel");
        nadeClear = clearSel;
        toast("这颗已用回报点坐标 ✓（0.8s 后写盘）");
        return;
      }
      const ic = ev.target.closest(".nade-icon");
      ev.stopPropagation();
      if (!ic) { clearSel(); return; }
      const it = flat[Number(ic.dataset.fi)];
      if (sel === it) { clearSel(); return; }
      sel = it;
      layer.querySelectorAll(".nade-icon").forEach(b => b.classList.remove("sel"));
      ic.classList.add("sel");
      drawSel();
      nadeClear = clearSel;
    });
  } else {
    if (!spots.length) {
      if (note) note.innerHTML = entries.length
        ? `本图 ${entries.length} 颗道具（当前过滤下）的落点都没对上报点，未显示。`
        : "当前过滤下没有可显示的道具。";
      return;
    }
    if (unmatched && note) {
      note.innerHTML = `${unmatched} 个落点没对上报点，未显示。`;
    }
    if (!layer || !svg || !popup) return;
    // 图标：按聚合落点渲染（浏览态）
    layer.innerHTML = spots.map((sp, i) => {
      const sideCls = sp.items.some(x => x.e.side === "CT") ? (sp.items.every(x => x.e.side === "CT") ? "ct" : "mix") : "t";
      const n = sp.items.length;
      return `<button class="nade-icon side-${sideCls}" data-ni="${i}"
                style="left:${sp.u * 100}%;top:${sp.v * 100}%"
                title="${sp.items.map(x => `${x.e.title}（${x.e.throw_badge}）`).join("\n")}">
          <img src="${(TYPE_INFO[sp.items[0].e.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">
          ${n > 1 ? `<span class="nade-n">×${n}</span>` : ""}
        </button>`;
    }).join("");
    let sel = null;
    function showLines(sp) {
      const lines = [];
      for (const it of sp.items) {
        const oc = originOf(it.e);
        if (oc) lines.push({ oc, it });
      }
      svg.innerHTML = lines.map(l =>
        `<line x1="${l.oc.u * 100}" y1="${l.oc.v * 100}" x2="${sp.u * 100}" y2="${sp.v * 100}"/>`).join("");
      const hasPin = sp.items.some(it => pinOrCallout(it.e, "origin") || it.e.pin_targets?.[it.target] ||
        (Array.isArray(it.e.pin_target) && targetVals(it.e).length === 1));
      popup.innerHTML = `
        <div class="np-head">${escapeHtml(sp.name)} · ${sp.items.length} 颗道具</div>
        ${sp.items.map(it => `
          <button type="button" class="np-item" data-jump="${it.e.id}">
            <img src="${(TYPE_INFO[it.e.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">${escapeHtml(it.e.title)}
            <span class="badge-throw">${escapeHtml(it.e.throw_badge)}</span>
          </button>`).join("")}
        ${hasPin ? `<button type="button" class="np-reset" data-pinreset>↺ 全部用回报点坐标</button>` : ""}`;
      popup.hidden = false;
    }
    clearSel = () => {
      nadeClear = null;
      sel = null;
      svg.innerHTML = "";
      popup.hidden = true;
      layer.querySelectorAll(".nade-icon.sel").forEach(b => b.classList.remove("sel"));
    };
    layer.addEventListener("click", ev => {
      const ic = ev.target.closest(".nade-icon");
      ev.stopPropagation();
      if (!ic) { clearSel(); return; }
      const sp = spots[Number(ic.dataset.ni)];
      if (sel === sp) { clearSel(); return; }
      sel = sp;
      showLines(sp);
      layer.querySelectorAll(".nade-icon").forEach(b => b.classList.remove("sel"));
      ic.classList.add("sel");
      nadeClear = clearSel;
    });
    popup.addEventListener("click", ev => {
      ev.stopPropagation();
      if (ev.target.closest("[data-pinreset]")) {   // ↺ 整组用回报点坐标（重聚合渲染）
        for (const it of sel.items) {
          const live = entryLive(it.e);
          clearPin(live, "origin", "");
          clearPin(live, "target", it.target);
          schedulePinSave(live);
        }
        const regroup = collectNadeSpots(mapKey, entries);
        spots.length = 0;
        spots.push(...regroup.spots);
        layer.innerHTML = spots.map((sp, i) => {
          const sideCls = sp.items.some(x => x.e.side === "CT") ? (sp.items.every(x => x.e.side === "CT") ? "ct" : "mix") : "t";
          const n = sp.items.length;
          return `<button class="nade-icon side-${sideCls}" data-ni="${i}"
                    style="left:${sp.u * 100}%;top:${sp.v * 100}%"
                    title="${sp.items.map(x => `${x.e.title}（${x.e.throw_badge}）`).join("\n")}">
              <img src="${(TYPE_INFO[sp.items[0].e.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">
              ${n > 1 ? `<span class="nade-n">×${n}</span>` : ""}
            </button>`;
        }).join("");
        clearSel();
        toast("已全部用回报点坐标 ✓（0.8s 后写盘）");
        return;
      }
      const it = ev.target.closest("[data-jump]");
      if (it) { clearSel(); jumpToEntry(it.dataset.jump, "tactics"); }
    });
  }

  svg.addEventListener("click", ev => ev.stopPropagation());
  // Esc：先取消选中/清单（不穿透到全局 Esc 链）。监听器只注册一次，经 nadeClear 指针
  // 委托给当前卡片；旧闭包不会吞键。
  if (!nadeEscBound) {
    nadeEscBound = true;
    document.addEventListener("keydown", ev => {
      if (ev.key === "Escape" && nadeClear) { nadeClear(); ev.stopPropagation(); }
    }, true);
  }
  el.addEventListener("click", () => clearSel());   // 点地图空白清连线
}

/* ---------------- I41：时间轴图层 v2（角色标 + 标签堆 + 真实动线） ---------------- */

// 倒计时解析："M:SS" → 秒数（0..115=1:55 上限）；非规范返回 null（显示 ⚠，滚轮重选即修复）
function parseCountdown(s) {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(String(s || "").trim());
  if (!m) return null;
  const sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return sec <= 115 ? sec : null;
}

// 步骤显示文本（I41）：text 留空时自动生成「{起点}→{目标}，{投法}」（仅显示不改存值，I31 生成式）
function stepDisplayText(st) {
  const txt = String(st.text || "").trim();
  if (txt) return txt;
  const e = st.use ? data.entries.find(x => x.id === st.use) : null;
  if (!e) return "";
  const tg = Array.isArray(e.target) ? e.target.join(" / ") : (e.target || "");
  return `${e.origin || "?"}→${tg || "?"}，${e.throw_badge || throwBadge(e.click, e.move, e.action)}`;
}

// 时间轴层：板 chips 选板；角色标（固定钉该角色第一个含 use 步骤的道具起点，I42 移除出生位）
// + 旁挂时间 chip 堆；每个指派角色的含道具步骤画 origin(pin)→target(pin) 虚线（真实投掷起点）。
function setupTimelineLayer(el, mapKey) {
  nadeClear = null;   // 与道具层互斥：图层切换重渲后不残留旧取消指针
  const layer = $(".tl-layer", el);
  const svg = $(".tl-lines", el);
  const strips = $(".tl-strips", el);
  const note = $(".map-note", el);
  const boards = data.tactics.filter(t => t.map === mapKey &&
    (state.showArchived || !["broken", "retired"].includes(t.status)));
  if (!boards.length) {
    if (note) note.textContent = "当前没有这块图的战术板——点右上「＋ 新增战术板」建一块。";
    return;
  }
  if (!state.tlBoard || !boards.some(b => b.id === state.tlBoard)) state.tlBoard = boards[0].id;
  const board = boards.find(b => b.id === state.tlBoard);
  const steps = Array.isArray(board.timeline) ? board.timeline : [];
  const callouts = (allCallouts() || {})[mapKey] || [];
  const roles = (Array.isArray(board.roles) ? board.roles : []).slice(0, 5);
  const roleColor = n => PLAYER_COLORS[(n - 1) % PLAYER_COLORS.length];
  const roleMark = n => ["①", "②", "③", "④", "⑤"][n - 1] || `r${n}`;
  const roleName = n => (roles[n - 1] && roles[n - 1].name) || `角色${n}`;
  const calloutFor = tv => callouts.find(cc => cc.name === tv || strictSpotMatch(cc, tv));

  const boardChips = boards.length > 1
    ? `<div class="tl-boards">${boards.map(b => `
        <button class="editor-btn mini ${b.id === board.id ? "primary" : ""}" data-board="${b.id}">${escapeHtml(b.title || b.id)}</button>`).join("")}</div>`
    : "";

  if (!steps.length) {
    layer.innerHTML = "";
    svg.innerHTML = "";
    if (strips) strips.innerHTML = boardChips;
    if (note) note.innerHTML = `「${escapeHtml(board.title || board.id)}」还没有时间轴——点这块板右上「⚙ 编辑」添加步骤。`;
    wireBoards();
    return;
  }

  // 步骤排序：倒计时大→小（剩得多=先发生），同刻按编辑顺序；非规范 t 排最后并标 ⚠
  const ordered = steps.map((st, oi) => ({ st, oi, sec: parseCountdown(st.t) }))
    .sort((a, b) => (b.sec ?? -1) - (a.sec ?? -1));

  // 步骤动线端点（pin 感知；解析不到=不上图）
  function stepCoords(st) {
    if (!st.use) return null;
    const e = data.entries.find(x => x.id === st.use);
    if (!e) return null;
    let tgt = null;
    for (const tv of targetVals(e)) {
      const c = calloutFor(tv);
      if (c) { tgt = pinOrCallout(e, "target", tv) || { u: c.u, v: c.v }; break; }
    }
    const oc = pinOrCallout(e, "origin") || calloutFor(e.origin);
    if (!tgt || !oc) return null;
    return { o: oc, t: tgt };
  }
  const coords = ordered.map(x => stepCoords(x.st));

  // 角色标位置（I42 唯一规则）：该角色时间序第一个含 use 步骤的道具起点（origin pin 优先，报点兜底）
  function roleAnchor(n) {
    for (const x of ordered) {
      if (x.st.role !== n || !x.st.use) continue;
      const e = data.entries.find(en => en.id === x.st.use);
      if (!e) continue;
      const oc = pinOrCallout(e, "origin") || calloutFor(e.origin);
      if (oc) return oc;
    }
    return null;
  }
  const anchors = {};
  for (let n = 1; n <= 5; n++) {
    if (!ordered.some(x => x.st.role === n)) continue;   // 该角色没有任何步骤不立标
    const a = roleAnchor(n);
    if (a) anchors[n] = a;
  }

  // 动线：指派角色且含 use 且两端可解析才画；同起终点第二条起错开 1-2%
  const linesDrawn = {};
  let linesHtml = "";
  ordered.forEach((x, i) => {
    const c = coords[i];
    if (!c || !x.st.role || !anchors[x.st.role]) return;
    let x1 = c.o.u * 100, y1 = c.o.v * 100, x2 = c.t.u * 100, y2 = c.t.v * 100;
    const key = `${x1.toFixed(1)},${y1.toFixed(1)},${x2.toFixed(1)},${y2.toFixed(1)}`;
    const dup = linesDrawn[key] || 0;
    linesDrawn[key] = dup + 1;
    if (dup) { x1 = +(x1 + 1.5 * dup).toFixed(2); y1 = +(y1 - 1.2 * dup).toFixed(2);
               x2 = +(x2 + 1.5 * dup).toFixed(2); y2 = +(y2 - 1.2 * dup).toFixed(2); }
    linesHtml += `<line class="tl-line" data-step="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      marker-end="url(#tl-arrow)" style="color:${roleColor(x.st.role)}"/>`;
  });
  svg.innerHTML = `<defs><marker id="tl-arrow" viewBox="0 0 10 10" refX="8" refY="5"
    markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0,0L10,5L0,10z" fill="currentColor"/></marker></defs>${linesHtml}`;

  // 角色标 + 标签堆（该角色全部步骤 chip，时间序；纯动作步骤=文字缩略 chip）
  const piles = {};
  ordered.forEach((x, i) => {
    if (!x.st.role || !anchors[x.st.role]) return;
    (piles[x.st.role] = piles[x.st.role] || []).push({ i, x });
  });
  layer.innerHTML = boardChips + Object.keys(anchors).map(n => {
    const a = anchors[n];
    return `
    <div class="tl-role" style="left:${a.u * 100}%;top:${a.v * 100}%;--rc:${roleColor(+n)}"
         title="${escapeHtml(roleName(+n))} · 站在第一个动作的起点">
      <span class="tl-role-badge">${roleMark(+n)}</span>
      <span class="tl-role-name">${escapeHtml(roleName(+n))}</span>
    </div>
    <div class="tl-pile" style="left:${a.u * 100}%;top:${a.v * 100}%">
      ${(piles[+n] || []).map(({ i, x }) => {
        const useE = x.st.use ? data.entries.find(e => e.id === x.st.use) : null;
        return `
        <button class="tl-chip" data-step="${i}" title="${escapeHtml(stepDisplayText(x.st) || x.st.t || "")}">
          <b>${escapeHtml(x.st.t || "")}</b>${x.sec == null ? `<span class="tl-warn" title="时间格式不是 M:SS（编辑器里滚轮重选即修复）">⚠</span>` : ""}
          ${useE ? `<img src="${(TYPE_INFO[useE.type] || {}).icon || "assets/icons/icon-he.svg"}" alt="">`
                 : `<span class="tl-chip-txt">${escapeHtml((stepDisplayText(x.st) || "…").slice(0, 6))}</span>`}
        </button>`;
      }).join("")}
    </div>`;
  }).join("");

  // 步骤卡（时间序）：倒计时徽章 + 角色徽章 + text/自动生成文 + use chip
  if (strips) {
    strips.innerHTML = `
      <div class="tl-strip card">
        <div class="tl-strip-head">${escapeHtml(board.title || board.id)}
          <span class="set-tip">${ordered.length} 步 · 时间窗 ${escapeHtml(board.window || "")} · 1:55=开局 0:00=回合结束</span></div>
        ${ordered.map((x, i) => {
          const c = coords[i];
          const chained = !!(x.st.role && anchors[x.st.role]);
          return `
          <div class="tl-step ${chained ? "has-role" : ""}" data-step="${i}" role="button" tabindex="0">
            ${x.st.role ? `<span class="tl-n" style="background:${roleColor(x.st.role)}">${roleMark(x.st.role)}</span>`
                        : `<span class="tl-n none" title="未指派角色">·</span>`}
            <span class="tl-t">${escapeHtml(x.st.t || "")}${x.sec == null ? ` <span class="tl-warn">⚠</span>` : ""}</span>
            <span class="tl-text">${escapeHtml(stepDisplayText(x.st))}</span>
            ${x.st.use ? `<button class="use-chip mini-chip" data-jump="${escapeHtml(x.st.use)}"
              title="查看这颗道具">${escapeHtml(data.entries.find(e => e.id === x.st.use)?.title || x.st.use)}</button>` : ""}
            ${x.st.use && !c ? `<span class="set-tip" title="道具起/落点没对上报点，只列出不上图">不上图</span>` : ""}
          </div>`;
        }).join("")}
      </div>`;
  }
  if (note) {
    note.innerHTML = "点角色旁的时间 chip 或下方步骤卡＝高亮动线；点道具名跳那颗道具。虚线从真实投掷起点到落点。";
  }

  function setSel(i) {
    layer.querySelectorAll(".tl-chip.sel").forEach(b => b.classList.remove("sel"));
    svg.querySelectorAll(".tl-line.sel").forEach(l => l.classList.remove("sel"));
    if (strips) strips.querySelectorAll(".tl-step.sel").forEach(s => s.classList.remove("sel"));
    if (i == null) return;
    layer.querySelector(`.tl-chip[data-step="${i}"]`)?.classList.add("sel");
    svg.querySelector(`.tl-line[data-step="${i}"]`)?.classList.add("sel");
    strips?.querySelector(`.tl-step[data-step="${i}"]`)?.classList.add("sel");
  }
  function wireBoards() {
    // 板 chips 可能渲染在 .tl-layer（有步骤）或 .tl-strips（无步骤占位），整卡范围找
    el.querySelectorAll("[data-board]").forEach(btn => btn.addEventListener("click", ev => {
      ev.stopPropagation();
      state.tlBoard = btn.dataset.board;
      render();
    }));
  }
  wireBoards();
  layer.querySelectorAll(".tl-chip").forEach(b => b.addEventListener("click", ev => {
    ev.stopPropagation();   // 不冒泡到地图卡的「点空白清高亮」
    const i = b.dataset.step;
    setSel(b.classList.contains("sel") ? null : i);
  }));
  if (strips) {
    strips.querySelectorAll(".tl-step").forEach(row => row.addEventListener("click", ev => {
      if (ev.target.closest("[data-jump]")) return;   // use chip 自己处理（stopPropagation）
      ev.stopPropagation();
      const i = row.dataset.step;
      setSel(row.classList.contains("sel") ? null : i);
    }));
    strips.querySelectorAll("[data-jump]").forEach(chip => chip.addEventListener("click", ev => {
      ev.stopPropagation();
      jumpToEntry(chip.dataset.jump, "tactics");
    }));
  }
  el.addEventListener("click", () => setSel(null));   // 点地图空白清高亮
}

function filterByCallout(mapKey, callout) {
  // I42（用户 UX 反馈⑤）：保留顶栏类型/阵营/地图选择，只叠加报点筛选——叠加后空列表走现有空态
  state.tab = "entries";
  $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === "entries"));
  state.setsOnly = false;   // I47：报点筛选是普通列表场景，退出只看视图
  state.searchTerms = null;
  state.search = "";
  state.drill = null;
  state.drillTarget = null;
  state.spot = { map: mapKey, name: callout.name };
  $("#search").value = callout.name;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  requestAnimationFrame(() => {
    const first = $$("#cards .card")[0];
    if (first) {
      first.classList.add("flash-focus");
      setTimeout(() => first.classList.remove("flash-focus"), 1600);
    }
  });
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
  // I42：归档只认磁盘真值——先枚举 srcDir 磁盘图片，>0 张 = 不移入（内存池受 I29 globalMap
  // 过滤与状态时效影响，不能作为归档依据；曾在筛选态把还有剩图的文件夹误判「已分拣完」）。
  const parentDir = sortSt.groupParents.get(group) || (rootDirHandle
    ? await rootDirHandle.getDirectoryHandle(SORT_POOL_DIR).catch(() => null) : null);
  if (!parentDir) return null;
  let diskLeft = -1;   // 磁盘剩余图片数（-1=枚举失败，才回落内存池判定）
  try {
    const srcDirProbe = await parentDir.getDirectoryHandle(group);
    diskLeft = 0;
    for await (const [name, h] of srcDirProbe.entries()) {
      if (h.kind === "file" && SORT_IMG_RE.test(name)) diskLeft++;
    }
  } catch { /* 目录不存在/枚举失败 → 用内存判定兜底 */ }
  if (diskLeft > 0) return `「${group}」还有 ${diskLeft} 张未入坑，文件夹保留在素材池`;
  if (diskLeft < 0) {
    for (const [, item] of sortSt.pool) if (item.group === group) return null;   // 兜底：池里还有剩余
  }
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
      <label>阵营<select id="tf-side">${opt([["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]], t.side)}</select></label>
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


function tacticCard(t) {
  const el = document.createElement("article");
  el.className = `card tactic st-${t.status}`;
  el.id = `card-${t.id}`;

  const mapInfo = data.maps[t.map] || {};
  const head = `
    <div class="card-head">
      <h2>${escapeHtml(t.title)}</h2>
      <span class="badge-status ${t.status}">${STATUS_CN[t.status] || t.status}</span>
      <span class="badge-phase">${escapeHtml(mapInfo.cn || t.map)} · ${SIDE_CN[t.side] || t.side} · 时间窗 ${escapeHtml(t.window)}</span>
      <button class="editor-btn" data-tedit="${t.id}" title="网页内编辑这块板">⚙ 编辑</button>
    </div>`;

  // 时间轴（I41 升级）：倒计时倒序、角色色点、text 留空显示自动生成；旧 steps 字段兼容渲染
  const useChipHtml = uid => {
    const e = data.entries.find(x => x.id === uid);
    if (!e) return "";
    const info = TYPE_INFO[e.type] || {};
    return `<button class="use-chip mini-chip" data-target="${e.id}" title="${escapeHtml(e.oneline || "")}">
      <img src="${info.icon || "assets/icons/icon-he.svg"}" alt="${info.cn}">${escapeHtml(e.title)}</button>`;
  };
  const tlColor = n => PLAYER_COLORS[(n - 1) % PLAYER_COLORS.length];
  const timeline = (Array.isArray(t.timeline) && t.timeline.length)
    ? `<ul class="timeline">${[...t.timeline]
        .sort((a, b) => (parseCountdown(b.t) ?? -1) - (parseCountdown(a.t) ?? -1))
        .map(s => {
          const e = s.use ? data.entries.find(x => x.id === s.use) : null;
          const txt = (s.text && String(s.text).trim()) || (e ? `${e.origin}→${Array.isArray(e.target) ? e.target.join(" / ") : e.target}，${e.throw_badge}` : "");
          return `<li>${s.role ? `<span class="t-dot" style="background:${tlColor(s.role)}" title="角色${s.role}">${["①", "②", "③", "④", "⑤"][s.role - 1] || ""}</span>` : ""}<span class="t">${escapeHtml(s.t || "")}</span><span>${escapeHtml(txt)}</span>${s.use ? useChipHtml(s.use) : ""}</li>`;
        }).join("")}</ul>`
    : (t.steps && t.steps.length)
    ? `<ul class="timeline">${t.steps.map(s => `
        <li><span class="t">${escapeHtml(s.t)}</span><span>${escapeHtml(s.text)}</span></li>`).join("")}</ul>`
    : "";

  // 引用道具缩略条
  const uses = (t.uses || []).map(uid => {
    const e = data.entries.find(x => x.id === uid);
    if (!e) return "";
    const info = TYPE_INFO[e.type] || {};
    return `
      <button class="use-chip" data-target="${e.id}" title="${escapeHtml(e.oneline)}">
        <img src="${info.icon || "assets/icons/icon-he.svg"}" alt="${info.cn}">${escapeHtml(e.title)}
        <span style="color:var(--text-dim);font-size:14px">${escapeHtml(e.throw_badge)}</span>
      </button>`;
  }).join("");

  const sections = (t.sections || []).map(sec => `
    <div class="sec-title">${escapeHtml(sec.title)}</div>
    ${sec.lines.map(l => `<div class="sec-line">${escapeHtml(l.replace(/^- /, "• "))}</div>`).join("")}`).join("");

  el.innerHTML = head + timeline +
    `<div class="uses-strip">${uses || ""}</div>` +
    `<div class="sections">${sections}</div>`;

  $$(".use-chip", el).forEach(chip =>
    chip.addEventListener("click", () => jumpToEntry(chip.dataset.target, "tactics")));
  $("[data-tedit]", el).addEventListener("click", () => {
    state.tacticEditId = t.id;
    state.tab = "tactics";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  return el;
}

/* ---------------- 道具联动跳转 ---------------- */

function jumpToEntry(id, from) {
  // I42：直达详情页（不再落列表）——from="tactics"（战术板系调用）则 Esc 回战术板；
  // 报点系筛选（spot/drill/searchTerms）进详情时一并清掉（用户下次进道具 Tab 是干净列表），
  // 类型/阵营/地图顶栏选择不动（用户 UX 反馈⑤）。
  state.tab = "entries";
  $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === "entries"));
  state.searchTerms = null;
  state.spot = null;
  state.drill = null;
  state.drillTarget = null;
  state.search = "";
  $("#search").value = "";
  state.detailFrom = from === "tactics" ? "tactics" : "list";
  const e = data.entries.find(x => x.id === id);
  if (e) {
    state.map = e.map;
    $("#map-filter").value = e.map;
    state.entryView = { id };
    state.entryListScroll = 0;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    render();
  }
}


/* ---------------- 键盘 ---------------- */

function visibleCards() {
  return $$("#cards .card").filter(el => el.offsetParent !== null);
}

function focusCard(idx) {
  const cards = visibleCards();
  if (!cards.length) return;
  state.focusIdx = Math.max(0, Math.min(idx, cards.length - 1));
  const el = cards[state.focusIdx];
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("flash-focus");
  setTimeout(() => el.classList.remove("flash-focus"), 900);
}

function onKey(ev) {
  const inInput = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);

  // lightbox 打开时：←/→ 切图，Esc 关闭
  if (!$("#lightbox").hidden) {
    if (ev.key === "ArrowLeft") { ev.preventDefault(); lightboxStep(-1); return; }
    if (ev.key === "ArrowRight") { ev.preventDefault(); lightboxStep(1); return; }
    if (ev.key === "Escape") { closeLightbox(); return; }
  }

  if (ev.key === "/" && !inInput) {
    ev.preventDefault();
    $("#search").focus();
    return;
  }
  if (ev.key === "Escape") {
    if (!$("#lightbox").hidden) { closeLightbox(); return; }
    if (state.editingId) {   // 编辑器里 Esc = 取消编辑返回（不保存；列表/详情随 entryView 回落）
      if (inInput) document.activeElement.blur();
      state.editingId = null;
      render();
      return;
    }
    if (state.tacticEditId) {   // 战术板编辑器 Esc = 返回（I39，语义同道具编辑器）
      if (inInput) document.activeElement.blur();
      state.tacticEditId = null;
      render();
      return;
    }
    if (inInput || state.search || state.searchTerms || state.spot || state.filterChips.size) {
      state.search = "";
      state.searchTerms = null;
      state.spot = null;
      state.filterChips.clear();   // I50：chips 与搜索框同环清空
      $("#search").value = "";
      $("#search").blur();
      refreshChipFilter();
      render();
      return;
    }
    if (state.tab === "entries" && state.entryView) { backToEntryList(); return; }
    if (state.drillTarget) { state.drillTarget = null; state.tab = "tactics"; render(); return; }
    if (state.drill) { clearDrill(); return; }
    // 道具列表页无字时 Esc = 切回战术板（过滤/地图状态不动，I28）
    if (state.tab === "entries") { state.drillTarget = null; state.tab = "tactics"; render(); return; }
  }
  if (inInput) return;

  // I51：编辑器难度快捷键 1/2/3——编辑器打开且焦点不在输入控件时；复用按钮 click（自带手动锁定语义）
  if (state.editingId && ["1", "2", "3"].includes(ev.key)) {
    const btn = document.querySelector(`#ef-difficulty [data-diff="${DIFF_ORDER[Number(ev.key) - 1]}"]`);
    if (btn) { ev.preventDefault(); btn.click(); return; }
  }

  // 道具二级页面键盘
  if (state.tab === "entries" && !state.editingId) {
    if (state.entryView) {
      if (ev.key === "ArrowLeft") { ev.preventDefault(); stepEntryDetail(-1); return; }   // ←=上一条（I28）
      if (ev.key === "Backspace") { ev.preventDefault(); backToEntryList(); return; }     // 返回列表
      if (ev.key === "ArrowRight") { ev.preventDefault(); stepEntryDetail(1); return; }
      if (ev.key === "[") { ev.preventDefault(); cycleViewerSlot(data.entries.find(x => x.id === state.entryView.id), -1); return; }
      if (ev.key === "]") { ev.preventDefault(); cycleViewerSlot(data.entries.find(x => x.id === state.entryView.id), 1); return; }
    } else {
      if (ev.key === "ArrowDown" || ev.key === "j" || ev.key === "J") { ev.preventDefault(); moveListHighlight(1); return; }
      if (ev.key === "ArrowUp" || ev.key === "k" || ev.key === "K") { ev.preventDefault(); moveListHighlight(-1); return; }
      if (ev.key === "Enter" && entryRows[state.listIdx]) { ev.preventDefault(); openEntryDetail(entryRows[state.listIdx].id); return; }
    }
  }

  if (ev.key === "j" || ev.key === "J" || ev.key === "ArrowDown") {
    ev.preventDefault();
    focusCard(state.focusIdx + 1);
  } else if (ev.key === "k" || ev.key === "K" || ev.key === "ArrowUp") {
    ev.preventDefault();
    focusCard(state.focusIdx - 1);
  }
}

function bootLightboxZoom() { initLightboxZoom(); }

/* ---------------- 启动（必须在所有常量与函数定义之后） ---------------- */
if (!window.PLAYBOOK) {
  $("#no-data").hidden = false;
} else {
  init();
  bootLightboxZoom();
}
