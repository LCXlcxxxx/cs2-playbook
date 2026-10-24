#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harvest.py — B 站视频抽帧流水线（纯 Python 标准库，外部仅调 yt-dlp / ffmpeg 可执行文件）

流程：
  1. python tools/harvest.py <B站URL或本地视频> --map de_mirage [--creator UP名] [--bv BV号]
     → 拉源/复制视频到 build/_harvest/<slug>/ ，ffmpeg 每 2 秒抽帧 + 场景切变帧，
       生成候选页 build/_harvest/<slug>/index.html（缩略图 + 时间戳，供浏览器翻看）。
  2. 人看候选页，记下要用的帧号（候选页和命令行都会列出帧号↔时间对照）。
  3. python tools/harvest.py <URL或视频> --id <条目id> --pick 1-stand=003 2-aim=017 4-result=042
     → 把选中帧压宽（>1920 → scale=1920:-2）、按槽位命名入 media/<map>/<id>/，
       回填 source（creator/url），并按视频标题关键词给出 click/move/action 建议。
       --apply-suggest 时把建议值写进 frontmatter；默认只打印。

红线：本工具永远不会把条目改成 verified——实测确认请用 `pb verify <id>`。
"""

from __future__ import annotations

import argparse
import datetime
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARVEST_DIR = ROOT / "build" / "_harvest"
COOKIES_FILE = ROOT / "cookies.txt"
SLOT_LABELS = {"1-stand": "站位", "2-aim": "瞄点", "3-landing": "落点", "4-result": "效果"}
IMG_EXTS = (".png", ".jpg", ".jpeg", ".webp")

# 视频标题/简介关键词 → 投法字段建议
KEYWORD_RULES = [
    (r"蹲跳投|蹲跳", {"action": "crouch-jump"}),
    (r"跳投", {"action": "jump"}),
    (r"双键|左右键|两键", {"click": "both"}),
    (r"右键", {"click": "rmb"}),
    (r"左键", {"click": "lmb"}),
    (r"静步|shift", {"move": "shift"}),
    (r"跑投|跑动|助跑", {"move": "run"}),
]


def out(*args):
    print(*args)


def find_ytdlp() -> list[str]:
    """定位 yt-dlp：PATH → 当前解释器 Scripts 目录 → python -m yt_dlp。"""
    exe = shutil.which("yt-dlp")
    if exe:
        return [exe]
    scripts = Path(sys.executable).parent / "Scripts" / "yt-dlp.exe"
    if scripts.is_file():
        return [str(scripts)]
    return [sys.executable, "-m", "yt_dlp"]


def cmd_login():
    """引导用户在自己浏览器里登录 B 站（扫码），再把 cookie 导出到 cookies.txt。
    密码全程不经过本工具；cookies.txt 已进 .gitignore，不外传。"""
    out("步骤 1：已尝试打开 B 站登录页，用 B 站 App 扫码登录（或在浏览器里直接登录）。")
    try:
        import os
        os.startfile("https://passport.bilibili.com/login")
    except Exception:
        out("  请手动打开：https://passport.bilibili.com/login")
    out("步骤 2：登录成功后，完全关闭 Edge（所有窗口，包括后台进程），")
    try:
        input("        然后回到这里按回车继续… ")
    except EOFError:
        out("")
    out("步骤 3：从 Edge 导出 B 站 cookie …")
    r = subprocess.run(
        find_ytdlp() + ["--cookies-from-browser", "edge", "--cookies", str(COOKIES_FILE),
                        "--no-warnings", "--skip-download", "https://www.bilibili.com/"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120,
    )
    if not COOKIES_FILE.is_file():
        out("[ERROR] 导出失败：" + (r.stderr or "").strip().splitlines()[-1] if r.stderr else "未知错误")
        out("        确认 Edge 已完全关闭后重试：python tools\\harvest.py --login")
        return 1
    # 校验登录态
    sessdata = ""
    for line in COOKIES_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        if "\tSESSDATA\t" in line:
            sessdata = line.rsplit("\t", 1)[-1]
            break
    ok = "未知"
    try:
        import urllib.request
        req = urllib.request.Request(
            "https://api.bilibili.com/x/web-interface/nav",
            headers={"User-Agent": "Mozilla/5.0", "Cookie": f"SESSDATA={sessdata}"},
        )
        import json as _json
        data = _json.loads(urllib.request.urlopen(req, timeout=15).read().decode("utf-8"))
        ok = data["data"]["uname"] if data.get("data", {}).get("isLogin") else "未登录"
    except Exception:
        pass
    out(f"[OK] cookies.txt 已生成（{COOKIES_FILE.name}，已 gitignore）。当前登录用户：{ok}")
    out("之后 harvest 拉源会自动带上它（可解锁 1080P 及大会员清晰度）。")
    return 0


def find_ffmpeg() -> str:
    """定位 ffmpeg：PATH → imageio_ffmpeg 附带二进制。"""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg  # 可选环境依赖，不算项目运行时依赖

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    out("[ERROR] 找不到 ffmpeg。安装任选其一：")
    out("  python -m pip install imageio-ffmpeg   （推荐，自带二进制）")
    out("  winget install Gyan.FFmpeg             （需能访问 GitHub）")
    sys.exit(1)


def slugify(text: str) -> str:
    s = re.sub(r"[^\w-]+", "-", text, flags=re.UNICODE).strip("-")
    return s[:40] or "video"


def extract_bv(url: str) -> str | None:
    m = re.search(r"(BV[0-9A-Za-z]{10})", url)
    return m.group(1) if m else None


def fetch_video_info(url: str):
    """yt-dlp 拉标题（拿不到就返回 None，不阻塞）。"""
    cmd = find_ytdlp() + ["--no-warnings", "--print", "%(title)s", "--skip-download", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=90)
        t = (r.stdout or "").strip().splitlines()
        return t[0] if t else None
    except Exception:
        return None


def get_video(input_str: str, work: Path, section: str | None = None) -> Path:
    """URL → yt-dlp 拉源；本地路径 → 直接复制。返回视频文件路径。
    section 形如 "0:30-1:10" 时只下载该时间段（--download-sections）。"""
    work.mkdir(parents=True, exist_ok=True)
    if re.match(r"^https?://", input_str):
        out("— yt-dlp 拉源中（≤1920 宽，仅视频流，个人使用）…")
        cmd = find_ytdlp() + [
            "--no-warnings",
            # 竖屏视频高度是长边，用宽度判清晰度；配了 cookies.txt 自动带上
            "-f", "bv*[width<=1920]/bv*/b*",
            "-o", str(work / "source.%(ext)s"),
        ]
        if COOKIES_FILE.is_file():
            cmd += ["--cookies", str(COOKIES_FILE)]
        if section:
            start, end = section.split("-", 1)

            def norm(ts: str) -> str:
                parts = ts.split(":")
                if len(parts) == 2:
                    return f"00:{int(parts[0]):02d}:{int(parts[1]):02d}"
                if len(parts) == 1:
                    return f"00:00:{int(parts[0]):02d}"
                return f"{int(parts[0]):02d}:{int(parts[1]):02d}:{int(parts[2]):02d}"

            cmd += ["--force-keyframes-at-cuts",
                    "--download-sections", f"*{norm(start)}-{norm(end)}"]
        cmd.append(input_str)
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=1800)
        videos = [p for p in work.glob("source.*") if p.suffix.lower() != ".part"]
        if not videos:
            out(r.stdout or "")
            out(r.stderr or "")
            out("[ERROR] 拉源失败（B 站偶需登录：加 --cookies-from-browser edge 试一次）")
            sys.exit(1)
        return videos[0]
    src = Path(input_str)
    if not src.is_file():
        out(f"[ERROR] 本地文件不存在: {src}")
        sys.exit(1)
    dest = work / f"source{src.suffix.lower()}"
    if not dest.exists():
        shutil.copy2(src, dest)
    return dest


def extract_frames(video: Path, frames_dir: Path):
    """每 2 秒一帧 + 场景切变帧（去重靠文件名后缀）。"""
    ffmpeg = find_ffmpeg()
    frames_dir.mkdir(parents=True, exist_ok=True)
    out("— ffmpeg 每 2 秒抽帧 …")
    subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", str(video),
         "-vf", "fps=1/2", str(frames_dir / "t%04d.png")],
        check=True, timeout=1800,
    )
    out("— ffmpeg 场景切变帧 …")
    subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", str(video),
         "-vf", "select='gt(scene,0.3)',showinfo", "-vsync", "vfr",
         str(frames_dir / "s%04d.png")],
        check=True, timeout=1800, capture_output=True,
    )
    frames = sorted(frames_dir.glob("t*.png")) + sorted(frames_dir.glob("s*.png"))
    return frames


def frame_seconds(name: str) -> float:
    """t0007 → (7-1)*2=12.0 秒；s0003 → 场景帧时间未知，标注为场景帧。"""
    m = re.fullmatch(r"[ts](\d+)", Path(name).stem)
    if not m:
        return -1.0
    n = int(m.group(1))
    return 0.0 if name.startswith("s") else (n - 1) * 2.0


def fmt_time(sec: float) -> str:
    if sec <= 0:
        return "场景帧"
    m, s = divmod(int(sec), 60)
    return f"{m:02d}:{s:02d}"


def write_candidates(slug: str, frames: list[Path], title: str, suggestions: dict):
    """生成本地候选页（缩略图 + 时间戳 + 帧号）。"""
    cells = []
    for i, f in enumerate(frames, 1):
        sec = frame_seconds(f.name)
        cells.append(
            f'<figure><img src="frames/{f.name}" loading="lazy">'
            f"<figcaption>#{i:03d} · {fmt_time(sec)}"
            f"{' · 场景帧' if f.name.startswith('s') else ''}</figcaption></figure>"
        )
    sug_text = "、".join(f"{k}={v}" for k, v in sorted(suggestions.items())) or "（无）"
    page = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>harvest 候选帧 — {html.escape(slug)}</title>
<style>
body{{background:#14181f;color:#d6dde7;font-family:system-ui,sans-serif;margin:20px}}
h1{{font-size:20px}} p{{color:#8b97a8}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}}
figure{{margin:0}} img{{width:100%;height:auto;border-radius:6px;border:1px solid #2c3542}}
figcaption{{font-size:14px;padding:4px 2px;color:#8b97a8}}
code{{background:#212935;padding:2px 6px;border-radius:4px}}
</style></head><body>
<h1>候选帧：{html.escape(slug)}</h1>
<p>标题：{html.escape(title)} · 共 {len(frames)} 帧（每 2 秒 t 帧 + 场景切变 s 帧）</p>
<p>投法关键词建议：<b>{html.escape(sug_text)}</b>（按标题/简介关键词，供核对）</p>
<p>选帧后执行（帧号 = 图下 #NNN）：</p>
<p><code>python tools\\harvest.py &lt;URL或视频&gt; --id &lt;条目id&gt; --pick 1-stand=001 2-aim=005 4-result=009 --creator "UP名"</code></p>
<div class="grid">{"".join(cells)}</div>
</body></html>"""
    page_path = HARVEST_DIR / slug / "index.html"
    page_path.write_text(page, encoding="utf-8", newline="\n")
    return page_path


