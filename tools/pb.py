# pb.py — CS2 Playbook 单文件 CLI（纯 Python 标准库）
#
# 子命令：
#   lint                校验所有条目/战术板/地图注册表
#   build               校验 + 生成 build/data.js + build/report.md
#   new utility <id>    生成道具条目模板（--side T --type smoke --map de_mirage）
#   new tactic <id>     生成战术板模板（--side T --map de_mirage）
#   shots <目录>        截图批量归位到 media/<map>/<id>/<槽位>.(png|jpg|webp)
#   pack                生成发布包 dist/cs2-playbook-YYYYMMDD.zip
#   verify <id>         实测确认后置 verified（或 --broken 置失效）
#
# 注：本文件于 2026-10-04 从 build/_pb_rescue.pyc 重建（I41 期间源文件被 cmd 分号坑误删）。
# 语义与 pyc 版本逐项对齐（lint/build/data.js 字节级验证），源码注释为重写版。
from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---- 槽位与常量（与 app.js 同步：EDITABLE_SLOTS / BASE_SLOTS） ----
SLOT_LABELS = {"1-stand": "站位", "2-aim": "瞄点", "4-result": "落点&效果"}
REQUIRED_SLOTS = ["1-stand", "2-aim", "4-result"]
EXTRA_SLOT_LABELS = {"5-alt": "备选站位", "5-demo": "演示"}
IMG_EXTS = [".png", ".jpg", ".jpeg", ".webp"]

