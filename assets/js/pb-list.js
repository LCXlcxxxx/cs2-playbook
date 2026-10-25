/* pb-list.js — 道具列表/行渲染/sets 折叠/锚点导航（R1-B 拆出） */
"use strict";

/* ---------------- I49：留白区锚点导航（横屏右侧留白的浮动目录） ----------------
   红线：这只是主栏右侧留白里的浮动目录（TOC），不承载任何内容本体——不渲染条目
   详情/正文/图片，主内容流永远单栏；不是被禁的「双栏（列表+详情）」。
   显示条件（同时满足）：道具 Tab 列表页（详情/编辑器/战术板不显示）+ 视口宽 >1200px
   + 右侧留白 ≥260px + 屏上有 ≥2 个分组头（⭐收藏/📦战术包区/各 phase/其他）。
   条件不满足时 DOM 元素根本不创建——竖屏零新增元素、零开销。 */

let anchorNavEl = null;          // 懒创建：第一次满足显示条件才建
let anchorNavHeads = [];         // [{el, btn}] 当前分组头 ↔ 目录按钮
let anchorNavSpyQueued = false;  // scrollspy rAF 合帧

function anchorNavShouldShow() {
  if (state.tab !== "entries" || state.entryView || state.editingId) return false;
  const rect = $("#main").getBoundingClientRect();
  const space = document.documentElement.clientWidth - rect.right;   // 右侧留白（不含滚动条）
  if (document.documentElement.clientWidth <= 1200 || space < 260) return false;
  return $$("#cards .list-group-head").length >= 2;
}

