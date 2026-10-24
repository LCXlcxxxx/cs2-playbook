# 迭代 I28 开发包 — 修复包：数据错位解 build 死锁 + 移动下拉去重 + 键盘导航（Esc / ←→）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段，无停点）。
> 背景（规划会话已诊断完毕，直接照修）：I27 两阶段已完成（13 颗入库、用户后删 3 颗，现存 28 条），
> 「同步并打包.bat」被 5 个 lint ERROR 卡死；移动下拉出现两个「蹲下」；详情页 ←/Esc 语义不符预期。

## 根因速览（已核实，开发会话无需重查，照改即可）

| # | 症状 | 根因 | 修法 |
| --- | --- | --- | --- |
| 1 | 移动下拉两个「蹲下」 | `moveExtra()`（app.js ~66-72）无存档时返回预置 `["蹲下"]`；crouch 转正内置枚举后没迁移旧预置，编辑器下拉（~947）与分拣台下拉（~3266）`concat(moveExtra())` 未按显示名去重 → 内置蹲下+自定义蹲下 | 拼接去重 + boot 一次性迁移清同名项 + `throwWarns`（~1562）标准数组补 `"crouch"` |
| 2 | 打包 5 ERROR | **不是 pb.py 的 bug**：pb.py lint（~504）按条目 frontmatter 的 side/type 推期望 id 前缀，而这 5 个文件 frontmatter 与 id 打架——4 颗 T 烟 `side: CT`（id 都是 `dust2-t-`）、retake-fire `type: smoke`（id 却是 molotov，内容「A大坑补A门烟」就是烟） | side 回 T ×4；retake-fire 改名 `dust2-ct-smoke-a-door-retake`（与 b-door-retake 同族，旧 id 已随条目删除腾空） |
| 3 | 道具页 Esc 应能回战术板 | onKey 的 Esc 链（~3868-3869）已有「详情→列表」「drillTarget→战术板」，但**列表页无字时 Esc 落空** | Esc 链尾部加兜底：道具列表页 → 切战术板 Tab（过滤/地图状态不动） |
| 4 | 详情页 ← 应为上一条 | ~3877 把 `ArrowLeft || Backspace` 都绑了 backToEntryList | ← 改绑 `stepEntryDetail(-1)`；Backspace 与 Esc（走既有 ~3868）= 返回列表 |

附：用户删掉的 3 颗 I27 条目在 `media/de_dust2/` 留了 3 个孤儿目录（retake-a-door / tunnel-delay / tunnel-push），顺带清到 staging 留底。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行修复迭代 I28。改动物仅限：assets/js/app.js、data/entries/ 下 5 个 .md、
media/de_dust2/ 目录归位、AGENTS.md §五 一行、docs/PROGRESS.md。不碰 pb.py（id 规则本身没错）。
动手前先读：AGENTS.md（重点 3.1、五）与 docs/iterations/ITER-I28.md 的根因速览表。

一、数据修复（解打包死锁；动手前把这 5 个文件的当前 frontmatter 抄进汇报留底）
1. side 回 T（id 前缀 dust2-t-、正文与 verified 历史均为 T 方道具；side 变 CT 系编辑器阵营下拉误存）：
   dust2-t-smoke-a-door.md、dust2-t-smoke-a-short-ac.md、dust2-t-smoke-a-short-block.md、
   dust2-t-smoke-tunnel-self.md —— 各把 frontmatter `side: CT` 改回 `side: T`，其余字段一字不动。
2. id 语义修正（内容是烟不是火）：dust2-ct-molotov-retake-fire.md →
   ① 文件名与 id 行改为 dust2-ct-smoke-a-door-retake（type: smoke 保持）；
   ② media/de_dust2/dust2-ct-molotov-retake-fire/ 整目录改名为 media/de_dust2/dust2-ct-smoke-a-door-retake/；
   ③ grep data/ 全库确认旧 id 零残留（related/spots 无悬空引用）。