# ---- 字段注册表（R1-C）：字段知识单一真相源 ----
# 每字段：key / type(scalar|scalar_array|array|object) / required / enum(值序=表单与显示序，[值, 中文名] 对) /
# default(new 模板初值) / new_value(模板占位) / dump_order(dumpEntryMd 键序，None=特判序列化) /
# dump_empty_array(空数组落 .md) / import_merge(朋友导入合并清单) / lint(规则名；跨字段与内容级规则
# 留在 lint() 内以同名注释对应) / cn(中文说明)。
# 加字段 = 改这里 + 必要 UI 特化；JS 侧经 data.js 的 window.PLAYBOOK.SCHEMA 消费（禁再新增硬编码字段数组）。
FIELD_REGISTRY = {
    "entry": [
        {"key": "id", "type": "scalar", "required": True, "dump_order": 1,
         "lint": "id_pattern+filename", "cn": "条目 id（系统自动生成，改 map/side/type 自动跟随改名）"},
        {"key": "map", "type": "scalar", "required": True, "dump_order": 2,
         "lint": "map_registered", "cn": "地图 key（maps.json）"},
        {"key": "side", "type": "scalar", "required": True, "enum_check": True, "dump_order": 3,
         "default": "T",
         "enum": [["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]],
         "lint": "enum", "cn": "阵营（both 双方通用）"},
        {"key": "type", "type": "scalar", "required": True, "enum_check": True, "dump_order": 4,
         "import_merge": True,
         "enum": [["smoke", "烟雾"], ["flash", "闪光"], ["molotov", "燃烧"], ["he", "高爆"]],
         "lint": "enum", "cn": "道具类型"},
        {"key": "click", "type": "scalar", "required": True, "enum_check": True, "dump_order": 5,
         "default": "lmb", "import_merge": True,
         "enum": [["lmb", "左键"], ["rmb", "右键"], ["both", "双键"]],
         "lint": "enum", "cn": "键位（三字段必填，组合即完整投法）"},
        {"key": "move", "type": "scalar", "required": True, "dump_order": 6,
         "default": "stand", "import_merge": True,
         "enum": [["stand", "原地"], ["crouch", "蹲下"], ["w", "W 前进"], ["walk-step", "W 一步"],
                  ["shift", "Shift"], ["shift-w", "Shift+W"], ["run", "跑"]],
         "lint": "enum_warn_custom", "cn": "移动方式（自定义值经 ⚙ 设置，lint WARN）"},
        {"key": "action", "type": "scalar", "required": True, "enum_check": True, "dump_order": 7,
         "default": "direct", "import_merge": True,
         "enum": [["direct", "直接投"], ["jump", "跳投"], ["crouch-jump", "蹲跳投"]],
         "lint": "enum", "cn": "投掷方式"},
        {"key": "origin", "type": "scalar", "required": True, "dump_order": 8,
         "import_merge": True, "new_value": "待补中文地标",
         "lint": "spots_callouts(经 spots 兜底)", "cn": "起点（报点表中文名）"},
        {"key": "target", "type": "scalar_array", "required": True, "dump_order": 9,
         "import_merge": True, "new_value": "待补",
         "lint": "target_callouts", "cn": "目标（报点名；多落点用行内数组）"},
        {"key": "title", "type": "scalar", "required": True, "dump_order": 10,
         "import_merge": True, "new_value": "待补标题", "cn": "标题"},
        {"key": "oneline", "type": "scalar", "required": True, "dump_order": 11,
         "import_merge": True, "new_value": "一句话怎么扔（卡片上最大字号的一行）",
         "cn": "一句话「怎么扔」，卡片最大字号的一行"},
        {"key": "difficulty", "type": "scalar", "required": True, "dump_order": 12,
         "default": "normal", "import_merge": True,
         "enum": [["easy", "简单"], ["normal", "中等"], ["hard", "困难"]],
         "lint": "difficulty_enum", "cn": "难度三档（中文只在显示层；数字旧值跑 migrate-difficulty）"},
        {"key": "phase", "type": "scalar_array", "required": True, "dump_order": 13,
         "default": ["default"], "import_merge": True,
         "enum": [["execute", "爆点"], ["default", "默认"], ["retake", "回防"],
                  ["postplant", "防守"], ["anti-eco", "科研"]],
         "lint": "phase_enum", "cn": "阶段（可多选，数据键不变）"},
        {"key": "status", "type": "scalar", "required": True, "enum_check": True, "dump_order": 14,
         "default": "draft",
         "enum": [["draft", "待验证"], ["verified", "已实测"], ["broken", "已失效"], ["retired", "弃用"]],
         "lint": "enum+checked_date", "cn": "状态（没实测永远是 draft）"},
        {"key": "spots", "type": "array", "dump_order": 15, "import_merge": True,
         "lint": "spots_callouts", "cn": "互动地图报点关联（精确过滤）"},
        {"key": "tags", "type": "array", "dump_order": 16, "dump_empty_array": True,
         "import_merge": True, "cn": "战术标签（搜索/筛选 chips 用）"},
        {"key": "sets", "type": "array", "dump_order": 17, "dump_empty_array": True,
         "import_merge": True, "lint": "sets_shapes", "cn": "战术包（自由中文名数组）"},
        {"key": "related", "type": "array", "dump_order": 18, "dump_empty_array": True,
         "import_merge": True, "lint": "related_link", "cn": "条目互链"},
        {"key": "coords", "type": "object", "dump_order": 19,
         "cn": "getpos 坐标（全部可选，实测后回填）"},
        {"key": "pin_origin", "type": "array", "dump_order": 20, "lint": "pin_uv",
         "cn": "图层起点显示坐标覆写 [u, v]"},
        {"key": "pin_target", "type": "array", "dump_order": 21, "lint": "pin_uv",
         "cn": "单目标落点显示坐标覆写 [u, v]"},
        {"key": "pin_targets", "type": "object", "dump_order": 22, "lint": "pin_uv",
         "cn": "多目标落点显示坐标覆写 {报点名: [u, v]}（含空格键须引号）"},
        {"key": "source", "type": "object", "dump": "block", "lint": "source_kind",
         "sub": {"kind": {"enum": ["self", "video", "web", "friend"]}},
         "cn": "来源署名（video/web 必记 creator/url）"},
        {"key": "checked", "type": "scalar", "dump": "conditional", "lint": "checked_date",
         "cn": "最后实测日期（仅 verified 必填，YYYY-MM-DD）"},
    ],
    "tactic": [
        {"key": "id", "type": "scalar", "required": True, "dump_order": 1,
         "lint": "tactic_id_pattern+filename", "cn": "战术板 id（<map去前缀>-plan-<两位序号>）"},
        {"key": "map", "type": "scalar", "required": True, "dump_order": 2,
         "cn": "地图 key（已有板锁定不改）"},
        {"key": "side", "type": "scalar", "required": True, "enum_check": True, "dump_order": 3,
         "default": "both", "enum": [["T", "T 方"], ["CT", "CT 方"], ["both", "双方"]],
         "lint": "enum", "cn": "阵营"},
        {"key": "title", "type": "scalar", "required": True, "dump_order": 4,
         "new_value": "待补标题", "cn": "标题"},
        {"key": "window", "type": "scalar", "required": True, "dump_order": 5,
         "new_value": "整局", "cn": "适用回合时间窗"},
        {"key": "status", "type": "scalar", "required": True, "dump_order": 6,
         "default": "draft",
         "enum": [["draft", "待验证"], ["verified", "已实测"], ["broken", "已失效"], ["retired", "弃用"]],
         "lint": "enum", "cn": "状态"},
        {"key": "checked", "type": "scalar", "dump_order": 7,
         "cn": "实测日期（这块板游戏里跑通过）"},
        {"key": "uses", "type": "array", "required": True, "dump_order": 8,
         "default": [], "lint": "uses_link", "cn": "引用的道具 id（必须真实存在）"},
        {"key": "roles", "type": "array", "dump_order": 9, "lint": "roles_shape",
         "cn": "角色名（≤5 项）"},
        {"key": "timeline", "type": "array", "dump_order": 10, "lint": "timeline_steps",
         "cn": "时间轴步骤（≤20 步，倒计时 M:SS）"},
    ],
}

# 枚举值表（由注册表派生；保留裸值列表形态以维持历史消息「允许 ['T', 'CT', 'both']」不变）
ENUMS = {}
for _kind in FIELD_REGISTRY.values():
    for _f in _kind:
        if _f.get("enum"):
            ENUMS[_f["key"]] = [_p[0] for _p in _f["enum"]]
        for _sub, _subdef in (_f.get("sub") or {}).items():
            ENUMS[f"{_f['key']}.{_sub}"] = _subdef["enum"]
# 注册表分节语义：entry 必填 = 非空（None/""/[] 都算缺）；tactic 必填 = 键存在（uses: [] 合法）
REQUIRED_SEMANTICS = {"entry": "nonempty", "tactic": "exists"}
ENTRY_REQUIRED = [f["key"] for f in FIELD_REGISTRY["entry"] if f.get("required")]
TACTIC_REQUIRED = [f["key"] for f in FIELD_REGISTRY["tactic"] if f.get("required")]
# I51：数字难度 → 三档枚举的一次性映射（1-2→easy / 3→normal / 4-5→hard）
DIFF_MIGRATE = {1: "easy", 2: "easy", 3: "normal", 4: "hard", 5: "hard"}

# 投法徽章中文表（与 app.js throwBadge 严格同串，CHECK-01 验证过 63 组合）
BADGE_MOVE = {"stand": "", "crouch": "蹲下", "w": "W", "walk-step": "W一步",
              "shift": "Shift", "shift-w": "Shift+W", "run": "跑"}
BADGE_CLICK = {"lmb": "左键", "rmb": "右键", "both": "双键"}
BADGE_ACTION = {"direct": "", "jump": "跳投", "crouch-jump": "蹲跳投"}
STATUS_CN = {"draft": "待验证", "verified": "已实测", "broken": "已失效", "retired": "弃用"}
TYPE_CN = {"smoke": "烟雾", "flash": "闪光", "molotov": "燃烧", "he": "高爆"}


def throw_badge(click: str, move: str, action: str) -> str:
    """三字段自动拼中文投法徽章。三段齐全用 · 分隔，缺段直接相连。
    move 不在内置表时（用户自定义移动）直接显示原值。"""
    mv = BADGE_MOVE.get(move, move)
    parts = [x for x in (mv, BADGE_CLICK.get(click, ""), BADGE_ACTION.get(action, "")) if x]
    if len(parts) == 3:
        return "·".join(parts)
    if len(parts) == 0:
        return "直接投"
    if len(parts) == 1:
        return parts[0] + ("轻抛" if click == "rmb" else "直投")
    return "".join(parts)


def entry_id_pattern(map_: str, side: str, type_: str) -> str:
    """条目 id 规则：{map去de_前缀}-{side小写}-{type}-{target}。
    燃烧弹在既有 id 里用别名 molly（AGENTS.md 首批内容表），两种拼法都认。"""
    short = map_[3:] if map_.startswith("de_") else map_
    type_part = "(?:molotov|molly)" if type_ == "molotov" else type_
    return f"^{short}-{side.lower()}-{type_part}-[a-z0-9-]+$"


class FmError(Exception):
    """frontmatter 语法错误——直接报错，不做容错猜测。"""


def _strip_comment(line: str) -> str:
    """去掉行尾注释：# 前是行首或空白且不在引号内才算注释（保护 URL 片段）。"""
    quote = None
    for i, ch in enumerate(line):
        if quote:
            if ch == quote:
                quote = None
        elif ch in "\"'":
            quote = ch
        elif ch == "#" and (i == 0 or line[i - 1] in " \t"):
            return line[:i].rstrip()
    return line


def _convert_scalar(s: str):
    """裸标量转类型：布尔/整数/浮点，其余保持字符串。"""
    if s in ("true", "True"):
        return True
    if s in ("false", "False"):
        return False
    if s in ("null", "~"):
        return None
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d+\.\d+", s):
        return float(s)
    return s


def _unquote(s: str) -> str:
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        return s[1:-1]
    return s


def _skip_ws(s: str, i: int) -> int:
    while i < len(s) and s[i] in " \t":
        i += 1
    return i


def _flow(s: str, i: int):
    """行内值递归下降解析：[数组] {字典} "引号" 裸标量。返回 (值, 下一个位置)。"""
    i = _skip_ws(s, i)
    if i >= len(s):
        return None, i
    c = s[i]
    if c == "[":
        i += 1
        arr = []
        while True:
            i = _skip_ws(s, i)
            if i >= len(s):
                raise FmError("行内数组未闭合")
            if s[i] == "]":
                return arr, i + 1
            v, i = _flow(s, i)
            arr.append(v)
            i = _skip_ws(s, i)
            if i < len(s) and s[i] == ",":
                i += 1
            elif i < len(s) and s[i] == "]":
                return arr, i + 1
            else:
                raise FmError(f"行内数组缺逗号或闭合: …{s[i:i+10]!r}")
    if c == "{":
        i += 1
        d = {}
        while True:
            i = _skip_ws(s, i)
            if i >= len(s):
                raise FmError("行内字典未闭合")
            if s[i] == "}":
                return d, i + 1
            # I43：键支持引号——报点名含空格（如「B 包点」「A 二楼 (宫殿)」）必须引号键，
            # 裸键遇空格仍截断报错（防线保留：漏加引号的键会立刻暴露）
            if s[i] in "\"'":
                q = s[i]
                j = s.find(q, i + 1)
                if j < 0:
                    raise FmError(f"引号键未闭合: {s[i:]!r}")
                key = s[i + 1 : j]
                i = j + 1
            else:
                # I51：裸键与 _KEY_RE 同规则（I43 只挡空格，`/` 等字符行内能读、写成块式读不回——
                # goose 的「鹅位/狙位」键即此缺口）。不合法键一律加引号，读端见引号即边界。
                m = re.match(r"[\w\u4e00-\u9fff-]+", s[i:])
                if not m:
                    raise FmError(f"行内字典键名不合法: {s[i:i+10]!r}")
                key = m.group(0)
                i = i + len(key)
            i = _skip_ws(s, i)
            if i >= len(s) or s[i] != ":":
                raise FmError(f"行内字典键缺冒号: {key!r}")
            v, i = _flow(s, i + 1)
            d[key] = v
            i = _skip_ws(s, i)
            if i < len(s) and s[i] == ",":
                i += 1
            elif i < len(s) and s[i] == "}":
                return d, i + 1
            else:
                raise FmError(f"行内字典缺逗号或闭合: {key!r} 之后")
    if c in "\"'":
        j = s.find(c, i + 1)
        if j < 0:
            raise FmError(f"引号未闭合: {s[i:]!r}")
        return s[i + 1 : j], j + 1
    # 裸标量：读到本层结束符（, ] }）为止
    j = i
    while j < len(s) and s[j] not in ",]}":
        j += 1
    raw = s[i:j].strip()
    if raw == "":
        return None, j
    return _convert_scalar(_unquote(raw)), j


def parse_flow(text: str):
    return _flow(text, 0)[0]


_KEY_RE = re.compile(r"^[\w\u4e00-\u9fff-]+$")


def _indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def parse_block(lines: list[str], start: int, indent: int):
    """解析一个块（字典或列表），返回 (值, 下一个行号)。只认：
    字典项 `key: 值` / `key:` + 更深缩进块；列表项 `- 行内值`。其余报错。"""
    first = None
    for k in range(start, len(lines)):
        ln = lines[k]
        if not ln.strip():
            continue
        first = ln
        break
    if first is None:
        return {}, start
    is_list = first.lstrip().startswith("- ")
    if is_list and _indent_of(first) != indent:
        raise FmError("列表项缩进异常")
    result: list | dict = [] if is_list else {}
    i = start
    while i < len(lines):
        raw = lines[i]
        if not raw.strip():
            i += 1
            continue
        ind = _indent_of(raw)
        if ind < indent:
            break  # 本块结束
        if ind > indent:
            raise FmError(f"缩进异常（期望 {indent} 空格，遇到 {ind}）: {raw.strip()[:30]!r}")
        line = _strip_comment(raw).strip()
        if not line:
            i += 1
            continue
        if is_list:
            if not line.startswith("- "):
                raise FmError(f"列表里混入非列表项: {line[:30]!r}")
            item_text = line[2:].strip()
            value, rest = _flow(item_text, 0)
            if item_text[rest:].strip():
                raise FmError(f"列表项行内值后有多余内容: {item_text!r}")
            result.append(value)
            i += 1
        else:
            # I43：块式键也支持引号（dump_doc 嵌套字典会写出 `  "B 包点": [...]`）
            quote = None
            if line[0] in "\"'":
                quote = line[0]
                j = line.find(quote, 1)
                if j < 0:
                    raise FmError(f"键引号未闭合: {line[:40]!r}")
                key, rest = line[1:j], line[j + 1 :]
                # 引号即边界：键内容不再过 _KEY_RE（含空格的报点名是合法键）
                if not rest.startswith(":"):
                    raise FmError(f"引号键后缺冒号: {line[:40]!r}")
                val_text = rest[1:].strip() or None
                if val_text is not None:
                    value, rest2 = _flow(val_text, 0)
                    if val_text[rest2:].strip():
                        raise FmError(f"键 {key!r} 的值后有多余内容: {val_text!r}")
                    result[key] = value
                else:
                    result[key] = None
                i += 1
                continue
            m = re.match(r"^([^\s:]+):(?:\s+(.*))?$", line)
            if not m:
                raise FmError(f"不认识的行语法: {line[:40]!r}")
            key, val_text = m.group(1), m.group(2)
            if not _KEY_RE.match(key):
                raise FmError(f"键名不合法: {key!r}")
            if val_text is not None and val_text != "":
                value, rest = _flow(val_text, 0)
                if val_text[rest:].strip():
                    raise FmError(f"键 {key!r} 的值后有多余内容: {val_text!r}")
                i += 1
            else:
                # 无值：看下一行是否是更深缩进的块
                j = i + 1
                while j < len(lines) and not lines[j].strip():
                    j += 1
                if j < len(lines) and _indent_of(lines[j]) > indent:
                    value, i = parse_block(lines, j, _indent_of(lines[j]))
                else:
                    value, i = None, j
            result[key] = value
    return result, i


def load_doc(path: Path):
    """读取 .md，返回 (frontmatter 字典, 正文, 解析错误列表)。"""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, text, [f"{path.name}: 缺少 frontmatter 起始 ---"]
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return None, text, [f"{path.name}: frontmatter 未闭合"]
    try:
        fm, _ = parse_block([l for l in lines[1:end] if _strip_comment(l).strip()], 0, 0)
        return fm, "\n".join(lines[end + 1 :]).strip(), []
    except FmError as e:
        return None, "", [f"{path.name}: frontmatter 语法错误：{e}"]


def dump_doc(fm: dict, body: str) -> str:
    """把字典序列化回 frontmatter + 正文（verify 回写用，保持稳定键序）。"""
    out = ["---"]

    def scalar(v) -> str:
        if isinstance(v, bool):
            return "true" if v else "false"
        if isinstance(v, (int, float)):
            return str(v)
        s = str(v)
        if s == "" or re.search(r"[#\[\]{}:,\"']", s):
            return '"' + s.replace('"', '\\"') + '"'
        return s

    def dkey(k) -> str:
        """字典键引号规则（I43，I51 收紧）：键不满足 _KEY_RE 裸键白名单（含空格/冒号/斜杠/点/
        花括号/引号/逗号等）一律双引号包裹——与读端 parse_block/_flow 的裸键校验完全对称。
        报点名如「B 包点」「A 二楼 (宫殿)」「鹅位/狙位」都必须引号。"""
        k = str(k)
        if k == "" or not re.fullmatch(r"[\w\u4e00-\u9fff-]+", k):
            return '"' + k.replace('"', '\\"') + '"'
        return k

    def inline(v) -> str:
        if isinstance(v, list):
            return "[" + ", ".join(inline(x) for x in v) + "]"
        if isinstance(v, dict):
            return "{" + ", ".join(f"{dkey(k)}: {inline(x)}" for k, x in v.items()) + "}"
        return scalar(v)

    for k, v in fm.items():
        if v is None:
            continue
        if isinstance(v, dict):
            out.append(f"{k}:")
            for k2, v2 in v.items():
                out.append(f"  {dkey(k2)}: {inline(v2)}")   # I43：嵌套键同样引号（B 包点等）
        elif isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
            out.append(f"{k}:")
            for item in v:
                out.append(f"  - {inline(item)}")
        else:
            out.append(f"{k}: {inline(v)}")
    out.append("---")
    out.append("")
    if body:
        out.append(body)
    return "\n".join(out)


# ---------------- 数据读取 ----------------

def load_entries():
    entries = []
    d = ROOT / "data" / "entries"
    if d.is_dir():
        for p in sorted(d.glob("*.md")):
            fm, body, errs = load_doc(p)
            entries.append({"path": p, "fm": fm, "body": body, "errs": errs})
    return entries


def load_tactics():
    tactics = []
    d = ROOT / "tactics"
    if d.is_dir():
        for p in sorted(d.glob("*.md")):
            fm, body, errs = load_doc(p)
            tactics.append({"path": p, "fm": fm, "body": body, "errs": errs})
    return tactics


def load_callouts():
    """读互动地图报点数据。返回 (dict, 问题列表)。"""
    p = ROOT / "data" / "callouts.json"
    if not p.is_file():
        return {}, ["WARN", "data/callouts.json", "文件不存在（互动地图没有报点标注）"]
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return {}, ["ERROR", "data/callouts.json", f"JSON 解析失败：{e}"]
    problems = []
    for map_key, items in data.items():
        if map_key.startswith("_"):
            continue
        for c in items:
            if not c.get("name"):
                problems.append(["WARN", "data/callouts.json", f"{map_key} 有报点缺 name"])
            if not isinstance(c.get("u"), (int, float)) or not isinstance(c.get("v"), (int, float)) \
                    or not (0 <= c["u"] <= 1 and 0 <= c["v"] <= 1):
                problems.append(["WARN", "data/callouts.json",
                                 f"{map_key}:{c.get('name')} 的 u/v 必须是 0~1 数字"])
            if not c.get("search"):
                problems.append(["WARN", "data/callouts.json",
                                 f"{map_key}:{c.get('name')} 缺 search 关键词（点击过滤用）"])
    return data, problems


def load_maps():
    p = ROOT / "data" / "maps.json"
    if not p.is_file():
        return {}, [f"maps.json: 文件不存在（{p}）"]
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        return data, []
    except json.JSONDecodeError as e:
        return {}, [f"maps.json: JSON 解析失败：{e}"]


def find_slot_images(media_dir: Path):
    """目录里按槽位找图片文件。返回 {槽位: 相对路径}。"""
    found = {}
    if not media_dir.is_dir():
        return found
    for slot in sorted(SLOT_LABELS):
        for ext in IMG_EXTS:
            f = media_dir / f"{slot}{ext}"
            if f.is_file():
                found[slot] = f.relative_to(ROOT).as_posix()
                break
    # 扩展槽位（5-xxx 等）：按文件名排序追加
    for f in sorted(media_dir.iterdir()):
        if f.suffix.lower() not in IMG_EXTS or f.stem in SLOT_LABELS:
            continue
        if re.fullmatch(r"\d+-[a-z0-9-]+", f.stem):
            found[f.stem] = f.relative_to(ROOT).as_posix()
    return found


def all_ids(entries, tactics) -> set:
    ids = set()
    for e in entries:
        if e["fm"] and e["fm"].get("id"):
            ids.add(e["fm"]["id"])
    for t in tactics:
        if t["fm"] and t["fm"].get("id"):
            ids.add(t["fm"]["id"])
    return ids


def lint():
    """校验全部数据。返回 (问题列表, 统计)。问题 = (级别, 位置, 消息)。"""
    problems: list[tuple[str, str, str]] = []

    def add(level, where, msg):
        problems.append((level, where, msg))

    maps, errs = load_maps()
    for e in errs:
        add("ERROR", "data/maps.json", e)
    callouts, callout_problems = load_callouts()
    for level, where, msg in callout_problems:
        add(level, where, msg)
    callout_names = {
        map_key: {n for c in items for n in
                  (c.get("name", ""), re.sub(r"\s*\(.*\)$", "", c.get("name", ""))) if n}
        for map_key, items in callouts.items() if not map_key.startswith("_")
    }
    callouts_data = callouts

    entries = load_entries()
    tactics = load_tactics()
    ids = all_ids(entries, tactics)

    # ---- maps.json 结构 ----
    used_maps = set()
    for item in entries + tactics:
        if item["fm"] and isinstance(item["fm"].get("map"), str):
            used_maps.add(item["fm"]["map"])
    for key, m in maps.items():
        if not isinstance(m, dict) or not m.get("name") or not m.get("cn"):
            add("ERROR", f"maps.json:{key}", "缺少 name 或 cn 字段")
        if key in used_maps:
            radar = ROOT / (m.get("radar") or "")
            if not radar.is_file():
                add("WARN", f"maps.json:{key}", f"雷达底图缺失（{m.get('radar')}）")
            if not m.get("radar_source"):
                add("WARN", f"maps.json:{key}", "radar_source 未填（来源与许可必须登记）")

    # ---- 道具条目 ----
    today = datetime.date.today()
    draft_count = verified_count = 0
    missing_images = []  # (id, [槽位])
    set_names: dict[str, set] = {}  # I47：套装名 → 引用它的条目 id 集（重名检查与 report 统计共用）

    for e in entries:
        p, fm = e["path"], e["fm"]
        name = p.name
        for msg in e["errs"]:
            add("ERROR", name, msg)
        if fm is None:
            continue
        for field in ENTRY_REQUIRED:
            if fm.get(field) in (None, "", []):
                add("ERROR", name, f"必填字段缺失: {field}")
        if any(fm.get(f) in (None, "", []) for f in ENTRY_REQUIRED):
            continue  # 缺字段的条目不再往下校验枚举，避免刷屏
        # 枚举：注册表驱动（R1-C）——lint=="enum" 的标量字段逐个查；
        # move(enum_warn_custom)/difficulty(difficulty_enum)/phase(phase_enum) 等特例走下方专属规则
        for _f in FIELD_REGISTRY["entry"]:
            if not _f.get("enum_check"):
                continue
            field = _f["key"]
            if fm.get(field) not in ENUMS[field]:
                add("ERROR", name, f"{field} 枚举非法: {fm.get(field)!r}（允许 {ENUMS[field]}）")
        # move 允许自定义（查看器 ⚙ 设置里加的，如「蹲下」转正前的过渡）
        if fm.get("move") not in ENUMS["move"]:
            add("WARN", name, f"move 为自定义值: {fm.get('move')!r}（内置枚举外，确认是有意的）")
        phase = fm.get("phase")
        phase_vals = phase if isinstance(phase, list) else [phase]
        if any(v not in ENUMS["phase"] for v in phase_vals):
            add("ERROR", name, f"phase 枚举非法: {phase!r}")
        # id 规则（molly 别名两种拼法都认）
        if not re.fullmatch(entry_id_pattern(fm["map"], fm["side"], fm["type"]), str(fm.get("id") or "")):
            short = fm["map"][3:] if fm["map"].startswith("de_") else fm["map"]
            add("ERROR", name, f"id 不符合规则（{short}-{fm['side'].lower()}-{fm['type']}-<目标>）: {fm.get('id')!r}")
        if p.stem != fm.get("id"):
            add("ERROR", name, f"文件名 {p.stem} 与 id {fm.get('id')!r} 不一致")
        if fm["map"] not in maps:
            add("ERROR", name, f"map 未在 maps.json 登记: {fm['map']!r}")
        # difficulty（I51）：三档枚举 easy|normal|hard。数字值=迁移前旧数据，报 ERROR 并指路迁移命令
        if fm.get("difficulty") not in ENUMS["difficulty"]:
            add("ERROR", name, f"difficulty 枚举非法: {fm.get('difficulty')!r}"
                f"（允许 {ENUMS['difficulty']}；数字旧值请跑 tools\\pb.cmd migrate-difficulty）")
        # 来源署名
        src = fm.get("source")
        kind = src.get("kind") if isinstance(src, dict) else None
        if kind not in ENUMS["source.kind"]:
            add("ERROR", name, "source.kind 非法（self | video | web | friend）")
        if kind in ("video", "web"):
            if not (isinstance(src, dict) and src.get("url")):
                add("WARN", name, "video/web 来源必须记 url（署名规范）")
            if not (isinstance(src, dict) and src.get("creator")):
                add("WARN", name, "video/web 来源必须记 creator（署名规范）")
        # 状态与实测日期
        if fm.get("status") == "verified":
            verified_count += 1
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(fm.get("checked") or "")):
                add("ERROR", name, "status=verified 必须填 checked: YYYY-MM-DD（最后实测日期）")
            else:
                try:
                    days = (today - datetime.date.fromisoformat(fm["checked"])).days
                    if days > 120:
                        add("INFO", name, f"verified 已 {days} 天未复测")
                except ValueError:
                    pass
        elif fm.get("status") == "draft":
            draft_count += 1
        for uid in fm.get("related") or []:
            if uid not in ids:
                add("WARN", name, f"related 断链: {uid}")
        # 图片槽位
        imgs = find_slot_images(ROOT / "media" / fm["map"] / fm["id"])
        missing = [s for s in REQUIRED_SLOTS if s not in imgs]
        if missing:
            add("WARN", name, f"缺图槽: {', '.join(missing)}（{fm['id']}）")
            missing_images.append((fm["id"], missing))
        # 孤儿条目：无图无坐标
        if not imgs and not fm.get("coords"):
            add("WARN", name, f"孤儿条目（无图无坐标）: {fm['id']}")
        # spots 与互动地图报点表对应（与前端一致：包含即算命中，如 宫殿 ⊂ A 二楼 (宫殿)）
        known = callout_names.get(fm["map"], set())
        for s in fm.get("spots") or []:
            if not any(s == n or s in n for n in known):
                add("WARN", name, f"spots 点位 {s!r} 不在 callouts.json 的 {fm['map']} 报点表里")
        # target 支持多值（行内数组）；每个值与 spots 同口径核报点表（WARN 不阻塞）
        tvals = fm.get("target")
        tvals = tvals if isinstance(tvals, list) else [tvals]
        for t in tvals:
            if t and not any(t == n or t in n for n in known):
                add("WARN", name, f"target 点位 {t!r} 不在 callouts.json 的 {fm['map']} 报点表里")
        # I47：sets（战术包，可选）——自由中文名数组。形态问题 WARN 不卡 build
        # （套装是编辑性内容，硬 ERROR 会把使用者的「同步并打包.bat」整个挡死，同 I28 教训）
        sets_val = fm.get("sets")
        if sets_val is not None:
            if not isinstance(sets_val, list) or not all(isinstance(x, str) for x in sets_val):
                add("WARN", name, "sets 应为套装名行内数组（如 [A区爆弹, 快攻B区]）")
            else:
                for s in sets_val:
                    s2 = str(s).strip()
                    if not s2:
                        add("WARN", name, "sets 有空白套装名")
                    elif re.search(r"[,，\"']", s2):
                        add("WARN", name, f"套装名 {s!r} 含逗号/引号（条目 .md 往返会失真），建议改名")
                    else:
                        set_names.setdefault(s2, set()).add(str(fm.get("id") or ""))
        # difficulty 与投法组合常识（I51：低容错核对随三档化重写——原地直投一般到不了「困难」档）
        if fm["move"] == "stand" and fm["action"] == "direct" and fm.get("difficulty") == "hard":
            add("INFO", name, "stand+direct 却 difficulty=hard，核对是否填高")
        # I41：pin 自定义点位（pin_origin / pin_target / pin_targets）u/v 越界 WARN——只影响图层画图坐标
        def _pin_check(where, val):
            if val is None:
                return
            if isinstance(val, list) and len(val) == 2 and all(isinstance(x, (int, float)) for x in val):
                u, v = val
                if not (0 <= u <= 1 and 0 <= v <= 1):
                    add("WARN", name, f"{where} 的 u/v 应在 0~1: [{u}, {v}]")
            else:
                add("WARN", name, f"{where} 应为 [u, v] 数字数组: {val!r}")
        _pin_check("pin_origin", fm.get("pin_origin"))
        _pin_check("pin_target", fm.get("pin_target"))
        pt = fm.get("pin_targets")
        if pt is not None:
            if isinstance(pt, dict):
                for k2, v2 in pt.items():
                    _pin_check(f"pin_targets[{k2!r}]", v2)
            else:
                add("WARN", name, f"pin_targets 应为 {{报点名: [u, v]}} 行内映射: {pt!r}")

    # ---- sets 一致性（I47）----
    # 不同写法 trim + 全半角括号归一后同名 = 疑似重名套装（拼写裂组，如「A区爆弹」vs「A区爆弹(火)」
    # 手滑少字/全角括号混用）。只提示不改数据——套装名是自由中文串，统一写法由使用者定夺。
    norm_groups: dict[str, list[str]] = {}
    for raw in set_names:
        key = raw.replace("（", "(").replace("）", ")")
        norm_groups.setdefault(key, []).append(raw)
    for key, variants in sorted(norm_groups.items()):
        if len(variants) > 1:
            detail = "；".join(f"「{v}」（{len(set_names[v])} 条）" for v in variants)
            add("WARN", "sets", f"疑似重名套装（trim+全半角括号归一后同为「{key}」，防拼写裂组）: {detail}——请统一写法")

    # ---- 战术板 ----
    for t in tactics:
        p, fm = t["path"], t["fm"]
        name = p.name
        for msg in t["errs"]:
            add("ERROR", name, msg)
        if fm is None:
            continue
        for field in TACTIC_REQUIRED:
            # players/steps 允许空列表（P3 之前的待绘制状态，另有 WARN 提示）
            if fm.get(field) is None:
                add("ERROR", name, f"必填字段缺失: {field}")
        for field in ("side", "status"):
            if fm.get(field) not in ENUMS[field]:
                add("ERROR", name, f"{field} 枚举非法: {fm.get(field)!r}")
        short = str(fm.get("map", ""))[3:] if str(fm.get("map", "")).startswith("de_") else fm.get("map", "")
        if not re.fullmatch(rf"^{re.escape(short)}-[a-z0-9-]+$", str(fm.get("id") or "")):
            add("ERROR", name, f"id 不符合规则（{short}-…）: {fm.get('id')!r}")
        if p.stem != fm.get("id"):
            add("ERROR", name, f"文件名与 id 不一致: {fm.get('id')!r}")
        for uid in fm.get("uses") or []:
            if uid not in ids:
                add("ERROR", name, f"uses 断链: {uid}")
        # I39：timeline（可选字段）。内容问题一律 WARN 不卡 build——战术板是编排性内容，
        # 硬 ERROR 会把使用者的「同步并打包.bat」整个挡死（I28 教训）。
        # I41：text 可留空（显示端自动生成「起点→目标，投法」）；t 统一倒计时 "M:SS"。
        tl = fm.get("timeline")
        if tl is not None:
            if not isinstance(tl, list) or not all(isinstance(x, dict) for x in tl):
                add("WARN", name, "timeline 应为 [{t: 时间, text: 做什么, use: 道具id}] 行内数组")
            else:
                if len(tl) > 20:
                    add("WARN", name, f"timeline 超过 20 步（当前 {len(tl)} 步）")
                for k, st in enumerate(tl, 1):
                    if not isinstance(st, dict):
                        continue
                    if not str(st.get("t") or "").strip():
                        add("WARN", name, f"timeline 第 {k} 步缺 t（倒计时 M:SS，如 1:30）")
                    use = st.get("use")
                    if use and use not in ids:
                        add("WARN", name, f"timeline 第 {k} 步 use 断链: {use}")
                    role = st.get("role")
                    if role not in (None, "") and (not isinstance(role, int) or not 1 <= role <= 5):
                        add("WARN", name, f"timeline 第 {k} 步 role 应为 1-5 整数: {role!r}")
        # I41：roles（可选，≤5 项角色配置 [{name}]）。I42：出生位（spawn）已移除——
        # 残留旧值不 WARN 不 ERROR，用户保存一次该板即自然清除。
        roles = fm.get("roles")
        if roles is not None:
            if not isinstance(roles, list) or not all(isinstance(x, dict) for x in roles):
                add("WARN", name, "roles 应为 [{name: 角色名}] 行内数组")
            elif len(roles) > 5:
                add("WARN", name, f"roles 超过 5 项（当前 {len(roles)} 项）")

    total = len(entries)
    if total and draft_count / total > 0.8:
        add("INFO", "统计", f"draft 占比 {draft_count}/{total} >80%（正常：还没实测）")

    order = {"ERROR": 0, "WARN": 1, "INFO": 2}
    problems.sort(key=lambda x: (order[x[0]], x[1], x[2]))
    stats = {
        "entries": total,
        "tactics": len(tactics),
        "draft": draft_count,
        "verified": verified_count,
        "missing_images": missing_images,
        "sets": {name: len(ids) for name, ids in sorted(set_names.items())},
        "by_map": {},
    }
    # R3 批次 0：内容看板数据（地图 × status/side/type）
    by_map: dict = {}
    for e in entries:
        fm = e["fm"]
        if not fm:
            continue
        mp = str(fm.get("map", "?"))
        st = str(fm.get("status", "?"))
        d = by_map.setdefault(mp, {"total": 0, "verified": 0, "draft": 0, "side_type": {}})
        d["total"] += 1
        if st == "verified":
            d["verified"] += 1
        elif st == "draft":
            d["draft"] += 1
        sd, tp = str(fm.get("side", "?")), str(fm.get("type", "?"))
        d["side_type"][(sd, tp)] = d["side_type"].get((sd, tp), 0) + 1
    stats["by_map"] = by_map
    return problems, stats


def print_problems(problems):
    icons = {"ERROR": "[ERROR]", "WARN": "[WARN ]", "INFO": "[INFO ]"}
    for level, where, msg in problems:
        print(f"{icons[level]} {where} — {msg}")
    n = {"ERROR": 0, "WARN": 0, "INFO": 0}
    for level, _, _ in problems:
        n[level] += 1
    print(f"\n统计：{n['ERROR']} ERROR / {n['WARN']} WARN / {n['INFO']} INFO")
    return n["ERROR"]


# ---------------- build ----------------

def build_data(entries, tactics, maps, callouts):
    """组装 window.PLAYBOOK 数据结构。返回 (data, pinyin_stats)。"""
    # I37：拼音字典（纯数据文件，缺失视为空字典并 WARN）
    pydict = {}
    pydict_path = ROOT / "tools" / "pydict.json"
    if pydict_path.is_file():
        try:
            pydict = json.loads(pydict_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            print(f"[WARN ] pydict.json 解析失败（{e}），拼音索引跳过")
    uncov = set()

    def py_fields(text):
        """I37：按字段文本算 pyf（全拼）/pyi（首字母）两个数组。
        CJK 字→字典拼音（未入典保留原字符且 pyi 跳过、report WARN）；非 CJK 字母数字
        原样小写进两者；标点丢弃。"""
        pyf, pyi = [], []
        for ch in str(text or ""):
            if "\u4e00" <= ch <= "\u9fff":
                py = pydict.get(ch)
                if not py:
                    uncov.add(ch)
                    continue
                pyf.append(py)
                pyi.append(py[:1])
            elif ch.isascii() and (ch.isalnum()):
                low = ch.lower()
                pyf.append(low)
                pyi.append(low)
        return ["".join(pyf)], ["".join(pyi)]

    entry_list = []
    for e in entries:
        fm, body = e["fm"], e["body"]
        imgs = find_slot_images(ROOT / "media" / fm["map"] / fm["id"])
        images = [{"slot": s, "label": SLOT_LABELS.get(s) or EXTRA_SLOT_LABELS.get(s, s), "path": p} for s, p in sorted(imgs.items())]
        missing = [s for s in REQUIRED_SLOTS if s not in imgs]
        item = dict(fm)
        item.update({
            "throw_badge": throw_badge(fm["click"], fm["move"], fm["action"]),
            "images": images,
            "missing": missing,
            "notes": body,
        })
        # I37：拼音索引字段——[title, origin, target 展示串] 各算一组
        tgt = fm.get("target")
        tgt_disp = "/".join(tgt) if isinstance(tgt, list) else str(tgt or "")
        pyf_all, pyi_all = [], []
        for seg in (fm.get("title"), fm.get("origin"), tgt_disp):
            f1, i1 = py_fields(seg)
            pyf_all += f1
            pyi_all += i1
        item["pyf"] = pyf_all
        item["pyi"] = pyi_all
        entry_list.append(item)
    tactic_list = []
    for t in tactics:
        fm, body = t["fm"], t["body"]
        item = dict(fm)
        # 正文按 ## 分节
        sections = []
        cur = {"title": "", "lines": []}
        for line in body.splitlines():
            if line.startswith("## "):
                if cur["title"] or cur["lines"]:
                    sections.append(cur)
                cur = {"title": line[3:].strip(), "lines": []}
            elif line.strip():
                cur["lines"].append(line.strip())
        if cur["title"] or cur["lines"]:
            sections.append(cur)
        item["sections"] = sections
        tactic_list.append(item)

    maps_out = {}
    for key, m in maps.items():
        radar = ROOT / (m.get("radar") or "")
        mm = dict(m)
        mm["radar_exists"] = radar.is_file()
        maps_out[key] = mm

    # R3-L1④：报点拼音索引（name+search 别名，与条目 pyf/pyi 同法）——选点弹窗搜索支持全拼/首字母
    callouts_out = {}
    for key, pts in callouts.items():
        if key.startswith("_"):
            continue
        outs = []
        for c in pts:
            cc = dict(c)
            pyf_all, pyi_all = [], []
            for seg in [c.get("name")] + list(c.get("search") or []):
                f1, i1 = py_fields(seg)
                pyf_all += f1
                pyi_all += i1
            cc["pyf"] = pyf_all
            cc["pyi"] = pyi_all
            outs.append(cc)
        callouts_out[key] = outs

    return {
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        # 数据一致性铁律（I19）：builtAt 是浏览器暂存退役对账的基准，格式必须保持
        # YYYY-MM-DDTHH:MM:SSZ（UTC），app.js 用字符串比较判定 savedAt
        "builtAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        # R1-C：字段注册表随 build 注入——JS 侧（dump 键序/导入净化与合并/表单元数据）由此消费，
        # 加字段从六处变一处；SCHEMA 缺失时 JS 消费点 warn 并回落内置兜底
        "SCHEMA": FIELD_REGISTRY,
        "maps": maps_out,
        "entries": entry_list,
        "tactics": tactic_list,
        "callouts": callouts_out,
    }, {"entries": len(entry_list), "uncov": sorted(uncov)}


def write_build_outputs(problems, stats):
    """公共构建（I19）：生成 build/data.js + build/report.md，返回 (data, build_dir)。
    cmd_build 与 cmd_pack 共用，消除原先重复的构建段。"""
    data, pinyin = build_data(load_entries(), load_tactics(), load_maps()[0], load_callouts()[0])
    build_dir = ROOT / "build"
    build_dir.mkdir(parents=True, exist_ok=True)
    js = "window.PLAYBOOK = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
    (build_dir / "data.js").write_text(js, encoding="utf-8", newline="\n")
    report = write_report(problems, stats, pinyin)
    print(f"\n已生成 {build_dir / 'data.js'}（{len(data['entries'])} 条目 / {len(data['tactics'])} 战术板）")
    print(f"已生成 {report}")
    return data, build_dir


def bump_index_version():
    """index.html 内所有 ?v=N 统一 +1（I19 起由工具自动管理，杜绝忘 bump 的缓存事故）。
    返回新版本号；index.html 不存在时返回 None。"""
    p = ROOT / "index.html"
    if not p.is_file():
        print("[WARN ] index.html 不存在，跳过 ?v= 递增")
        return None
    text = p.read_text(encoding="utf-8")
    new_text, n = re.subn(r"(\?v=)(\d+)", lambda m: m.group(1) + str(int(m.group(2)) + 1), text)
    if not n:
        print("[WARN ] index.html 里没有找到 ?v=N，跳过递增")
        return None
    p.write_text(new_text, encoding="utf-8", newline="\n")
    v = int(re.search(r"\?v=(\d+)", new_text).group(1))
    print(f"index.html ?v= 已自动递增：{n} 处 → v={v}")
    return v


def write_report(problems, stats, pinyin=None):
    lines = ["# build report", ""]
    lines.append(f"生成时间：{datetime.datetime.now():%Y-%m-%d %H:%M:%S}")
    lines.append("")
    lines.append("## 统计")
    lines.append("")
    lines.append(f"- 道具条目：{stats['entries']} 条（draft {stats['draft']} / verified {stats['verified']}）")
    lines.append(f"- 战术板：{stats['tactics']} 块")
    lines.append("")
    lines.append("## 缺图清单")
    lines.append("")
    if stats["missing_images"]:
        for eid, slots in stats["missing_images"]:
            lines.append(f"- `{eid}`：缺 {'、'.join(SLOT_LABELS[s] for s in slots)}")
    else:
        lines.append("- 无（全部条目三槽齐全）")
    lines.append("")
    # I37：拼音索引统计（pinyin 是 {"entries": N, "uncov": [...]}，按键取值——I37 修过的解构坑）
    if pinyin:
        n_entries = pinyin.get("entries", 0)
        uncov = pinyin.get("uncov", [])
        lines.append("## 拼音索引")
        lines.append("")
        if uncov:
            lines.append(f"- 条目 {n_entries} 条；**未覆盖字符 {len(uncov)} 个：{''.join(sorted(uncov))}**（该字不参与拼音/首字母搜索，汉字搜索不受影响；请把读音补进 tools/pydict.json）")
        else:
            lines.append(f"- 条目 {n_entries} 条；字典全覆盖")
        lines.append("")
    # I47：战术包（sets）统计——各套装名 + 成员条数（套装完全由条目 sets 字段派生）
    set_stats = stats.get("sets") or {}
    lines.append("## 战术包（sets）")
    lines.append("")
    if set_stats:
        for sname, cnt in set_stats.items():
            lines.append(f"- {sname}：{cnt} 条")
    else:
        lines.append("- 无（还没有条目挂 sets 字段）")
    lines.append("")
    # R3 批次 0：内容看板（地图 × status + side × type + sets verified 数 + 转化率）
    by_map = stats.get("by_map") or {}
    lines.append("## 内容看板（R3）")
    lines.append("")
    for mp in sorted(by_map):
        d = by_map[mp]
        pct = d["verified"] * 100 // d["total"] if d["total"] else 0
        lines.append(f"### {mp}（{d['total']} 条 / verified {d['verified']} / draft {d['draft']} / {pct}%）")
        lines.append("")
        for (sd, tp) in sorted(d["side_type"]):
            lines.append(f"- {sd} {tp}：{d['side_type'][(sd, tp)]}")
        lines.append("")
    tot_e = stats.get("entries", 0)
    ver_e = sum(d["verified"] for d in by_map.values())
    if tot_e:
        lines.append(f"- **全库转化率：verified {ver_e}/{tot_e}（{ver_e * 100 // tot_e}%）**")
    else:
        lines.append("- 无条目")
    lines.append("- **套装**：" + ("；".join(f"{sname}（{cnt} 条）" for sname, cnt in set_stats.items())
                 if set_stats else "无"))
    lines.append("")
    lines.append("## 问题清单")
    lines.append("")
    if problems:
        for level, where, msg in problems:
            lines.append(f"- **{level}** {where} — {msg}")
    else:
        lines.append("- 无")
    lines.append("")
    out = ROOT / "build" / "report.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    return out


def cmd_build(_args):
    problems, stats = lint()
    print_problems(problems)
    if any(lv == "ERROR" for lv, _, _ in problems):
        print("\n存在 ERROR，终止 build（先修数据）")
        return 1
    write_build_outputs(problems, stats)
    bump_index_version()
    return 0


def cmd_lint(_args):
    problems, _ = lint()
    n_err = print_problems(problems)
    return 1 if n_err else 0


def _yaml_inline(v):
    """模板用小型行内值序列化（注册表 default/new_value 均为简单标量或标量数组）。"""
    if isinstance(v, list):
        return "[" + ", ".join(str(x) for x in v) + "]"
    return str(v)


def _template_from_registry(kind, overrides):
    """R1-C：new 模板由字段注册表生成（键序/默认值/占位/注释=cn+枚举），加字段模板自动跟随。"""
    lines = ["---"]
    for f in FIELD_REGISTRY[kind]:
        k = f["key"]
        if k in overrides:
            v = overrides[k]
        elif "new_value" in f:
            v = f["new_value"]
        elif "default" in f:
            v = f["default"]
        elif f.get("dump_empty_array"):
            v = []
        else:
            continue   # source/checked/coords/pin_*/spots 等不进模板
        comment = ""
        if f.get("enum"):
            comment = " | ".join(f"{p[0]} {p[1]}" for p in f["enum"]) + "——" + f["cn"]
        else:
            comment = f.get("cn", "")
        lines.append(f"{k}: {_yaml_inline(v)}   # {comment}" if comment else f"{k}: {_yaml_inline(v)}")
    lines.append("---")
    return "\n".join(lines)


ENTRY_TEMPLATE = None   # R1-C：由 _template_from_registry("entry", ...) 现生成（保留名字防外部引用）
TACTIC_TEMPLATE = None


def _entry_template(sid, map_, side, typ):
    body = _template_from_registry("entry", {"id": sid, "map": map_, "side": side, "type": typ})
    return body + f"""

> 待补：站位 / 瞄点 / 效果三图 → media/{map_}/{sid}/（命名 1-stand / 2-aim / 4-result）。
> 正文只写 ≤5 行注意事项（缝在哪、什么时候别用）。
"""


def _tactic_template(sid, map_, side):
    body = _template_from_registry("tactic", {"id": sid, "map": map_, "side": side})
    return body + """

## 用法

几行写清这块板的用法顺序。

## 失效条件

- 条件一：
"""

README_TXT = """双击 index.html 打开道具速查与战术板。
详细图文说明：打开网页后点右上 ⚙ 设置 → 📖 使用说明。
按 F11 全屏观感更佳；数据为静态页面，无需联网。
非商用学习项目，素材署名保留，欢迎分享给需要的 CS2 新手。
想录自己的道具：网页右上工具栏「＋ 新增道具」，图传好，改完点 ⚙ 设置 → 📤 把我的修改分享给队长，
下载的文件微信发给队长即可收进大家的册子（录完是"待验证"，队长实测后才转绿）。
你的修改存在本浏览器，换电脑/清缓存会丢——录完记得及时分享留底。
"""


def cmd_new(args):
    kind, sid = args.kind, args.id
    side, typ, map_ = args.side, args.type, args.map
    if side not in ENUMS["side"]:
        print(f"[ERROR] side 枚举非法: {side}")
        return 1
    if kind == "utility":
        if typ not in ENUMS["type"]:
            print(f"[ERROR] type 枚举非法: {typ}")
            return 1
        if not re.fullmatch(entry_id_pattern(map_, side, typ), sid):
            print(f"[ERROR] id 不符合规则：{sid}\n        应为 {map_[3:]}-{side.lower()}-{typ}-<目标>（全小写连字符）")
            return 1
        dest = ROOT / "data" / "entries" / f"{sid}.md"
        if dest.exists():
            print(f"[ERROR] 条目已存在: {dest}")
            return 1
        dest.write_text(_entry_template(sid, map_, side, typ), encoding="utf-8", newline="\n")
        media = ROOT / "media" / map_ / sid
        media.mkdir(parents=True, exist_ok=True)
        print(f"已生成条目 {dest}\n已建图片目录 {media}")
    else:
        if not re.fullmatch(rf"^{map_[3:]}-[a-z0-9-]+$", sid):
            print(f"[ERROR] id 不符合规则：{sid}\n        应为 {map_[3:]}-<名称>（全小写连字符）")
            return 1
        dest = ROOT / "tactics" / f"{sid}.md"
        if dest.exists():
            print(f"[ERROR] 战术板已存在: {dest}")
            return 1
        dest.write_text(_tactic_template(sid, map_, side), encoding="utf-8", newline="\n")
        print(f"已生成战术板 {dest}")
    return 0


def cmd_shots(args):
    src = Path(args.dir)
    if not src.is_dir():
        print(f"[ERROR] 目录不存在: {src}")
        return 1
    entries = {e["fm"]["id"]: e for e in load_entries() if e["fm"]}
    imgs = [p for p in sorted(src.iterdir())
            if p.is_file() and p.suffix.lower() in tuple(IMG_EXTS) + (".jpeg", ".jpg")]
    if not imgs:
        print("[WARN] 目录里没有图片: ", src)
        return 0
    # 文件名识别：<id>_<槽位>.<ext> 直接入座；认不出的按修改时间顺序配给 --id
    plan = []  # (path, entry_id, slot, overwrite)
    named, unnamed = [], []
    for p in imgs:
        m = re.match(r"([\w-]+)_(\d+-[a-z0-9-]+)\.(png|jpg|jpeg|webp)$", p.name, re.I)
        if m and m.group(1) in entries:
            named.append((p, m.group(1), m.group(2)))
        else:
            unnamed.append(p)
    for p, eid, slot in named:
        plan.append((p, eid, slot))
    if args.id:
        eid = args.id
        if eid not in entries:
            print(f"[ERROR] 找不到条目 id: {eid}")
            return 1
        order = REQUIRED_SLOTS + sorted(EXTRA_SLOT_LABELS)
        if entries[eid]["fm"].get("type") == "flash":
            order = ["2-aim"] + [s for s in order if s != "2-aim"]
        unnamed.sort(key=lambda x: x.stat().st_mtime)
        for i, p in enumerate(unnamed):
            plan.append((p, eid, order[i % len(order)]))
    elif unnamed:
        for p in unnamed:
            print(f"[WARN] 认不出（既无 <id>_槽位 命名，也没给 --id）: {p.name}")
    # 槽位已满提示
    used = {}
    for _, eid, slot in plan:
        used.setdefault(eid, set()).add(slot)
    for eid, slots in used.items():
        fm = entries[eid]["fm"]
        have = set(find_slot_images(ROOT / "media" / fm["map"] / eid))
        for s in slots:
            if s in have:
                print(f"[WARN] {s}：条目 {eid} 槽位已满，未分配")
    if args.dry_run:
        print("— dry-run 计划 —")
        for p, eid, slot in plan:
            tag = "覆盖(存.bak)" if slot in find_slot_images(ROOT / "media" / entries[eid]["fm"]["map"] / eid) else "新 增"
            print(f"  {p.name}  →  {eid}   [{slot}] {tag}")
        print(f"共 {len(plan)} 个文件待复制（未实际执行）")
        return 0
    n = 0
    for p, eid, slot in plan:
        fm = entries[eid]["fm"]
        dest_dir = ROOT / "media" / fm["map"] / eid
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / f"{slot}{p.suffix.lower()}"
        if dest.exists():
            bak = dest.with_suffix(dest.suffix + ".bak")
            bak.write_bytes(dest.read_bytes())
            print(f"[备份] {dest.name} → {bak.name}")
        dest.write_bytes(p.read_bytes())
        print(f"[归位] {p.name} → {dest.relative_to(ROOT)}")
        n += 1
    print(f"\n完成：{n} 个文件已归位（原文件未搬动）")
    return 0


def cmd_pack(_args):
    problems, stats = lint()
    print_problems(problems)
    if any(lv == "ERROR" for lv, _, _ in problems):
        print("\n存在 ERROR，终止 pack（先修数据）")
        return 1
    data, build_dir = write_build_outputs(problems, stats)
    stamp = datetime.date.today().strftime("%Y%m%d")
    dist = ROOT / "dist"
    dist.mkdir(parents=True, exist_ok=True)
    zip_path = dist / f"cs2-playbook-{stamp}.zip"
    if zip_path.exists():
        zip_path.unlink()
    n = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        def add(src: Path, arc: str):
            nonlocal n
            if src.is_file():
                z.write(src, arc)
                n += 1
        add(ROOT / "index.html", "cs2-playbook/index.html")
        add(ROOT / "help.html", "cs2-playbook/help.html")
        for sub in ("js", "css", "icons", "radar"):
            for p in sorted((ROOT / "assets" / sub).glob("*")):
                add(p, f"cs2-playbook/assets/{sub}/{p.name}")
        add(build_dir / "data.js", "cs2-playbook/build/data.js")
        for p in sorted((ROOT / "media").rglob("*")):
            if p.is_file() and ".bak" not in p.name:
                add(p, "cs2-playbook/" + p.relative_to(ROOT).as_posix())
        z.writestr("cs2-playbook/使用说明.txt", README_TXT)
        n += 1
    size_mb = zip_path.stat().st_size / 1048576
    print(f"\n发布包已生成：{zip_path}（{n} 个文件，{size_mb:.1f} MB）")
    print("解压后双击 index.html 即可用，无需任何环境。")
    return 0


def cmd_migrate_difficulty(_args):
    """I51 一次性迁移：difficulty 数字（1-5）→ 三档枚举（1-2→easy / 3→normal / 4-5→hard）。
    每个写回前存 .bak（项目惯例）；缺失/非数字/越界的列出清单人工确认，不静默改。
    已是合法枚举的跳过（幂等，可重复执行）。"""
    changed = clean = 0
    manual = []
    for e in load_entries():
        fm, p = e["fm"], e["path"]
        if fm is None:
            manual.append((p.name, "frontmatter 解析失败，请人工检查"))
            continue
        v = fm.get("difficulty")
        if isinstance(v, str) and v in ENUMS["difficulty"]:
            clean += 1
            continue
        if isinstance(v, bool) or not isinstance(v, int):
            manual.append((p.name, f"difficulty={v!r}（缺失/非整数），请人工确认后手改"))
            continue
        if v not in DIFF_MIGRATE:
            manual.append((p.name, f"difficulty={v!r}（越界 1-5），请人工确认"))
            continue
        target = DIFF_MIGRATE[v]
        bak = p.with_suffix(p.suffix + ".bak")
        bak.write_bytes(p.read_bytes())
        fm["difficulty"] = target
        p.write_text(dump_doc(fm, e["body"]), encoding="utf-8", newline="\n")
        changed += 1
        print(f"[迁移] {p.name}: {v} → {target}（备份 {bak.name}）")
    for fname, why in manual:
        print(f"[待人工] {fname} — {why}")
    print(f"\n完成：迁移 {changed} 条 / 已是枚举 {clean} 条 / 待人工 {len(manual)} 条")
    return 1 if manual else 0


def cmd_test(_args):
    """R1-A：回归测试套件（tools/tests/run_tests.py，playwright 可选依赖）。
    环境缺失时打印跳过原因并以 0 退出——零依赖约束只管运行时，测试工具可选。"""
    runner = ROOT / "tools" / "tests" / "run_tests.py"
    if not runner.is_file():
        print("[ERROR] tools/tests/run_tests.py 不存在")
        return 1
    try:
        import playwright  # noqa: F401
    except ImportError:
        print("[SKIP] playwright 未安装（可选依赖，不影响 bat/发布）")
        print("       安装：pip install playwright -i https://pypi.tuna.tsinghua.edu.cn/simple")
        print("             python -m playwright install chromium")
        return 0
    import subprocess
    r = subprocess.run([sys.executable, "-X", "utf8", str(runner), "--root", str(ROOT)])
    return r.returncode


def cmd_verify(args):
    entries = {e["fm"]["id"]: e for e in load_entries() if e["fm"]}
    e = entries.get(args.id)
    if not e:
        print(f"[ERROR] 找不到 id: {args.id}")
        return 1
    target, ask = ("broken", "确认该条目已失效（版本更新/点位改动）？") if args.broken \
        else ("verified", "确认你已亲自进游戏实测复现？")
    fm = e["fm"]
    print(f"条目：{args.id} — {fm.get('title', '')}")
    print(f"当前状态：{fm.get('status')}（{STATUS_CN.get(fm.get('status'), '')}）")
    answer = input(f"目标状态：{target} [y/N] ").strip().lower()
    if answer != "y":
        print("已取消——没有实测确认不会改状态。")
        return 0
    fm["status"] = target
    if target == "verified":
        fm["checked"] = datetime.date.today().isoformat()
    elif "checked" in fm:
        del fm["checked"]
    dest = e["path"]
    dest.write_text(dump_doc(fm, e["body"]), encoding="utf-8", newline="\n")
    print(f"已更新 {dest.name}")
    return 0


def main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(prog="pb", description="CS2 Playbook 工具链（纯标准库）")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("lint", help="校验所有条目/战术板")
    sub.add_parser("build", help="校验 + 生成 build/data.js + build/report.md")
    p_new = sub.add_parser("new", help="生成条目/战术板模板")
    p_new.add_argument("kind", choices=["utility", "tactic"])
    p_new.add_argument("id")
    p_new.add_argument("--side", default="T")
    p_new.add_argument("--type", dest="type", default="smoke")
    p_new.add_argument("--map", default="de_mirage")
    p_shots = sub.add_parser("shots", help="截图批量归位")
    p_shots.add_argument("dir")
    p_shots.add_argument("--id")
    p_shots.add_argument("--dry-run", action="store_true")
    sub.add_parser("pack", help="生成发布包 dist/cs2-playbook-YYYYMMDD.zip")
    p_verify = sub.add_parser("verify", help="实测确认后置 verified（或 --broken）")
    p_verify.add_argument("id")
    p_verify.add_argument("--broken", action="store_true", help="标记失效（内容过时/版本改动），防止重复录入")
    sub.add_parser("migrate-difficulty", help="I51 一次性迁移：difficulty 数字 1-5 → easy/normal/hard（每文件存 .bak）")
    sub.add_parser("test", help="R1-A 回归测试套件（playwright 可选依赖，缺失时优雅跳过）")
    args = ap.parse_args(argv)
    return {"lint": cmd_lint, "build": cmd_build, "new": cmd_new, "shots": cmd_shots,
            "pack": cmd_pack, "verify": cmd_verify, "migrate-difficulty": cmd_migrate_difficulty,
            "test": cmd_test}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
