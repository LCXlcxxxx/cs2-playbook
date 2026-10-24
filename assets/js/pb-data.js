/* pb-data.js — .md 序列化与解析/字段徽章数据（R1-B 拆出；阶段 C 换 Schema 注册表前的过渡形态） */
"use strict";

function dumpTacticMd(t) {
  const order = ["id", "map", "side", "title", "window", "status"];
  const lines = ["---"];
  for (const k of order) {
    if (t[k] === undefined || t[k] === null || t[k] === "") continue;
    lines.push(`${k}: ${mdScalar(t[k])}`);
  }
  if (t.checked) lines.push(`checked: ${mdScalar(t.checked)}`);
  lines.push(`uses: ${mdInline(t.uses || [])}`);
  const roles = (Array.isArray(t.roles) && t.roles.length) ? t.roles : null;   // I41：角色（I42 移除出生位，只存 name）
  if (roles) {
    lines.push("roles:");
    for (const r of roles) {
      const parts = [];
      if (r.name) parts.push(`name: ${mdScalar(r.name)}`);
      lines.push(`  - {${parts.join(", ")}}`);
    }
  }
  const tl = (Array.isArray(t.timeline) && t.timeline.length) ? t.timeline : null;
  if (tl) {
    lines.push("timeline:");
    for (const s of tl) {
      const parts = [];
      if (s.t !== undefined && s.t !== null) parts.push(`t: ${mdScalar(s.t)}`);
      if (s.role) parts.push(`role: ${mdScalar(s.role)}`);   // I41：角色 1-5
      if (s.text !== undefined && s.text !== null) parts.push(`text: ${mdScalar(s.text)}`);
      if (s.use) parts.push(`use: ${mdScalar(s.use)}`);
      lines.push(`  - {${parts.join(", ")}}`);
    }
  }
  lines.push("---", "", (t.body || "").trim());
  return lines.join("\n") + "\n";
}

// 行内值小解析器（I39）：只处理 dumpTacticMd 会产出的形态（引号标量/行内数组/行内字典），
// 与 pb.py _flow 同规则——裸标量读到 , ] } 为止。
function flowVal(s, i) {
  i = i || 0;
  while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
  if (i >= s.length) return [null, i];
  const c = s[i];
  if (c === "[") {
    const arr = [];
    i++;
    for (;;) {
      while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
      if (s[i] === "]") return [arr, i + 1];
      let v;
      [v, i] = flowVal(s, i);
      arr.push(v);
      while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
      if (s[i] === ",") i++;
      else if (s[i] === "]") return [arr, i + 1];
      else if (i >= s.length) return [arr, i];
    }
  }
  if (c === "{") {
    const d = {};
    i++;
    for (;;) {
      while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
      if (i >= s.length) return [d, i];
      if (s[i] === "}") return [d, i + 1];
      let key;   // I43：键支持引号（报点名含空格如「B 包点」），与 pb.py _flow 同规则
      if (s[i] === "\"" || s[i] === "'") {
        const q = s[i];
        const j = s.indexOf(q, i + 1);
        if (j < 0) return [d, s.length];
        key = s.slice(i + 1, j);
        i = j + 1;
      } else {
        const m = /^[^\s:]+/.exec(s.slice(i));
        key = m ? m[0] : "";
        i += key.length;
      }
      while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
      i++;   // 冒号
      let v;
      [v, i] = flowVal(s, i);
      d[key] = v;
      while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
      if (s[i] === ",") i++;
      else if (s[i] === "}") return [d, i + 1];
      else if (i >= s.length) return [d, i];
    }
  }
  if (c === "\"" || c === "'") {
    const j = s.indexOf(c, i + 1);
    return [j < 0 ? s.slice(i + 1) : s.slice(i + 1, j).replace(/\\"/g, "\""), j < 0 ? s.length : j + 1];
  }
  let j = i;
  while (j < s.length && !",]}".includes(s[j])) j++;
  const raw = s.slice(i, j).trim();
  if (raw === "") return [null, j];
  // I43：裸标量类型转换（对齐 pb.py _convert_scalar）——数字/布尔不再是字符串
  if (raw === "true" || raw === "True") return [true, j];
  if (raw === "false" || raw === "False") return [false, j];
  if (raw === "null" || raw === "~") return [null, j];
  if (/^-?\d+$/.test(raw)) return [parseInt(raw, 10), j];
  if (/^-?\d+\.\d+$/.test(raw)) return [parseFloat(raw), j];
  return [raw, j];
}

