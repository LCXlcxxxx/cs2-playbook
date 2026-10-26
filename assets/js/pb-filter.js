/* pb-filter.js — 搜索分词/拼音/chips/过滤管道（R1-B 拆出） */
"use strict";

/* ---------------- 过滤 ---------------- */

function hayOf(e) {
  return [
    e.id, e.title, e.oneline, e.origin, e.target, e.notes || "",
    ...(e.tags || []), ...(e.phase || []),
    ...(Array.isArray(e.sets) ? e.sets : []),   // I47：套装名可搜
    e.source?.creator || "",
    TYPE_INFO[e.type]?.cn || "",
  ].join(" ").toLowerCase();
}

function spotNameMatch(spot, calloutName) {
  // spots 写基础名即可：宫殿 → 「A 二楼 (宫殿)」；匪口 → 「中远匪口」；A1 → 「A1/A 门」
  const name = String(calloutName);
  const base = name.replace(/\s*\(.*\)$/, "");
  return spot === name || spot === base || name.includes(spot) || spot.includes(base);
}

// 严格匹配（I16）：value 与报点名或 search 别名精确相等（归一化 trim/大小写/全半角），
// 禁止子串包含——「警家」不得命中「警家过点」、「后花园」不得命中「后花园平台」
function normSpot(s) {
  return String(s ?? "").trim().toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/（/g, "(").replace(/）/g, ")")
    .replace(/，/g, ",");
}
function strictSpotMatch(callout, value) {
  const v = normSpot(value);
  if (!v) return false;
  return normSpot(callout.name) === v ||
    (Array.isArray(callout.search) && callout.search.some(a => normSpot(a) === v));
}

// 钻取用的严格匹配：起点/目标必须就是报点名本体（或 "A1/A 门" 的规范名），
// 禁止子串包含——否则「楼梯」会误连「下水道楼梯/跳台楼梯」
function canonicalCallout(name) {
  return String(name).split("/")[0].trim();
}
function originIs(e, calloutName) {
  return e.origin === calloutName || e.origin === canonicalCallout(calloutName);
}
// target 支持多值：数组 any-match，标量行为不变（I13）
function targetVals(e) {
  const t = e.target;
  if (Array.isArray(t)) return t.filter(Boolean);
  return t ? [t] : [];
}
function targetIs(e, targetName) {
  return targetVals(e).includes(targetName);
}

// I41：图层画图坐标统一解析——pin 覆写优先，否则返回 null（调用方回落报点坐标）。
// kind="origin" 读 pin_origin；kind="target" 读 pin_targets[报点名]，单目标条目回落 pin_target。
// 只影响道具/时间轴两图层的画图，报点层/匹配/聚合判定不受影响。
function pinOrCallout(entry, kind, targetName) {
  let pin = null;
  if (kind === "origin") pin = entry.pin_origin;
  else {
    if (entry.pin_targets && Array.isArray(entry.pin_targets[targetName])) pin = entry.pin_targets[targetName];
    else if (Array.isArray(entry.pin_target) && targetVals(entry).length === 1) pin = entry.pin_target;
  }
  if (Array.isArray(pin) && pin.length === 2) {
    const u = +pin[0], v = +pin[1];   // I43：Number 防御（编辑器读盘曾产出字符串坐标）
    if (isFinite(u) && isFinite(v) && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      return { u: +u.toFixed(4), v: +v.toFixed(4) };
    }
  }
  return null;
}
function targetDisplay(e) {
  return targetVals(e).join(" / ");
}

