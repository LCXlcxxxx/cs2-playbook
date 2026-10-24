# 36 张道具信息面板裁片 + 按组拼图
import io
import subprocess
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import imageio_ffmpeg

ff = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"D:\AI agent\ZCode data\CS2\文件夹批量录入\炙热沙城Ⅱ")
CROPS = Path(r"D:\AI agent\ZCode data\CS2\build\_i17\panels")
CROPS.mkdir(parents=True, exist_ok=True)
OUT = Path(r"D:\AI agent\ZCode data\CS2\build\_i17")

GROUPS = {
    "g1": [f"2026100116{n}_1.jpg" for n in (
        "4758", "4804", "4823", "4858", "4907", "4927", "5044", "5101",
        "5111", "5209", "5215", "5252", "5327", "5334", "5350", "5438", "5453", "5508")],
    "g2": ["20261001170248_1.jpg", "20261001170320_1.jpg", "20261001170340_1.jpg",
           "20261001170438_1.jpg", "20261001170512_1.jpg", "20261001170525_1.jpg"],
    "g3": ["20261001171141_1.jpg", "20261001171210_1.jpg", "20261001171337_1.jpg"],
    "g4": ["20261001171709_1.jpg", "20261001171723_1.jpg", "20261001171753_1.jpg",
           "20261001171903_1.jpg", "20261001171911_1.jpg", "20261001171925_1.jpg",
           "20261001171937_1.jpg", "20261001171945_1.jpg", "20261001171959_1.jpg"],
}

def run(args):
    return subprocess.run([ff, "-y", "-loglevel", "error"] + args, capture_output=True, timeout=60)

def stack_h(tiles, out, h):
    inputs = []
    for t in tiles:
        inputs += ["-i", str(t)]
    fc = ";".join(f"[{i}:v]scale=-1:{h}[s{i}]" for i in range(len(tiles)))
    fc += ";" + "".join(f"[s{i}]" for i in range(len(tiles))) + f"hstack=inputs={len(tiles)}"
    return run(inputs + ["-filter_complex", fc, "-frames:v", "1", str(out)]).returncode == 0

for g, files in GROUPS.items():
    tiles = []
    for k, f in enumerate(files, 1):
        dst = CROPS / f"{g}_{k:02d}.png"
        r = run(["-i", str(SRC / f), "-vf", "crop=470:170:720:990", str(dst)])
        if r.returncode:
            print("[fail]", f)
            continue
        tiles.append(dst)
    # 每组：3 列竖排拼（面板文字大，3 列×N 行清晰）
    rows = [tiles[i:i + 3] for i in range(0, len(tiles), 3)]
    ri = 0
    row_imgs = []
    for row in rows:
        rp = OUT / f"_prow_{g}_{ri}.png"
        # 竖排每列（面板竖着叠更易读）：直接单行 hstack，行高 220
        if stack_h(row, rp, 220):
            row_imgs.append(rp)
        ri += 1
    if row_imgs:
        inputs = []
        for rp in row_imgs:
            inputs += ["-i", str(rp)]
        fc = ";".join(f"[{i}:v]scale=2280:-2[s{i}]" for i in range(len(row_imgs)))
        fc += ";" + "".join(f"[s{i}]" for i in range(len(row_imgs))) + f"vstack=inputs={len(row_imgs)}"
        r = run(inputs + ["-filter_complex", fc, "-frames:v", "1", str(OUT / f"{g}_panels.png")])
        print(g, "rc=", r.returncode)
        for rp in row_imgs:
            rp.unlink()
