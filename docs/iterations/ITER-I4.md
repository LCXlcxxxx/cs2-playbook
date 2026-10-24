# 迭代 I4 开发包 — 修复报点本地存档遮蔽新地图（Dust2 等显示"没有报点"）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 前置：I3 已完成（?v=9、pb.cmd 已修、data.js 8 图 404 点已重建）。

---

## 根因（规划会话已定位，2026-10-01）

`assets/js/app.js` 的 `allCallouts()`（约 943 行）：只要 localStorage 里存在
`pb-callouts-v2`，就**整体替代** `data.callouts`。用户 9/30 校正 Mirage 报点时，
编辑器把「当时只有 Mirage 的全部报点」整份存进了 localStorage；此后每次打开页面，
这个旧快照都压过新数据 → Dust2 等 7 张新图全部显示「该地图还没有报点」。

**次生风险（必须一并消除）**：若用户已「🔗 关联」callouts.json，任何一次编辑都会把这个
缺图快照自动写回 `data/callouts.json`，冲掉 352 个导入报点。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器修复迭代（迭代 I4）。只改 assets/js/app.js 的报点本地存档层
（EDITOR_KEY = "pb-callouts-v2" 相关），数据文件一律不动。

一、本地存档语义从「整体替代」改为「按地图叠加」
1. allCallouts() 改为合并语义：
   - base = data.callouts || {}；
   - overlay = JSON.parse(localStorage.getItem(EDITOR_KEY) || "{}")（损坏按空处理）；
   - 返回 { ...base } 浅拷贝后，对 overlay 里每个 key：若值是非空数组则覆盖对应地图。
   这样旧快照（只含 de_mirage）自动变成"只覆盖 Mirage 的叠加层"，Dust2 等 7 图
   立即恢复显示 data.js 里的报点，用户已校正的 Mirage 数据不受影响，无需迁移。
2. saveCallouts 改为按地图保存：saveCalloutsForMap(mapKey, arr) ——
   读 overlay（只读 localStorage 里的叠加层，不是合并结果），overlay[mapKey] = arr，
   存回 localStorage，再走原有的 scheduleCalloutsFileWrite()。
3. 改造所有编辑写回点（拖拽换位 / 改名 / 删除 / 新增报点 / 授权关联后首次写入，
   约 1168-1236 行多处）：从「const all = allCallouts(); 改 all[mapKey]; saveCallouts(all)」
   改为「const arr = (allCallouts())[mapKey] 的副本; 改 arr; saveCalloutsForMap(mapKey, arr)」。
   注意 allCallouts() 现在每次返回新对象，绝不能再整份存回（会重新变成全量快照）。
4. writeCalloutsFileNow / 导出按钮仍写 allCallouts()（合并结果），保持正确：文件里
   始终是全量 8 图数据。
5. 「新增报点」在 overlay 没有该图时：先取 allCallouts()[mapKey]（内置数据副本）再 push，
   保证新点是在 60 个点的基础上加，而不是在空数组上加。

二、data.js 也纳入版本号防缓存
1. index.html 里 <script src="build/data.js"> 加上 ?v=1（与 app.js/style.css 的 ?v=
   相互独立计数即可，注释注明：数据或前端有变，三者一起递增）。
2. 本次把 data.js / app.js / style.css 统一递增到 ?v=10（接着 I3 的 9 往下走；
   data.js 从 1 起也行，只要以后记得动）。

三、验收（强刷 Ctrl+F5 后逐项检查）
- [x] Dust2 / Inferno / Train / Overpass / Anubis / Ancient / Office 报点全部显示，
      数量与 data/callouts.json 一致（60/55/63/56/46/36/36）
- [x] Mirage 报点仍正常（52 点，含三个包位），拖拽一个点保存后刷新，位置保留
- [x] localStorage 里 pb-callouts-v2 若存在旧快照，修复后不再遮蔽其他地图
- [x] 未关联文件时编辑只进本地叠加层；「导出 callouts.json」内容为合并后的全量 8 图
- [x] （若已关联文件）确认写回内容是全量 8 图，不是快照
- [x] 起点钻取 / 目标钻取在 Mirage 与 Dust2 上各试一对点位，跨图不串
- [x] pb lint / pb build 通过；pb pack 重新打包

红线：不动 data/callouts.json 与 maps.json；不改报点数据本身；
localStorage 里的旧快照不得丢弃（它是用户校正过的 Mirage 数据）。
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I4 | 创建：修复 allCallouts() 本地快照整体替代内置数据导致新地图报点为空（改为按地图叠加）；消除关联文件时快照写回冲掉导入数据的风险；data.js 纳入 ?v 防缓存 |
| 2026-10-01 | I4 | 执行完成：allCallouts 改合并语义（内置为底、叠加层按地图覆盖）；saveCalloutsForMap + editableCalloutsFor 重写五个写回点（拖拽/改名/搜索/删除/新增，全部副本模式）；导出与文件写回保持合并全量；index.html 三资源 ?v=10（data.js 纳入版本号）。浏览器实测：旧快照（仅 Mirage 52 点）不再遮蔽 Dust2 等 7 图（60/55/63/56/46/36/36 全对）；Mirage 拖拽保存只进 Mirage 叠加层；导出为 8 图全量；起点/目标钻取 Mirage、Dust2 跨图正常 |
