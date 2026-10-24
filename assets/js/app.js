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
