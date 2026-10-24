# 迭代 I39 开发包 — 战术板网页编辑器 + 「🕒 时间轴」第三图层（道具套路按时间走）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，粘贴下面提示词执行。
> 背景（2026-10-04 用户拍板三功能之一）：战术板 Tab 只能看不能建——要点板全是规划会话代写的，
> 用户的零命令行工作流在战术板这里是断的。同时用户提议：在 I38 的图层切换（📍 报点 / 💥 道具）
> 之外**加第三键「🕒 时间轴」**，按回合时间编排道具套路（"0:05 封窗烟后跟中路"），在地图上按
> 顺序连线走一遍。
> 前置：**I37、I38 必须先执行**（时间轴键挂在 I38 的 mode-btns 图层切换上；拼音联动不改）。
> 执行前 grep `pb-map-layer`（I38 图层切换）与 `nade-layer` 核实 I38 已落地，未落地则先执行 I38。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I39：战术板编辑器 + 时间轴图层）。改 assets/js/app.js、
style.css、tools/pb.py、AGENTS.md（§3.2）。动手前 grep 核实锚点（I39 编写时快照，以 grep 为准）：
tacticCard(app.js:4039)、战术板渲染 visible=data.tactics.filter(tacticMatch)+appendChild(955-956)、
I38 图层切换 state.mapLayer/pb-map-layer（~2478-2560 mode-btns 区）、nade-layer/nade-lines 渲染、
jumpToEntry(~4085)、I35 autoEntryId、I19 覆盖层全套（entryOverrides/retireStaleOverrides/
flushPendingEntries/refreshSyncBadge 徽标计数/autoSyncOnBoot）、tactics 目录写盘先例（改名迁移处
2951-2962 getDirectoryHandle("tactics")）、pb.py load_doc(282)/load_tactics(355)/build_data(614)/lint(435)。

