# UTF-8 中文 grep 小工具
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
path = sys.argv[1]
pat = sys.argv[2]
for i, line in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
    if pat in line:
        print(f"{i}: {line.strip()[:150]}")
