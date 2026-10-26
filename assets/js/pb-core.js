/* pb-core.js — PB 根/全局常量/state 单仓/工具函数（R1-B 自 app.js 机械拆出，行为零变化） */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/* ---------------- SCHEMA 消费助手（R1-C：字段知识单一真相源在 pb.py 注册表） ----------------
   build 把注册表注入 window.PLAYBOOK.SCHEMA；此处只做读取与兜底——
   SCHEMA 缺失（旧 data.js）时 warn 一次并回落调用方内置兜底，不做整份镜像，防两份真相。 */
let __schemaWarned = false;
function schemaWarnOnce() {
  if (!__schemaWarned) {
    __schemaWarned = true;
    console.warn("PLAYBOOK.SCHEMA 缺失——字段清单回落内置兜底（旧 build？请双击「同步并打包.bat」刷新）");
  }
}
function schemaFields(kind) {
  const sc = window.PLAYBOOK?.SCHEMA?.[kind];
  if (!Array.isArray(sc) || !sc.length) { schemaWarnOnce(); return null; }
  return sc;
}
function schemaField(kind, key) {
  return (schemaFields(kind) || []).find(f => f.key === key) || null;
}
// [值, 中文名] 对；SCHEMA 缺失返回 null（调用方回落硬编码对）
function schemaEnumPairs(kind, key) {
  const f = schemaField(kind, key);
  return f && Array.isArray(f.enum) ? f.enum : null;
}
function schemaEnumValues(kind, key) {
  const pairs = schemaEnumPairs(kind, key);
  return pairs ? pairs.map(p => p[0]) : null;
}
// 朋友导入合并清单：注册表 import_merge 字段 + notes（正文，非 frontmatter 字段恒在清单）
const SCHEMA_IMPORT_MERGE_FALLBACK = ["title", "oneline", "origin", "target", "click", "move",
  "action", "difficulty", "type", "phase", "tags", "sets", "spots", "related"];
function schemaImportMergeKeys() {
  const fs = schemaFields("entry");
  const keys = fs ? fs.filter(f => f.import_merge).map(f => f.key) : SCHEMA_IMPORT_MERGE_FALLBACK;
  return [...keys, "notes"];
}

/* ---------------- 道具条目：本地覆盖层 + 文件写入 ---------------- */
/* 编辑结果先写 data/entries/*.md（已关联项目文件夹时），并即时存 localStorage
   让本次浏览生效；跑 pb build 后 data.js 与文件一致，覆盖层内容相同故无副作用。
   红线：查看器不可改动 status（转 verified 只能走 pb verify）。 */

const TYPE_INFO = {
  smoke:   { cn: "烟雾", icon: "assets/icons/icon-smoke.svg",   color: "#7aa2f7" },
  flash:   { cn: "闪光", icon: "assets/icons/icon-flash.svg",   color: "#e8c15a" },
  molotov: { cn: "燃烧", icon: "assets/icons/icon-molotov.svg", color: "#f07a5a" },
  he:      { cn: "高爆", icon: "assets/icons/icon-he.svg",      color: "#9ece6a" },
};
const PHASE_CN = {
  execute: "爆点", default: "默认", retake: "回防", postplant: "防守", "anti-eco": "科研",
};
const SIDE_CN = { T: "T 方", CT: "CT 方", both: "双方" };
const STATUS_CN = { draft: "待验证", verified: "已实测", broken: "已失效", retired: "弃用" };
const PLAYER_COLORS = ["#f07a5a", "#5aa2f7", "#e8c15a", "#3fd68f", "#c58af9"];
const EDITABLE_SLOTS = [
  ["1-stand", "站位"], ["2-aim", "瞄点"], ["4-result", "落点&效果"],
];
// R1-C：阶段选项由注册表驱动（值序=表单与显示序）；SCHEMA 缺失回落内置对
const PHASE_OPTS = schemaEnumPairs("entry", "phase")
  || [["execute", "爆点"], ["default", "默认"], ["retake", "回防"], ["postplant", "防守"], ["anti-eco", "科研"]];
const PHASE_ORDER = ["default", "execute", "postplant", "retake", "anti-eco"];   // 列表分组顺序（显示分组序，非枚举序——UI 特化保留）
const BASE_SLOTS = ["1-stand", "2-aim", "4-result"];   // 基础槽（只可替换不可删）

let entryRows = [];   // 当前列表页扁平顺序（键盘高亮/详情上一条下一条共用）
let entryListPlaceholder = false;   // 列表页显示过「该图还没有录入道具」占位

