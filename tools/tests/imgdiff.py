# -*- coding: utf-8 -*-
"""imgdiff.py — 纯标准库 PNG 解码与像素比对（R1-A 测试固化）。
Chromium 截图为 8-bit RGB/RGBA 非隔行 PNG；快路径 = 字节级全等（C 速度），
仅在不等时做有界慢扫描定位差异。"""
import struct
import zlib


def load_png(path):
    """返回 (w, h, channels, raw_bytes)（已去滤波）。"""
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"not a png: {path}")
    pos = 8
    idat = b""
    w = h = bd = ct = inter = None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, bd, ct, _comp, _filt, inter = struct.unpack(">IIBBBBB", chunk)
            if bd != 8 or inter != 0:
                raise ValueError(f"unsupported png {path}: bitdepth={bd} interlace={inter}")
        elif typ == b"IDAT":
            idat += chunk
        elif typ == b"IEND":
            break
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ftype = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if ftype == 1:      # Sub
            for i in range(ch, stride):
                line[i] = (line[i] + line[i - ch]) & 255
        elif ftype == 2:    # Up
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif ftype == 3:    # Average
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ftype == 4:    # Paeth
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, ch, bytes(out)


def diff(a_path, b_path):
    """返回 (same: bool, msg: str)。尺寸不同或像素不同即 False。"""
    wa, ha, ca, da = load_png(a_path)
    wb, hb, cb, db = load_png(b_path)
    if (wa, ha) != (wb, hb):
        return False, f"尺寸不同 {wa}x{ha} vs {wb}x{hb}"
    if ca == cb and da == db:          # 快路径：整块字节全等
        return True, "0 px differ"
    c = min(ca, cb)
    n = wa * ha
    bad = 0
    first = None
    step = max(1, n // 200000)         # 慢路径采样上限防卡死
    for i in range(0, n, step):
        off = i * c
        if da[off:off + c] != db[off:off + c]:
            bad += 1
            if first is None:
                first = (i % wa, i // wa)
            if bad > 50:
                break
    if bad:
        return False, f"≥{bad} 处像素不同" + (f"（首处 {first}）" if first else "")
    return True, "0 px differ（采样比对）"
