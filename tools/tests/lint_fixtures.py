# -*- coding: utf-8 -*-
"""R1-C 临时夹具：在 data/entries 造触发全部 lint 规则的临时条目 + 快照 lint 输出。
用法：python -X utf8 build/_lint_fixture.py create|snapshot|clean
夹具 id 用 9x 号段，用后即删。"""
import io
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\AI agent\ZCode data\CS2")
E = ROOT / "data" / "entries"

FIX = {
    # 必填缺失（缺 oneline）——触发「缺字段跳过后续枚举校验」分支
    "mirage-t-smoke-97.md": """---
id: mirage-t-smoke-97
map: de_mirage
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 沙袋
target: Jungle
title: R1C夹具-缺oneline
difficulty: 3
phase: [default]
status: draft
---

夹具正文
""",
    # 枚举全错 + 自定义 move + phase 非法 + 数字难度 + stand+direct hard INFO
    "mirage-t-smoke-96.md": """---
id: mirage-t-smoke-96
map: de_mirage
side: XX
type: smoke
click: 中键
move: 蹲跳
action: 平抛
origin: 沙袋
target: Jungle
title: R1C夹具-枚举错
oneline: 测试
difficulty: 5
phase: [notaphase]
status: gone
---

夹具正文
""",
    # id 不合规则
    "mirage-t-smoke-95.md": """---
id: mirage-t-smoke-BAD.ID
map: de_mirage
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 沙袋
target: Jungle
title: R1C夹具-id坏
oneline: 测试
difficulty: 3
phase: [default]
status: draft
---

夹具正文
""",
    # map 未登记
    "mirage-ct-flash-90.md": """---
id: mirage-ct-flash-90
map: de_nowhere
side: CT
type: flash
click: lmb
move: stand
action: direct
origin: 匪家
target: A 包点
title: R1C夹具-地图未登记
oneline: 测试
difficulty: 2
phase: [default]
status: draft
---

夹具正文
""",
    # verified 缺 checked + video 缺署名 + related 断链 + spots/target 悬空 + sets 含逗号
    "dust2-t-smoke-97.md": """---
id: dust2-t-smoke-97
map: de_dust2
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 不存在的报点AAA
target: 不存在的报点BBB
title: R1C夹具-验证链
oneline: 测试
difficulty: 3
phase: [default]
status: verified
sets: ["含,逗号"]
spots: [悬空点位XXX]
related: [dust2-t-smoke-not-exist]
source:
  kind: video
---

夹具正文
""",
    # sets 形态坏 + sets 重名（全半角括号归一）+ pin 越界/形态 + 常识 INFO（stand+direct hard）
    "dust2-t-smoke-96.md": """---
id: dust2-t-smoke-96
map: de_dust2
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 匪家
target: 中路
title: R1C夹具-sets与pin
oneline: 测试
difficulty: hard
phase: [default]
status: draft
sets: [测A包(一)]
pin_origin: [1.5, 0.2]
pin_targets: 不是字典
---

夹具正文
""",
    "dust2-t-smoke-95.md": """---
id: dust2-t-smoke-95
map: de_dust2
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 匪家
target: 中路
title: R1C夹具-sets重名
oneline: 测试
difficulty: 3
phase: [default]
status: draft
sets: [测A包（一）]
---

夹具正文
""",
    # verified 超 120 天未复测 INFO
    "dust2-t-smoke-93.md": """---
id: dust2-t-smoke-93
map: de_dust2
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 匪家
target: 中路
title: R1C夹具-复测过期
oneline: 测试
difficulty: 3
phase: [default]
status: verified
checked: 2020-01-01
sets: 不是数组
pin_target: [0.2]
source:
  kind: self
  creator: 自己
---

夹具正文
""",
    # frontmatter 语法错误（键名非法）
    "dust2-t-smoke-94.md": """---
id: dust2-t-smoke-94
map: de_dust2
side: T
type: smoke
click: lmb
move: stand
action: direct
origin: 匪家
target: 中路
title: R1C夹具-语法错
oneline: 测试
difficulty: 3
phase: [default]
status: draft
坏键.X: 1
---

夹具正文
""",
}

TACTIC_FIX = {
    # 战术板：id 坏 + status 坏 + uses 断链 + timeline 缺 t/role 越界 + roles 形态 + side 缺
    "dust2-plan-98.md": """---
id: DUST2-PLAN-98
side: XX
title: R1C夹具-战术板
window: 整局
status: forever
uses: [dust2-t-smoke-not-exist]
roles: [不是字典]
timeline:
  - {text: 缺t步骤, role: 9}
---

## 要点
夹具正文
""",
}


def create():
    for name, text in FIX.items():
        (E / name).write_text(text, encoding="utf-8", newline="\n")
    for name, text in TACTIC_FIX.items():
        (ROOT / "tactics" / name).write_text(text, encoding="utf-8", newline="\n")
    print(f"created {len(FIX) + len(TACTIC_FIX)} fixtures")


def clean():
    n = 0
    for name in {**FIX, **TACTIC_FIX}:
        for d in (E, ROOT / "tactics"):
            p = d / name
            if p.exists():
                p.unlink()
                n += 1
    print(f"removed {n} fixtures")


def snapshot(tag):
    r = subprocess.run([sys.executable, "-X", "utf8", str(ROOT / "tools" / "pb.py"), "lint"],
                       capture_output=True, text=True, cwd=str(ROOT))
    out = ROOT / "build" / "_tests" / f"lint_{tag}.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(r.stdout, encoding="utf-8")
    print(f"snapshot -> {out}（{len(r.stdout.splitlines())} 行，exit={r.returncode}）")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"create": create, "clean": clean, "snapshot": lambda: snapshot(sys.argv[2])}[cmd]()