const state = {
  tab: "tactics",      // 默认打开就是报点地图
  map: localStorage.getItem("pb-map") || "de_dust2",   // 默认炙热沙城，记住上次选择（I14）
  side: "",
  types: new Set(),
  search: "",
  searchTerms: null,   // 点击报点后的多关键词过滤（任一命中即显示）
  spot: null,          // {map, name} 报点精确过滤（按条目 spots 字段）
  drill: null,         // {map, name, mode} 两级钻取：已选点位（mode=起点/目标模式）
  drillTarget: null,   // 已选的第二级地名（起点模式下是目标；目标模式下是起点）
  drillMode: ["origin", "target", "all"].includes(localStorage.getItem("pb-drill-mode"))
    ? localStorage.getItem("pb-drill-mode") : "all",   // all=普通视图：显示全部相关报点（I16）
  entryView: null,     // {id} 道具二级详情页
  detailFrom: "list",  // 详情页来源（I42）："tactics"=战术板系跳入（Esc 回战术板）/"list"=列表（Esc 回列表）
  entryListScroll: 0,  // 列表滚动位置（返回时还原）
  listIdx: -1,         // 列表页键盘高亮行
  showArchived: localStorage.getItem("pb-show-archived") === "1",   // 全局设置持久化（I17）
  mapLayer: ["callouts", "nades", "timeline"].includes(localStorage.getItem("pb-map-layer"))
    ? localStorage.getItem("pb-map-layer") : "callouts",   // 战术板图层（I38 双层，I39 加时间轴）
  tacticEditId: null,  // 战术板编辑器打开中（id 或 "__new__"，I39）
  tlBoard: null,       // 时间轴层当前选中的战术板 id（I39，会话内不持久化）
  pinEdit: false,      // 道具层「✏️ 调点」模式（I41，会话内不持久化）
  focusIdx: -1,        // 当前键盘聚焦的可见卡片
  editor: false,       // 报点编辑器模式
  picking: false,      // 地图选点弹窗打开中（I13，Esc 由弹窗捕获消费）
  setsOnly: false,     // 📦 只看战术包（套装折叠视图，会话内有效，默认关，I47）
  manage: false,       // R2-A：管理模式（false=查阅，显示全部编辑入口；每次打开默认查阅，不持久化）
  runbook: null,       // R2-B：开战连翻（null=关闭；活跃时 {source, name, idx, items}，不持久化）
  filterChips: new Set(),  // 快捷筛选 chips 选中的 id（I50，会话内不持久化，刷新即清）
};

const setsExpanded = new Set();   // 展开的套装名（会话内保持，不持久化，I47）

const data = window.PLAYBOOK;

const ENTRY_OV_KEY = "pb-entries-v1";
const TACTIC_OV_KEY = "pb-tactics-v1";   // 战术板覆盖层（I39）：与条目覆盖层同结构、同 I19 语义
const EDITOR_KEY = "pb-callouts-v2";   // 报点编辑器覆盖层（按地图叠加）——恢复被误删的声明，修同步徽章失效
const RETIRED_KEY = "pb-retired-v1";   // 搁置区：被 builtAt 对账退役的暂存留底（I19，绝不静默丢）
const MOVE_EXTRA_KEY = "pb-move-extra";   // 自定义移动方式（值即显示名，I17）
const FAVS_KEY = "pb-favs";   // 收藏的条目 id（浏览器本地，不进 .md，I17）

// 与 pb.py 的 builtAt 同格式（UTC YYYY-MM-DDTHH:MM:SSZ），可直接字符串比较（I19）
function isoNow() { return new Date().toISOString().slice(0, 19) + "Z"; }