// 快捷筛选 chips（I50）：chip→谓词集中一处；dim=互斥维度（同 dim 单选防恒空集，如跳投/跑投同属投法维），
// 跨 dim AND，再与类型/阵营/地图/报点过滤、搜索词按 AND 组合（entryMatch 内按 state.tab 门控——只作用道具
// Tab 的列表，战术板图层/报点相关性链路不受影响）。
const FILTER_CHIPS = [
  { id: "oneway-smoke", label: "单向烟", dim: "oneway-smoke", test: e => e.type === "smoke" && (e.tags || []).includes("单向") },
  { id: "instant-flash", label: "瞬爆闪", dim: "instant-flash", test: e => e.type === "flash" && (e.tags || []).includes("瞬爆") },
  { id: "self-flash", label: "自助闪", dim: "self-flash", test: e => e.type === "flash" && (e.tags || []).includes("自助") },
  { id: "extinguish", label: "灭火", dim: "extinguish", test: e => (e.tags || []).includes("灭火") },
  { id: "jump", label: "跳投", dim: "throw", test: e => e.action === "jump" || e.action === "crouch-jump" },
  { id: "run", label: "跑投", dim: "throw", test: e => e.move === "w" || e.move === "run" },
  { id: "verified", label: "已实测", dim: "verified", test: e => e.status === "verified" },
  // I51：难度三档（同 dim 互斥单选）
  { id: "diff-easy", label: "简单", dim: "diff", test: e => diffEnum(e.difficulty) === "easy" },
  { id: "diff-normal", label: "中等", dim: "diff", test: e => diffEnum(e.difficulty) === "normal" },
  { id: "diff-hard", label: "困难", dim: "diff", test: e => diffEnum(e.difficulty) === "hard" },
];
const FILTER_CHIP_BY_ID = new Map(FILTER_CHIPS.map(c => [c.id, c]));

// 自定义筛选 chips（R3-L3，用户 2026-10-26 拍板）：把任意 tags 词提升为顶栏筛选按钮，数量不限。
// 词表存 localStorage（持久）；每词独立 dim=多个自定义词可叠加 AND；选中态仍会话内（state.filterChips 原语义）。
const CUSTOM_CHIPS_KEY = "pb-custom-chips";
function customChipWords() {
  try {
    const arr = JSON.parse(localStorage.getItem(CUSTOM_CHIPS_KEY) || "[]");
    return Array.isArray(arr) ? arr.map(w => String(w || "").trim()).filter(Boolean) : [];
  } catch { return []; }
}
function saveCustomChipWords(words) {
  localStorage.setItem(CUSTOM_CHIPS_KEY,
    JSON.stringify([...new Set(words.map(w => String(w || "").trim()).filter(Boolean))]));
}
function customChipObjs() {
  return customChipWords().map(w => ({
    id: "tag-" + w, label: w, dim: "tag-" + w,
    test: e => (e.tags || []).includes(w),
  }));
}
function allFilterChips() { return FILTER_CHIPS.concat(customChipObjs()); }
function getFilterChip(id) {
  return FILTER_CHIP_BY_ID.get(id) || customChipObjs().find(c => c.id === id) || null;
}

function chipMatch(e) {
  for (const id of state.filterChips) {
    const c = getFilterChip(id);   // 含自定义 chips；词被移除后的悬挂 id 安全跳过
    if (c && !c.test(e)) return false;
  }
  return true;
}

// chips 行视觉态同步（I50）：仅道具 Tab 显示；选中高亮、清除按钮显隐、溢出时两端渐隐
function refreshChipFilter() {
  const wrap = $("#chip-filter");
  if (!wrap) return;
  wrap.hidden = state.tab !== "entries";
  $$(".fchip", wrap).forEach(b => b.classList.toggle("on", state.filterChips.has(b.dataset.fchip)));
  const clearBtn = $("[data-fchipclear]", wrap);
  if (clearBtn) clearBtn.hidden = !state.filterChips.size;
  wrap.classList.toggle("fade", wrap.scrollWidth > wrap.clientWidth + 4);
}

// I50：搜索分词——空白（含全角空格）/中英逗号/顿号分隔，逐词 AND；拼音逐词保留
function splitSearchTerms(q) {
  return String(q || "").split(/[\s,，、]+/).map(s => s.trim()).filter(Boolean);
}

