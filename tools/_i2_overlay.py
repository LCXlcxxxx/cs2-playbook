# ITER-I2 工具：为每张图生成「官方雷达 + 草稿报点」叠加图（核对用）
# 用法：python -X utf8 tools/_i2_overlay.py [map ...]（缺省生成全部 7 张草稿图）
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "_i2"
LABELS = OUT / "labels"
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FONT = "C\\:/Windows/Fonts/simhei.ttf"

MAPS = ["de_dust2", "de_inferno", "de_ancient", "de_train",
        "de_overpass", "de_anubis", "cs_office"]

def gen_overlay(map_key):
    callouts = json.load(open(ROOT / "data" / "callouts.json", encoding="utf-8"))[map_key]
    radar = ROOT / "assets" / "radar" / f"{map_key}.png"
    out = OUT / f"overlay_{map_key}.png"
    LABELS.mkdir(parents=True, exist_ok=True)

    filters = []
    for i, c in enumerate(callouts):
        tf = LABELS / f"{map_key}_{i}.txt"
        tf.write_text(c["name"], encoding="utf-8")
        u, v = c["u"], c["v"]
        filters.append(
            f"drawtext=fontfile='{FONT}':textfile='{tf.relative_to(ROOT).as_posix()}'"
            f":x='{u}*main_w-text_w/2':y='{v}*main_h-text_h/2'"
            f":fontsize=20:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=3"
        )
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-i", str(radar),
           "-vf", ",".join(filters), str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        print(f"[FAIL] {map_key}: {r.stderr[:300]}")
        return False
    print(f"[ok] {out.relative_to(ROOT)}  ({len(callouts)} 点)")
    return True

if __name__ == "__main__":
    maps = sys.argv[1:] or MAPS
    for m in maps:
        gen_overlay(m)
