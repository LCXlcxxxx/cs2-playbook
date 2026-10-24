# 迭代 I45 开发包 — 新地图首次录入图片写盘失败：writeEntryImage 补建目录（一行修）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 背景：用户首次录入炼狱小镇（inferno-t-smoke-02「快T字烟」）——条目 .md 写盘成功，但三张图片全部
> 「图片写盘失败」，详情页缺图。I44 的逐行容错按设计工作了（单条失败不炸整批、弹层如实报告），
> 现在把真正的病根修掉。

## 根因（已核实代码，一行修）

`writeEntryImage`（app.js ~556-566）：
```js
const media = await rootDirHandle.getDirectoryHandle("media")            // ← 无 create
  .then(d => d.getDirectoryHandle(entry.map))                            // ← 无 create
  .then(d => d.getDirectoryHandle(entry.id, { create: true }));          // 只有这级有
```
`media/` 与 `media/<map>/` 两级目录不存在时直接抛 NotFoundError。Dust2/Mirage 目录早已存在所以从未暴露；
**de_inferno 是第一张新图** → media/de_inferno 不存在 → 三图全失败。I44 容错接住后按设计降级
（条目照常入库、问题进弹层）——机制正确，病根在此。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I45。只改 assets/js/app.js（writeEntryImage 一处 + getDirectoryHandle 调用点审计）。
动手前先读：docs/iterations/ITER-I45.md 根因、app.js ~556-575（writeEntryImage）。

一、修复
1. writeEntryImage 的目录链前两级补 { create: true }：
   getDirectoryHandle("media", { create: true }) → getDirectoryHandle(entry.map, { create: true })
   → entry.id 级保持 create:true。create 幂等（目录已存在原样返回），老图路径零影响。
2. 全库 grep getDirectoryHandle 调用点，按「读取（不应 create）vs 写入路径（应 create）」分类列清单进汇报；
   发现同类「写入路径但中途目录可能不存在」的一并补 create（重点：其他写 media/写 data 的链路）。

二、存量修复（本次受害条目）
1. grep/lint 核对 inferno-t-smoke-02（快T字烟）：条目在、images 空——无需脚本修复，
   修复上线后用户在网页编辑器对三个槽重新上传即可（源图仍在 文件夹批量录入\炼狱小镇\，
   入坑只是池内移除，磁盘文件未动）。
2. 顺手核对 lint report 的缺图清单：确认除 smoke-02 外无其他「因本 bug 缺图」的条目
   （Dust2/Mirage 目录早已有，理论上仅此一例）。

三、回归确认（逐项）
1. 模拟全新地图首录（stub 句柄或临时目录）：导入三图 → media/<新图>/<id>/ 三文件落盘成功、详情页立即可见。
2. Dust2/Mirage 既有条目上传/替换不回归；未关联（idb 暂存）→ 🔑 授权后 syncAllPending 补写同样能建目录
   （走同一 writeEntryImage，自然修复）。
3. I44 弹层/逐行容错不回归；控制台零报错；lint / build / pack 通过；PROGRESS.md 追加执行记录。

红线：不改 writeEntryImage 返回签名与 I44 的容错结构；不动 pb.py 与数据文件；不引入第三方依赖。
验收清单：
- [ ] 新地图首录三图成功落盘并显示；media 目录自动创建
- [ ] inferno-t-smoke-02 用户重传后三图齐全（lint 该条缺图 WARN 消除）
- [ ] getDirectoryHandle 调用点审计清单入汇报；既有上传/补写/删除零回归
- [ ] 控制台零报错；PROGRESS.md 追加执行记录并更新当前状态
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-05 | I45 | 创建：新地图首次录入图片全失败——writeEntryImage 的 media/ 与 media/<map>/ 两级 getDirectoryHandle 缺 create:true，de_inferno 为第一张从零录入的图目录不存在直接 NotFoundError（I44 容错接住降级为「图片写盘失败」，机制正确病根在此）。修=前两级补 create（幂等）+ 全库 getDirectoryHandle 读写分类审计；存量仅 inferno-t-smoke-02 需用户网页重传三图 |
| 2026-10-10 | 开发 | **执行完成（?v=141，dist/cs2-playbook-20261010.zip，lint 0E/2W——2 WARN 均为 inferno-t-smoke-02 缺图待用户重传）**：① writeEntryImage 前两级补 create:true（幂等，老图零影响）② **getDirectoryHandle 全库 20 调用点读写审计**——写入 CREATE ✓：writeEntryImage 三级（本次修）/migrateMediaDir dstMap+dst/sortMaybeMoveGroup doneDir+doneSub；entriesDir 写路径 data 级**同类缺口一并补**（create=true 才建，读路径不建）；读取路径（deleteSlotImage/migrateMediaDir src/renameEntry tactics/sortScanPool/sortMaybeMoveGroup probe+srcDir）全部有 try/catch 兜底保持不 create ③ 存量核对：inferno-t-smoke-02 条目在 images 空、2 WARN 全在该条=全库仅此一例 ④ 回归实测：mock 无 media/ 目录导入三图→media/de_inferno/inferno-t-smoke-02/ 三文件自动建目录落盘+详情页 images 全路径；既有 Dust2 替换/删槽不回归；未关联 idb→🔑 syncAllPending 补写自动建目录 ✓；I44 弹层/容错回归 ✓；控制台零报错。**测试坑（重要）：playwright evaluate 是隔离世界——evaluate 里赋值 rootPerm/rootDirHandle 只改隔离世界全局，主世界 app.js 读不到；主世界 stub 必须用 script 标签注入（此前多轮「时灵时不灵」的真因）** |