function refreshAnchorNav() {
  if (!anchorNavShouldShow()) {
    if (anchorNavEl) anchorNavEl.hidden = true;
    anchorNavHeads = [];
    return;
  }
  if (!anchorNavEl) {
    anchorNavEl = document.createElement("nav");
    anchorNavEl.id = "anchor-nav";
    anchorNavEl.setAttribute("aria-label", "本页分组");
    document.body.appendChild(anchorNavEl);
    // 点击=平滑滚到分组头（停在 sticky 位下方一点）；目录是纯指针控件，点完不驻焦点
    anchorNavEl.addEventListener("click", ev => {
      const btn = ev.target.closest("button[data-an]");
      if (!btn) return;
      btn.blur();
      const head = anchorNavHeads[Number(btn.dataset.an)];
      if (!head || !head.el.isConnected) return;
      const top = head.el.getBoundingClientRect().top + window.scrollY
        - ($("#topbar").offsetHeight + 8);
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    window.addEventListener("scroll", anchorNavOnScroll, { passive: true });
    window.addEventListener("resize", refreshAnchorNav);
  }
  // 目录=当前真实渲染出的分组头，文本取组头原文——未来新增分组类型自动收录，无需改这里
  anchorNavEl.innerHTML = "";
  anchorNavHeads = $$("#cards .list-group-head").map((head, idx) => {
    const btn = document.createElement("button");
    btn.dataset.an = idx;
    btn.textContent = head.textContent.trim();
    anchorNavEl.appendChild(btn);
    return { el: head, btn };
  });
  anchorNavEl.hidden = false;
  anchorNavSpy();
}

function anchorNavOnScroll() {
  if (!anchorNavEl || anchorNavEl.hidden) return;
  if (anchorNavSpyQueued) return;
  anchorNavSpyQueued = true;
  requestAnimationFrame(anchorNavSpy);
}

function anchorNavSpy() {
  anchorNavSpyQueued = false;
  if (!anchorNavEl || anchorNavEl.hidden) return;
  const rect = $("#main").getBoundingClientRect();
  const space = document.documentElement.clientWidth - rect.right;
  // 滚动条出现/消失会挪主栏右缘：spy 每帧顺手校正定位；窗口变不够时整列干净收起
  if (document.documentElement.clientWidth <= 1200 || space < 260) {
    anchorNavEl.hidden = true;
    return;
  }
  anchorNavEl.style.left = `${Math.round(rect.right + Math.max(12, (space - 200) / 2))}px`;
  const limit = $("#topbar").offsetHeight + 90;   // 组头 sticky top(≈64)+余量
  let act = -1;
  anchorNavHeads.forEach((h, i) => {
    if (h.el.isConnected && h.el.getBoundingClientRect().top <= limit) act = i;
  });
  if (act < 0 && anchorNavHeads.length) act = 0;   // 页顶尚未滚到第一组：高亮第一项
  anchorNavHeads.forEach((h, i) => h.btn.classList.toggle("on", i === act));
}


/* ---------------- 道具一级列表页 / 二级详情页 ---------------- */

function rowHtml(e) {
  const info = TYPE_INFO[e.type] || {};
  const star = isFav(e.id) ? "★" : "☆";
  const tags = (e.tags || []).filter(Boolean);
  // R3-L2①：三簇重排——左(图标+标题+标签)/中(起点→目标)/右(投法+难度+状态+星)，
  // space-between 把原中段 ~40% 空白均分成两段，观感从「中间镂空」变「三栏对齐」。
  return `
    <button class="entry-row" data-id="${e.id}">
      <span class="row-left">
        <img class="type-ico" src="${info.icon || "assets/icons/icon-he.svg"}" alt="${info.cn}">
        <span class="row-main"><span class="row-title">${entryTitleHtml(e.title)}</span>${rowTagsHtml(tags)}</span>
      </span>
      <span class="row-mid"><span class="row-loc">${escapeHtml(e.origin)} → ${escapeHtml(targetDisplay(e))}</span></span>
      <span class="row-right">
        <span class="badge-throw ${throwBadgeClass(e)}">${escapeHtml(e.throw_badge)}</span>
        ${difficultyBadge(e.difficulty, false, true)}
        <span class="badge-status ${e.status}">${STATUS_CN[e.status] || e.status}</span>
        <span class="fav-btn ${isFav(e.id) ? "on" : ""}" data-fav="${e.id}" title="${isFav(e.id) ? "取消收藏" : "收藏置顶"}">${star}</span>
      </span>
    </button>`;
}

// 标题行 tags 小徽章（I48）：不换行、放不下整体省略（容器裁切），空 tags 不渲染任何节点
function rowTagsHtml(tags) {
  if (!tags || !tags.length) return "";
  return `<span class="row-tags">${tags.map(t => `<i class="row-tag">${escapeHtml(t)}</i>`).join("")}</span>`;
}

/* ---------------- R3-L2②：缩略图墙（快速浏览视图） ----------------
   列表页 ☰/▦ 切换（查阅/管理两模式均可见——实战阅读功能）；状态存本模块 + localStorage，
   不进 pb-core 的 state（零共享文件红线）。分组/组头/锚点导航/过滤照旧，组内行改网格卡片；
   封面=落点&效果图（缺则站位图）；点卡片直达 lightbox（复用 I12 缩放）+ J/K 跨条目连翻。 */
let wallView = localStorage.getItem("pb-list-view") === "wall";

function listViewToggleHtml() {
  return `<div class="pb-view-bar" title="▦=一眼看全部道具效果图，点击放大（滚轮缩放）、J/K 连翻">
    <button type="button" class="pb-view-btn ${wallView ? "" : "on"}" data-view="list">☰ 列表</button>
    <button type="button" class="pb-view-btn ${wallView ? "on" : ""}" data-view="wall">▦ 缩略图</button>
  </div>`;
}

function entryItemHtml(e) {
  return wallView ? wallCellHtml(e) : rowHtml(e);
}

// 分组内容包装（R3-L2②）：墙模式整组包 .pb-wall-grid 网格；列表模式平铺行
function groupItemsHtml(items) {
  if (!wallView) return items.map(rowHtml).join("");
  return `<div class="pb-wall-grid">${items.map(wallCellHtml).join("")}</div>`;
}

function wallCellHtml(e) {
  const info = TYPE_INFO[e.type] || {};
  const imgs = e.images || [];
  const cover = imgs.find(i => i.slot === "4-result") || imgs.find(i => i.slot === "1-stand");
  return `
    <button class="pb-wall-cell card" data-id="${e.id}" title="${escapeHtml(e.title)}——点击放大（滚轮缩放）">
      ${cover ? `<img src="${cover.path}" loading="lazy" alt="" draggable="false">`
        : `<span class="pb-wall-noimg"><img src="${info.icon || "assets/icons/icon-he.svg"}" alt="">无图</span>`}
      <span class="pb-wall-dots" title="状态 ${STATUS_CN[e.status] || e.status} · 难度${DIFF_CN[e.difficulty] || "中等"}">
        <i class="pb-dot st-${e.status}"></i><i class="pb-dot df-${e.difficulty || "normal"}"></i>
      </span>
      <span class="pb-wall-bar">
        <span class="pb-wall-title">${entryTitleHtml(e.title)}</span>
        <span class="badge-throw ${throwBadgeClass(e)}">${escapeHtml(e.throw_badge)}</span>
      </span>
    </button>`;
}

/* R3-L2③：lightbox 跨条目连翻——按 entryRows 数据序（≠DOM 分组序，坑⑨），
   到头 clamp+toast；跳过无图条目。 */
function wallNextEntry(curId, dir) {
  const order = entryRows.length ? entryRows : data.entries;
  const i = order.findIndex(x => x.id === curId);
  if (i < 0) return null;
  for (let s = i + dir; s >= 0 && s < order.length; s += dir) {
    if ((order[s].images || []).length) return order[s];
  }
  return null;
}

function openWallLightbox(e) {
  const show = ent => {
    openLightboxCtx((ent.images || []).map(i => i.path), 0, ent.title, {
      onStep(dir) {
        const nxt = wallNextEntry(ent.id, dir);
        if (!nxt) { toast(dir > 0 ? "已是最后一条" : "已是第一条"); return; }
        show(nxt);
      },
    });
  };
  show(e);
}

// 墙模式下 lightbox 的 J/K 跨条目：capture 监听（先于 app.js onKey）。
// stopImmediatePropagation 兼容「事件派发在 document 上」的合成场景；真实按键 stopPropagation
// 已够——Esc/←/→ 仍走 app.js 既有分支零回归。
document.addEventListener("keydown", ev => {
  if ($("#lightbox").hidden || !lbCtx || !lbCtx.nav) return;
  const k = ev.key.toLowerCase();
  if (k !== "j" && k !== "k") return;
  ev.preventDefault();
  if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
  else ev.stopPropagation();
  lbCtx.nav.onStep(k === "j" ? 1 : -1);
}, true);

// I47：套装收集——完全由可见条目的 sets 字段派生（不建注册表）：套装名 → 成员条目（按 id 去重），
// 名称 zh 序排序。成员跟着当前过滤走（搜索/类型/阵营过滤下套装只显示命中的成员）。
function collectSets(visible) {
  const map = new Map();
  for (const e of visible) {
    for (const s of (Array.isArray(e.sets) ? e.sets : [])) {
      const name = String(s || "").trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, []);
      if (!map.get(name).some(x => x.id === e.id)) map.get(name).push(e);
    }
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh"));
}

// 套装折叠行：一行「📦 名称 (N 个道具)」，点击展开/收起成员行（复用 rowHtml）。
// 类名用 pkg-row——.set-row 已被 ⚙ 设置弹层的行占用，不能撞。
function setRowHtml(name, items) {
  const open = setsExpanded.has(name);
  return `
    <button class="pkg-row ${open ? "open" : ""}" data-setrow="${escapeHtml(name)}">
      <span class="set-fold">${open ? "▾" : "▸"}</span>
      <span class="row-title">📦 ${escapeHtml(name)}</span>
      <span class="runbook-btn" data-setrunbook="${escapeHtml(name)}" title="开战连翻：逐张翻看这套道具（Esc 退出）">🚀 开战</span>
      <span class="set-count">${items.length} 个道具</span>
    </button>
    ${open ? `<div class="set-members">${groupItemsHtml(items)}</div>` : ""}`;
}

function entryListPanel(visible) {
  const wrap = document.createElement("div");
  wrap.className = "entry-list";
  entryRows = visible.slice();
  if (state.listIdx >= entryRows.length) state.listIdx = entryRows.length - 1;

  // 收藏置顶分组（I17）：收藏的条目从 phase 分组中剔除
  const favSet = new Set(favList());
  const notFav = e => !favSet.has(e.id);
  const setsList = collectSets(visible);
  const groups = [];
  if (state.setsOnly) {
    // 📦 只看视图（I47）：只显示套装折叠区（按名称排序），未分组条目收进「未分组」一行；
    // 收藏/phase 分组整体隐藏
    for (const [name, items] of setsList) groups.push({ set: name, items });
    const inSet = new Set(setsList.flatMap(([, items]) => items.map(x => x.id)));
    const rest = visible.filter(e => !inSet.has(e.id));
    if (rest.length) groups.push({ ph: "__noset", items: rest });
  } else {
    const favItems = visible.filter(e => favSet.has(e.id));
    if (favItems.length) groups.push({ ph: "__fav", items: favItems });
    // 📦 战术包折叠区（I47）：收藏区之后、phase 分组之前；套装是叠加视图，
    // 成员条目仍保留在下方 phase 分组中
    if (setsList.length) groups.push({ setsZone: setsList });
    for (const ph of PHASE_ORDER) {
      // 按主阶段（第一个 phase）分组，一条只出现一次
      const items = visible.filter(e => notFav(e) && (e.phase || [])[0] === ph);
      if (items.length) groups.push({ ph, items });
    }
    const rest = visible.filter(e => notFav(e) && !PHASE_ORDER.includes((e.phase || [])[0]));
    if (rest.length) groups.push({ ph: "other", items: rest });
  }

  wrap.innerHTML = listViewToggleHtml() + groups.map(g => {
    if (g.setsZone) {
      return `<div class="list-group-head">📦 战术包</div>` +
        g.setsZone.map(([name, items]) => setRowHtml(name, items)).join("");
    }
    if (g.set) return setRowHtml(g.set, g.items);
    const head = g.ph === "__fav" ? "⭐ 收藏"
      : g.ph === "__noset" ? "未分组"
      : g.ph === "other" ? "其他" : PHASE_CN[g.ph] || g.ph;
    return `<div class="list-group-head">${head}</div>${groupItemsHtml(g.items)}`;
  }).join("") +
    `<div class="list-foot">${visible.length} 条 · ${visible.filter(x => x.status === "verified").length} 条已实测</div>`;

  $$(".entry-row", wrap).forEach(row => {
    row.addEventListener("click", ev => {
      if (ev.target.closest(".fav-btn")) return;   // 星按钮不触发行点击（I17）
      const db = ev.target.closest("[data-diffbtn]");   // I51：点难度徽章=按该档过滤（复用 chips 管线）
      if (db) {
        const id = "diff-" + db.dataset.diffbtn;
        if (state.filterChips.has(id)) state.filterChips.delete(id);
        else {
          for (const other of FILTER_CHIPS) if (other.dim === "diff") state.filterChips.delete(other.id);
          state.filterChips.add(id);
        }
        refreshChipFilter();
        render();
        return;
      }
      openEntryDetail(row.dataset.id);
    });
    if (entryRows[state.listIdx] && row.dataset.id === entryRows[state.listIdx].id) {
      row.classList.add("hl");
    }
  });
  $$(".pkg-row", wrap).forEach(row => row.addEventListener("click", ev => {
    const rbtn = ev.target.closest("[data-setrunbook]");
    if (rbtn) { openSetRunbook(rbtn.dataset.setrunbook); return; }   // R2-B：开战连翻
    const name = row.dataset.setrow;
    setsExpanded.has(name) ? setsExpanded.delete(name) : setsExpanded.add(name);
    render();
  }));
  $$(".fav-btn", wrap).forEach(st => st.addEventListener("click", () => {
    toggleFav(st.dataset.fav);
    render();
  }));
  // R3-L2②：视图切换（☰/▦，记忆偏好）+ 墙卡片交互（点卡片直达 lightbox；无图卡进详情=现状语义）
  $$(".pb-view-btn", wrap).forEach(btn => btn.addEventListener("click", () => {
    const v = btn.dataset.view === "wall" ? "wall" : "list";
    if (v === (wallView ? "wall" : "list")) return;
    wallView = v === "wall";
    localStorage.setItem("pb-list-view", v);
    render();
  }));
  $$(".pb-wall-cell", wrap).forEach(cell => cell.addEventListener("click", () => {
    const e = entryRows.find(x => x.id === cell.dataset.id)
      || data.entries.find(x => x.id === cell.dataset.id);
    if (!e) return;
    if (!(e.images || []).length) { openEntryDetail(e.id); return; }
    openWallLightbox(e);
  }));
  return wrap;
}

function openEntryDetail(id) {
  state.entryListScroll = window.scrollY;
  state.detailFrom = "list";   // I42：列表行点击=来源列表（Esc 回列表）
  // I42（用户 UX 反馈④）：进详情即清报点系筛选（spot/drill/searchTerms）——用户下次进道具
  // Tab 是干净列表；类型/阵营/地图顶栏选择不动（⑤）。
  state.spot = null;
  state.drill = null;
  state.drillTarget = null;
  state.searchTerms = null;
  state.search = "";
  $("#search").value = "";
  state.entryView = { id };
  render();
  window.scrollTo({ top: 0 });
}

// I47：📦 开关与详情页「所属战术包」chip 共用——打开只看视图并展开/定位该套装
function openSetView(name) {
  state.entryView = null;
  state.detailFrom = "list";
  state.tab = "entries";
  $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === "entries"));
  state.setsOnly = true;
  refreshSetsToggle();
  setsExpanded.add(name);
  render();
  requestAnimationFrame(() => {
    const row = $$(".pkg-row").find(r => r.dataset.setrow === name);
    if (row) {
      row.scrollIntoView({ block: "center" });
      row.classList.add("flash-focus");
      setTimeout(() => row.classList.remove("flash-focus"), 900);
    }
  });
}

