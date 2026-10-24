/* pb-detail.js — 详情页/翻图面板/lightbox（R1-B 拆出） */
"use strict";

/* ---------------- 翻图面板（详情页大图 + 槽位 chips） ---------------- */

const viewerSlotByEntry = {};   // 条目 id → 当前选中槽位
let viewerLastEntry = null;

function viewerSlots(e) {
  // 基础槽在前（固定顺序），扩展槽按 images 顺序追加
  const slots = [...BASE_SLOTS];
  for (const im of e.images || []) {
    if (!slots.includes(im.slot)) slots.push(im.slot);
  }
  return slots;
}

function firstSlotWithImage(e) {
  const have = new Set((e.images || []).map(im => im.slot));
  return viewerSlots(e).find(s => have.has(s)) || viewerSlots(e)[0];
}

function renderViewerPanel(panel, e) {
  const slots = viewerSlots(e);
  const haveSet = new Set((e.images || []).map(im => im.slot));

  // 当前槽位失效（被删除）→ 回落到第一个有图槽
  let slot = viewerSlotByEntry[e.id];
  if (!slots.includes(slot)) {
    slot = firstSlotWithImage(e);
    viewerSlotByEntry[e.id] = slot;
  }
  const im = (e.images || []).find(x => x.slot === slot);
  const img = $(".viewer-img", panel);
  const empty = $(".viewer-empty", panel);
  const unsync = im && String(im.path).startsWith("idb:");

  img.hidden = !im;
  empty.hidden = !!im;
  if (im) {
    img.src = String(im.path).startsWith("idb:")
      ? idbObjectURL(String(im.path).slice(4)) : im.path;
  } else {
    img.removeAttribute("src");
    empty.innerHTML = `<div class="viewer-empty-box">缺图 · ${escapeHtml(slotLabel(slot))}
      <span class="viewer-empty-tip">用右上角「上传/替换」补图</span></div>`;
  }
  $(".viewer-slot-label", panel).innerHTML =
    `${escapeHtml(slotLabel(slot))}${unsync ? `<span class="slot-unsync">未同步</span>` : ""}`;

  // 工具跟随当前槽位
  const uploadInput = $("input[data-upload]", panel);
  uploadInput.dataset.upload = slot;
  const delBtn = $("[data-delslot]", panel);
  delBtn.hidden = !im || BASE_SLOTS.includes(slot);
  delBtn.dataset.delslot = slot;

  // chips
  $(".viewer-chips", panel).innerHTML = slots.map(s => `
    <button class="vchip ${s === slot ? "on" : ""} ${haveSet.has(s) ? "" : "empty"}"
            data-slot="${s}">${escapeHtml(slotLabel(s))}${haveSet.has(s) ? "" : "·缺图"}</button>`).join("");

  // 事件
  $(".viewer-zone.left", panel).onclick = () => cycleViewerSlot(e, -1);
  $(".viewer-zone.right", panel).onclick = () => cycleViewerSlot(e, 1);
  img.onclick = () => {
    if (!im) return;
    const have = slots.filter(s => haveSet.has(s));
    const idx = have.indexOf(slot);
    openLightboxCtx(have.map(s => {
      const x = (e.images || []).find(v => v.slot === s);
      return String(x.path).startsWith("idb:") ? idbObjectURL(String(x.path).slice(4)) : x.path;
    }), Math.max(0, idx), `${e.title} · ${slotLabel(slot)}`);
  };
  $$(".vchip", panel).forEach(chip => chip.onclick = () => {
    viewerSlotByEntry[e.id] = chip.dataset.slot;
    renderViewerPanel(panel, e);
  });
}

