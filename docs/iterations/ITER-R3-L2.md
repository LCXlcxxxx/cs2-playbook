# 迭代 R3-L2 开发包 — 道具行三簇重排 + 缩略图墙快速浏览（R3 功能冻结例外第 7 项，单包封顶）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面「粘贴提示词」整段粘贴执行。
> 授权依据：docs/iterations/ITER-R3.md 第五节允许清单第 7 项（2026-10-24 用户带截图拍板）。
> 背景：用户截图实证道具行「左簇信息—大段空白—右簇徽章」——row-main flex:1 把 ~40% 行宽堆死在标题与
> 投法徽章之间；且实战浏览要「一眼看全部道具的效果图，点开即放大缩放」。lightbox 缩放（I12：滚轮 1-8x
> 光标锚点/拖拽/双击/±0）已存在，缺的只是缩略图墙与直达入口。
> **与 R3-L1 不可并行执行**（两包都改 style.css 与 tools/tests/run_tests.py——串行域文件）：
> 开工三查若发现 L1 未入账/工作区不干净，等待其完成后再动。

## 现状速览（2026-10-24 规划会话实读核实；行号是快照，执行前重 grep）

- `rowHtml` pb-list.js:91-105：单行结构 = type-ico / row-main(标题+tags, flex:1 撑行) / badge-throw /
  difficultyBadge / row-loc / badge-status / fav-btn——空白全部落在 row-main 尾部。
- 行 CSS style.css:881-910（.row-main flex:1 1 auto、.row-loc flex:0 1 auto 省略号、行高 40px）。
- 分组渲染 `entryListPanel` pb-list.js:142-186（收藏组/📦 setsZone 折叠区/phase 组/list-foot）；
  套装成员复用 rowHtml（setRowHtml:130-140）。
- lightbox：lbCtx={imgs,idx,title} pb-detail.js:201；**入口 `openLightboxCtx(imgs, idx, title)` :246**
  （通用，imgs 为路径数组）；lightboxStep :263 条目内循环；closeLightbox :271 置 null。
- 键盘分层：app.js onKey 在 lightbox 打开时消费 ←/→/Esc；J/K 落到全局 focusCard（.card 元素通用焦点）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 R3-L2（道具行三簇重排 + 缩略图墙；R3 功能冻结例外第 7 项，见
docs/iterations/ITER-R3.md 第五节——动手前先读第五节确认授权与红线）。
开工三查：pb test 23/23 全绿 / git status 干净 / pb lint 0E/0W（git 全路径
"%LocalAppData%\Programs\Git\cmd\git.exe"）。行号是快照，先重 grep。
**若 R3-L1 已开工未入账：停下等待**（两包共享 style.css 与 run_tests.py，串行域）。
改动面白名单：assets/js/pb-list.js、assets/js/pb-detail.js（仅 lbCtx.nav 轻量扩展）、
assets/css/style.css、tools/tests/run_tests.py、docs/UI.md、docs/iterations/ITER-R3-L2.md（变更记录）。
**零共享文件红线**：pb-core/pb-data/pb-sync/app.js/index.html/pb.py 一行不改——
视图状态放 pb-list 模块内 + localStorage；lightbox 的 J/K 拦截用 capture 监听方案（见四）。
若执行中发现绕不开共享文件，停下在台账说明理由获批后再动。

一、道具行三簇重排（修「中间大段空白」）
1. rowHtml 改三簇结构：
   .row-left = type-ico + row-main(标题+tags)；
   .row-mid = row-loc（起点 → 目标，字号 14→15px 微升——它是浏览第二关键信息）；
   .row-right = badge-throw + difficultyBadge + badge-status + fav-btn。
   .entry-row 三簇 justify-content:space-between——空白均匀拆成左右两段（各 ~20%），
   观感从「中间镂空」变「三栏对齐」。
2. CSS：.row-left/.row-mid 均 min-width:0 + overflow ellipsis（长标题/长路径截断不换行），
   .row-mid max-width ≈ 38%；.row-right flex:none；行高 40px 不变；空隙不足时左中簇共同收缩。