3. 孤儿媒体清理（对应条目已删）：media/de_dust2/ 下 dust2-ct-smoke-retake-a-door、dust2-ct-smoke-tunnel-delay、
   dust2-ct-flash-tunnel-push 三个目录整体移入 build/staging-i27/orphans/（素材留底，media 清爽、pack 不再带上）。
4. tools\pb.cmd lint 预期 0 ERROR / 0 WARN → build → pack；grep data.js 抽查 4 颗 side=T、新 id 生效。

二、移动下拉去重（两个蹲下）
1. 编辑器移动下拉（~947）与分拣台移动下拉（~3266）：内置枚举与 moveExtra() 拼接处按**显示名**去重，内置优先。
2. boot 时一次性迁移：把 pb-move-extra 里与内置显示名相同的项清除并 saveMoveExtra 持久化
   （⚙ 设置的自定义移动列表随之不再出现「蹲下」；用户后加的自定义项不受影响）。
3. throwWarns（~1562）标准 move 数组补 "crouch"（现状 move: crouch 会被误报「非标准」）。
4. 回归：编辑器/分拣台/⚙ 设置三处都只剩一个蹲下；选内置蹲下保存后 .md 落 move: crouch。

三、键盘导航（app.js onKey ~3836-3895）
1. 详情页（state.entryView 分支）：`ArrowLeft` 改为 stepEntryDetail(-1)（上一条）；`ArrowRight` 保持下一条；
   `Backspace` 保持返回列表；Esc 走既有 ~3868 返回列表（确认即可，勿重复绑定）。
2. 道具列表页（tab=entries 且非详情非编辑器）：Esc 链在「清搜索/报点筛选」分支（~3859）之后加兜底——
   清 drillTarget、state.tab="tactics"、render（地图/类型/阵营过滤与搜索记忆逻辑保持现状不额外清）。
3. 明确不动：lightbox 内 ←/→/Esc；编辑器/选点/设置/分拣台各自的捕获级 Esc；J/K、↑/↓、/ 聚焦搜索。
4. AGENTS.md §五「交互」行补一句 Esc 语义：关 lightbox/关弹层 → 清搜索/筛选 → 详情页回列表 → 道具列表切回战术板。

红线：不改 pb.py；不动修复清单之外的任何条目数据；不引入第三方依赖；?v= 由 pb build 自动递增。
验收清单（逐项自检，Ctrl+F5 强刷后）：
- [ ] pb lint 0 ERROR / 0 WARN；双击「同步并打包.bat」全流程跑通不再中止
- [ ] data.js：4 颗 T 烟 side=T；dust2-ct-smoke-a-door-retake 渲染正常（图片在、旧 id 零残留）；media 无孤儿目录
- [ ] 三处移动下拉均无重复蹲下；选内置蹲下保存落 move: crouch；throwWarns 不再误报 crouch
- [ ] 详情页 ←=上一条、→=下一条、Backspace/Esc=返回列表；列表页 Esc=切回战术板（有搜索词先清搜索）
- [ ] lightbox/编辑器/分拣台 Esc 语义不变；J/K 导航不变；控制台零报错
- [ ] docs/PROGRESS.md 执行记录追加一行 + 当前状态更新
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-03 | I28 | 创建（修复包，规划会话已完成根因诊断）：① 5 个 .md frontmatter/id 错位解 build 死锁（4 颗 T 烟 side 误存 CT 回改 T；retake-fire 是烟、改名 dust2-ct-smoke-a-door-retake）；② 移动下拉两个蹲下＝moveExtra 预置未随 crouch 转正迁移＋拼接未去重（附带 throwWarns 补 crouch）；③④ 键盘＝详情页 ← 改绑上一条、Esc=回列表，列表页 Esc 兜底切战术板；AGENTS §五 同步；孤儿 media 目录入 staging |