// I51：难度快捷搜索 token——「难度:简单 / 难度:困难 / diff:easy」（值兼容中文与枚举，冒号全半角皆可）。
// 认识前缀但不认识值 → 返回 "none"（恒假），不当自由词搜索误导。
function diffTokenToEnum(t) {
  const m = String(t || "").match(/^(?:难度|diff)[:：]\s*(.+)$/i);
  if (!m) return null;
  const v = m[1].trim().toLowerCase();
  if (["简单", "easy"].includes(v)) return "easy";
  if (["中等", "normal"].includes(v)) return "normal";
  if (["困难", "hard"].includes(v)) return "hard";
  return "none";
}

function entryMatch(e) {
  if (state.map && e.map !== state.map) return false;
  // 阵营过滤（I23）：both 双方通用，T/CT 下都显示
  if (state.side && e.side !== state.side && e.side !== "both") return false;
  if (state.types.size && !state.types.has(e.type)) return false;
  if (state.tab === "entries" && !chipMatch(e)) return false;   // 快捷筛选 chips（I50，仅道具 Tab）
  if (!state.showArchived && (e.status === "broken" || e.status === "retired")) return false;
  // 钻取模式：起点模式 起点+目标；目标模式 目标+起点（方向语义反转，字段相同）
  if (state.drill && state.drillTarget) {
    if (e.map !== state.drill.map) return false;
    if (state.drill.mode === "target") {
      return targetIs(e, state.drill.name) && originIs(e, state.drillTarget);
    }
    return originIs(e, state.drill.name) && targetIs(e, state.drillTarget);
  }
  // 报点精确过滤：条目 spots 声明优先；没写 spots 的条目按 origin/target/tags 兜底（不含正文，避免误伤）
  if (state.spot) {
    if (e.map !== state.spot.map) return false;
    const name = state.spot.name;
    if (Array.isArray(e.spots) && e.spots.length) {
      return e.spots.some(s => spotNameMatch(s, name));
    }
    const limited = [e.id, e.title, e.origin, e.target, ...(e.tags || [])]
      .join(" ").toLowerCase();
    return limited.includes(name.toLowerCase());
  }
  const hay = hayOf(e);
  if (state.searchTerms) {
    return state.searchTerms.some(t => hay.includes(String(t).toLowerCase()));
  }
  if (state.search) {
    return splitSearchTerms(state.search).every(t => {
      const d = diffTokenToEnum(t);   // I51：难度 token 摘出转谓词，与剩余词按 AND
      if (d) return d !== "none" && diffEnum(e.difficulty) === d;
      const w = t.toLowerCase();
      return hay.includes(w) || pyHit(e, w);
    });
  }
  return true;
}

// I37：拼音匹配——q 仅含 [a-z0-9] 时才走拼音：全拼子串（pyf）恒可命中；
// q 长度≥2 再加首字母子序列匹配（pyi 每个字段串按序含 q 全部字符，双指针）。
function pyHit(e, q) {
  if (!/^[a-z0-9]+$/.test(q)) return false;
  const f = e.pyf || [], i = e.pyi || [];
  if (f.some(x => x.includes(q))) return true;
  if (q.length >= 2 && i.some(x => isSubseq(x, q))) return true;
  return false;
}
// 字段首字母串 field 是否按序包含搜索词 q 的全部字符（不必连续）
function isSubseq(field, q) {
  let p = 0;
  for (const ch of field) {
    if (ch === q[p]) p++;
    if (p === q.length) return true;
  }
  return p === q.length;
}

function tacticMatch(t) {
  if (state.map && t.map !== state.map) return false;
  if (state.side && t.side !== state.side && t.side !== "both") return false;   // 阵营过滤（I23）
  if (!state.showArchived && (t.status === "broken" || t.status === "retired")) return false;
  if (state.search) {
    const usedTitles = (t.uses || []).map(u => data.entries.find(e => e.id === u)?.title || "");
    const hay = [t.id, t.title, ...(t.tags || []), ...usedTitles].join(" ").toLowerCase();
    if (!splitSearchTerms(state.search).every(t => hay.includes(t.toLowerCase()))) return false;   // I50 分词
  }
  return true;
}

PB.files.push("pb-filter.js");   // R1-B 模块登记
