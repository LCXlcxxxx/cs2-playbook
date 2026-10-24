# ITER-I2 任务 C：Nuke / Vertigo 上下层纵向拼接（含白色分隔带与中文字标）
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FONT = "C\\:/Windows/Fonts/simhei.ttf"
mp = Path("data/maps.json")
maps = json.loads(mp.read_text(encoding="utf-8"))

JOBS = [
    ("de_nuke", "de_nuke_lower", "de_nuke_combined.png", "上层 外场/A", "下层 B 点"),
    ("de_vertigo", "de_vertigo_lower", "de_vertigo_combined.png", "大厦上层", "大厦下层"),
]

for top, lower, out_name, top_label, lower_label in JOBS:
    top_p = ROOT / "assets" / "radar" / f"{top}.png"
    low_p = ROOT / "assets" / "radar" / f"{lower}.png"
    out_p = ROOT / "assets" / "radar" / out_name

    base = (
        f"[0][1]vstack,drawbox=x=0:y=ih/2-7:w=iw:h=14:color=white@0.9:t=fill"
    )
    # 尝试加中文字标（drawtext 对 simhei 可用时）；失败则退回纯分隔带
    with_label = (
        base
        + f",drawtext=fontfile='{FONT}':text='{top_label}':x=24:y=24"
          f":fontsize=44:fontcolor=white@0.95:box=1:boxcolor=black@0.55:boxborderw=8"
        + f",drawtext=fontfile='{FONT}':text='{lower_label}':x=24:y=main_h/2+40"
          f":fontsize=44:fontcolor=white@0.95:box=1:boxcolor=black@0.55:boxborderw=8"
    )
    for vf, tag in ((with_label, "带字标"), (base, "纯分隔带")):
        r = subprocess.run(
            [FFMPEG, "-y", "-loglevel", "error", "-i", str(top_p), "-i", str(low_p),
             "-filter_complex", vf, str(out_p)],
            capture_output=True, text=True, timeout=300,
        )
        if r.returncode == 0:
            print(f"[ok] {out_name}（{tag}）")
            break
        print(f"[retry] {out_name} {tag} 失败: {r.stderr.strip()[:160]}")
    else:
        print(f"[FAIL] {out_name}")
        continue

    # maps.json 指向拼接图
    m = maps[top]
    m["radar"] = f"assets/radar/{out_name}"
    src = m.get("radar_source") or {}
    note = "上下层纵向拼接图（白色分隔带，原始单层图保留溯源）"
    if isinstance(src, dict):
        src["note"] = note
    else:
        m["radar_source"] = {"note": note}

mp.write_text(json.dumps(maps, ensure_ascii=False, indent=2), encoding="utf-8")
print("maps.json 已更新")