3. 新类命名决策（写进变更记录）：.row-left/.row-mid/.row-right 属 .entry-row 作用域的家族命名
   （与既有 .row-main/.row-loc 一致）——落地前 grep assets/js/*.js + style.css 确认无冲突
   （有冲突即改 pb- 前缀）；R1-D「新类一律 pb- 前缀」规矩在本条让位于家族一致性，仅限 row-* 作用域族。
4. 套装成员行/setRowHtml 复用 rowHtml 自动跟随；钻取/搜索命中行如复用 rowHtml 同样自动跟随。
5. 红线：行内元素集合一个不多一个不少（只挪位置）；点击语义（行进详情/星/难度徽章过滤）零改动。

二、缩略图墙（快速浏览视图）
1. 视图切换：列表面板顶部加一条窄切换栏 [☰ 列表 | ▦ 缩略图]（segmented；列表页专属，查阅/管理
   两模式均可见——这是实战阅读功能）；选择存 localStorage pb-list-view（"list"|"wall"，默认 list）；
   **状态放 pb-list 模块内变量**，不进 pb-core 的 state（零共享文件红线）。
2. 墙渲染：分组结构完全照旧（收藏组 / 📦 折叠区（展开后成员为网格）/ phase 组 / 未分组 / list-foot），
   组内条目从行改为网格卡片：CSS grid repeat(auto-fill, minmax(240px, 1fr))，竖屏 1200px≈4 列。
   分组头原样保留（留白锚点导航 .list-group-head 自动继续工作）。
3. 卡片（新类一律 pb- 前缀：.pb-wall-grid/.pb-wall-cell/…，cell 需带 class="card" 让 J/K focusCard
   继续工作）：
   - 封面图 = 条目 images 中 4-result 优先，缺则 1-stand，再缺给类型图标占位；loading="lazy"；
   - 底部叠条 = 标题 + 投法徽章（小号，文案保留——宪法 3.1 徽章必显文案，不许只留色点）；
   - 右上角 = 状态点（绿/橙）+ 难度点（复用 difficultyBadge 紧凑形态或色点，grep 现实现选用）；
   - hover 描边高亮（与行一致 var(--accent)）。
4. 交互：点有图卡片 → openLightboxCtx(该条目全部图路径按槽位序, 0, 标题, nav)（见四）——
   滚轮缩放/拖拽/双击/±0 直接复用既有 lightbox，不新建任何放大器；点无图卡片 → 进详情页（现状语义）；
   Enter（J/K 聚焦后）保持进详情页现状不改。

三、lightbox J/K 跨条目连翻（「快速浏览」完全体）
1. pb-detail 轻量扩展（白名单内）：openLightboxCtx 增可选第 4 参 nav={onStep(dir)} 存入 lbCtx；
   closeLightbox 置 null 时天然清除；不传 nav 的全部既有调用零变化。
2. pb-list 装一个幂等的 document capture keydown 监听（墙模块安装一次）：当 lightbox 可见、
   lbCtx.nav 存在、按 j/k 时 → preventDefault + stopPropagation（防 app.js onKey 的 J/K 落到
   focusCard 滚动列表）+ 调 nav.onStep(±1)；到头 clamp 不回绕并 toast「已是第一条/最后一条」。
   Esc/←/→ 仍由 app.js 既有分支处理，零回归。
3. onStep 语义：按 entryRows 数据序（坑 ⑨：≠DOM 分组序）切到上/下一条目，openLightboxCtx
   到该条目第一张有图槽位；相邻条目无图则跳过继续找（找不到就 clamp）。

四、测试与基线
1. run_tests.py 新增用例（DOM/状态断言，参照 DEV.md 坑清单；用例自建状态+CASES 显式排序）：
   - 三簇结构：.row-left/.row-mid/.row-right 存在且顺序正确、row-loc 在中簇、元素集合与改前一致；
   - 墙切换：点 ▦ → .pb-wall-grid 出现且格子数=过滤条数；封面优先 4-result（mock 数据断言 src）；
     视图偏好 reload 保持；切回 ☰ 行视图恢复；
   - 过滤联动：类型+chips 过滤在墙模式生效（格子数随过滤收窄）；📦 展开成员为网格、组头仍在；
   - lightbox：点有图卡片 → #lightbox 可见且 img src=该条目图、label 含条目名；滚轮缩放回归一笔；
   - J/K 跨条目：mock 3 条 → 开箱后按 j 两次 → label 变第三条；尽头 clamp toast；Esc 关闭零回归。
2. 基线守则（改行为迭代）：entries 两张基线（1440×2560 / 2560×1440）删除重生成 + 连续两轮 0 漂移
   验确定性；tactics/detail 四张基线**不得漂移**（未触碰页面）。
3. 浏览器走查：竖屏 1440×2560 主场景（三栏对齐空白均分、墙 4 列、点图缩放流畅）+ 2560×1440 抽查；
   查阅模式墙可用且无管理入口；boot 零 console 错误。

五、收尾
- docs/UI.md 道具列表段同步（三簇行结构 + 墙视图语义 + lightbox J/K 分层）；
  PROGRESS.md 台账行（开发）+ git 提交 + 工作区 clean；?v= 由 build 自动递增；pack 解包双击可用。

红线重申：R3 冻结例外仅此一包（第 7 项，做完不开续包）；不新建第二套 lightbox；徽章文案必显；
新类 pb- 前缀（row-* 家族例外见一.3 并写变更记录）；与 R3-L1 串行执行。
```

---

## 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-10-24 | 创建（R3 规划会话，用户带截图拍板「写包吧」）：① 道具行三簇重排（左=图标标题标签/中=起点→目标/右=投法难度状态星，space-between 空白均分两段，修 ~40% 中段空白）② 缩略图墙视图（列表页 ☰/▦ 切换、分组照旧、封面=落点&效果图、点击直达 lightbox 复用 I12 缩放）③ lightbox J/K 跨条目连翻（lbCtx.nav 轻量扩展 + capture 监听，零共享文件）；基线仅 entries 两张重生成。同会话修订 ITER-R3.md 第五节（冻结例外增第 7 项）并更新台账 |
