# 迭代 I35 开发包 — id 全自动化：零输入、随阵营自动改名迁移、自动序号

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，粘贴下面提示词执行。
> 背景（2026-10-03 用户提出）：用户被 id 规则反复卡住——手填英文 id、前缀校验报错、新建后改阵营
> 导致 id 与 side 不符（现存 ERROR：mirage-t-smoke-12 side:CT，**当前 bat 重建会被此 ERROR 阻断**）、
> 手动编号 12/13。诉求：id 能否随详情（阵营等）自动更改、自动加序号。
> 方案：id 对用户**零感知**——新建全自动编号（复用 I24 sortAutoId 机制推广到所有入口）；改
> 地图/阵营/类型时 id 前缀自动跟随并**自动迁移全部关联**（.md 文件、media 文件夹、related/tactics
> 引用、浏览器本地键）；起点/目标随便改**不影响** id（编号稳定才是引用安全的根基，显示层永远用
> 标题/起点/目标，id 不承载含义）。
> 前置：**I34（编辑器打开即读盘）先执行**——本包会碰 openEntryEditor/ef-save 同一批代码区域，
> 顺序执行减少冲突；若 grep 发现 I34 未落地（编辑器打开无读盘逻辑）则先执行 I34。
> 排程建议：I34 → I35（本包，解 bat 阻断）→ CHECK-01 全局体检（看修完的干净状态）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I35：id 全自动化）。改 assets/js/app.js、tools/pb.py、
AGENTS.md、help.html（如提及 id 处）。动手前 grep 核实锚点（I35 编写时快照，以 grep 为准，且以
I34 落地后的代码为基线）：ef-id 输入框(app.js:970 附近)与 ef-save 的 id 校验段(1182-1190 附近)、
sortAutoId(2817-2833，注意 2824 行阵营硬编码 "-t-")、sortAddRow(2835)、sortImportAll(2946)、
markEntryWritten(430)、persistEntryEdits、flushPendingEntries、entryOverrides 覆盖层结构
（edited/added/deleted/savedAt/written）、pb-favs 读写（favList/isFav）、writeEntryImage/
deleteEntryFile、pb.py entry_id_pattern 与 lint id 校验段。

一、统一自动编号函数（复用 I24 成熟机制，修掉硬编码）
1. 抽公共函数 autoEntryId({map, side, type}, extraUsed)：
   `${map去de_前缀}-${side小写}-${type}-${两位序号}`，序号=该前缀下未被占用（data.entries 全量 +
   覆盖层 added + extraUsed + 分拣台各行）的最小号，1..99 逐个试，全占用兜底时间戳尾巴。
2. sortAutoId 改为调 autoEntryId 并传 row.side（修 2824 行硬编码 "-t-"——分拣台 CT 行现在会生成
   错误前缀）；编辑器与分拣台从此一套逻辑。

二、新建条目：零输入
1. 编辑器 ef-id 输入框从必填改为折叠进「高级 ▸ 自定义 id（一般不用）」（分拣台已有同款高级模式，
   参照其 idTouched 语义）；折叠态下新建保存时 autoEntryId 生成，toast 显示「id 已自动生成：
   mirage-ct-smoke-01」。
2. 保存路径（ef-save isNew 分支、分拣台 sortImportAll、📥 朋友导入新增兜底）全部走 autoEntryId；
   仅当用户手改过 id（idTouched）才走原有正则+前缀+唯一校验。

