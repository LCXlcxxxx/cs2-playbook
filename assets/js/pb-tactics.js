/* pb-tactics.js — 战术板渲染/钻取/道具图层/时间轴（R1-B 拆出） */
"use strict";

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

// 主落点（R3-L4，用户 2026-10-26 拍板「只显示一个落点」）：一条道具在图上只画一个落点=
// 第一个可定位的关联目标（按 target 顺序，pin 覆写 I41 优先）；其余关联点保留在详情/搜索/钻取
// 语义，不上图。解析不到返回 null（调用方计入未定位提示）。
function primaryTargetSpot(e, callouts) {
  for (const tv of targetVals(e)) {
    const c = callouts.find(cc => cc.name === tv || strictSpotMatch(cc, tv));
    if (!c) continue;
    const pos = pinOrCallout(e, "target", tv) || { u: c.u, v: c.v };
    return { tv, calloutName: c.name, u: pos.u, v: pos.v };
  }
  return null;
}

// 展开 visible 条目为落点集合（R3-L4 起每条只取主落点）；坐标=pin 覆写（I41）否则报点，
// 对不上的跳过并计数。聚合按调后坐标重算（同报点不同 pin 不再合并；调过的条目拖回来会自然重新聚合）。
function collectNadeSpots(mapKey, entries) {
  const callouts = (allCallouts() || {})[mapKey] || [];
  const spots = new Map();   // key=坐标 → {u, v, name, items: [{e, target}]}
  let unmatched = 0;
  for (const e of entries) {
    const p = primaryTargetSpot(e, callouts);
    if (!p) { unmatched++; continue; }
    const key = `${p.u.toFixed(4)},${p.v.toFixed(4)}`;
    if (!spots.has(key)) spots.set(key, { u: p.u, v: p.v, name: p.calloutName, items: [] });
    spots.get(key).items.push({ e, target: p.tv });
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
    // 调点态：每条道具一枚图标（主落点=第一个可定位关联点；R3-L4 起与浏览态同语义，不调不显示的次要点）
    const flat = entries.flatMap(e => {
      const p = primaryTargetSpot(e, callouts);
      return p ? [{ e, tv: p.tv, calloutName: p.calloutName, u: p.u, v: p.v }] : [];
    });
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
      ? "调点中：每条道具一枚图标（主落点＝它的第一个关联点；同区域的重叠道具已自动散开）——拖图标到真实落点＝精准定位并记住；先点一颗，再拖白点手柄＝调它的起点显示位。没拖过的不记位置，报点本身不变。"
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
      // R3-L5（用户反馈）：调点态选中后常显道具名——散开的图标圈不再靠猜；
      // 「↺ 回报点」缩成小按钮挂在名称标签尾部（贴右缘自动翻到左侧，I42 既有翻转逻辑沿用）
      popup.hidden = true;
      layer.querySelectorAll(".pin-reset-chip").forEach(x => x.remove());
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pin-reset-chip pin-name-chip";
      chip.innerHTML = `<b>${escapeHtml(sel.e.title)}</b><span class="pn-throw">${escapeHtml(sel.e.throw_badge)}</span>` +
        `<span class="pn-reset">↺ 回报点</span>`;
      chip.title = `拖落点图标=调位置 · 拖白点手柄=调起点 · 点「↺ 回报点」=这颗恢复报点坐标`;
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
      const reset = ev.target.closest(".pn-reset");
      if (reset) {   // ↺ 这颗用回报点坐标（保持选中；名称标签尾部小按钮不遮图）
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
      <button class="editor-btn runbook-tbtn" data-trunbook="${t.id}" title="按时间轴开战：逐张翻看时间轴上的道具（Esc 退出）">🚀 按时间轴开战</button>
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
  $("[data-trunbook]", el).addEventListener("click", () => {
    openTacticRunbook(t.id);   // R2-B：按时间轴开战
  });
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

PB.files.push("pb-tactics.js");   // R1-B 模块登记
