# CHECK-01 全局联动检查 — 提示词（新会话直接粘贴执行）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴。
> 性质：只读检查（代码 + 数据 + 功能联动），产出报告，**不顺手修改任何项目文件**（发现问题分级记录，
> 修复另立开发包）。
> 创建：2026-10-03，规划会话（基于当日实测现状锚点编写）。

---

## 粘贴提示词

```text
对 CS2 Playbook 项目做一次全局联动检查（CHECK-01）。你在 D:\AI agent\ZCode data\CS2。

总则（先读）：
1. 先读 AGENTS.md（最高规范：§3.2 数据一致性铁律、§十 来源档含 friend、§九 包结构）、
   docs/PROGRESS.md 全文、docs/iterations/ITER-I19 至 I33 的变更记录与验收清单。
2. 一切结论只认内容验证：grep / diff / 脚本实测输出，不引用台账或迭代包里的"声称已执行"。
   台账声明与实测不一致的，单独列进「台账诚实性」一节。
3. 你只写两样东西：docs/CHECK-01-报告.md 和 docs/PROGRESS.md 末尾的执行记录行。
   不改任何代码/数据/配置；临时比对脚本放临时路径，用完删除；测试数据零残留。
4. cmd 输出中文可能乱码（GBK/UTF-8），中文逻辑一律写 .py 文件加 -X utf8 执行。

当前状态锚点（2026-10-03 实测，用于起点核对，若与你的实测不符以你的为准并记录）：
- 迭代 I19–I33 全部已执行；条目 41（Dust2 28 + Mirage 13）；报点 10 图 509 点；?v=86（自动递增）；
- build/data.js builtAt=2026-10-03T04:49:33Z；磁盘 41 条 id 与 data.js 集合一致（字段级漂移未核）；
- 已知矛盾①：台账当前状态称 lint 0 ERROR/1 WARN，实测 1 ERROR/1 WARN——
  mirage-t-smoke-12.md 的 side:CT 与 id 前缀 mirage-t- 不符（疑似浏览器端新建后改阵营，
  编辑器仅 isNew 时校验 id 前缀，事后改 side 不复检——需核实代码确认这条漏洞链）；
- 已知矛盾②：data.js builtAt 为今晨 04:49，若其后存在浏览器写回（如该条 checked=2026-10-03），
  则 data.js 落后磁盘——列出「构建后写回」条目清单。

一、代码一致性（静态）
1. 双端对称抽查：app.js throwBadge ↔ pb.py 徽章组合（全枚举 + 自定义 move「蹲下」各抽一组，
   两边输出必须同串）；EDITABLE_SLOTS/slotLabel ↔ SLOT_LABELS/EXTRA_SLOT_LABELS；
   dumpEntryMd ↔ pb.py load_doc/dump_doc 互逆——写脚本对全部 41 条 .md 做
   parse→dump→与原文件比对（列出差异行；无害差异如尾空行可归白名单）。
2. 枚举一致性：click/move/action/side/type/phase/status/source.kind 在前端下拉与校验
   ↔ pb.py ENUMS/lint 分级（ERROR vs WARN）逐项对照，标出任何单边收紧/放松。
3. I19 机制完整性复验（grep+读代码）：builtAt 统一 UTC「YYYY-MM-DDTHH:MM:SSZ」；
   覆盖层 savedAt/written 新结构在所有读写出口一致；retireStaleOverrides 对无 builtAt 的保守行为；
   writeCalloutsFileNow 读-改-写（磁盘解析失败必须中止）；flushPendingEntries；ef-save 的
   diskEntries 基线；?v= 自动 bump 在 cmd_build 与 cmd_pack 两条路径都生效（解包最新 dist zip 核对
   其 ?v 与 builtAt 是否同源）。
4. 声明完整性回归（本项目历史四连删事故：fsHandle/fsStatus/EDITOR_KEY/fsWriteTimer）：
   写脚本扫描 app.js 全部顶层 let/const 声明 vs 标识符使用点，列出「使用了但未声明」与
   「声明了从未使用」两类。
5. 死代码与孤儿引用：app.js 函数定义 vs 调用次数（零调用的列出）；index.html 每个 id 挂载点
   ↔ getElementById/querySelector 命中；style.css 类名抽样比对 innerHTML 拼接（.imp-* .pick-* 等新段）。
6. 新功能交叉点（I22–I33 重点读代码）：I29 素材范围过滤+地图排序与 I23 阵营过滤、类型过滤的
   交集逻辑是否互相覆盖重置；I30 ⧉ 复制还池的 id 生成是否校验唯一性（与 mirage-t-smoke-12 同类
   的 id 漏洞面）；I31 空备注自动生成 oneline 的触发条件与 lint 规则一致性；I32 图片全路径
   在 file:// 与 dist zip 相对路径两种场景的正确性；I33 选点双向写回对 spots/origin/target
   三字段与报点表的绑定。

二、数据一致性（写脚本跑，输出进报告）
1. 41 条条目全字段 diff：data/entries/*.md ↔ build/data.js（逐字段：oneline/origin/target/spots/
   click/move/action/phase/difficulty/tags/related/source/checked/status），不只比 status；
   结合 builtAt 给出「构建后写回待重建」清单。
2. callouts.json ↔ data.js：10 图逐点 name/u/v/search diff。
3. id 与 side 一致性全量核查：每条 id 前缀 {map缩写}-{side}-{type}- 与 frontmatter side/type 是否
   吻合（已知 mirage-t-smoke-12 违例，查是否仅此一例）；id 目标段为纯数字（如 -12/-13）的清单
   （命名质量 WARN，不影响运行）。
4. media/ ↔ 条目 images 对账：孤儿图（文件存在无条目引用）、缺基础 3 图清单（应与 lint WARN 一致）、
   .bak 残留、I32 全路径引用抽查 10 张实际可打开。
5. spots/origin/target 悬空名核查：每个值在对应地图 callouts 的 name/search 里按前端 strictSpotMatch
   语义能否命中，列出命不中的值及所属条目。
6. tactics/ uses 断链；maps.json ↔ assets/radar 文件存在性 ↔ data.js maps 段（Train duty=false、
   Cache 未注册与台账一致）。
7. dist 最新 zip 解包抽核：文件数/总大小 vs 台账（185 文件 163.4MB）；help.html 与使用说明.txt 在包内；
   包内 build/data.js 的 builtAt 与项目当前一致；包内不含 data/、tools/、tactics/ 源。
8. 卫生：tools/ 与 build/ 下一次性 _*.py 清单；_archive/mirage-v1/、build/staging-i27/ 完好且不被
   lint/pack 波及；「文件夹批量录入」等待处理素材目录状态。

三、功能联动（浏览器实测；能自动化的自动化，需要真实授权的列成用户清单）
1. 首页链路：默认图打开 → 点报点 → 条目过滤（含 Mirage 13 颗新条目组合）→ 详情翻图面板 →
   lightbox 缩放/翻图 → Esc 语义链（关 lightbox→清筛选→回列表→切 Tab）逐级核。
2. 编辑链路端到端（临时测试条目，结束删净）：新增→校验 id 前缀（含故意改 side 复现
   mirage-t-smoke-12 漏洞，确认后记录为待修项）→改字段保存→磁盘 .md diff 正确→标实测 checked
   当天→删除→.md 同步删除。
3. 覆盖层对账三通道（伪造 localStorage 实测）：旧 savedAt→退役进 pb-retired-v1→⚙ 可导出；
   pending→🔑 恢复→flush 全通道→徽标清零；无 builtAt 保守不退役。
4. 回流闭环（临时演练）：📤 导出结构合法（含 base64 图）→📥 导入→draft 强制/status 不被覆盖/
   同名报点坐标不动→演练后磁盘零残留（entries/callouts/media 与演练前 md5 一致）。
5. help.html：⚙→📖 可开、六问答齐全、无开发术语（grep localStorage/data.js/API/JSON）。
6. I29/I30/I33 分拣台按各自 ITER 验收清单抽 3 项复测（过滤、⧉ 还池、选点写回）。
7. 全程 console 零报错记录。

四、产出（docs/CHECK-01-报告.md）
1. 结构：总评一句话 → 三个等级问题清单（ERROR=阻断 build/数据错误/功能不可用；WARN=应修；
   INFO=记录）→ 每条附证据（文件:行 / diff 输出 / 截图）、影响面、建议修法（是否需要新 ITER）→
   「台账诚实性」专节（声明 vs 实测差异）→ 用户侧确认清单（需要真人/真实授权才能验的）。
2. 报告写完：docs/PROGRESS.md 执行记录表末尾追加一行（会话=检查），当前状态加
   「最近体检：CHECK-01（2026-10-03）结论一句话」。
3. 报告若含 ERROR 级问题：建议的下一个迭代包编号（接 I34 起），只建议不动手。
```

---

## 给用户的说明

这次检查是"全局联动体检"：不只查单个功能，重点查**三层之间是否对得上**——代码层（网页和工具
两套逻辑必须镜像一致）、数据层（源文件 ↔ 网页数据文件 ↔ 发布包逐字比对）、功能层（按你实际
使用的路径整条走通）。已经替检查会话备好了两条已知线索（台账说 0 错误但实测 1 错误的矛盾、
改阵营不改 id 的漏洞），它去核实并顺藤摸瓜。

## 变更记录

| 日期 | 会话 | 记录 |
| --- | --- | --- |
| 2026-10-03 | 规划 | 创建 CHECK-01 检查提示词（锚点实测：I19–I33 完成、41 条、?v=86、lint 实测 1E/1W 与台账 0E 矛盾、mirage-t-smoke-12 side/id 不符线索） |