三、已存条目：改阵营/地图/类型 → id 自动跟随 + 全量迁移（本包核心）
1. 编辑器内 map/side/type 字段变化 → ef-save 时检测前缀不符 → 不再报错卡住，改为自动改名
   newId=autoEntryId(新前缀)，然后执行 renameEntry(oldId, newId)：
   · 磁盘（rootPerm=ready 时立即做；否则记入覆盖层待 flush 补做，见下）：
     - 旧 .md 删除（deleteEntryFile(oldId)），新 .md 写入（writeEntryFile）；
     - media/<map>/<oldId>/ → media/<map>/<newId>/：FS API 无目录改名，逐文件读→写新路径→删旧；
       map 同时变化时新目录的 map 段也换。旧目录空了尝试删。
     - 扫描全部条目 related 数组与 tactics/*.md uses 数组，含 oldId 的替换为 newId 并写回
       （走 persistEntryEdits+writeEntryFile，纳入 I19 覆盖层语义）。
   · 浏览器侧（无论权限状态，立即做）：
     - pb-favs：数组内 oldId → newId；
     - pb-entries-v1：edited[oldId] 迁到 edited[newId] 并加 _renamedFrom=oldId，savedAt/written
       键同步迁移；oldId 加入 deleted（待 flush 删旧 .md）；
     - IndexedDB pending-images：键 `${oldId}/${slot}` 重 put 为新键、删旧键（无权限也可做）；
     - pb-retired-v1 搁置区条目键同步迁移（若有）；
     - 内存 data.entries 与 diskEntries 同步换 id。
   · toast：「id 已自动改为 {newId}，图片与引用已同步迁移 ✓」。
2. 权限过期（need-permission）时的改名：磁盘部分挂起——_renamedFrom 使 flushPendingEntries 在
   重新授权后：写新 .md、删旧 .md、迁移 media 文件夹（列出所有 _renamedFrom 逐个处理）、重写
   related 引用文件。挂起期间徽标正常显示待写入。
3. 迁移原子性与可重试：先算好映射再逐项执行；某步失败即停并 toast 列出已完成项；重新触发
   renameEntry 对已迁移项幂等（新 .md 已存在且旧已删则跳过）。
4. 起点/目标/标题等其余字段改动**永不触发改名**（编号语义稳定）。

四、存量修复（执行本包时跑一次，解掉当前 bat 阻断）
1. 写一次性脚本扫全部 data/entries/*.md：id 前缀 vs frontmatter side/type 不符的清单——已知
   mirage-t-smoke-12（side:CT）→ 按第三节同规则自动改名迁移（.md/media/引用）；预期仅此一例，
   若有其余逐条同法处理，脚本输出每条 old→new 与迁移文件数，用完删除脚本。
2. 处理后 lint 必须 0 ERROR（mirage-t-smoke-13 缺图 WARN 保留）；跑 build+pack 确认 bat 恢复可用。

五、规范与文档
1. AGENTS.md §3.1 id 规则段改写为：「id 由系统自动生成与维护：<map>-<side>-<type>-<两位序号>，
   新建零输入；改 map/side/type 时自动改名并迁移全部关联（.md/media/related/tactics/浏览器本地键）。
   用户无需感知 id。手动自定义仅高级模式。id 不含语义（起点/目标/标题随意改，不影响 id）。」
   删除原「id 提交后不改」句，补一句「改名迁移由工具保证引用一致；朋友修改包按 id 匹配，改名后
   旧修改包中的同条目会按新条目导入（-f2 后缀），可接受」。
2. help.html 不需要改动（id 对用户不可见后无解释必要；如文中提及 id 则删该句）。
3. lint 的 id 前缀 ERROR 保留作最后防线（正常流程不应再触达）；pb.py entry_id_pattern 逻辑不变。

六、收尾
pb lint（0 ERROR）/ build / pack；?v= 自动递增；一次性脚本清理；
完成后 docs/PROGRESS.md 执行记录表末尾追加一行并更新「当前状态」（含：建议 CHECK-01 在本包后执行）。

红线：不引入第三方依赖、file:// 直开；迁移逻辑必须幂等可重试；除第四节存量修复外不批量改任何
现有条目数据内容；I19 覆盖层退役/搁置/读-改-写语义与 I34 编辑器读盘逻辑不动（改名只新增
_renamedFrom 挂起机制）；分拣台其余行为（I29/I30/I31/I33）不动。

验收清单（逐项自检，浏览器自动化优先）：
- [ ] autoEntryId：前缀随 side/map/type 正确（含 CT 行）；序号跳号（占用 01/03 时给 02）；
      99 号兜底路径可构造验证；分拣台 CT 行不再生成 -t- 前缀
- [ ] 新建零输入：折叠高级模式默认自动 id；手改 id（idTouched）时原校验生效；三条新建路径
      （编辑器/分拣台/朋友导入）全走自动
- [ ] 改 side 迁移（ready 态）：T→CT 保存后 .md 改名、旧文件删、media 文件夹逐文件迁移、
      related 引用条目 .md 同步改写、pb-favs/pending-images 键迁移、页面立即可见新 id 条目；
      toast 报新 id
- [ ] 改 side 迁移（need-permission 态）：磁盘挂起、徽标亮；模拟 🔑 后 flush 补齐全部磁盘步骤
      （新 .md/删旧 .md/media 迁移/related 重写）；重试幂等（重复 flush 不报错不重复）
- [ ] 改 map 同时改 side：media 新目录 map 段正确
- [ ] 起点/目标/标题修改不触发任何 id 变化（前后 .md 仅相应字段变化）
- [ ] 存量修复：mirage-t-smoke-12 → mirage-ct-smoke-12（或下一个空号）迁移完成；lint 0 ERROR；
      build+pack 成功；全量扫描输出无其他违例
- [ ] 台账执行行含 CHECK-01 顺序建议；一次性脚本零残留；控制台零报错
用户侧确认清单：
- [ ] 网页里新建一颗道具：全程没让你填 id；改阵营保存后编号自动变对
- [ ] 双击「同步并打包.bat」恢复正常（不再报 ERROR）
```

---

## 给用户的说明（大白话）

**以后 id 的事你彻底不用管了：**
- **新增道具**：不填任何编号，系统自动给（mirage-ct-smoke-04 这种，序号自动往后排）；
- **改阵营/地图/类型**：编号前缀自动跟着变，而且**所有相关的东西自动搬过去**——条目文件、
  图片文件夹、别处对它的引用、你的收藏，一次到位；
- **改起点/目标/标题**：随便改，编号不动（编号只是内部档案号，不承载含义——你看到的永远是
  标题和起点→目标，这样才不会改个目标就把引用全断掉）；
- 顺带把现在卡住「同步并打包」的那个错误（12 号条目阵营改了编号没跟）自动修掉。

**执行顺序建议**：I34（另一个会话刚建的"编辑器打开读最新文件"包）→ 本包 I35（解打包阻断）→
CHECK-01 体检。

## 变更记录

| 日期 | 会话 | 记录 |
| --- | --- | --- |
| 2026-10-03 | 规划 | 创建本开发包（用户诉求：id 随详情自动改/自动序号/别再卡住；I34 编号已被"编辑器读盘"包占用，本包顺延 I35）。复用 I24 sortAutoId 推广全入口 + 改名全量迁移机器（磁盘/媒体/引用/浏览器键，含权限过期挂起 flush 补做）+ 存量修复 mirage-t-smoke-12 解 bat 阻断；AGENTS §3.1 id 规则改写 |
