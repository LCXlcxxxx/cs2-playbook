# 迭代 R3-L1 开发包 — 分拣台批量录入体验（R3 功能冻结例外第 6 项，单包封顶）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面「粘贴提示词」整段粘贴执行。
> 授权依据：docs/iterations/ITER-R3.md 第五节允许清单第 6 项（2026-10-24 用户拍板「按推荐组合来」）。
> 背景：R3 批次 3/4 要录 30+ 条 CT 侧与新图内容，分拣台是主力通道，先把管线磨快；
> 其中「本批来源」同时修一个数据质量缺口（视频素材被硬编码标成自己录的）。
> 前置现状：R3 批次 0 已落地（内容看板 + I42 归档判定修 + 23 用例 + ?v=173）。

## 现状速览（2026-10-24 规划会话全文实读 pb-sortdesk.js 902 行核实；行号是快照，执行前重 grep）

- `sortSt` 定义 ~10-16：rows 仅内存，**无草稿暂存**（误关页面丢整批字段录入；图片本身在磁盘素材文件夹安全）。
- `sortAddRow` ~188-199：行默认 `verified: true`、side:T、type:smoke。
- `sortScanPool` ~134-159：组内按文件名 `localeCompare(zh)` 排序。
- `sortPutToSlot` ~202-225：一图一坑（`pool.delete`）+ compressToSlot。
- `sortImportAll` ~305-435：entry 构造 ~345-356，**`source: { kind: "self", creator: "自己", url: "" }` 硬编码（~354）**
  ——视频抽帧批次走分拣台会被错标自录且可带 verified；verified→checked=今天（~358）。
- 预览/入坑即选点 ~711-822（SORT_SLOT_KEYS=1/2/4；选点回调后自动跳下一张）。
- 表格渲染 `drawSortStation` ~834-935（行单元格 ~891-909、表头 ~913-919、问题区 ~922-934）；
  change 委托 ~646-660（type 改动触发 sortAutoId ~655）。
- 选点弹窗 `openSpotPicker` **pb-editor.js:616**（共用组件，条目编辑器同用；搜索过滤 name+search，**无拼音**）。
- 拼音基建：`pyHit` pb-filter.js:175 仅条目搜索；pb.py ~858-895 按字段算 pyf/pyi 注入**条目**（callouts 未注入）。
- I42 修法已落地（批次 0：池全量无剩余才归档）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 R3-L1（分拣台批量录入体验；R3 功能冻结例外第 6 项，见
docs/iterations/ITER-R3.md 第五节——动手前先读第五节确认授权与红线）。
开工三查：pb test 23/23 全绿 / git status 干净 / pb lint 0E/0W（git 不在 PATH，全路径
"%LocalAppData%\Programs\Git\cmd\git.exe"）。行号是快照，先重 grep 再动手。
改动面白名单：assets/js/pb-sortdesk.js、assets/js/pb-editor.js（仅选点弹窗扩展点）、
tools/pb.py（仅 callouts 拼音注入）、assets/css/style.css（新类一律 pb- 前缀）、
tools/tests/run_tests.py、docs/UI.md、docs/iterations/ITER-R3-L1.md（变更记录）。
数据模型 / lint 规则 / 写盘管线（writeEntryFile/writeEntryImage/I19 链路）零改动。

一、本批来源（修数据质量缺口：现 source 硬编码 self）
1. 分拣台顶栏（sort-head，全局地图下拉旁）加「本批来源」单选：自己 / 视频；视频档显示两个输入
   ——UP 主名（必填）+ 视频 BV/链接（建议填）。选择与输入随草稿暂存（见二）。
2. 选「视频」时：全表「已实测✓」勾自动取消并禁用（title 注明「视频抽帧一律待验证——实测过才能转绿」），
   之后新行默认不勾；切回「自己」恢复可勾。导入前校验：视频档 UP 主为空 → 拦截导入 + toast 指引。
3. sortImportAll 的 entry.source 按本批来源构造：自己 = {kind:"self", creator:"自己", url:""}（现行为）；
   视频 = {kind:"video", creator:输入值, url:输入值}。对照 FIELD_REGISTRY/lint 的 source_kind 规则，
   不得造出导入后被 lint 拦的数据。批量级即可，不做行级覆盖（混合来源分两批录）。

二、行数据草稿暂存（防误关丢整批录入）
1. sortSt.rows 防抖 0.8s 序列化到 localStorage pb-sort-draft-v1：每行全部标量字段 +
   slots 存 {src, group, name, poolKey, ext}（blob/url 不序列化）；同存 globalMap、本批来源（一）、
   savedAt。序列化失败静默跳过，不因草稿坏主流程。
2. 重开分拣台（池扫描完成后）检测草稿：rows 非空则确认弹层「检测到上次未导入的 N 行草稿（时间）——恢复 / 丢弃」。
3. 恢复：字段直接回填；池图槽按 poolKey 从当前素材池重挂（重读文件 + compressToSlot，并从池移除=重新入坑）；
   poolKey 已不在池（被别处消费）→ 该槽清空并在问题区列「某行某槽图已不在素材池，请重配」；
   file 上传槽（无 poolKey）blob 不可恢复 → 同样清空标注。
4. 草稿清除时机：全部导入成功后 / 丢弃按钮 / 恢复后零有效行。JSON 解析失败静默丢弃。

三、智能三连自动成组（只做图→行，不碰字段语义）
1. 每个池组名行加「⏩ 成组」按钮：取该组当前池内图片按现有顺序（文件名 zh 序，同 sortScanPool），
   每 3 张一组自动建行并按序入坑 1-stand/2-aim/4-result（复用 sortPutToSlot 语义：池移除+压缩）；
   余 1-2 张也建行（缺槽留空，问题区提示）。
