# 迭代 I3 开发包 — 地图下拉补全 + pb.cmd 修复 + 重建数据

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 前置：I2 已执行完成（见 docs/iterations/ITER-I2.md 变更记录：352 点核对通过、Mirage 52 点、
> de_nuke/de_vertigo 拼接图已生成并入 maps.json）。本迭代是小修快跑，一个会话可完成。

---

## 已确认的现状（规划会话核实，2026-10-01）

- **data.js 是旧的**（build 于 I2 执行前）：Mirage 三个包位报点、拼接图雷达路径都还没进 data.js，
  所以查看器里看不到这些 I2 成果。本迭代必须以 `pb build` 收尾。
- **顶栏地图下拉只有 Mirage**：根因在 `assets/js/app.js` init()（约 218 行）——
  `usedMaps` 只统计 `data.entries` + `data.tactics` 的地图，`data.callouts` 的 8 张图没被算进去。
  这不是数据问题（data.js 里 10 图全部 `radar_exists: true`），是纯前端过滤 bug。
- **tools\pb.cmd GBK 问题未修**（用户已批准：直接修，无需再问）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器小迭代（迭代 I3）。改动很小，按顺序做：

一、顶栏地图下拉补全（用户报告：下拉里只有荒漠迷城）
1. assets/js/app.js init() 里 usedMaps（约 218 行）并入报点地图：
   const usedMaps = new Set([
     ...data.entries.map(e => e.map),
     ...data.tactics.map(t => t.map),
     ...Object.keys(data.callouts || {}),
   ]);
2. 道具 Tab 选中没有条目的地图时显示占位文案（如「该地图还没有录入道具」），不留白屏。
3. 战术板 Tab 验证 8 张有报点的地图都能切换渲染；「全部地图」聚合视图行为不变；
   有战术板的地图（目前仅 Mirage）时间轴卡片显示不变。
4. index.html 的 style.css / app.js 引用 ?v=8 递增为 ?v=9（改前端必须换版本号防缓存）。

二、pb.cmd GBK 修复（用户已批准）
现象：部分终端把 UTF-8 中文注释按 GBK 误析导致报错（python tools\pb.py 直跑正常）。
修法：pb.cmd 头部（@echo off 之后）加 chcp 65001 >nul；若仍有回显乱码，把 pb.cmd 里的
中文回显改成英文。修完在 cmd 和 PowerShell 各跑一次 tools\pb.cmd lint 验证直接可跑。

三、重建数据并整体验收
1. 跑 pb lint + pb build，确认 data.js 更新：de_mirage 52 点（含二楼包位/B小包位/安全包位）、
   de_nuke / de_vertigo 的 radar 指向 *_combined.png。
2. 浏览器打开查看器（注意强刷 Ctrl+F5）逐项检查：
   - 下拉列出全部 8 张有报点的地图 + 全部地图，切换/过滤正常
   - Mirage 报点图能看到 3 个包位点
   - Nuke / Vertigo 显示上下拼接大图，已有报点（如有）落位正确、半区不串位
   - 道具 Tab 选 Dust2 等空地图显示占位文案
3. pb pack 重新打包（dist 里的发布包要带上这批修复）。

红线：不动 callouts.json 的点位数据；不动 maps.json；不改 pb.py。
验收清单（逐项自检）：
- [x] 下拉 8+1 项，切换渲染正常，空地图道具 Tab 有占位文案
- [x] Mirage 3 个包位在查看器可见
- [x] Nuke/Vertigo 拼接图显示正常
- [x] tools\pb.cmd lint 在 cmd 与 PowerShell 下均直接可跑
- [x] pb lint / pb build / pb pack 通过，data.js 为最新
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I3 | 创建：顶栏地图下拉补全（usedMaps 并入 callouts 地图 + 空地图占位 + ?v=9）；pb.cmd GBK 修复（用户已批准）；重建 data.js（I2 成果尚未进 data.js） |
| 2026-10-01 | I3 | 执行完成：下拉 11 项（全部 + 10 图，含 Nuke/Vertigo 底图与「报点待放置」提示）；Dust2 等空地图道具 Tab 占位文案；Mirage 3 包位可见；Nuke/Vertigo 拼接图渲染确认（1024×2048）；pb.cmd 改纯 ASCII + chcp 65001（UTF-8 中文注释 + chcp 会令 cmd 解析错位，已实测 cmd/PowerShell 双通过）；data.js 重建，?v=9 |
