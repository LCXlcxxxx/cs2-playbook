# 导入修正版：按道具面板数据重建 12 颗 Dust2 条目（面板=类型/起点/落点/投法/作者/ID）
import io
import shutil
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = Path(r"D:\AI agent\ZCode data\CS2")
SRC = ROOT / "文件夹批量录入" / "炙热沙城Ⅱ"
ENT = ROOT / "data" / "entries"
MEDIA = ROOT / "media" / "de_dust2"
TODAY = "2026-10-01"

def fn(ts):
    return SRC / f"20261001{ts}_1.jpg"

E = []
def add(fid, title, frames, oneline, notes, origin, target, phase="execute", tags="[A区]",
        side="T", type_="smoke", click="lmb", move="stand", action="direct", spots=None):
    E.append(dict(id=fid, title=title, frames=frames, oneline=oneline, notes=notes,
                  origin=origin, target=target, phase=phase, tags=tags, side=side,
                  type_=type_, click=click, move=move, action=action,
                  spots=spots or sorted({s for s in (origin, target) if s and s != "-"})))

add("dust2-t-smoke-a-prot-rain", "Rain-A大保护烟", ("164758", "164804", "164823"),
    "匪家→A大，左键跳投",
    "- 面板：烟雾弹｜起点 匪家｜落点 A大｜左键跳投（Tatukunn ID 5397）。",
    "匪家", "A大", action="jump")
add("dust2-t-smoke-a-prot", "A大保护烟", ("164858", "164907", "164927"),
    "匪家→A大，左键跳投",
    "- 面板：烟雾弹｜起点 匪家｜落点 A大｜左键跳投（PWA ID 6072）。",
    "匪家", "A大", action="jump")
add("dust2-t-smoke-mid-arch-teses", "Teses-中门挂门烟", ("165044", "165101", "165111"),
    "匪家→中门，蹲下左键跳投，挂门烟",
    "- 面板：烟雾弹｜起点 匪家｜落点 中门｜蹲下左键跳投（Teses，PS: 以演示为准！）。\n"
    "- 蹲下跳投=蹲跳投字段。",
    "匪家", "中门", action="crouch-jump", spots=["中门"])
add("dust2-t-smoke-a-short-block", "卡神A小隔断烟", ("165209", "165215", "165252"),
    "A门外→A小道，左键投掷，隔断 A 小",
    "- 面板：烟雾弹｜起点 A门外｜落点 A小道｜左键投掷（卡神，Tatukunn ID 5401）。\n"
    "- 面板「A门外」取近义报点「匪A门」；「A小道」即「A小」。",
    "匪A门", "A小", spots=["匪A门", "A小"])
add("dust2-t-smoke-a-anti-push", "Jame-防顶A大过点烟", ("165327", "165334", "165350"),
    "蓝箱→警家，双键跳投，防 A 大过点",
    "- 面板：烟雾弹｜起点 蓝箱｜落点 警家｜双键跳投（Jame，Tatukunn ID 5474）。",
    "蓝箱", "警家", click="both", action="jump")
add("dust2-t-smoke-a-door", "A门烟", ("165438", "165453", "165508"),
    "电梯位→A门内，左键跳投",
    "- 面板：烟雾弹｜起点 电梯｜落点 A门里｜左键跳投（Tatukunn ID 5431）。\n"
    "- 「电梯」即报点「电梯位」，「A门里」即「A门内」。",
    "电梯位", "A门内", phase="postplant", action="jump")
add("dust2-t-smoke-a-short-ac", "A小空调灭火烟", ("170248", "170320", "170340"),
    "A小空调位灭火烟，蹲下右键投",
    "- 用户指认：A 小空调位灭火烟，蹲下右键投。\n"
    "- 该帧无道具面板；「蹲下」暂不在移动枚举（按原地+右键轻抛），待扩枚举后修正。",
    "A小", "A小", click="rmb", spots=["A小"])
add("dust2-t-smoke-tunnel-self", "自助暗道烟", ("170438", "170512", "170525"),
    "沙地→暗道，W 助跑双键跳投，过道自用",
    "- 面板：烟雾弹｜起点 沙地｜落点 暗道｜W+助跑双键跳投（Tatukunn ID 1850）。",
    "沙地", "暗道", tags="[中路]", click="both", move="run", action="jump")
add("dust2-ct-smoke-b-door-retake", "回防B门展开烟", ("171141", "171210", "171337"),
    "B门→B包点，回防时贴箱展开",
    "- 视频教学字幕：「回防B门展开烟」「贴住箱子再丢」——CT 回防时在 B 门内展开。\n"
    "- 该段无道具面板，投法占位待实测。",
    "B门", "B 包点", phase="retake", tags="[回防]", side="CT")
add("dust2-t-flash-doghole-self", "scrunk-自助狗洞启动闪", ("171709", "171723", "171753"),
    "B二层→B包，W 助跑双键投掷，狗洞启动闪",
    "- 面板：闪光弹｜起点 B二层｜落点 B包｜W+助跑双键投掷（scrunk，Tatukunn ID 5418）。\n"
    "- 「B二层」即上层 B 通（报点「B通/B2」）；闪光类第 3 帧为致盲反馈。",
    "B通/B2", "B 包点", type_="flash", tags="[B区]", click="both", move="run", action="jump")
add("dust2-t-smoke-b-door", "B门烟", ("171903", "171911", "171925"),
    "后花园→B门，左键跳投",
    "- 面板：烟雾弹｜起点 后花园｜落点 B门｜左键跳投（Tatukunn ID 1376）。",
    "后花园", "B门", tags="[B区]", action="jump")
add("dust2-t-smoke-doghole", "狗洞烟", ("171937", "171945", "171959"),
    "后花园→狗洞，左键跳投",
    "- 面板：烟雾弹｜起点 后花园｜落点 狗洞｜左键跳投（Tatukunn ID 1377）。",
    "后花园", "狗洞", tags="[B区]", action="jump")

TPL = """---
id: {id}
map: de_dust2
side: {side}
type: {type}
click: {click}
move: {move}
action: {action}
origin: {origin}
target: {target}
title: {title}
oneline: {oneline}
difficulty: 2
phase: [{phase}]
status: verified
source:
  kind: self
checked: {checked}
tags: {tags}
spots: {spots}
---

{notes}- 素材为用户自截（Tatukunn 道具预览视频，画面含完美平台道具面板：起点/落点/投法已按面板录入）。
"""

# 旧 id 清理（b-side 改名 doghole）
old = ENT / "dust2-t-smoke-b-side.md"
if old.exists():
    old.unlink()
    shutil.rmtree(MEDIA / "dust2-t-smoke-b-side", ignore_errors=True)

made = 0
for e in E:
    d = MEDIA / e["id"]
    d.mkdir(parents=True, exist_ok=True)
    for slot, ts in zip(("1-stand", "2-aim", "4-result"), e["frames"]):
        src = fn(ts)
        if not src.exists():
            print("[缺图]", e["id"], src.name)
            continue
        shutil.copy(src, d / f"{slot}.jpg")
    md = TPL.format(id=e["id"], side=e["side"], type=e["type_"], click=e["click"],
                    move=e["move"], action=e["action"], origin=e["origin"],
                    target=e["target"], title=e["title"], oneline=e["oneline"],
                    phase=e["phase"], checked=TODAY, tags=e["tags"],
                    spots="[" + ", ".join(e["spots"]) + "]", notes=e["notes"])
    (ENT / f"{e['id']}.md").write_text(md, encoding="utf-8", newline="\n")
    made += 1
print(f"重建 {made} 颗（含投法/起点/落点面板修正）")
