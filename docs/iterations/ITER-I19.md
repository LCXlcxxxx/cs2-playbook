# 迭代 I19 开发包 — 数据不再"变回去"：文件为唯一真相，浏览器暂存自动对账

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，粘贴下面提示词执行。
> 背景（2026-10-01 诊断会话全局体检结论，详见 PROGRESS.md 末两行）：用户反复遭遇四症状——
> ①报点位置变歪 ②新增报点消失 ③已改的道具详情变回修改前 ④已实测变回待验证。
> 根因：浏览器 localStorage 覆盖层（pb-entries-v1 / pb-callouts-v2）是无时间戳的"永久影子"——
> 加载时无条件压过磁盘；自动保存又把旧影子写回文件，形成双向踩踏；权限过期时条目编辑
> 静默滞留浏览器且开机只补图片不补条目；?v= 手动递增易漏。
> 前置：?v=26，条目 18，报点 10 图（磁盘 Dust2 63 点 > data.js 62 点，存在活动漂移）。
> 用户身份：非开发者，零命令行，一切验收尽量自动化，真实文件授权端到端留给用户清单。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I19：数据一致性根治）。改 assets/js/app.js、index.html、
tools/pb.py、同步并打包.bat、AGENTS.md。动手前先 grep 核实锚点（行号为 I19 编写时快照，以 grep 为准）：
applyEntryOverrides(app.js:106)、syncAllPending(:350)、autoSyncOnBoot(:379)、setEntryStatus(:388)、
refreshSyncBadge(:403)、init 里 applyEntryOverrides 调用(:528)、ef-save(:955)、persistEntryEdits(:1005)、
initFsHandle(:1328)、writeCalloutsFileNow(:1353)、calloutsOverlay(:1388)、allCallouts(:1396)、
saveCalloutsForMap(:1406)、editableCalloutsFor(:1415)、refreshFsButton(:1645)、编辑器删除按钮(:1743)、
startDrag(:1754)、resetLocalEdits(:1808)、index.html 内联 sync-badge 脚本(:63-72)；
pb.py build_data(:614)、cmd_build(:696)、cmd_pack 内重复构建段(:900-910)。

一、核心规则（本次迭代只立这一条规矩，所有改动围绕它）
  「文件是唯一真相」：
  R1 每份浏览器暂存（条目编辑/新增/删除、整图报点快照）都必须带保存时间 savedAt；
  R2 build/data.js 顶层带 builtAt（构建时刻）；
  R3 页面加载时：builtAt ≥ savedAt 的暂存项说明"文件已正式收录/更新"，自动退役——
     但退役 ≠ 删除：搬进 localStorage pb-retired-v1「搁置区」留底，绝不无声消失；
  R4 data.js 无 builtAt 字段（旧产物）时视为 builtAt=0，任何暂存都不退役（保守迁移）。
  效果：开发会话重建 data.js 后，用户浏览器里的旧影子自动让位（症状①②③根除）；
  用户没写进文件的修改永远有据可查（症状④不再无声丢）。

二、pb.py（tools/pb.py）
  1. build_data() 顶层加 "builtAt"：统一 UTC、格式严格为 YYYY-MM-DDTHH:MM:SSZ——
     Python 用 datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")。
     cmd_build 与 cmd_pack 的内联构建段两处都要生效（建议抽公共函数，消除 906-910 重复）。
  2. 新增 _bump_index_version()：读写 index.html，把所有 \?v=(\d+) 统一 +1（当前 26→27 起），
     cmd_build 与 cmd_pack 末尾都调用。从此 ?v= 由工具自动管理，开发会话不再手动 bump，
     忘 bump 导致"改了盘看不到"的缓存层事故永久根除。
  3. 打包/构建输出行打印新 ?v= 值，方便核对。

