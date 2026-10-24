# QQ 竖屏截图批量裁黑边 + 按槽位归位（--place 时才归位）
import io
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ff = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"D:\AI agent\ZCode data\CS2\文件夹批量录入\炙热沙城Ⅱ")
CROP_DIR = Path(r"D:\AI agent\ZCode data\CS2\build\_i2\dust2_crops")
CROP_DIR.mkdir(parents=True, exist_ok=True)

# 实测矩形微调：左缘放宽 5px（845:1109:875:108 → 850:1109:870:108）
W, H, X, Y = 850, 1109, 870, 108

PLACE = "--place" in sys.argv

# 三颗火分组（已逐张目验确认，2026-10-01）
# 火1 B 门火：B 洞口开镜出手，烧 B 门墙前两个老六位（141508 为敌方位展示帧）
# 火2 中门后火：抵叉箱瞄墙棱，火越门顶烧门后（141635 为叉箱/X箱后电刃演示帧）
# 火3 二箱后/L 位火：A 大坑第一级台阶，瞄污渍左边
GROUPS = {
    "dust2-t-molotov-b-door": {
        "1-stand": "QQ20261001-141508.jpg",   # 敌方老六位展示（非投掷站位）
        "2-aim": "QQ20261001-141534.jpg",
        "4-result": "QQ20261001-141551.jpg",
    },
    "dust2-t-molotov-mid-doors": {
        "5-demo": "QQ20261001-141635.jpg",   # 叉箱（X箱）后老六位电刃演示
        "2-aim": "QQ20261001-141645.jpg",
        "4-result": "QQ20261001-141744.jpg",
    },
    "dust2-t-molotov-boxes-l": {
        "1-stand": "QQ20261001-141819.jpg",
        "2-aim": "QQ20261001-141835.jpg",
        "4-result": "QQ20261001-141902.jpg",
    },
}

ok = fail = 0
for f in sorted(SRC.glob("QQ*.jpg")):
    out = CROP_DIR / f.name
    r = subprocess.run(
        [ff, "-y", "-loglevel", "error", "-i", str(f),
         "-vf", f"crop={W}:{H}:{X}:{Y}", "-q:v", "3", str(out)],
        capture_output=True, timeout=60,
    )
    if r.returncode == 0:
        ok += 1
    else:
        fail += 1
        print("[FAIL]", f.name, r.stderr.decode(errors="replace")[:150])
print(f"裁剪完成 {ok} 张，失败 {fail} 张")

if PLACE:
    media_root = Path(r"D:\AI agent\ZCode data\CS2\media\de_dust2")
    for eid, slots in GROUPS.items():
        d = media_root / eid
        d.mkdir(parents=True, exist_ok=True)
        for slot, fname in slots.items():
            src = CROP_DIR / fname
            dst = d / f"{slot}.jpg"
            src.replace(dst)
            print(f"  {eid}/{slot}.jpg ← {fname}")
    print("归位完成")
