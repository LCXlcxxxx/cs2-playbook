# 迭代 R3 开发包 — 内容冲刺（功能冻结期，2026-10-24 启动）

> R3 不是代码迭代：**功能冻结**——查看器与工具不加新功能，主体是使用者按批次冲内容
> （实测转 verified / 补录 / 建套装），开发会话只按第五节「允许清单」介入。
> 启动前置已满足：R0→R2-B 全部落地，整体健康复查通过（2026-10-24 规划会话实测：
> pb test 22/22、lint 0E/0W、git 工作区 clean）。

## 一、现状盘点（2026-10-24 实测，临时脚本 build/_r3_stats.py，批次 0 收编后删除）

总量 **80 条 / verified 66（82%）/ draft 14**；全部条目三图齐全（无缺图）。

| 图 | 条目 | verified | draft | T / CT | 明显缺口 |
| --- | --- | --- | --- | --- | --- |
| de_dust2 | 32 | 18 | **14** | 21 / 11 | draft 全在此图；CT 侧火/延迟烟待查缺 |
| de_mirage | 27 | 27 | 0 | 24 / **3** | CT 侧几乎空白（仅 2 闪 1 烟） |
| de_inferno | 21 | 21 | 0 | 17 / **4** | CT 侧薄弱 |
| Ancient / Nuke / Anubis | 0 | — | — | — | 整图零覆盖（选图率 11.2 / 10.5 / 8.1%） |
| Cache | 0 | — | — | — | maps.json 未注册、无雷达无报点（选图率 6.6%） |

- **套装（sets）仅 1 个**：Mirage「A包爆弹三件套」4 条全 verified。R2-B 开战连翻已就绪——
  套装就是喂它的弹药，这是 R3 最高性价比的产出。
- **draft 14 条清单（全部 Dust2）**：dust2-ct-flash-02 / dust2-ct-flash-b-retake / dust2-ct-he-02 /
  dust2-ct-molly-short-rush / dust2-ct-smoke-a-door-retake / dust2-ct-smoke-long-delay /
  dust2-t-flash-02 / dust2-t-flash-a-long / dust2-t-flash-a-main / dust2-t-flash-b-exec /
  dust2-t-molly-a-site / dust2-t-molly-car / dust2-t-molly-goose / dust2-t-smoke-02
- docs/CONTENT_IDEAS.md 的选图率表「现有条目数」列是 2026-10-02 时点（18/0/0），**以本表为准**；
  其各图补全清单（第二~八节）与 B 站素材 BV 库仍有效，取缺前先对照当前条目（部分建议已被录入，
  如 dust2-t-molly-goose 就在 draft 清单里）。

## 二、目标与验收（里程碑）

**里程碑 A：三图满编成体系（R3 主目标）**

- [ ] Dust2 draft 清零（32/32 verified）
- [ ] 每图 ≥2 个套装、成员全 verified：
      Dust2＝A包爆弹 / B包爆弹 / 中门默认；Mirage＝现有 A包 + B包 + 中门；Inferno＝B香蕉 / A公寓
- [ ] CT 侧补强：Mirage CT 3→≥8 条、Inferno CT 4→≥8 条、Dust2 CT 对照 CONTENT_IDEAS 第二节查缺
      （延迟烟 / 防 rush 火 / 回防闪）
- [ ] 全程 lint 0E/0W、pb test 22/22 维持；每批完成双击「同步并打包.bat」

**里程碑 B：图池扩展（弹性，按游戏兴趣推进）**

- [ ] +1 张新图（Ancient 或 Nuke，按选图率 11.2%≈10.5% 与个人偏好选）≥15 条起步，
      其中 1 个核心套装全 verified
- [ ] Cache 注册（maps.json + 雷达 ≥1024px 带许可 + 报点表）视余力——注册完成前不录入条目

里程碑 A 达成即视为 R3 收官可解冻；B 不阻塞解冻。

## 三、批次清单

| 批次 | 内容 | 执行者 | 验收 |
| --- | --- | --- | --- |
| 0 | 内容工具 + 旧账核查（第四节提示词） | 开发会话 | report 看板段落地；I42 销账或修复 |
| 1 | Dust2 14 条 draft 实测转 verified + 建 Dust2 三套装 | 使用者 | Dust2 32/32 绿、≥3 套装 |
| 2 | Mirage / Inferno 套装补齐（每图 ≥2） | 使用者 | 套装成员全 verified；📦 只看 + 开战连翻每套装走查 |
| 3 | CT 侧补强（Mirage / Inferno / Dust2 CT 查缺） | 使用者（抽帧→draft→实测） | 里程碑 A 第三项达标 |
| 4 | 新图起步（Ancient 或 Nuke 15-20 条 + 1 套装） | 使用者 + agent 抽帧通道 | ≥15 条、核心套装全绿 |
| 5 | Cache 注册（弹性） | 开发会话 + 使用者 | maps.json / 雷达 / 报点就绪 |

顺序建议 0→1→2→3→4→5；批次 1/2 的主体就是进游戏实测（工作流见第六节），随时可穿插进行。

## 四、批次 0 粘贴提示词（开发会话）