三、app.js — 覆盖层改造（统一"暂存=显示缓存+待写队列"，退役制，不搞写盘即清）
  1. 时间戳与退役：
     - 条目覆盖层 pb-entries-v1 结构升级：顶层加 savedAt 映射 { [id]: "…Z" }（edited/added/
       deleted 各项共用）；报点覆盖层 pb-callouts-v2 从 { map: [points] } 升级为
       { map: { savedAt: "…Z", points: [...], removed: [names] } }。
     - 旧数据一次性迁移：读到旧结构时补 savedAt=当前时刻（条目）、包成新对象（报点），
       迁移后立即写回。新增 util isoNow() = new Date().toISOString().slice(0,19)+"Z"，
       与 pb.py 的 builtAt 同格式可直接字符串比较。
     - init() 里 applyEntryOverrides() 之前先执行 retireStaleOverrides()：
       逐项比较 data.builtAt（缺省 "1970-01-01T00:00:00Z"）≥ savedAt → 从覆盖层移除并
       追加进 pb-retired-v1（结构 { entries: {id:{item,retiredAt}}, callouts: {map:{item,retiredAt}} }）。
     - allCallouts()/applyEntryOverrides()/editableCalloutsFor()/refreshSyncBadge()/还原默认/
       resetLocalEdits 全部适配新结构。
  2. 报点写盘改"读-改-写"（关键防踩踏）：
     writeCalloutsFileNow 重写：先 const f = await fsHandle.getFile() 读当前文件内容 disk
     （解析失败则中止并 toast），再合成输出：每张图——
       · 覆盖层没有该图 → 保持 disk 原样（绝不基于 data.js 旧数据回写，根除 63→62 点被冲）；
       · 覆盖层有该图 → 按 canonical(name)（trim+小写）做并集：disk 点为底、覆盖层同名点
         覆盖字段，最后剔除 removed 名单里的点（编辑器"删除"按钮把名字记入 removed）；
     写回完整合并结果。此规则保证：文件比 data.js 新时不丢点（A大油桶场景）、
     别人没动过的图不被旧快照回滚。
  3. 编辑器删除按钮（:1743）在 splice 之外同步把被删点名记入该图 overlay 的 removed；
     「还原默认」保持清本图覆盖层（含 removed）+ 两段确认，文案补一句：
     「已自动保存进文件的报点仍在文件里；要从文件删除请在编辑器里删除该报点」。
  4. 开机补写条目（补齐 I16 只补图片的缺口）：
     autoSyncOnBoot 扩展：initRootHandle 成功（ready）后，先 syncAllPending(true) 写图片，
     再 flushPendingEntries()——edited/added 逐条 writeEntryFile、deleted 逐条 deleteEntryFile，
     成功后刷新该项 savedAt=isoNow()（保持显示缓存语义，等下次 build 退役）；
     need-permission 时不动，徽标提示。setEntryStatus/ef-save 成功写盘后同样刷新 savedAt
     而不是删除暂存（显示缓存直到 build 退役，避免"reload 后未重建先回退"）。
  5. 编辑器保存基线改用磁盘原始条目：init() 在首次 applyEntryOverrides() 之前深拷贝
     const diskEntries = structuredClone(data.entries)（或 JSON 深拷贝）；ef-save 的
     const entry = { ...e } 改为 { ...(diskEntries.find(x=>x.id===e.id) || e) }，
     再叠表单字段——旧影子字段不再借"保存"回写文件。images 数组例外：沿用当前内存值
     （可能含 idb: 暂存路径）。
  6. 徽标与文案纠偏（当前文案承诺了做不到的事）：
     - refreshSyncBadge：计数 = 待写条目数 + 待写报点图数 + 待写图片数 + 搁置数，文案
       「● N 条修改待写入文件」/「● N 条修改已搁置（文件曾更新）」；
     - 徽标点击：有待写且 rootPerm=ready → 全量 flush（图片+条目+报点 writeCalloutsFileNow）；
       有待写但非 ready → toast「点工具栏 🔑 重新授权后自动写入」；只有搁置 → 打开 ⚙ 设置。
     - index.html 内联脚本里「双击同步并打包.bat 即可同步」改为真实语义：
       「这些修改要先写回项目文件（点 🔑 重新授权后自动写入）；bat 只负责把项目文件刷进页面和发布包」。
  7. ⚙ 设置弹层加「被搁置的本地修改」节：显示条目/报点搁置计数 + 「导出留底」按钮
     （下载 pb-retired-v1 内容为 JSON，用户拿给开发会话可找回）。

四、文案与规范同步
  1. 同步并打包.bat 第 8 行「校验并同步网页里的修改到项目数据」→「把项目数据刷新进页面与发布包」
     （bat 读不到浏览器暂存，原文案是误导源；浏览器→文件由页面授权写回完成）。
  2. AGENTS.md §3.2 报点段落后追加（原文照抄）：
     「数据一致性铁律（I19 起）：文件是唯一权威。浏览器覆盖层仅作"未写盘修改的暂存+显示缓存"，
     每项带 savedAt；data.js 顶层带 builtAt；加载时 builtAt ≥ savedAt 的暂存自动退役进 pb-retired-v1
     搁置区（可导出留底，绝不静默丢弃）。开发会话重建 data.js 或改 entries/callouts 前，若磁盘文件
     比 data.js 新（用户网页改动已自动落盘），必须以磁盘为准重建，禁止用会话内存数据覆盖磁盘。
     index.html 的 ?v= 由 pb build/pack 自动递增，开发会话不再手动管理。」