function refreshSetsToggle() {
  const btn = $("#sets-toggle");
  if (btn) btn.classList.toggle("active", !!state.setsOnly);
}

function backToEntryList() {
  // I42：战术板系跳入的详情，返回语义=回战术板（用户 UX 反馈④）；普通列表链照旧回列表
  if (state.detailFrom === "tactics") {
    state.detailFrom = "list";
    state.entryView = null;
    state.tab = "tactics";
    $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === "tactics"));
    render();
    return;
  }
  state.entryView = null;
  render();
  requestAnimationFrame(() => window.scrollTo(0, state.entryListScroll || 0));
}

function entryDetailPage(listOrder) {
  const e = data.entries.find(x => x.id === state.entryView.id);
  if (!e) return null;
  // 换了条目 → 翻图面板重置到第一个有图槽位（同条目重渲染保持当前槽）
  if (viewerLastEntry !== e.id) {
    viewerLastEntry = e.id;
    viewerSlotByEntry[e.id] = firstSlotWithImage(e);
  }
  const order = entryRows.length ? entryRows : listOrder;
  const idx = order.findIndex(x => x.id === e.id);
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="detail-nav card">
      <button class="editor-btn" id="detail-back">← 返回列表</button>
      <span class="detail-pos">${idx >= 0 ? `${idx + 1} / ${order.length}` : ""}</span>
      ${order.length > 1 ? `
        <button class="editor-btn" id="detail-prev">‹ 上一条</button>
        <button class="editor-btn" id="detail-next">下一条 ›</button>` : ""}
      <button class="editor-btn" id="detail-fav" title="收藏后在列表置顶显示">${isFav(e.id) ? "★ 已收藏" : "☆ 收藏"}</button>
    </div>`;
  $("#detail-fav", wrap).addEventListener("click", ev => {
    toggleFav(e.id);
    ev.currentTarget.textContent = isFav(e.id) ? "★ 已收藏" : "☆ 收藏";
  });
  $("#detail-back", wrap).addEventListener("click", backToEntryList);
  if (order.length > 1) {
    $("#detail-prev", wrap).addEventListener("click", () => stepEntryDetail(-1));
    $("#detail-next", wrap).addEventListener("click", () => stepEntryDetail(1));
  }
  wrap.appendChild(entryCard(e));
  return wrap;
}

function stepEntryDetail(dir) {
  const order = entryRows.length ? entryRows : data.entries.filter(entryMatch);
  const idx = order.findIndex(x => x.id === state.entryView?.id);
  if (idx < 0 || !order.length) return;
  const next = order[(idx + dir + order.length) % order.length];
  state.entryView = { id: next.id };
  render();
  window.scrollTo({ top: 0 });
}

function moveListHighlight(dir) {
  if (!entryRows.length) return;
  state.listIdx = Math.max(0, Math.min(state.listIdx + dir, entryRows.length - 1));
  const row = document.querySelector(`.entry-row[data-id="${CSS.escape(entryRows[state.listIdx].id)}"]`);
  if (row) {
    $$(".entry-row.hl").forEach(r => r.classList.remove("hl"));
    row.classList.add("hl");
    row.scrollIntoView({ block: "nearest" });
  }
}

PB.files.push("pb-list.js");   // R1-B 模块登记