2. 不自动填起点/目标/类型/标题（保持行默认值），不抢当前选中行；完成 toast
   「已按序成组 N 行（其中 M 行缺图）——逐行补起点/目标后导入」。
3. 红线：手动 1/2/4 流、一图一坑、⧉ 复制还池、归档判定全部不动；成组是纯叠加按钮。

四、选点提速（共用组件扩展，必须向后兼容）
1. openSpotPicker（pb-editor.js:616）加可选 opts（不传 = 现行为零变化，条目编辑器不回归）：
   a. reusePrev: {label, value}——弹窗顶部一行「⧉ 沿用上一行：警家」按钮，点击按当前模式生效
      （起点=直接选定；目标=加入多选）。分拣台起点单元格打开时传上一行的 origin。
   b. recent：弹窗顶部「最近」chips（每图最近 5 个报点，localStorage pb-recent-spots 按图存）；
      选点确认时更新（分拣台与条目编辑器两条链路都更新）；点击按当前模式语义生效。
2. 选点弹窗搜索支持拼音全拼/首字母：pb.py build 给 data.js 的 callouts 也注入 pyf/pyi
   （复用条目同款逻辑 ~858-895，对 name+search 别名生成）；弹窗搜索 haystack 加 pyf/pyi；
   pydict 未收录字按条目同规则处理；pack 自动带出。
3. 表格行首加「⧉ 抄上一行」小按钮（删按钮旁）：复制上一行的 起点/键位/移动/投掷/阶段/阵营/已实测勾
   （标题、目标、图不复制）；无上一行时隐藏。视频档下勾选值复制但保持禁用语义（仍不可勾）。

五、表头批量设列
1. 阵营/类型/阶段/已实测 四列表头加 ▾：点击弹小菜单（该列全部选项；已实测=全勾|全不勾），
   选择后应用到全表所有行；类型批量改后对 !idTouched 的行统一重跑 sortAutoId。
2. 视频档下「已实测」列的 ▾ 禁用（与一.2 一致）。

六、导入进度（小件）
1. sortImportAll 运行中：导入按钮转圈禁用 + 按钮旁小字「正在导入 n/N 行」逐行更新；完成后移除。
   既有 I44 逐行容错 / I46 结果弹层零改动。

七、可选加分项（时间允许才做，不阻塞验收；不做则在变更记录注明）
- 重复提醒：行级预检——同 map+type+origin+target 与库内或表内已有重复 → 问题区黄条提示（不拦导入）。

回归与验收（逐项自检；浏览器走查 + mock FS，参照 DEV.md 坑清单）
- [ ] 来源：视频档导入 1 行 → 捕获 .md 含 source.kind=video + creator + status=draft + 无 checked；
      自己档回归现行为；视频档空 UP 主被拦
- [ ] 草稿：录 2 行（含池图坑）→ 刷新页面重开分拣台 → 恢复确认 → 行/字段/坑位全回来且池图重新入坑；
      丢弃路径清键；file 上传槽恢复后正确标缺
- [ ] 成组：mock 池 1 组 7 张 → 成组 → 3 行（2 满配 + 1 缺 1 槽）+ 池空 + 槽序 1/2/4 正确；
      手动 1/2/4 流回归正常
- [ ] 选点：拼音（如 jj→警家，以 pydict 覆盖为准）命中；沿用上一行一键生效；最近 chips 出现且点击生效；
      条目编辑器选点弹窗零回归（不传新 opts 的路径行为不变）
- [ ] 批量列：表头 ▾ 类型=闪 → 全表变 + id 重生成；视频档「已实测」▾ 禁用
- [ ] pb test 全绿（新增用例建议：来源两档 / 草稿恢复 / 成组三行 / 批量设列——分拣台用例走 DOM 与
      状态断言不做像素，分拣台不在基线覆盖面，既有 6 像素基线不得漂移）；lint 0E/0W；
      ?v= 由 build 自动递增；pack 解包双击可用
- [ ] docs/UI.md 分拣台段同步新交互；台账行（开发）+ git 提交 + 工作区 clean

红线重申：R3 冻结例外仅此一包（做完不开续包）；新类一律 pb- 前缀；遵守 I33 设计偏好
（动作合并进既有点击，不堆常驻按钮——新按钮只有成组/抄上行/沿用/表头▾，都是低频高收益）；
若确需改共享文件（pb-core/pb-data/pb-sync/app.js/index.html）哪怕一行，先停下在台账说明理由再动。
```

---

## 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-10-24 | 创建（R3 规划会话，用户拍板「按推荐组合来」）：范围=①本批来源批量设置（修 source 硬编码 self 的署名缺口，视频档自动禁实测全 draft）②行草稿暂存（pb-sort-draft-v1，池图槽 poolKey 重挂）③智能三连成组（文件名序每 3 张自动建行入坑）④选点提速（openSpotPicker 加 reusePrev/recent 向后兼容 + callouts 拼音注入 + 抄上一行）⑤表头批量设列 ⑥导入进度；可选=重复提醒。同会话修订 ITER-R3.md 第五节（冻结例外增第 6 项）并更新台账 |
| 2026-10-26 | 开发 | **执行完成（深夜批处理会话；功能提交 eb84fb4 + 本收尾提交）**：六功能点+可选⑦重复提醒全落地；27 用例全绿（新增 r3l1_source/draft/autogroup/bulkcol 四用例）；?v=176；lint 0E/0W；像素基线未动。落地口径备注：视频档「抄上一行」实测勾不抄（保持一律待验证语义）；选点弹窗拼音经 build 注入 callouts pyf/pyi（用户自加点无拼音自动跳过）；测试桩两处自纠（7 张=3+3+1 缺两槽断言、mock 池 key 须循「组名/文件名」约定）|