五、收尾
  1. pb lint（0 ERROR）/ pb build（builtAt 与自动 ?v= 生效）/ pb pack 各跑一遍。
  2. 控制台无报错；一次性验证脚本用完删除，不留 build/_*.py 新垃圾。
  3. 完成后在 docs/PROGRESS.md 执行记录表末尾追加一行并更新「当前状态」。

红线：不引入第三方依赖、file:// 直开可用；投法三字段枚举不动；不修改 12 颗 verified 条目的
数据内容；投法/图片/lightbox/钻取/收藏等既有交互行为不动；发布包朋友侧只看不编辑、覆盖层
恒为空，不受影响。

验收清单（逐项自检，自动化能测的自动化，真实授权端到端留给用户）：
- [ ] data.js 顶层出现 builtAt（UTC Z 格式）；重复 build 后 index.html 三处 ?v= 自动 +1
- [ ] 旧覆盖层迁移：预置 pb-entries-v1 旧结构（无 savedAt）+ pb-callouts-v2 纯数组结构，
      打开页面不报错、内容显示不丢、迁移后结构升级、无 builtAt 的 data.js 下不退役
- [ ] 退役：把 localStorage 某项 savedAt 改成早于 builtAt → 刷新后该项不再参与显示，
      pb-retired-v1 出现留底，⚙ 设置可见计数并可导出 JSON
- [ ] 报点读-改-写：使 data.js 的 Dust2=62 点、callouts.json=63 点（当前真实状态），
      编辑器拖动任一点 → callouts.json 仍 63 点且该点坐标更新（A大油桶不丢），
      文件里其他图字节不变
- [ ] 条目基线：预置含旧字段的 pb-entries-v1 → 打开编辑器只改标题保存 → 磁盘 .md 中
      旧字段被磁盘值而非影子值覆盖；status/checked 往返正确
- [ ] 开机补写：伪造 pending 条目 + need-permission → 徽标出现；模拟 ready 后刷新 →
      .md 写盘成功、savedAt 刷新、徽标清零（图片+条目+报点三通道）
- [ ] 徽标/设置/还原默认文案与点击行为按三-6/三-7 落地；bat 文案已改
- [ ] lint 0 ERROR / build / pack 通过；控制台无报错；无新增一次性脚本残留
用户侧确认清单（发给用户照做）：
- [ ] 双击「同步并打包.bat」一次（先把 22:22 的报点修改追进 data.js），浏览器 Ctrl+F5 强刷
- [ ] 换一个浏览器打开 index.html：报点（含 A大油桶）、条目、已实测状态与原浏览器一致
- [ ] 正常使用一天后：不再出现"改了又变回去"；徽标出现时点 🔑 重新授权即可消失
```

---

## 给用户的说明（大白话，为什么这样修）

**你问"能不能换浏览器打开？"——能，这是完全正常的需求，修好后随便换。**
之前出问题不是"换浏览器"这个动作错了，而是程序把你的每笔修改存了**两份**：一份写进项目
文件夹（真身），另一份留在**每个浏览器自己的小抽屉**（便利贴）。换浏览器后小抽屉是空的，
或者里面贴的是很久以前的旧便利贴——旧的盖住了新的，你就看到"位置歪了/新加的没了/改了又
变回去"。发布包（发给朋友的 zip）不受影响，朋友只看不改。

修完后只有一条规矩：**文件夹里的文件说了算**。
- 你在网页里的修改，照旧自动写进文件（要开着"自动保存"，第一次用点一次授权）；
- 浏览器里那份只剩"还没来得及写进文件的草稿"，文件一正式更新，旧草稿自动作废；
- 作废不是扔掉：搬进"搁置区"，⚙ 设置里能看到、能导出，**永远不会无声消失**；
- 每次同步并打包后版本号自动+1，不用再担心"改了看不到"。

日常使用记住三件事：
1. 换新浏览器第一次用：点一次「📁 关联项目文件夹」+「开启自动保存」（浏览器的安全规定，
   就像 App 第一次要权限，每个浏览器一次）；
2. 看到「● N 条修改待写入文件」：点工具栏 🔑 重新授权一下，它就自动写完消失；
3. 其他一切照旧：改完双击「同步并打包.bat」。

## 变更记录

| 日期 | 会话 | 记录 |
| --- | --- | --- |
| 2026-10-01 | 诊断 | 全局体检定位根因（覆盖层无对账机制双向踩踏），PROGRESS 记录在案 |
| 2026-10-01 | 规划 | 创建本开发包（savedAt/builtAt 退役制 + 读-改-写 + 开机补写条目 + 自动 ?v= + 搁置区留底） |
