# g2/g3 水印拼图重跑：裁片检查 + 单行 hstack + copy
import io
import subprocess
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import imageio_ffmpeg

ff = imageio_ffmpeg.get_ffmpeg_exe()
SRC = Path(r"D:\AI agent\ZCode data\CS2\文件夹批量录入\炙热沙城Ⅱ")
OUT = Path(r"D:\AI agent\ZCode data\CS2\build\_i17")
CROPS = OUT / "crops"

GROUPS = {
    "g2_1702": ["20261001170248_1.jpg", "20261001170320_1.jpg", "20261001170340_1.jpg",
                "20261001170438_1.jpg", "20261001170512_1.jpg", "20261001170525_1.jpg"],
    "g3_1711": ["20261001171141_1.jpg", "20261001171210_1.jpg", "20261001171337_1.jpg"],
}

def run(args):
    return subprocess.run([ff, "-y", "-loglevel", "error"] + args, capture_output=True, timeout=60)

for g, files in GROUPS.items():
    tiles = []
    for k, f in enumerate(files, 1):
        dst = CROPS / f"{g}_{k:02d}_w.png"
        if not dst.exists():
            r = run(["-i", str(SRC / f), "-vf", "crop=480:130:0:300,scale=480:-1", str(dst)])
            if r.returncode:
                print("[裁失败]", f, r.stderr.decode(errors="replace")[-150:])
                continue
        tiles.append(dst)
    print(g, "裁片", len(tiles), "张")
    if not tiles:
        continue
    final = OUT / f"{g}_wm.png"
    if len(tiles) == 1:
        shutil_copy = tiles[0].read_bytes()
        final.write_bytes(shutil_copy)
        print(g, "copied 1")
        continue
    inputs = []
    for t in tiles:
        inputs += ["-i", str(t)]
    fc = ";".join(f"[{i}:v]scale=-1:60[s{i}]" for i in range(len(tiles)))
    fc += ";" + "".join(f"[s{i}]" for i in range(len(tiles))) + f"hstack=inputs={len(tiles)}"
    r = run(inputs + ["-filter_complex", fc, "-frames:v", "1", str(final)])
    print(g, "hstack rc=", r.returncode)
    if r.returncode:
        print("  ", r.stderr.decode(errors="replace")[-200:])