```text
按 AGENTS.md 执行 R3 批次 0（内容工具 + 旧账核查；R3 功能冻结例外清单第 2/3 项，见
docs/iterations/ITER-R3.md 第五节）。开工三查：pb test 22/22 全绿 / git status 干净 / lint 0E/0W
（git 不在 PATH，全路径 "%LocalAppData%\Programs\Git\cmd\git.exe"）。

1. pb report 增「内容看板」段（纯 tools/pb.py 输出，不动查看器，不违反功能冻结）：
   - 地图 × status 汇总（条数 / verified / draft / verified 占比）+ 全库转化率一行
   - 地图 × side × type 计数表
   - sets 清单（名称 / 条数 / verified 数）
   - 与 build/_r3_stats.py（R3 规划会话临时脚本）输出逐项交叉核对一致后，删除该临时脚本（零残留）。
2. I42 归档判定核查：读 assets/js/pb-sortdesk.js 的 sortMaybeMoveGroup 现实现，判断是否仍存在
   「素材池状态过期时提前归档」缺陷；已知修法 = 「池无剩余 && 磁盘数==本批入坑数」双条件才归档。
   仍缺 → 按修法修 + tools/tests/run_tests.py 补一个归档判定回归用例；
   已修 → 台账记「I42 无遗留」销账。（若需动码只碰 pb-sortdesk.js 与 run_tests.py。）
3. 完成后 PROGRESS.md 台账行 + git 提交（五步缺一不可）；?v= 若 build 触发照常自动递增。
```

## 五、开发会话允许清单（功能冻结例外，其余一律不做）

1. bug 修复（走正常小迭代五步）
2. pb report 内容看板段（批次 0）
3. I42 归档判定修法（批次 0 核查后决定修或销账）
4. Cache 注册基建：maps.json 登记 + 雷达入库（来源许可写 maps.json）+ 报点表（批次 5）
5. 素材抽帧批量入库 agent 通道（docs/RECORD.md 既有通道，批次 3/4 使用）
6. 分拣台录入体验优化（**ITER-R3-L1，单包封顶**：只碰 pb-sortdesk.js + pb-editor.js 选点扩展点 +
   pb.py callouts 拼音注入 + style.css + tests + UI.md；2026-10-24 用户拍板，批次 3/4 前磨快管线）
7. 道具行三簇重排 + 缩略图墙（**ITER-R3-L2，单包封顶**：只碰 pb-list.js + pb-detail.js 的 lbCtx.nav
   轻量扩展 + style.css + tests + UI.md，零共享文件；2026-10-24 用户带截图拍板。**与 L1 串行执行**——
   两包共享 style.css 与 run_tests.py）

R3 收官（里程碑 A）后解冻，回到小步功能迭代。

## 六、使用者工作流（零命令行，手册级细节见 docs/RECORD.md）

- **实测转化**：进游戏复现 → 该条详情页点状态徽章两段确认 → 自动记 checked 日期 →
  顶栏出现「● 修改待写入」后双击「同步并打包.bat」。没把握就留橙，别急着标绿。
- **建套装**：管理模式开条目编辑器 → 「战术包」chips 输入套装名（有全库自动补全）→ 保存 →
  📦 只看视图核对成员 → 开战连翻（📦 行进入、J/K 逐张翻、Esc 退）实战自测一遍。
- **批量补录**：分拣台通道——素材截图按「子文件夹=地图中文名」放「文件夹批量录入」，
  点图入坑、「全部导入」；已实测的勾着导入即绿。
- **素材红线**（AGENTS.md 十 + CONTENT_IDEAS 第九/十节）：
  - 视频只用 **tatukunn / 冷锋横屏**画面，发布 ≥2024-10 的 CS2 版本；祖灵/蒋道具竖屏源 pass
  - 抽帧入库一律 **draft**，自己实测过才 verified（checked 日期必填）
  - CS2 机制注意：HE/火可吹散烟雾——CSGO 时代「烟里留缝」类点位大量失效，老材料必须实测复核
  - 换源重录：draft 条目若素材源不达标（竖屏/过旧），先用横屏源抽帧替换三图再实测，署名跟随新源

## 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-10-24 | 创建（R3 规划会话）：现状盘点 80 条 = verified 66（82%）/ draft 14（全 Dust2）；套装仅 1 个；Mirage CT 3 / Inferno CT 4；Ancient/Nuke/Anubis/Cache 零覆盖。定批次 0-5 与里程碑 A/B、冻结例外允许清单；同会话补记 R2-B 台账行（该会话漏记）、刷新 PROGRESS.md 当前状态 |
| 2026-10-24 | 第五节增第 6 项：分拣台录入体验优化（ITER-R3-L1，单包封顶）——用户拍板「按推荐组合来」；含 source 署名缺口修复（视频素材此前被硬编码标自录）；详见 ITER-R3-L1.md 变更记录 |
| 2026-10-24 | 第五节增第 7 项：道具行三簇重排 + 缩略图墙（ITER-R3-L2，单包封顶）——用户带截图拍板（行中段 ~40% 空白 + 实战要缩略图快速浏览）；与 L1 串行执行；详见 ITER-R3-L2.md 变更记录 |