function cycleViewerSlot(e, dir) {
  const have = viewerSlots(e).filter(s => (e.images || []).some(im => im.slot === s));
  if (!have.length) return;
  const cur = viewerSlotByEntry[e.id];
  let i = have.indexOf(cur);
  if (i < 0) i = 0;
  viewerSlotByEntry[e.id] = have[(i + dir + have.length) % have.length];
  const panel = document.querySelector(`.viewer-panel[data-entry="${CSS.escape(e.id)}"]`);
  if (panel) renderViewerPanel(panel, e);
}

function entryCard(e) {
  const el = document.createElement("article");
  el.className = `card entry st-${e.status}`;
  el.id = `card-${e.id}`;

  const info = TYPE_INFO[e.type] || {};
  const head = `
    <div class="card-head">
      <img class="type-ico" src="${info.icon || "assets/icons/icon-he.svg"}" alt="${info.cn}">
      <h2>${escapeHtml(e.title)}</h2>
      <button class="badge-status ${e.status} badge-status-btn" data-status-toggle
              title="${e.status === "verified" ? "点击退回待验证" : "确认游戏内稳定复现后，点击标记已实测"}">${STATUS_CN[e.status] || e.status}</button>
      <button class="editor-btn entry-edit" data-edit="${e.id}">编辑</button>
    </div>`;
  const oneline = `<div class="oneline">${escapeHtml(e.oneline)}</div>`;

  const phases = (e.phase || []).map(p => PHASE_CN[p] || p).join(" / ");
  const meta = `
    <div class="card-meta">
      <span class="badge-throw">${escapeHtml(e.throw_badge)}</span>
      <span class="badge-loc"><b>${escapeHtml(e.origin)}</b> → ${escapeHtml(targetDisplay(e))}</span>
      ${phases ? `<span class="badge-phase">${escapeHtml(phases)}</span>` : ""}
      ${difficultyBadge(e.difficulty, true)}
    </div>`;

  const srcNote = e.source
    ? `<div class="note-src">来源：${escapeHtml(e.source.creator || "自己")}
       ${e.source.url ? `· <a href="${escapeHtml(e.source.url)}" target="_blank" rel="noopener">${escapeHtml(e.source.url)}</a>` : ""}
       ${e.checked ? `· 实测 ${escapeHtml(e.checked)}` : ""}</div>`
    : "";

  // I47：底部「所属战术包」chips——点击打开 📦 只看视图并自动展开/定位该套装
  const setChips = (Array.isArray(e.sets) && e.sets.length)
    ? `<div class="set-chips"><span class="set-chips-label">所属战术包：</span>` +
      e.sets.map(s => `<button class="set-chip" data-setchip="${escapeHtml(s)}" title="打开战术包只看视图并定位该套装">📦 ${escapeHtml(s)}</button>`).join("") +
      `</div>`
    : "";

  const notes = e.notes
    ? `<details class="notes"><summary>注意事项</summary>
       <div class="notes-body">${escapeHtml(e.notes)}</div></details>`
    : "";

  // 翻图面板：大图常驻 + 槽位 chips + 左右半区循环（工具跟随当前槽位）
  el.innerHTML = head + oneline + meta + `
    <div class="viewer-panel" data-entry="${e.id}">
      <div class="viewer-stage">
        <div class="viewer-zone left" title="上一张（有图的槽位）">‹</div>
        <img class="viewer-img" alt="" draggable="false">
        <div class="viewer-empty" hidden></div>
        <div class="viewer-zone right" title="下一张（有图的槽位）">›</div>
        <span class="viewer-slot-label"></span>
        <span class="viewer-tools">
          <label class="pic-btn">上传/替换<input type="file" accept="image/*" hidden data-upload=""></label>
          <button class="pic-btn danger" data-delslot="" hidden>删除</button>
        </span>
      </div>
      <div class="viewer-chips"></div>
    </div>` + notes + srcNote + setChips;

  renderViewerPanel($(".viewer-panel", el), e);

  // 所属战术包 chips（I47）：点击 = 📦 只看视图 + 展开/定位
  $$(".set-chip", el).forEach(btn => btn.addEventListener("click", () => openSetView(btn.dataset.setchip)));

  // 状态徽章：两段确认切换 实测/待验证
  const stBtn = $(".badge-status-btn", el);
  if (stBtn) stBtn.addEventListener("click", () => {
    if (stBtn.dataset.arm !== "1") {
      stBtn.dataset.arm = "1";
      stBtn.textContent = e.status === "verified" ? "确认退回待验证？" : "确认已在游戏内稳定复现？";
      setTimeout(() => {
        if (stBtn.isConnected) { stBtn.dataset.arm = ""; stBtn.textContent = STATUS_CN[e.status] || e.status; }
      }, 3000);
      return;
    }
    setEntryStatus(e.id, e.status === "verified" ? "draft" : "verified");
  });

  // 槽位上传/替换 + 扩展槽删除（翻图面板内）
  $("input[data-upload]", el).addEventListener("change", async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    viewerSlotByEntry[e.id] = ev.target.dataset.upload;   // 上传后面板停在该槽
    await uploadSlotImage(e, ev.target.dataset.upload, file);
  });
  $("[data-delslot]", el).addEventListener("click", async ev => {
    const btn = ev.currentTarget;
    if (btn.dataset.arm !== "1") {
      btn.dataset.arm = "1";
      btn.textContent = "确认删除？";
      setTimeout(() => { btn.dataset.arm = ""; btn.textContent = "删除"; }, 3000);
      return;
    }
    await deleteSlotImage(e, btn.dataset.delslot);
  });

  const editBtn = $(".entry-edit", el);
  if (editBtn) editBtn.addEventListener("click", () => {
    state.editingId = e.id;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  return el;
}


/* ---------------- lightbox ---------------- */

let lbCtx = null;   // {imgs:[path...], idx, title}
const lbZoom = { k: 1, tx: 0, ty: 0 };   // k 倍率；tx/ty 平移（相对容器中心，px）

function lbApplyTransform() {
  const img = $("#lightbox-img");
  const box = document.getElementById("lightbox");
  if (!img || !box) return;
  img.style.transform = `translate(${lbZoom.tx}px, ${lbZoom.ty}px) scale(${lbZoom.k})`;
  box.classList.toggle("zoomed", lbZoom.k > 1);
  const badge = document.getElementById("lightbox-zoom");
  if (badge) {
    badge.textContent = Math.round(lbZoom.k * 100) + "%";
    badge.style.opacity = lbZoom.k > 1.001 ? "1" : "0.45";
  }
}

function lbResetZoom() {
  lbZoom.k = 1; lbZoom.tx = 0; lbZoom.ty = 0;
  lbApplyTransform();
}

function lbClampPan() {
  // k>1 时限制平移，图片不完全拖出视口
  const img = $("#lightbox-img");
  if (!img) return;
  const limX = (lbZoom.k - 1) * img.clientWidth / 2;
  const limY = (lbZoom.k - 1) * img.clientHeight / 2;
  lbZoom.tx = Math.max(-limX, Math.min(limX, lbZoom.tx));
  lbZoom.ty = Math.max(-limY, Math.min(limY, lbZoom.ty));
}

function lbZoomAt(mx, my, factor) {
  // mx/my：光标相对容器中心的偏移（px），以光标为锚缩放
  const k0 = lbZoom.k;
  const k1 = Math.min(8, Math.max(1, k0 * factor));
  if (k1 === k0) return;
  const s = k1 / k0;
  lbZoom.tx = mx - (mx - lbZoom.tx) * s;
  lbZoom.ty = my - (my - lbZoom.ty) * s;
  lbZoom.k = k1;
  if (k1 === 1) { lbZoom.tx = 0; lbZoom.ty = 0; }
  lbClampPan();
  lbApplyTransform();
}

function openLightboxCtx(imgs, idx, title) {
  lbCtx = { imgs, idx, title: title || "" };
  lbResetZoom();
  renderLightbox();
  $("#lightbox").hidden = false;
}
function openLightbox(src, label) {
  // 兼容旧调用：单图
  openLightboxCtx([src], 0, label || "");
}
function renderLightbox() {
  if (!lbCtx) return;
  lbResetZoom();
  $("#lightbox-img").src = lbCtx.imgs[lbCtx.idx];
  $("#lightbox-label").textContent =
    `${lbCtx.title ? lbCtx.title + " · " : ""}${lbCtx.idx + 1}/${lbCtx.imgs.length}`;
}
function lightboxStep(dir) {
  if (!lbCtx || lbCtx.imgs.length < 2) return;
  lbCtx.idx = (lbCtx.idx + dir + lbCtx.imgs.length) % lbCtx.imgs.length;
  renderLightbox();
}
function closeLightbox() {
  $("#lightbox").hidden = true;
  $("#lightbox-img").src = "";
  lbCtx = null;
  lbResetZoom();
}

/* ---- lightbox 缩放交互：滚轮/拖拽平移/双击复位/键盘 + − 0 ---- */
function initLightboxZoom() {
  const box = document.getElementById("lightbox");
  if (!box) return;

  // 滚轮缩放（以光标为锚）；ctrl+wheel 触控板捏合同一处理
  box.addEventListener("wheel", ev => {
    ev.preventDefault();
    if (!lbCtx) return;
    const rect = box.getBoundingClientRect();
    const mx = ev.clientX - rect.left - rect.width / 2;
    const my = ev.clientY - rect.top - rect.height / 2;
    lbZoomAt(mx, my, ev.deltaY < 0 ? 1.2 : 1 / 1.2);
  }, { passive: false });

  // 拖拽平移（k>1 时；pointer 事件 + setPointerCapture；用 client 增量而非 movementX）
  let panning = false;
  let panLast = null;
  const img = document.getElementById("lightbox-img");
  img.style.transformOrigin = "center";
  img.addEventListener("pointerdown", ev => {
    if (lbZoom.k <= 1) return;
    panning = true;
    panLast = { x: ev.clientX, y: ev.clientY };
    try { img.setPointerCapture(ev.pointerId); } catch { }
    img.classList.add("panning");
  });
  img.addEventListener("pointermove", ev => {
    if (!panning || !panLast) return;
    lbZoom.tx += ev.clientX - panLast.x;
    lbZoom.ty += ev.clientY - panLast.y;
    panLast = { x: ev.clientX, y: ev.clientY };
    lbClampPan();
    lbApplyTransform();
  });
  const panEnd = () => { panning = false; panLast = null; img.classList.remove("panning"); };
  img.addEventListener("pointerup", panEnd);
  img.addEventListener("pointercancel", panEnd);

  // 双击：1x → 以双击点为锚放大 2x；k>1 → 复位
  img.addEventListener("dblclick", ev => {
    ev.preventDefault();
    if (lbZoom.k > 1) { lbResetZoom(); return; }
    const rect = box.getBoundingClientRect();
    lbZoomAt(ev.clientX - rect.left - rect.width / 2, ev.clientY - rect.top - rect.height / 2, 2);
  });

  // 键盘 +/− 步进（锚点取容器中心），0 复位
  document.addEventListener("keydown", ev => {
    if ($("#lightbox").hidden || inInputCheck()) return;
    const rect = box.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    if (ev.key === "+" || ev.key === "=") { ev.preventDefault(); lbZoomAt(cx, cy, 1.25); }
    else if (ev.key === "-" || ev.key === "_") { ev.preventDefault(); lbZoomAt(cx, cy, 1 / 1.25); }
    else if (ev.key === "0") { ev.preventDefault(); lbResetZoom(); }
  });
}
function inInputCheck() {
  return /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
}

PB.files.push("pb-detail.js");   // R1-B 模块登记