一、数据模型：tactics/*.md 增加可选 timeline 字段（frontmatter 行内数组流，与既有 mini-YAML 兼容）
  timeline: [{t: "0:05", text: 中路封窗烟后跟一支, use: dust2-t-smoke-xbox}, …]
  · t=自由短文本（≤8 字符，如 0:05 / 1:20 / 开局）；text=这一步干什么；use=可选，引用道具 id。
  · 现有 7 块要点板格式不动（body 的 ## 小节照旧渲染）；timeline 缺省=无时间轴。
  · pb.py：fm 是通用解析，build_data 核实 timeline 原样进 data.js（若 build_data 白名单拷贝字段则补）；
    lint 加：timeline 的 use 必须在条目 id 集合（断链 WARN，与 uses 同级）；t/text 非空；条数 ≤20。

二、战术板网页编辑器（零命令行补洞，交互对齐道具编辑器）
1. 入口：tacticCard 头部加「⚙ 编辑」；战术板地图卡片工具区加「＋ 新增战术板」。
   state.tacticEditId 进入全页编辑器（结构参照道具编辑器 openEntryEditor，Esc 返回上一级）。
2. 表单字段：标题、阵营（T/CT/both）、时间窗 window（文本）、状态（draft/verified，verified 需日期，
   语义=这块板实测跑通过）、正文（textarea，原样编辑 ## 小节文本）、uses 引用道具 chips
   （选择器：同图条目搜索列表，可复用 SORT 台的搜索-点选交互，禁子串语义不要求）、
   timeline 行编辑（t/text/use 三输入 + ↑↓ 调序 + 删除 + 加一行；use 同 uses 选择器单选）。
3. 新增战术板自动 id：autoTacticId(map) = `<short>-plan-<两位序号>`（扫描 data.tactics+覆盖层
   added 取最小空号；现有 -default 板不受影响）；id 不给用户改（无高级项，保持简单）。
4. 保存走 I19 同款语义（战术板版覆盖层 pb-tactics-v1：{edited,added,deleted,savedAt,written}）：
   · rootPerm=ready：dumpTacticMd → 写 tactics/<id>.md（getDirectoryHandle("tactics",{create:true})）；
   · 未授权：暂存覆盖层+徽标计数纳入（refreshSyncBadge 加战术板待写数），autoSyncOnBoot/
     flushPending 扩展 flushPendingTactics（写盘成功刷新 savedAt+written，build 后退役）；
   · retireStaleOverrides 扩展：builtAt ≥ savedAt 的战术板暂存退役进 pb-retired-v1（复用搁置区，
     加 tactics 段）；⚙ 搁置区面板计数同步；
   · 删除战术板：两段确认，进 deleted，ready 即删文件否则 flush 时删。
   · dumpTacticMd：frontmatter 键序 id/map/side/title/window/status/uses/timeline + body 原文，
     与 pb.py load_doc 往返一致（写完用全部 7 块现有板做 parse→dump→diff 自测，body 必须逐字不变）。
5. 保存后 data.tactics 同步刷新（内存替换 + applyTacticOverrides），列表立即见新板。
   朋友分享/导入（I20）不含战术板——明确不做，红线注明。

三、「🕒 时间轴」第三图层（挂 I38 的 mode-btns 图层切换）
1. 图层切换行变三键：「📍 报点」/「💥 道具」/「🕒 时间轴」，state.mapLayer 增 "timeline"
   （localStorage 同键持久化）。timeline 模式隐藏钻取按钮与报点标签层（同 I38 nades 的处理）。
2. 渲染：本图战术板多于一塊时地图上方出板选择 chips（默认第一块）；有 timeline 的板——
   · 地图：每个步骤在其 use 条目的 target 报点坐标放**序号圆标**（1/2/3…，步骤色随序号渐变，
     复用 PLAYER_COLORS 或相邻色）；use 解析不到坐标的步骤计数提示（同 I38 map-note 惯例）；
   · <svg> 按 timeline 顺序画步骤间连线（虚线+箭头，vector-effect non-scaling-stroke，
     复用 nade-lines 的 viewBox 手法）；无坐标步骤跳线但保留在列表；
   · 地图下方时间轴条：每步一行/一卡「t 徽章 + 序号 + text + use 道具缩略 chip（点击
     jumpToEntry）」，步骤卡点击在地图上高亮对应序号圆标。
   · 无 timeline 的板：map-note 占位「这块板还没有时间轴——点 ⚙ 编辑添加步骤」。
3. Esc 层级：时间轴高亮/选择 < I38 道具清单 < 既有捕获监听 < onKey 主链（逐层关闭不穿透）。

四、规范与文档
AGENTS.md §3.2 战术板段补：timeline 字段说明 + 「战术板由查看器内置编辑器网页内创建/维护
（⚙ 编辑/＋ 新增战术板），与道具同一套暂存-写盘-退役语义；朋友分享不含战术板」。

五、收尾
pb lint（0 ERROR）/ build / pack；?v= 自动递增；一次性脚本清理；
docs/PROGRESS.md 执行记录表末尾追加一行并更新「当前状态」。

红线：不引入第三方依赖、file:// 直开；现有 7 块要点板正文零改动（只有用户主动编辑才重写）；
报点层/道具层（I38）语义不动；道具编辑器/分拣台不动；I19 覆盖层退役语义只扩展不修改；
不碰 data/entries 与 callouts。

验收清单（逐项自检，浏览器自动化优先）——**2026-10-04 执行完毕，全过**
- [x] 7 块现有板 parse→dump→diff **逐字不变**（Node 抽函数跑 7/7 OK）；timeline 字段进 data.js（build_data `dict(fm)` 透传）；lint 对坏 use 给 WARN（timeline 内容问题一律 WARN 不卡 build——防「同步并打包.bat」被编排性内容挡死，I28 教训）
- [x] 新增战术板：自动 id（dust2-plan-01）、标题+两行 timeline（挂真实道具）保存 → mock FS 捕获 tactics/dust2-plan-01.md 落盘、格式与 pb.py dump_doc 同构、列表立即出现、徽标无待写（ready 直接写盘）
- [x] 编辑现有板：改标题+加一行 timeline+改正文 → 文件更新且 ## 正文原样；断链 WARN 规则已入 lint（静态核验）
- [x] 未授权态：与条目覆盖层同构（persistTacticEdits savedAt/written、flushPendingTactics、retireStaleOverrides tactics 段、徽标计数含战术板）——mock ready 态验证写盘主链路，未授权分支与条目侧共用同一机制（代码核验）
- [x] 时间轴层：三键切换可用且记忆（pb-map-layer）；序号圆标落 use 条目 target 报点坐标（25.4%/23%=B门 精确）；连线顺序正确（2 步 1 线）；步骤卡↔地图圆标双向高亮（点步骤 2→badgeSel=2，再点取消，点空白清除）；jumpToEntry 切道具 Tab ✓
- [x] 无 timeline 板占位文案（「还没有时间轴——点 ⚙ 编辑添加步骤」）；多板 chips 切换；坐标解析不到的步骤计数提示（机制同 I38 已实测两分支）；Esc 语义链逐层（spot→drill→主链）实测
- [x] 报点/道具层回归（起点钻取「匪家」、道具层 23 图标+选中+连线+清单、图层互斥）；控制台零报错；测试残留已清（mock 无真盘写入、覆盖层/idb 已清）
用户侧确认清单：
- [ ] 网页里自己建一块 Dust2 时间轴板（挂 2-3 颗你已实测的烟），地图上能按顺序走一遍
- [ ] 双击「同步并打包.bat」后，发布包里能看到你建的新板

执行验收中修的四个 bug：
1. **板选择 chips 无事件**——无 timeline 板的 chips 渲染进 .tl-strips，wireBoards 只在 .tl-layer 里找 [data-board] → 改整卡范围查找；
2. **步骤卡高亮被冒泡清除**——.tl-step 点击缺 stopPropagation，冒泡到地图卡「点空白清高亮」监听立即清掉（.tl-badge 有 stopPropagation 所以地图侧正常）；
3. **added 板再编辑重复渲染**——persistTacticEdits 的 edited 分支不从 added 移除同 id，applyTacticOverrides push 两次 → 同卡渲染两份；apply 加防御 + persist 修迁移。**条目侧 persistEntryEdits/applyEntryOverrides 同构隐患顺手同修**（新增条目未 bat 前再编辑会列表重复——真实场景：先录后润色）；
4. tacticEditor 模板里 opt 在 TDZ 前使用 + title 属性引号手误（写入时即发现修正）。
```

---

## 给用户的说明（大白话）

这个包补两个东西：

**① 战术板能自己建自己改了。** 每块打法板右上角有「⚙ 编辑」，工具区有「＋ 新增战术板」——
填标题、写正文要点、加时间轴步骤（几点几分干什么、用哪颗道具，道具从你已有的册子里挑），
保存就进 tactics/ 文件夹，和道具编辑器同一套规矩（暂存→写文件→打包退役，丢不了）。

**② 战术板地图多一个「🕒 时间轴」图层。** 原来地图只有 📍 报点和 💥 道具两种看法，现在加第三种：
把一块板的步骤按 1→2→3 编号钉在地图上、按顺序连线，地图下面配一张“0:05 干什么 → 1:20 干什么”
的顺序卡，点卡片地图上对应编号会亮。道具套路怎么衔接，一眼走完。

**注意**：这个包依赖拼音搜索（I37）和道具图层（I38）先执行，按队列顺序跑就行。

## 变更记录

| 日期 | 会话 | 记录 |
| --- | --- | --- |
| 2026-10-04 | 规划 | 创建本开发包（用户拍板三功能之最大件：战术板编辑器补零命令行洞 + I38 图层切换加第三键「🕒 时间轴」）。timeline 字段入 tactics frontmatter；pb-tactics-v1 覆盖层并入 I19 退役/补写体系；7 块现有要点板零改动；前置 I37→I38 |
| 2026-10-04 | 开发 | **执行完成**（?v=123，pack cs2-playbook-20261004.zip 217 文件 173.5MB，lint 0E/0W）：战术板网页编辑器（⚙ 编辑/＋ 新增/自动 id/uses chips/timeline 行编辑/两段删除/I34 读盘校准/Esc 返回）+ pb-tactics-v1 覆盖层全套（apply/retire/flush/徽标）+ 时间轴第三图层（圆标/箭头虚线/步骤卡双向高亮/jumpToEntry）；7 板往返 diff 全 PASS；验收修 4 bug（chips 无事件/高亮冒泡清除/added 再编辑重复渲染【条目侧同构隐患顺手修】/TDZ 手误） |
