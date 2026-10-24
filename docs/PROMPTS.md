# 各阶段启动提示词

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话（必须在这个目录，AGENTS.md 才会自动生效），把对应阶段的提示词整段粘贴进去。
> 一次一个阶段，按 P1 → P2 → P3 → P4 顺序；每个阶段做完对着 BUILD_PLAN.md 的验收清单检查。

---

## P1 — 工具链 + 查看器 + 置顶 + 打包

```text
按 AGENTS.md 规范开发本项目 P1。先读 AGENTS.md，再读 docs/BUILD_PLAN.md 的第 2 节（P1）与第 6、7、8 节，然后实现：

1. tools/pb.py 单文件 CLI（纯 Python 标准库）+ tools/pb.cmd：lint / build / new / shots / pack 五个子命令，行为严格按 BUILD_PLAN.md 2.1 的定义。
2. 根目录 index.html + assets/js/app.js + assets/css/style.css 查看器：道具/战术板双 Tab、地图与 T/CT 与类型过滤、搜索、J/K 键跳转、图片 lightbox、缺图槽位显示占位块、投法三字段自动拼中文徽章（拼接表在 BUILD_PLAN.md 第 8 节）。
3. tools/pin.ahk（AutoHotkey v2：F4 置顶切换、F3 半透明切换）+ tools/pin.bat。
4. 跑通验收：pb lint 无 ERROR；pb build 生成 build/data.js 且 data/entries 里已有的 11 条骨架全部渲染；pb pack 产出 dist zip。

硬性约束：零第三方依赖；file:// 下数据只走 build/data.js（禁 fetch JSON）；代码注释和界面全中文。
完成后按 BUILD_PLAN.md 2.4 的验收清单逐项自检并报告结果。
```

---

## P2 — 11 条内容补全

```text
按 AGENTS.md 规范执行 P2 内容填充。先读 AGENTS.md 和 docs/BUILD_PLAN.md 第 3 节（P2）。

目标：把 data/entries/ 下 11 条 Mirage T 条目从骨架补成完整条目，每条至少 1-stand / 2-aim / 4-result 三张图。

做法：优先在 B 站检索教学视频（UP 主：tatukunn / 冷锋 / 蒋道具 / 祖灵Zu1ing；搜「Mirage + 点位名 + 烟/闪/火」），按 BUILD_PLAN.md 第 3 节的流程取帧处理归位（需要 yt-dlp + ffmpeg，安装命令在计划里）。每条回填 oneline / origin / click / move / action / source（UP 主 + BV 号），status 保持 draft。
注意 mirage-t-smoke-connector-a 已有来源：祖灵Zu1ing BV1ght86rEww，直接从这个视频抽帧。
图片宽 >1920 压到 1920；拉不到的视频用图片搜索兜底（source.kind=web），再不行列出点位名让我游戏内截图后用 pb shots 归位。

验收：pb lint 无 ERROR；build/report.md 显示 11 条全部图片齐 3 槽；每条 source 可溯源；抽 3 条与原视频对照线位无误。
```

---

## P3 — 战术板

```text
按 AGENTS.md 规范执行 P3 战术板。先读 AGENTS.md 和 docs/BUILD_PLAN.md 第 4 节（P3）。

1. 找 Mirage 雷达底图（≥1024px、含 A/B 点标注，官方风格或 Simple Radar 等社区重绘版），下载到 assets/radar/de_mirage.png，把来源与许可写进 data/maps.json 的 radar_source。
2. 完整填写 tactics/mirage-t-default.md 的 players（5 个 {n, u, v, role}）与 steps（时间轴 {t, text, routes}），坐标一律 0~1 归一化，动线参考 BUILD_PLAN.md 第 4 节。
3. 在查看器战术板页验证渲染：玩家圆点编号、路径箭头（draft 虚线）、时间轴、uses 道具缩略条点击联动滚动到对应卡片。

验收：AGENTS.md「分期与验收」P3 行逐项通过。
```

---

## P4 — 抽帧流水线 + verify + 可选增强

```text
按 AGENTS.md 规范执行 P4。先读 AGENTS.md 和 docs/BUILD_PLAN.md 第 5 节（P4）。

1. tools/harvest.py：输入 B 站视频 URL 或本地视频路径，yt-dlp 拉源 + ffmpeg 抽候选帧，生成本地候选页供挑选，确认后按槽位自动归位 media/ 并回填 source；从视频标题/字幕抓「跳投/左键/双键」等词给 click/move/action 建议值。
2. pb verify <id>：交互确认后把条目置 verified（强制填 checked 日期），lint/build 同步生效。
3. 可选增强（练习 cfg 生成、雷达动线标注工具）：逐个先问我要不要做，同意再动手。

红线：没有我实测确认，任何流程不得自动把条目改成 verified。
验收：harvest 端到端跑通 1 条；verify 后查看器里该卡片变绿。
```

---

## 日常使用（开发完成后）

- 加一条新道具：游戏内截图 → `tools\pb.cmd shots <截图目录> --id <新id>`，或让我按 P2 流程录一条新条目。
- 内容失效（版本更新）：`pb verify <id>` 改 broken，防止以后重复录入。
- 发朋友：`tools\pb.cmd pack`，把 `dist\` 里的 zip 发出去即可。