def suggest_throws(text: str) -> dict:
    sug = {}
    for pattern, field in KEYWORD_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            sug.update(field)
    return sug


def load_entry(entry_id: str):
    path = ROOT / "data" / "entries" / f"{entry_id}.md"
    if not path.is_file():
        out(f"[ERROR] 找不到条目: {path}")
        sys.exit(1)
    return path


def apply_pick(args, pick: dict, work: Path):
    """按 --pick 帧号归位 + 回填。"""
    ffmpeg = find_ffmpeg()
    frames_dir = work / "frames"
    frames = sorted(frames_dir.glob("t*.png")) + sorted(frames_dir.glob("s*.png"))
    index = {f"{i:03d}": f for i, f in enumerate(frames, 1)}
    if not frames:
        out("[ERROR] 没有候选帧——先跑不带 --pick 的一遍生成候选页")
        sys.exit(1)

    entry_path = load_entry(args.id)
    fm_text = entry_path.read_text(encoding="utf-8")
    media_dir = ROOT / "media" / args.map / args.id
    media_dir.mkdir(parents=True, exist_ok=True)

    for slot, num in pick.items():
        if slot not in SLOT_LABELS:
            out(f"[WARN] 未知槽位 {slot}（可用：{', '.join(SLOT_LABELS)}），跳过")
            continue
        frame = index.get(num)
        if frame is None:
            out(f"[ERROR] 帧号不存在: {num}（共 {len(frames)} 帧）")
            sys.exit(1)
        dest = media_dir / f"{slot}.png"
        if dest.exists():
            bak = dest.with_suffix(".png.bak")
            shutil.copy2(dest, bak)
            out(f"[备份] {bak.name}")
        # >1920 才压宽；不裁剪
        subprocess.run(
            [ffmpeg, "-y", "-loglevel", "error", "-i", str(frame),
             "-vf", "scale='min(1920,iw)':-2", str(dest)],
            check=True, timeout=300,
        )
        out(f"[归位] #{num} → {dest.relative_to(ROOT)}（{SLOT_LABELS[slot]}）")

    # 回填 source
    creator = args.creator or ""
    url = args.bv and f"https://www.bilibili.com/video/{args.bv}" or (args.src if re.match(r"^https?://", args.src or "") else "")
    if creator and f"creator:" not in fm_text:
        block = (f"\nsource:\n  kind: video\n  creator: {creator}\n"
                 f"  url: {url or '待补URL'}\n")
        fm_text = re.sub(r"\n---\n", block + "---\n", fm_text, count=1)
        entry_path.write_text(fm_text, encoding="utf-8", newline="\n")
        out(f"[回填] source → {creator} / {url or '待补URL'}")
    elif creator:
        # 已有 source 就更新 creator/url 两行
        fm_text = re.sub(r"(  creator: ).*", rf"\g<1>{creator}", fm_text, count=1)
        if url:
            fm_text = re.sub(r"(  url: ).*", rf"\g<1>{url}", fm_text, count=1)
        entry_path.write_text(fm_text, encoding="utf-8", newline="\n")
        out(f"[更新] source → {creator} / {url or '（未变）'}")

    # 投法建议（默认只打印）
    sug = suggest_throws(args.hint or "")
    if sug:
        out("[建议] 依据标题关键词：" + "、".join(f"{k}={v}" for k, v in sug.items()))
        if args.apply_suggest:
            text = entry_path.read_text(encoding="utf-8")
            for field, value in sug.items():
                text = re.sub(rf"^{field}: .*$", f"{field}: {value}", text,
                              count=1, flags=re.MULTILINE)
            entry_path.write_text(text, encoding="utf-8", newline="\n")
            out("[已写入] " + "、".join(f"{k}={v}" for k, v in sug.items()))
        else:
            out("       （核对无误后加 --apply-suggest 写入，或手动改条目）")
    out("完成。status 仍为 draft——进游戏实测后用 `pb verify <id>` 转 verified。")