// 解析 dumpTacticMd 形态的战术板 .md（I39 编辑器打开即读盘用，与 parseEntryMd 同角色）。
// 兼容现有 7 块要点板（标量 + uses 行内数组 + ## 正文）。
function parseTacticMd(text) {
  const m = String(text || "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const t = {};
  let cur = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim()) { cur = null; continue; }
    if (/^\s+-\s/.test(raw) && cur === "timeline") {
      const inner = raw.trim().replace(/^-\s*/, "");
      const step = inner.startsWith("{") ? flowVal(inner)[0] : { text: flowVal(inner)[0] };
      if (step && typeof step === "object") (t.timeline = t.timeline || []).push(step);
      continue;
    }
    if (/^\s+-\s/.test(raw) && cur === "roles") {   // I41：角色与出生位
      const inner = raw.trim().replace(/^-\s*/, "");
      const role = inner.startsWith("{") ? flowVal(inner)[0] : { name: flowVal(inner)[0] };
      if (role && typeof role === "object") (t.roles = t.roles || []).push(role);
      continue;
    }
    if (/^\s/.test(raw)) continue;   // 其余嵌套形态不支持（战术板没有）
    const i = raw.indexOf(":");
    if (i < 0) continue;
    const key = raw.slice(0, i).trim();
    const val = raw.slice(i + 1);
    cur = key;
    if (val.trim() === "") { t[key] = []; continue; }
    const [v] = flowVal(val);
    t[key] = v;
  }
  if (typeof t.uses === "string") t.uses = [t.uses];
  t.body = (m[2] || "").replace(/\r?\n$/, "");
  return t;
}

