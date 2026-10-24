# 迭代 I11 开发包 — 一键「重置本地编辑」（修浏览器存档压住磁盘数据的类问题）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：网页编辑走「浏览器存档优先」机制，agent 直接改磁盘后，浏览器里的旧存档会把新数据压住
> （起点"后花园→后花园平台"用户看不到，就是这一类）。报点编辑器已有「还原默认」，
> 条目编辑的存档没有对应入口——本迭代补上。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器小迭代（迭代 I11）。只改 assets/js/app.js，不碰数据文件。
先读条目本地覆盖层：entryOverrides/saveEntryOverrides（key "pb-entries-v1"：
edited/deleted/added 三张表）与 IndexedDB 待写图（idbImgOpen/putIdbImage/allIdbImages）。

一、道具 Tab 工具栏加「重置本地编辑」按钮
1. entries-toolbar（「＋ 新增道具」旁边）加按钮：「↺ 重置本地编辑（以磁盘为准）」。
2. 两段确认（沿用现有 arm 模式）：第一次点变成「确认丢弃？未同步的修改会丢失」，
   再点才执行。确认文案必须列清后果：
   「将丢弃浏览器里未同步的修改：字段编辑 / 已实测标记 / 未同步图片。磁盘文件不受影响。」
3. 执行：
   - localStorage.removeItem("pb-entries-v1")
   - 清空 IndexedDB 待写图库（遍历 allIdbImages() 逐个删除；注意不要动存文件夹句柄的库）
   - render() 重新渲染
4. 重置后若 rootDirHandle 仍关联，不受影响；刷新同步徽章（refreshSyncBadge）。
5. 报点编辑器的「还原默认」已有，不动。

二、收尾
1. index.html 三处 ?v= 递增到 17（当前是 16）。
2. pb lint / pb build / pb pack 各跑一遍。

红线：不改覆盖层的读写逻辑本身（saveCalloutsForMap/dumpEntryMd 等一律不动）；
不动 IndexedDB 里存句柄的库；不碰数据文件。
验收清单（逐项自检，强刷 ?v=17 后）：
- [x] 重置前先改一个字段（制造存档），道具页显示存档值；点重置两段确认后，
      立即显示磁盘值（build/data.js 内容）
- [x] 待写图的「未同步」角标在重置后消失
- [x] 重置不影响 已关联的项目文件夹 与 callouts.json 关联
- [x] lint / build / pack 通过；控制台无报错
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I11 | 创建：道具工具栏加「重置本地编辑（以磁盘为准）」——清条目覆盖层 + IndexedDB 待写图，两段确认警示后果；解决 agent 改盘后被浏览器旧存档遮蔽的问题 |
| 2026-10-01 | I11 | 执行完成：道具工具栏「↺ 重置本地编辑」三段确认（清 pb-entries-v1 + pending-images，不动句柄库）；制造存档→重置→恢复磁盘值实测通过；?v=17，lint 0 ERROR |
| 2026-10-01 | I11 | 执行完成：entries-toolbar 加「↺ 重置本地编辑（以磁盘为准）」三段确认（arm1 确认丢弃→arm2 列清后果→执行）；执行清 pb-entries-v1 + pending-images 全部记录（不动 kv 句柄库）；实测：制造字段存档+1 张待写图后重置，条目立即恢复 build/data.js 磁盘值、未同步角标消失、关联句柄不受影响；?v=17，lint 0 ERROR |