def main(argv=None):
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    ap = argparse.ArgumentParser(prog="harvest", description="B 站视频抽帧 → 道具条目配图")
    ap.add_argument("src", nargs="?", default=None, help="B 站 URL 或本地视频路径")
    ap.add_argument("--login", action="store_true", help="引导扫码登录并把 cookie 存到 cookies.txt")
    ap.add_argument("--map", default="de_mirage", dest="map")
    ap.add_argument("--id", default=None, help="条目 id（--pick 时必填）")
    ap.add_argument("--creator", default=None, help="UP 主名（回填 source 用）")
    ap.add_argument("--bv", default=None, help="BV 号（回填 url 用，URL 里含 BV 时可省）")
    ap.add_argument("--pick", nargs="*", default=[], help="槽位=帧号，如 1-stand=003 2-aim=017 4-result=042")
    ap.add_argument("--apply-suggest", action="store_true", help="把投法建议写进 frontmatter")
    ap.add_argument("--ss", default=None,
                    help='只下载指定时间段（省流量），格式 "秒" 或 "分:秒-分:秒"，如 "0:30-1:10"')
    ap.add_argument("--hint", default=None, help="给建议用的补充文本（默认用视频标题）")
    args = ap.parse_args(argv)

    if args.login:
        return cmd_login()
    if not args.src:
        ap.error("需要提供 B 站 URL 或本地视频路径")

    bv = args.bv or extract_bv(args.src) or ""
    slug = bv or slugify(Path(args.src).stem)
    work = HARVEST_DIR / slug
    pick = {}
    for item in args.pick:
        if "=" not in item:
            out(f"[ERROR] --pick 格式应为 槽位=帧号: {item}")
            return 1
        k, v = item.split("=", 1)
        pick[k] = v.zfill(3)

    if pick:
        if not args.id:
            out("[ERROR] --pick 需要同时给 --id <条目id>")
            return 1
        apply_pick(args, pick, work)
        return 0

    # 阶段一：拉源 + 抽帧 + 候选页
    title = fetch_video_info(args.src) or ""
    video = get_video(args.src, work, section=args.ss)
    frames = extract_frames(video, work / "frames")
    suggestions = suggest_throws(title + " " + (args.hint or ""))
    page = write_candidates(slug, frames, title, suggestions)

    out("")
    out(f"候选页已生成：{page}")
    out(f"帧数：{len(frames)}（t 帧每 2 秒一张；s 帧为场景切变）")
    if suggestions:
        out("投法关键词建议：" + "、".join(f"{k}={v}" for k, v in suggestions.items()))
    out("")
    out("用浏览器打开候选页挑帧，然后执行：")
    out(f'  python tools\\harvest.py "{args.src}" --id <条目id> '
        f'--pick 1-stand=001 2-aim=005 4-result=009'
        + (f' --creator "{args.creator}"' if args.creator else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
