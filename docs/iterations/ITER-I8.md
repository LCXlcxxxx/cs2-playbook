# 迭代 I8 开发包 — 清除旧条目（归档）+ RECORD.md 录入工作流

> 状态说明（2026-10-01 执行会话注）：本文件原定由规划会话创建但未落盘，执行会话按 PROGRESS.md
> （唯一权威进度记录）「下一步待办：清除旧条目归档到 _archive/mirage-v1/ + 新建 docs/RECORD.md
> 录入工作流」重建本包并执行。范围以 PROGRESS.md 为准。

## 背景（PROGRESS.md 数据现状）

- 道具 12 条 Mirage 全为 draft：来源是视频抽帧的「纸面数据」，用户决定**清除重录**——
  改为游戏内实测、网页里录入（I5 零命令行链路已上线：新增道具/传图/标记实测/同步打包）。
- 报点 10 图 502 点不涉及本次改动（Nuke/Vertigo 为用户手动放置的知识草稿）。
- 归档 = 移动到 `_archive/mirage-v1/`，**不删除**（来源署名与图片描述随时可参考）。

## 执行范围

1. `data/entries/*.md`（12 条）→ 移动到 `_archive/mirage-v1/`。
2. 新建 `docs/RECORD.md`：零命令行录入工作流（网页新增→传图→标记实测→同步打包），
   开发者命令行替代路径（harvest/shots/verify）附后。
3. `media/` 保留不动（历史参考图，重录时可对照；后续可自行清理）。
4. tactics/、callouts、maps 不动。

| 2026-10-01 | I8 | 执行完成（执行会话按 PROGRESS.md 重建本包）：12 条 v1 条目归档至 _archive/mirage-v1/；战术板 mirage-t-default 因 uses 全断链一并归档；docs/RECORD.md 零命令行录入工作流落地；media/ 保留（历史参考图）。lint 0E/0W，data.js 0 条目 0 战术板，报点 10 图 502 点不受影响；查看器验收：战术板报点图正常、道具 Tab 占位+新增入口、下拉 11 项 |
## 验收清单

- [x] data/entries/ 清空，12 条 .md 完整存在于 _archive/mirage-v1/
- [x] pb lint 0 ERROR（无条目属正常）；pb build 后 data.js 条目为 0、战术板/报点不受影响
- [x] 查看器：战术板/报点图正常；道具 Tab 显示「还没有录入道具」占位 + 新增入口
- [x] docs/RECORD.md 落地：录入四步走完整、无命令行要求（开发者路径单独标注）
- [x] pb pack 重新打包；PROGRESS.md 追加执行记录并更新当前状态
