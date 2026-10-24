# 迭代 I36 开发包 — 上传图片黑屏（I32 同类 bug 第二处）：uploadSlotImage 补 media/ 前缀 + 全调用点审计

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 背景（2026-10-03 15:52 实证）：用户在详情页「上传/替换」给 mirage-t-smoke-13 传 瞄点/落点&效果 两图——
> 文件已成功写入 media（2-aim.jpg / 4-result.jpg，mtime 15:52，内容完好），但页面显示仍黑。
> 规划会话此前「编辑器链路已自行拼接前缀」的判断**有误**：uploadSlotImage 这一处漏审。I32 只修了 sortImportAll。
> 注：编号 I35 已被「id 全自动化」包占用（另一会话），本包顺延 I36；与 I34/I35 改动区域不重叠，随时可插入执行。

## 根因速览（已核实，含 writeEntryImage 全调用点现状）

- `uploadSlotImage`（app.js ~416-435，编辑器图槽与详情页「上传/替换」共用的上传函数）：
  ~420 行 `writeEntryImage` 返回**裸文件名**（`2-aim.jpg`），~427 行 `images.push({ slot, label, path })`
  **裸路径直接入条目** → overlay.edited 存裸路径 → 显示端 `img.src = "2-aim.jpg"` → 404 → 黑图。
- writeEntryImage 调用点审计现状：sortImportAll（**I32 已修✓**）、syncAllPending（~474 已拼✓）、
  朋友导入 flush（~1722/~1753 已拼✓）、**uploadSlotImage（~427 裸奔✗）**。
- 实证数据：data.js（CHECK-01 构建，早于 15:52）smoke-13 的 images 只有 1-stand（导入时全路径，显示正常），
  2-aim/4-result 在 missing——所以旧图正常、新上传的两张全黑，与用户截图完全吻合。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I36。只改 assets/js/app.js（uploadSlotImage 一处 + 调用点审计）。
动手前先读：docs/iterations/ITER-I36.md 根因速览、app.js 416-435（uploadSlotImage）、288-313（writeEntryFile/writeEntryImage）、
460-480（syncAllPending ~474 已正确的拼法参照）。

一、修复
1. uploadSlotImage 非 idb: 分支：writeEntryImage 返回的裸文件名拼全相对路径再入 images——
   `path = \`media/${entry.map}/${entry.id}/${path}\``（与 syncAllPending ~474、I32 在 sortImportAll 的拼法一致；
   注意保持 ~430 行 markEntryWritten 的 idb:/全路径判断语义不变）。
2. 全库 grep writeEntryImage 调用点逐一复核「入 entry.images 前已拼 media/<map>/<id>/ 前缀」，
   汇报调用点清单与结论；发现同类裸奔一并修复。

二、回归确认（逐项）
1. mirage-t-smoke-13：双击 bat（build 从 media/ 扫描全路径）→ Ctrl+F5 → 三图全显示；此后再上传新图 → 立即显示不黑。
2. 编辑器图槽「替换图片」、详情页「上传/替换」、扩展槽上传：保存后立即显示；lightbox 打开新上传图正常。
3. 未关联场景：上传走 idb: 暂存 + 「未同步」角标 → 🔑 授权后 syncAllPending 补写 → 路径转 media 全路径，不回归。
4. × 取下、扩展槽删除、朋友导入图片、分拣台导入（I32）、入坑即选点（I33）全部不回归。

红线：不改 writeEntryImage 返回值签名；不动 pb.py 与数据文件；不引入第三方依赖；?v= 由 pb build 自动递增。
验收清单（逐项自检，Ctrl+F5 强刷后）：
- [ ] 上传任一槽位 → 立即显示（img src 为 media/ 全路径；检查 pb-entries-v1 暂存里无裸文件名路径）
- [ ] mirage-t-smoke-13 三图显示正常；bat 后 data.js 与盘一致
- [ ] writeEntryImage 调用点审计清单写入汇报
- [ ] idb: 未同步流程、删除、朋友导入、分拣台导入零回归；控制台零报错
- [ ] lint / build / pack 通过；PROGRESS.md 追加执行记录并更新当前状态
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-03 | I36 | 创建（I32 同类 bug 第二处）：uploadSlotImage（编辑器/详情页上传共用）~427 行把 writeEntryImage 返回的裸文件名直接入 entry.images → 显示 404 黑图（实证：smoke-13 15:52 上传的 2-aim/4-result 已成功写盘、文件完好，仅路径裸奔；data.js 早于上传构建所以旧图正常新图黑）。修法＝非 idb: 分支拼 media/<map>/<id>/ 全路径 + writeEntryImage 全调用点审计。I35 编号已被 id 全自动化包占用，本包顺延 |