function moveExtra() {
  try {
    const v = JSON.parse(localStorage.getItem(MOVE_EXTRA_KEY) || "null");
    if (Array.isArray(v)) return v.filter(x => typeof x === "string" && x.trim());
  } catch { /* 忽略坏数据 */ }
  return [];   // 预置「蹲下」已转正为内置枚举 crouch（I28：不再预置，旧存档由 migrateMoveExtra 清理）
}
function saveMoveExtra(arr) {
  localStorage.setItem(MOVE_EXTRA_KEY, JSON.stringify(arr));
}
// 内置移动枚举的显示名集合（编辑器/分拣台共用子集，用于去重与迁移，I28）
function builtinMoveNames() {
  return new Set(["原地", "蹲下", "W", "W 前进", "W一步", "W 一步", "Shift", "Shift+W", "跑"]);
}
// boot 一次性迁移（I28）：清掉与内置显示名同名的自定义项（如旧预置「蹲下」，crouch 转正后重复）
function migrateMoveExtra() {
  if (!localStorage.getItem(MOVE_EXTRA_KEY)) return;
  const kept = moveExtra().filter(m => !builtinMoveNames().has(m));
  if (kept.length !== moveExtra().length) saveMoveExtra(kept);
}
// 编辑器/分拣台移动下拉共用的选项列表：内置优先，自定义项按显示名去重后追加（I28）
function moveChoices(builtinPairs) {
  const names = new Set(builtinPairs.map(p => p[1]));
  return builtinPairs.concat(
    moveExtra().filter(m => !names.has(m) && !builtinMoveNames().has(m)).map(m => [m, m]));
}
function favList() {
  try {
    const v = JSON.parse(localStorage.getItem(FAVS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function isFav(id) { return favList().includes(id); }
function toggleFav(id) {
  const arr = favList();
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.push(id);
  localStorage.setItem(FAVS_KEY, JSON.stringify(arr));
}

function throwBadge(click, move, action) {
  const M = { stand: "", crouch: "蹲下", w: "W", "walk-step": "W一步", shift: "Shift", "shift-w": "Shift+W", run: "跑" };
  const C = { lmb: "左键", rmb: "右键", both: "双键" };
  const A = { direct: "", jump: "跳投", "crouch-jump": "蹲跳投" };
  const mv = move in M ? M[move] : String(move || "");   // 自定义移动直接显示原值（I17）
  const parts = [mv, C[click] || "", A[action] || ""].filter(Boolean);
  if (parts.length >= 3) return parts.join("·");
  if (parts.length === 0) return "直接投";
  if (parts.length === 1) return parts[0] + (click === "rmb" ? "轻抛" : "直投");
  return parts.join("");
}

// 投法徽章着色（I48，纯显示层，仅列表行用）：跳投类=蓝、走位投=绿、原地直投=灰，其余默认色。
// 文案不动——规范要求徽章必显示文案，颜色只是辅助识别。
function throwBadgeClass(e) {
  if (!e) return "";
  if (e.action === "jump" || e.action === "crouch-jump") return "bt-jump";
  if (["w", "walk-step", "shift", "shift-w", "run"].includes(e.move)) return "bt-run";
  if ((e.move || "stand") === "stand" && (e.action || "direct") === "direct") return "bt-direct";
  return "";
}

// 来源前缀显示（I48 弱化；用户 2026-10-26 定稿放宽为中英文通用）——标题形如「flamez-跳台烟」
// 「寒王-抢A大门烟」（首个「-」前为非空且 ≤12 字的名字段，其后非空）时，前缀渲染为次级小字，
// 一眼分清职业选手/战队/UP 主来源。不改数据、不影响排序/搜索（hayOf 仍用原始 title）。
function entryTitleHtml(title) {
  const s = String(title || "");
  const i = s.indexOf("-");
  if (i > 0 && i <= 12 && s.length > i + 1) {
    return `<span class="row-prefix">${escapeHtml(s.slice(0, i))}-</span>${escapeHtml(s.slice(i + 1))}`;
  }
  return escapeHtml(s);
}


function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 解析 dumpEntryMd 形态的条目 .md（frontmatter 标量/行内数组/嵌套 source + 正文=notes）。
// I34：编辑器打开即读盘用——盘上文件是唯一真相。

/* ---------------- 初始化 ---------------- */

let diskEntries = [];   // 磁盘原始条目基线（I19：ef-save 用它做底，旧影子字段不借「保存」回写文件）

// I40：Ctrl+V 贴图——编辑器打开期间的上下文（entryEditor 赋值）；分拣台最后点过的槽挂 sortSt.lastSpSlot
let pasteEditorCtx = null;

// 第一个缺失的基础槽（贴图/详情页缺省落点）
function firstMissingSlot(entry) {
  return BASE_SLOTS.find(s => !(entry.images || []).some(i => i.slot === s)) || null;
}

/* ---- 地图排序（I29）：⚙ 可调序，pb-map-order 持久化，第一位=默认图 ---- */
function mapOrder() {
  let saved = [];
  try {
    const v = JSON.parse(localStorage.getItem("pb-map-order") || "null");
    if (Array.isArray(v)) saved = v.filter(x => typeof x === "string" && data.maps[x]);
  } catch { /* 忽略坏数据 */ }
  const rest = Object.keys(data.maps).filter(k => !saved.includes(k));
  return [...saved, ...rest];
}
// 顶栏地图下拉（I29：无「全部地图」聚合项，顺序按 ⚙ 自定义排序）
function buildMapSelect() {
  const mapSel = $("#map-filter");
  if (!mapSel) return;
  mapSel.innerHTML = mapOrder().map(m => {
    const info = data.maps[m] || {};
    return `<option value="${m}">${info.cn || m}（${info.name || m}）</option>`;
  }).join("");
  mapSel.value = state.map;
}
// ⚙ 排序行 ↑/↓ 调序：写回 pb-map-order 并同步顶栏下拉
function moveMapOrder(idx, dir) {
  const arr = mapOrder();
  const j = idx + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  localStorage.setItem("pb-map-order", JSON.stringify(arr));
  buildMapSelect();
}


let toastTimer = null;
function toast(msg) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---- window.PB 模块登记与共享 state 宿主（R1-B） ---- */
window.PB = window.PB || {};
PB.files = PB.files || [];
PB.state = state;

PB.files.push("pb-core.js");   // R1-B 模块登记
