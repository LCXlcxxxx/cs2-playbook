# ?v= 递增
import io
import re
import sys
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
p = Path(r"D:\AI agent\ZCode data\CS2\index.html")
v = sys.argv[1] if len(sys.argv) > 1 else "26"
t = p.read_text(encoding="utf-8")
t2, n = re.subn(r"\?v=\d+", f"?v={v}", t)
p.write_text(t2, encoding="utf-8")
print(f"?v -> {v} ({n})")
