# CHECK-01 全局联动检查报告

> 检查日期：2026-10-03 ｜ 会话：开发（只读检查，未修改任何项目文件）
> 方法：静态脚本（数据 diff/声明扫描/grep）+ 浏览器实测（mock FS + 真实盘文件混合）+ dist 解包抽核
> 锚点核对：条目 41（Dust2 28 + Mirage 13）｜报点 10 图 509 点｜?v=96｜lint 0 ERROR / 1 WARN——与 CHECK-01.md 锚点一致，唯 lint 状态已从「1 ERROR」变为 **0 ERROR**（mirage-t-smoke-12 已由 I35 存量修复改名 mirage-ct-smoke-12，见执行记录）

---

## 总评

**项目处于健康可发布状态。** 已知矛盾①（mirage-t-smoke-12 side/id 不符）已由 I35 存量修复闭环并经 lint/build/pack 验证；已知矛盾②（构建后写回）实测不存在（41 条 .md ↔ data.js 全字段一致）。历史四连删声明完好、I19 对账机制 12 项 grep 全过、双端徽章 63 组合全同串、报点 10 图逐点一致、dist 包与 build 同源。发现 1 项 WARN 级遗留（v1 孤儿 media 目录）与若干 INFO 级记录，均不阻断使用与发布。

---

## 一、代码一致性（静态）

| 检查项 | 结论 | 证据 |
| --- | --- | --- |
| 徽章双端对称（app.js throwBadge ↔ pb.py throw_badge） | **✓ 63 组合全同串**（3 阵营×7 移动×3 投掷） | 脚本全枚举对比：键集 js=py=[crouch,run,shift,shift-w,stand,w,walk-step]，63 组合输出逐串相同 |
| move 枚举含 crouch（I28/I35） | ✓ 双端一致 | js M 表与 py BADGE_MOVE 均含 `crouch:"蹲下"` |
| pb.py ENUMS 七类 | ✓ 与前端下拉/校验一致 | side/type/click/move/action/phase/status/source.kind 全列核对 |
| I19 机制 12 项 grep（builtAt UTC/覆盖层结构/保守退役/读-改-写中止/flush/diskEntries 基线/bump 双路径/I34 读盘/I35 renameEntry/_renamedFrom） | ✓ 全部命中 | grep 输出（无 ✗） |
| 历史四连删声明（fsHandle/fsStatus/EDITOR_KEY/fsWriteTimer） | ✓ 全部声明且在用 | 声明+引用计数 13/17/11/6 |
| 可疑未声明调用 | 无真实违例 | 去串/注释后扫描的命中均为嵌套函数、局部变量、浏览器 API 或关键字（脚本正则固有误报，已人工复核排除） |
| app.js 内零引用声明 | 3 项 INFO：`PLAYER_COLORS`（I17 前遗留常量）、`onSyncBadgeClick`（由 index.html 内联脚本调用，跨文件正常）、`openLightbox`（兼容旧接口保留） | 不影响运行 |
| index.html 挂载点 | ✓ 全部命中或为纯 CSS 钩子 | footer/main/topbar 无 JS 引用属正常 |
| I33 选点白名单回归 | ✓ openSpotPicker=["origin","target"]；编辑器三页签默认形态不变 | 静态 + 浏览器实测 |

## 二、数据一致性

| 检查项 | 结论 |
| --- | --- |
| 41 条 .md ↔ data.js 全字段 diff（oneline/origin/target/spots/click/move/action/phase/difficulty/tags/related/source/status/side/type/checked/notes） | **41 条全字段一致，无构建后写回漂移**（已知矛盾②实测不存在） |
| callouts.json ↔ data.js | 10 图 509 点逐点 name/u/v 一致 |
| id 前缀 ↔ side/type 全量核查 | **违例 0**（mirage-t-smoke-12 已改名 mirage-ct-smoke-12） |
| 数字尾号 id（INFO） | 13 颗（mirage-t-smoke-01..13，分拣台自动编号正常产物） |
| tactics uses 断链 | 无（tactics 目录空） |
| maps.json：Train duty=false ✓；Cache 未注册 ✓（与台账一致） | ✓ |
| spots/origin/target 悬空名 | 无（全部命中报点表 name/search） |
| dist 最新 zip（185 文件 163.4MB） | ?v=96 三处一致、builtAt 与 build 同源（2026-10-03T07:35:46Z）、help.html 与使用说明.txt 在包内、**不含 data/ tools/ tactics/** |

## 三、功能联动（浏览器实测）

| 链路 | 结论 |
| --- | --- |
| 首页：默认图（荒漠迷城，I29 排序首）→ 52 报点标签 → 点报点过滤 → 详情翻图（1920 图加载）→ lightbox → Esc 分级链（关 lightbox → 清筛选 → 回列表 → 切战术板，逐层独立） | ✓ 全通 |
| Mirage 13 颗组合过滤 | ✓ |
| 编辑链路端到端（新建/改字段/保存/磁盘 diff） | ✓ 于 I34/I35 验收轮实测（含 mock FS 真实盘文件读取） |
| 覆盖层对账三通道（退役入搁置/挂起 flush/无 builtAt 保守） | ✓ 于 I19/I28/I34/I35 各轮实测（本轮抽查搁置区徽标触发正常） |
| 回流闭环（📤 结构/📥 draft 强制/status 不覆盖/同名报点不动） | ✓ 于 I20 验收轮实测（本轮未重复演练，引用该轮记录） |
| help.html | ✓ 可开、六问答、**零开发术语**（grep localStorage/data.js/API/JSON 无命中） |
| I29 池过滤 / I30 ⧉ 复制 / I33 选点写回 抽测 | ✓ 全过（详见会话执行输出） |
| 控制台 | 全程零报错 |

## 台账诚实性

| 台账声明 | 实测 | 结论 |
| --- | --- | --- |
| lint 状态 | 曾称 0 ERROR，实测曾 1 ERROR（mirage-t-smoke-12）→ I35 存量修复后 **0 ERROR / 1 WARN** | **已一致**（该矛盾即 I35 修复项，闭环） |
| 「4 颗 CT 烟 side 回 T」（I28 记录） | 用户澄清四颗本就是 CT，I28 后修正行已记录，磁盘现为 side:CT + ct- 前缀 id | **已一致** |
| 「41 条磁盘 id 与 data.js 集合一致」 | ✓ 复核通过 | 一致 |
| I19–I33 各迭代「已执行」声明 | 抽查 12 项 grep + 功能联动全部与声明相符 | **一致** |

## 用户侧确认清单（需真人/真实授权）

1. 🔑 重新授权项目文件夹 → 编辑器打开旧条目应显示盘上最新值（I34）；
2. 网页新建一颗道具全程无需填 id；改阵营保存后编号自动变对、图片/收藏跟着迁移（I35）；
3. 双击「同步并打包.bat」全流程跑通（lint 0 ERROR 已确认，bat 即 build+pack）；
4. 游戏内实测各 draft 条目（Mirage 13 + Dust2 10）后网页标记 verified；mirage-t-smoke-13 补 2-aim/4-result 图（消掉最后 1 WARN）。

## 建议的后续迭代（仅建议，未动手）

- **无 ERROR 级遗留**，无需紧急修复包。可选优化项（均 INFO）：v1 孤儿 media 目录清理（并入下一内容批次顺手做）；`PLAYER_COLORS` 死常量清理；CHECK-02 在 Mirage 批次润色完成后复检。
