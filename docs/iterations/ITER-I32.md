# 迭代 I32 开发包 — 分拣台导入图片黑屏：display 路径缺 media/ 前缀（一行修复）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 前置：**先执行 ITER-I31**（13 条 oneline 修复，解 build 死锁）——本包与 I31 都改 app.js，且 I31 的
> build 成功后本包所述「已导入 13 条黑图」会随之自愈（见下），本包修的是**以后每次导入**的显示。
> 背景：用户分拣台批量导入 13 颗 Mirage 烟后，详情页图片全黑。

## 根因速览（已核实，图没坏）

- **media 盘上文件完好**：`media/de_mirage/mirage-t-smoke-01/1-stand.jpg` 与源文件 `文件夹批量录入/荒漠迷城/20261002160104_1.jpg`
  字节数完全一致（479,613），规划会话已目验图片内容正常。
- **黑屏真因**：`writeEntryImage`（app.js ~303-312）返回**裸文件名** `${slot}.${ext}`（如 `1-stand.jpg`）；
  编辑器上传链路（~474/~1722/~1753）都在调用后自行拼接 `media/${map}/${id}/${path}`，
  **唯独分拣台导入（~2969-2974）直接把返回值塞进 entry.images[].path**——显示端（~3580）裸 path 当
  `img.src` → 相对 index.html 找根目录下的 `1-stand.jpg` → 404 → 暗底空图 = 「黑图」。
- **为什么 build 后会自愈**：.md 不存 images（pb build 从 media/<map>/<id>/ 目录扫描生成全路径 images），
  build 成功 → data.js 路径正确 + 浏览器显示缓存按 builtAt≥savedAt 退役（I19）→ 显示恢复。
  但下一次分拣台导入还会黑——必须修导入代码。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I32。只改 assets/js/app.js 分拣台导入处（~2962-2977 一带）。
动手前先读：docs/iterations/ITER-I32.md 根因速览、app.js 296-320（writeEntryImage）、2960-2995（sortImportAll 图片段）、
474/1722/1753（编辑器链路拼前缀的既有写法）。

一、修复
1. sortImportAll 图片入 entry 处：writeEntryImage 返回的裸文件名拼全相对路径再入 images——
   `path: \`media/${entry.map}/${entry.id}/${path}\``（与编辑器链路 1722/1753 同款；idb: 分支不动）。
2. 确认 lightbox（~3608-3611）、详情大图（~3579-3580）、列表缩略图对全路径/idb: 两种 path 均正常（本来就有分支，勿改显示端）。

二、回归确认（逐项）
1. 分拣台导入（FS ready mock 或真实授权）：导入后**立即**进详情页，图片正常显示（不再黑）；lightbox 打开正常。
2. build → pack → 重载：显示缓存退役后图片仍正常（data.js 从 media 扫描的全路径）。
3. 未关联场景（idb: 待写图路径）显示与「未同步」角标不回归。
4. 编辑器上传/替换图片不回归（本来就有前缀拼接）。

红线：不改 writeEntryImage 的返回值签名（其他调用点依赖裸名自行拼接）；不动 pb.py；不碰数据文件。
验收清单（逐项自检，Ctrl+F5 强刷后）：
- [ ] 分拣台导入一条测试行 → 详情页图片立即可见（黑屏消失）→ 删除测试条目与 media 目录还原现场
- [ ] build/pack 后重载显示正常；idb: 流程与编辑器上传零回归
- [ ] 控制台零报错；lint 0 ERROR；PROGRESS.md 追加执行记录并更新当前状态
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-03 | I32 | 创建：分拣台导入图片黑屏——图本体完好（media 文件与源文件字节一致、目验正常），真因＝writeEntryImage 返回裸文件名而 sortImportAll 未像编辑器链路那样拼 `media/<map>/<id>/` 前缀，显示端裸 path 当 src 404。修复＝导入处拼全路径一行；已导入 13 条的黑图随 I31 的 build 自愈（.md 不存 images、build 从 media 目录扫描全路径 + 显示缓存退役），无需数据修复 |
