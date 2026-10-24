# 迭代 I37 开发包 — 搜索支持拼音首字母/全拼（cz 修正版：窗户烟=chy）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 背景：用户速查场景想要「打字母不打汉字」——比赛里切输入法慢。定稿交互：搜索框**汉字/全拼/首字母三种混打**，
> 例：「窗户烟」打 chy、「警家烟」打 jjy、「A门烟」打 amen、「匪口过点烟」打 fkgdy。
> 方案取向：**拼音索引在 build 期生成**（pb.py 按 tools/pydict.json 字典给每条道具算好，写进 data.js），
> 运行时 app.js 只做字符串匹配——查看器保持零依赖，运行时不引任何拼音库。

## 根因/现状速览（已核实，2026-10-04）

- 搜索匹配在 `entryMatch`（app.js ~816-849）：`hay = hayOf(e)`，然后 `hay.includes(state.search.toLowerCase())`——纯汉字子串。
- `state.searchTerms`（点击报点产生的中文多词过滤）走同一 hay，**不动**。
- build 端条目装配在 pb.py `build_data`（~623-628 `item = dict(fm); item.update({...})`），在此注入拼音字段。
- 零依赖约束：不能引运行时拼音库；方案=**build 期字典**（tools/pydict.json，纯数据文件，pb.py 仍单文件代码+json 标准库读取）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I37（搜索支持拼音/首字母）。改 tools/pb.py、新增 tools/pydict.json、assets/js/app.js。
动手前先读：docs/iterations/ITER-I37.md 根因速览、pb.py build_data 条目装配段（~620-630）与 report 生成段、
app.js entryMatch（~816-849）与搜索框 placeholder（index.html）。

一、生成 tools/pydict.json（纯数据：{"字":"pinyin"}，无声调小写）
1. 从 data/entries/*.md 提取 title / origin / target / oneline 里的全部 CJK 字符去重（预计 200-400 字）。
2. 逐字写拼音写入 pydict.json；多音字取道具语境常用读法（如「行」xíng；读错后果只是搜不到，汉字搜索兜底）。
   汇报：总字符数、清单。后续新增字符未入典 → build 不报错，report.md 加 WARN 列出未覆盖字符（新增此逻辑），
   未覆盖字在 pyf 里保留原字符、pyi 里跳过（汉字搜索不受影响）。
3. pb.py build 时读 tools/pydict.json（json 标准库，文件缺失视为空字典并 WARN）。

二、build 注入拼音字段
1. build_data 每条目 item.update 增加 "pyf" 与 "pyi" 两个数组，与三个字段一一对应：[title, origin, target 展示串
   （数组用原字符连接）]。规则：CJK 字→字典拼音（pyf）/首字母（pyi）；非 CJK 字母数字原样小写进两者；标点丢弃。
2. 战术板/报点不加拼音（v1 范围外）；report.md 输出「拼音索引：N 条目 / 未覆盖字符 X 个」。
三、app.js 匹配
1. 新增 pyHit(e, q)：q 仅含 [a-z0-9] 且长度≥1 → (e.pyf||[]).some(f => f.includes(q))；
   q 长度≥2 → 再加首字母子序列匹配 (e.pyi||[]).some(f => isSubseq(q, f))（双指针，按序不必连续——
   「警家补A二楼烟」的首字母里能按序找到 jjy）。
2. entryMatch 搜索分支（~845）改为：const q = state.search.toLowerCase();
   return hay.includes(q) || pyHit(e, q)。searchTerms 分支、tacticMatch、filterByCallout 全部不动。
3. 搜索框 placeholder 追加「，支持拼音首字母」（index.html；?v= 由 build 自动递增）。

四、回归与验收（逐项自检，Ctrl+F5 强刷后）——**2026-10-04 执行完毕，全过**
- [x] data.js 中抽查 pyf/pyi 与标题读音一致：51 条全量注入（dust2 警家烟 pyi 含 "jjy"）
- [x] 搜索实测：jjy→警家补A2楼烟、amen（Dust2）→A门烟 等 6 条、fkgdy→匪口过点烟；**chuang 全库无含窗条目**（pyf 无 chuang 字段，如实标注——「如有」条件不成立，规则由前三例覆盖）
- [x] 汉字搜索（警家=1）、英文搜索（jame=1）、类型/阵营/报点过滤、收藏置顶、列表分组、Esc 清空全部零回归
- [x] 搜索时战术板报点相关性与道具列表一致（entryMatch 同管线；I38 联动实测：搜索无结果→地图图标同步清零）
- [x] report.md「拼音索引：条目 51 条；字典全覆盖」无 WARN；lint 0 ERROR；build/pack 通过（cs2-playbook-20261004.zip）；控制台零报错
- [x] PROGRESS.md 追加执行记录并更新当前状态

执行验收中修的两个 bug：isSubseq 遍历对象写反（f 数组 vs q 串）；write_report pinyin 解构错（曾输出「未覆盖字符 5 个：cnouv」）。

红线：不引入任何运行时第三方库/CDN；不动 searchTerms 与报点过滤语义；tools/pydict.json 是纯数据文件
（pb.py 代码仍单文件+标准库）；不碰 tactics 渲染（那是 I38）。
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-04 | I37 | 创建：搜索支持拼音——build 期用 tools/pydict.json（纯数据）给每条道具算 pyf（全拼）/pyi（首字母）写进 data.js，app.js 搜索分支加 pyHit（全拼子串 + 首字母子序列，长度≥2），汉字/英文搜索零回归。例：窗户烟=chy、警家烟=jjy、A门烟=amen、匪口过点烟=fkgdy。运行时零依赖 |
| 2026-10-04 | I37 | **执行完成**（?v=120，pack cs2-playbook-20261004.zip，lint 0E/0W）：pydict 391 字全量注入 51 条、report「字典全覆盖」；验收修 isSubseq 参数反 + write_report pinyin 解构错两 bug；jjy/amen/fkgdy/汉字/英文实测全过（chuang 无含窗条目，条件不成立）；验收清单全勾 |