function mdScalar(v) {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  let s = String(v);
  if (s === "" || /[#\[\]{}:,"']/.test(s)) s = '"' + s.replace(/"/g, '\\"') + '"';
  return s;
}
// 行内字典键的引号规则（I43，I51 收紧）：键不满足裸键白名单（字母/数字/下划线/中文/连字符）
// 一律双引号包裹——与 pb.py _KEY_RE 完全对称。I43 只查空格等六个字符，「鹅位/狙位」这类含斜杠的
// 报点名键在 pb.py 块式读回会炸（goose 实测），斜杠键必须引号；纯中文/字母/数字/连字符键不包（存量零 diff）。
function mdKey(k) {
  const s = String(k);
  return /^[\w\u4e00-\u9fff-]+$/.test(s) ? s : '"' + s.replace(/"/g, '\\"') + '"';
}
function mdInline(v) {
  if (Array.isArray(v)) return "[" + v.map(mdScalar).join(", ") + "]";
  if (v && typeof v === "object") {   // 行内映射（I41：pin_targets 等 {报点名: [u,v]}）
    return "{" + Object.entries(v).map(([k, x]) => `${mdKey(k)}: ${mdInline(x)}`).join(", ") + "}";
  }
  return mdScalar(v);
}
function dumpEntryMd(e) {
  // R1-C：键序由注册表 dump_order 升序驱动（含原 tailOrder 四键，序号 19-22 相接）；
  // SCHEMA 缺失回落内置序（与注册表逐键一致）。source/checked 为特判序列化（registry dump 标记）。
  const _fs = schemaFields("entry");
  const allKeys = _fs
    ? _fs.filter(f => f.dump_order).sort((a, b) => a.dump_order - b.dump_order).map(f => f.key)
    : null;
  const order = allKeys || ["id", "map", "side", "type", "click", "move", "action",
    "origin", "target", "title", "oneline", "difficulty", "phase",
    "status", "spots", "tags", "sets", "related", "coords", "pin_origin", "pin_target", "pin_targets"];
  const emptyArr = _fs ? _fs.filter(f => f.dump_empty_array).map(f => f.key) : ["tags", "sets", "related"];
  const lines = ["---"];
  for (const k of order) {
    if (e[k] === undefined || e[k] === null) continue;
    if (Array.isArray(e[k]) && !e[k].length && emptyArr.includes(k)) { lines.push(`${k}: []`); continue; }
    if (e[k] && typeof e[k] === "object" && !Array.isArray(e[k]) && !Object.keys(e[k]).length) continue;   // 空 dict（pin_targets: {}）不落盘
    lines.push(`${k}: ${mdInline(e[k])}`);
  }
  if (e.source && (e.source.kind || e.source.creator || e.source.url)) {
    lines.push("source:");
    if (e.source.kind) lines.push(`  kind: ${mdScalar(e.source.kind)}`);
    if (e.source.creator) lines.push(`  creator: ${mdScalar(e.source.creator)}`);
    if (e.source.url) lines.push(`  url: ${mdScalar(e.source.url)}`);
  }
  if (e.checked) lines.push(`checked: ${mdScalar(e.checked)}`);
  lines.push("---", "", (e.notes || "").trim());
  return lines.join("\n") + "\n";
}


function parseEntryMd(text) {
  const m = String(text || "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const e = { phase: [], tags: [], sets: [], related: [], spots: [] };
  const num = s => /^-?\d+$/.test(s) ? parseInt(s, 10) : (/^-?\d+\.\d+$/.test(s) ? parseFloat(s) : s);
  const conv = v => {
    v = v.trim();
    if (v.startsWith("{") && v.endsWith("}")) {   // 行内映射（I41：pin_targets 等）
      const d = flowVal(v)[0];
      return d && typeof d === "object" ? d : v;
    }
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      return inner ? inner.split(",").map(x => num(x.trim().replace(/^["']+|["']+$/g, ""))).filter(x => x !== "" && x !== null) : [];
    }
    if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\"/g, '"');
    return num(v);
  };
  let cur = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim()) { cur = null; continue; }
    if (/^\s/.test(raw)) {   // 嵌套（现仅 source / pin_targets 块式）
      if (!cur) continue;
      const i = raw.indexOf(":");
      if (i < 0) continue;
      let key = raw.slice(0, i).trim();
      // I43：dump_doc 块式嵌套会写出引号键（"B 包点": [...]），读取时剥掉
      if (key.length >= 2 && key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1).replace(/\\"/g, '"');
      e[cur] = e[cur] || {};
      e[cur][key] = conv(raw.slice(i + 1));
      continue;
    }
    const i = raw.indexOf(":");
    if (i < 0) continue;
    const key = raw.slice(0, i).trim();
    const val = raw.slice(i + 1);
    cur = key;
    if (val.trim() === "") {
      if (key === "source") e.source = {};
      else if (!(key in e)) e[key] = [];
      continue;
    }
    e[key] = conv(val);
  }
  if (typeof e.phase === "string") e.phase = [e.phase];
  e.notes = (m[2] || "").replace(/\r?\n$/, "");
  return e;
}

// I51：难度三档——数据枚举 easy|normal|hard，值序与中文名由注册表（SCHEMA entry.difficulty）驱动
const _diffPairs = schemaEnumPairs("entry", "difficulty");
const DIFF_ORDER = _diffPairs ? _diffPairs.map(p => p[0]) : ["easy", "normal", "hard"];
const DIFF_CN = _diffPairs ? Object.fromEntries(_diffPairs) : { easy: "简单", normal: "中等", hard: "困难" };
// 兜底归一（I19 语义）：数字/数字串按 1-2→easy / 3→normal / 4-5→hard 折算，防旧覆盖层/旧修改包
// 里的数字难度流进渲染与过滤；缺失/未知回落中等（与旧默认 difficulty:3 一致）
function diffEnum(v) {
  if (DIFF_ORDER.includes(v)) return v;
  const n = parseInt(v, 10);
  if (Number.isFinite(n)) return n <= 2 ? "easy" : n === 3 ? "normal" : "hard";
  return "normal";
}
// 三档徽章（一处定义多处用）：色点+汉字，颜色永远伴随文字（色盲可读）、无 emoji 字符。
// full=详情页大号带边框版；clickable=列表行可点击按档过滤（span——entry-row 是 button 不能嵌套，同 fav-btn 先例）
function difficultyBadge(v, full, clickable) {
  const d = diffEnum(v);
  return `<span class="diff-badge diff-${d}${full ? " diff-full" : ""}"${clickable
    ? ` data-diffbtn="${d}" title="只看难度：${DIFF_CN[d]}（再点取消）"` : ""}><i class="diff-dot"></i>${DIFF_CN[d]}</span>`;
}

PB.files.push("pb-data.js");   // R1-B 模块登记
