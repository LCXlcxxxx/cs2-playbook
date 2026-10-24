# CS2 Playbook — 道具速查与战术板

> 本文件是项目的最高规范：所有构建、改版、录内容都必须遵守。
> 使用场景：CS2 游戏中忘记道具点位 / 打法时，在副屏（27 英寸 2K **竖屏**）快速查看。

## 一、定位与硬性约束

1. **单栏长滚动，不锁竖屏**：以竖屏副屏 1440×2560 为设计基准；单栏限宽居中（竖屏维持 max-width ≈1200px；视口 >1440px 时渐进加宽、上限 ≈1560px，纯文本块另设独立行宽上限——图宽文窄），横屏打开自动两侧留白、照样能看。明确不做的只有横屏双栏（列表+详情）布局——那种布局在竖屏上会把瞄点图挤到看不清。
2. **图片优先**：一条道具的价值 = 图能让人 3 秒复现。文字只做短标注（oneline + 图上角标），不写长文。
3. **静态零服务**：双击根目录 `index.html` 必须直接可用（file:// 协议）。不起本地服务器、不引入打包器/框架。
4. **零第三方依赖**：Python 工具只用标准库；查看器只用原生 HTML/CSS/JS。
5. **状态诚实**：每条条目必须有 `status`。没实测过永远是 `draft`（橙色），自己进游戏复现过才能 `verified`（绿色）。
6. **素材署名**：凡来自视频/网页的图片，`source` 必须记 UP 主/网站与 URL。仅限自己和朋友小范围使用，署名保留，不上公开平台、不做二次剪辑传播。
7. **可分发**：`pb pack` 产出的发布包，朋友拿到后**不装任何环境**（无 Python/Node/AHK），解压双击就能用。
8. **零命令行使用（2026-10-01 用户定稿）**：使用者没有开发经验，**一切日常操作必须在网页内或双击完成**——改内容、传图片、标记实测、打包分发，全部通过查看器和根目录「同步并打包.bat」；命令行工具（pb.py 等）只留给开发会话，任何给使用者的指引都不得出现命令行。
9. **进度台账制度（2026-10-01 用户定稿，保证跨会话进度互通）**：`docs/PROGRESS.md` 是唯一权威进度记录。**任何会话**（开发/规划）完成一项工作后，必须立即在其「执行记录」表末尾追加一行并更新「当前状态」；动手写开发包或判断项目状态前，必须**先读它**。判断某迭代"是否已执行"只认**内容验证**（grep 关键改动是否落地），不认文件修改时间。

## 二、目录结构

```text
AGENTS.md              本规范
README.md              项目入口说明（指向本文件与 docs/）
docs/
  PROGRESS.md          进度台账（唯一权威进度记录，所有会话必读必写，见一.9）
  BUILD_PLAN.md        开发计划：分期任务、技术要点、lint 规则明细
  PROMPTS.md           各阶段启动提示词（新会话直接粘贴用）
  RECORD.md            道具录入工作流（录入通道/截图文件夹约定/质量标准/日常提示词）
data/
  maps.json            地图注册表（显示名、雷达底图、来源与许可）
  glossary.md          术语表（中英对照：window=窗户、connector=连接…）
  entries/             道具条目，一条一个 .md
tactics/               战术板（默认打法），一个 .md 一块板
assets/
  radar/               各图雷达底图 de_mirage.png …
  js/ css/             查看器源码
  icons/               烟/闪/火/雷 图标、UI 素材
media/<map>/<id>/      道具截图（固定槽位命名，见第四节）
tools/
  pb.py                单文件 CLI（lint / build / new / shots / pack）
  pin.ahk / pin.bat    副屏置顶脚本（AutoHotkey v2）
build/                 生成产物（data.js、report.md），可随时重建
index.html             查看器入口（根目录，双击即开）
```

## 三、数据模型

### 3.1 道具条目 `data/entries/<id>.md`

id 规则：`{map 去前缀}-{side}-{type}-{两位序号}`（如 `mirage-ct-smoke-01`），全小写连字符。id 由系统自动生成与维护，新建零输入；改 map/side/type 时 id 前缀自动跟随并自动改名迁移全部关联（.md 文件、media 文件夹、related/tactics 引用、浏览器本地键）。用户无需感知 id；手动自定义仅编辑器「高级 ▸ 自定义 id」。id 不含语义（起点/目标/标题随意改，不影响 id）。改名迁移由工具保证引用一致；朋友修改包按 id 匹配，改名后旧修改包中的同条目会按新条目导入（-f2 后缀），可接受。交叉引用全挂 id 上。

```yaml
id: mirage-t-smoke-window
map: de_mirage
side: T                  # T | CT | both
type: smoke              # smoke | flash | molotov | he
click: lmb               # lmb 左键 | rmb 右键 | both 双键（左右齐按）——三字段必填，组合即完整投法
move: stand              # stand 原地 | crouch 蹲下 | w W前进 | walk-step W一步 | shift Shift静步 | shift-w Shift+W | run W跑
action: jump             # direct 直接投 | jump 跳投 | crouch-jump 蹲跳投
origin: T 出生点白箱      # 中文地标（术语表里的名字）
target: window           # 报点名；可多个（行内数组），如 [二箱, 电梯位]——落点范围跨多个报点时用数组
title: 封窗户烟
oneline: 贴白箱角，准星顶天窗右沿，跳投     # 一句话「怎么扔」，卡片上最大字号的一行
difficulty: normal       # easy 简单 | normal 中等 | hard 困难（I51 三档枚举，中文只在显示层）
phase: [default]         # execute 爆点 | default 默认 | retake 回防 | postplant 防守 | anti-eco 科研（可多选，数据键不变）
status: draft            # draft | verified | broken | retired
source:
  kind: video            # self | video | web
  creator: tatukunn
  url: https://...
checked: 2026-09-30      # 仅 verified 必填（最后实测日期）
coords:                  # 全部可选；实测后用 getpos 回填，供后期生成练习 cfg
  stand: [x, y, z]
  ang: [pitch, yaw, 0]
tags: [中路]
sets: [A区爆弹]           # 可选（I47）：战术包，自由中文名数组（跨 phase 的打法套装分组）
spots: [跳台, 宫殿巷道]   # 互动地图报点关联（对应 callouts.json 的 name，点击报点按此精确过滤）
related: [mirage-t-default]
pin_origin: [0.48, 0.62]        # 可选（I41）：道具图层起点显示坐标覆写（u/v 0~1）；不填=用报点坐标
pin_targets: {中: [0.5, 0.4]}   # 可选（I41）：落点显示坐标覆写（键=目标报点名；单目标也可用 pin_target）
```

正文只写 ≤5 行的注意事项（缝在哪、什么时候别用）。

> 查看器内置条目编辑器（2026-10-01 用户定稿：**所有操作网页内完成，不对使用者提任何命令行要求**）：卡片右上「编辑」可改全部字段**含 status**——「标记已实测」二次确认后置 verified 并自动填 checked 日期，可一键退回待验证；新增条目一律 draft。图片槽位支持网页内上传/替换（宽 >1920 自动压缩），未关联项目文件夹时改动与图片暂存浏览器（IndexedDB），点「📁 关联项目文件夹」授权后自动写回 `data/entries/*.md` 与 `media/`。根目录「同步并打包.bat」双击 = pb build + pb pack，是使用者的唯一"命令"（见第七节）。origin/target 用报点图里的中文名。

**投法标签由三字段自动组合**，也是卡片上必显示的徽章文案：
`lmb + stand + jump` → 「左键跳投」；`both + shift-w + jump` → 「Shift+W·双键·跳投」；`rmb + stand + direct` → 「右键轻抛」。lint 校验三字段枚举，禁止自由文本——组合写错等于练错。

### 3.2 战术板 `tactics/<id>.md`

```yaml
id: dust2-plan-01        # 自动 id：<map去前缀>-plan-<两位序号>（-default 要点板不受影响）
map: de_dust2
side: both
title: 打法要点（大白话版）
window: 整局             # 适用回合时间窗
status: draft
checked: 2026-10-04      # 仅 verified 必填（这块板游戏里跑通过）
uses: [dust2-t-smoke-xbox, dust2-t-smoke-mid-door]   # 引用的道具 id，必须真实存在
roles:                   # 可选（I41）：角色名（≤5 项；I42 出生位已移除——角色标固定钉在该角色
  - {name: 1号 狙}        # 第一个含 use 步骤的道具起点上，无任何含道具步骤的角色不立标）
  - {name: 2号}
timeline:                # 可选（≤20 步；t=倒计时 "M:SS"（1:55=开局 0:00=结束）；role=1-5 可空；
  - {t: "0:05", role: 1, use: dust2-t-smoke-mid-door}   # text 可空=显示端自动生成；use=可选道具 id）
  - {t: "1:20", role: 2, text: 按中路信息转 A 或 B}
```

正文：`##` 分节要点，每节几行，不写散文。

> **战术板形态（2026-09-30 用户定稿）**：不做 5 人动线（自估坐标不入库）。「战术板」Tab 渲染为**互动地图**——雷达底图 + 中文报点标注（`data/callouts.json`，u/v 为 0~1 坐标，已按知乎@北辰等同源参考图校正）。**报点位置以查看器内置「⚙ 编辑报点」为准**：拖拽/增删/改名即时保存，点「开启自动保存」一次性授权 `data/callouts.json` 后**改动实时自动写回**（File System Access API，Chromium 内核；防抖 0.8s），授权后界面只显示被动状态字样——正常使用中**不出现导出/覆盖等开发类控件**，仅在不支持该 API 的浏览器回退显示「导出」。条目与报点的关联写进条目 `spots` 字段（精确过滤，不做正文模糊匹配），lint 校验 spots 与报点表对应。`players`/`steps` 字段已废弃（旧 steps 由 timeline 取代，仅旧数据兼容渲染）。
>
> **战术板由查看器内置编辑器网页内创建/维护（I39）**：每块板右上「⚙ 编辑」、地图卡「＋ 新增战术板」；新增自动 id（`<short>-plan-NN`），字段=标题/地图（已有板锁定）/阵营/时间窗/状态/正文/uses chips/timeline 行编辑。与道具同一套暂存-写盘-退役语义（pb-tactics-v1 覆盖层 → ready 直接写 `tactics/*.md` → build 后退役进搁置区；徽标计数含战术板；flushPendingTactics 开机补写）。「🕒 时间轴」图层（I41 v2）=角色标（①..⑤，固定钉在该角色第一个含 use 步骤的道具起点；I42 出生位已移除）+ 角色旁时间 chip 堆（倒计时+道具图标，点击三联动高亮）+ 每个指派步骤的 **origin(pin)→target(pin) 真实投掷动线**；步骤按倒计时自动排序（1:55=开局 0:00=结束）；text 留空显示自动生成「{起点}→{目标}，{投法}」。**朋友分享/导入（I20）不含战术板——明确不做。**

**数据一致性铁律（I19 起）**：文件是唯一权威。浏览器覆盖层仅作「未写盘修改的暂存+显示缓存」，每项带 savedAt；data.js 顶层带 builtAt；加载时 builtAt ≥ savedAt 的暂存自动退役进 pb-retired-v1 搁置区（可导出留底，绝不静默丢弃）。开发会话重建 data.js 或改 entries/callouts 前，若磁盘文件比 data.js 新（用户网页改动已自动落盘），必须以磁盘为准重建，禁止用会话内存数据覆盖磁盘。index.html 的 ?v= 由 pb build/pack 自动递增，开发会话不再手动管理。

### 3.3 地图注册表 `data/maps.json`

每张图登记：`name`（英文名）、`cn`（中文名）、`radar`（底图路径）、`radar_source`（origin / url / license）、`duty`。

## 四、图片规范

`media/<map>/<id>/` 固定槽位命名，查看器按此顺序竖排并叠角标：

| 文件 | 角标 | 要求 |
| --- | --- | --- |
| `1-stand.png` | 站位 | 全景，含可辨识地标（箱角/门框/地纹） |
| `2-aim.png` | 瞄点 | 准星居中，能看清对的是哪条边/哪个点 |
| `4-result.png` | 落点&效果 | 烟墙 / 火区 / 闪爆覆盖的实际范围（天然包含落点位置） |

- **完整条目至少 3 图**：站位 + 瞄点 + 落点&效果。没图不算录完。
- 宽度上限 1920，png/jpg/webp 均可；截图保持 16:9 原比例。
- 扩展槽位（如 `5-alt.png` 备选站位）允许，查看器按文件名排序追加；个别道具确需单独的落点视角（弹道/落点被遮挡时），加扩展槽 `5-landing.png` 补充，不设基础槽。

## 五、查看器（副屏速查，单栏自适应）

- **顶栏 sticky**：大 Tab「道具 | 战术板」→ 地图切换（记忆上次选择；顺序在 ⚙ 设置自定义，第一位=默认图；已移除「全部地图」聚合视图）→ 烟/闪/火/雷图标过滤（同时作用于道具列表与战术板地图）+「📦」开关（I47：只看战术包——列表切为套装折叠视图，未分组条目收进「未分组」行；再点还原）→ 阵营 全部/T/CT 过滤（side=both 两侧都显示，作用于道具列表、战术板地图与战术板卡片）→ `/` 搜索框。
- **道具列表**（单栏自上而下）：⭐ 收藏置顶分组 →「📦 战术包」折叠区（I47：每个套装一行「📦 名称 (N 个道具)」，点击展开成员行复用道具行组件；成员仍保留在原 phase 分组中——套装是叠加视图；无套装条目时此区不出现）→ phase 分组。
- **道具卡片**（自上而下）：状态色条 + 类型图标 + 标题 → oneline（大字）→ 投法徽章（如「Shift+W·双键·跳投」）+ 难度徽章（I51 三档色点+汉字：简单/中等/困难；列表行点徽章=按档过滤）→ 图片竖排（角标：站位/瞄点/落点/效果）→ 注意事项折叠 → 底部「所属战术包」chips（I47：点击=打开 📦 只看视图并展开/定位该套装；无套装不显示）。条目编辑器含「战术包」chips 输入（自由命名，全库已有套装名自动补全）。
- **战术板卡片**：雷达大图 + SVG 动线层 → 时间轴步骤列表 → 引用的道具缩略条，点击滚动到对应道具卡片。
- **交互**：`/` 搜索、`J/K` 或 `↑/↓` 条目间跳、点击图片 lightbox 放大、`Esc` 关闭/清空（I28 语义链：关 lightbox/关弹层 → 清搜索/筛选 → 详情页回列表 → 道具列表切回战术板）；详情页 `←/→` 切上一条/下一条、`Backspace` 回列表。
- **字号**：正文 ≥18px，图上角标 ≥15px——副屏距离主屏更远。
- **横竖屏自适应**：同一套单栏布局，窗口比栏宽就居中留白；不搞断点切换的双栏模式。
- **file:// 关键约束**：数据一律由 build 生成 `build/data.js`（`window.PLAYBOOK = {...}`）用 `<script src>` 引入。**禁止 fetch JSON**——file:// 下会被 CORS 拦死。图片用相对路径 `<img>`，file:// 下没问题。

## 六、战术板动线坐标

- 一律存 **0~1 归一化坐标**（u=横向、v=纵向，相对底图宽高），渲染时乘实际尺寸。换底图分辨率不失效。
- 底图：`assets/radar/<map>.png`，网上获取，优先官方风格或 Simple Radar 等社区重绘版，边长 ≥1024px；**来源和许可必须写进 maps.json**。
- 渲染：SVG overlay（viewBox 归一化），玩家编号圆点 + 路径箭头 + 道具小图标；draft 板虚线、verified 板实线。
- 道具/时间轴图层的条目起终点显示坐标可用条目 `pin_origin`/`pin_target(s)` 覆写报点坐标（I41，「✏️ 调点」拖拽产生）；报点层与一切匹配/过滤语义不受影响。**定位语义（I42 定稿）：报点=区域级，道具图层落点=精准位置**——未调点的道具默认停在报点中心，调点态同位重叠的道具自动环形散开（仅显示不存点），逐颗拖到真实落点才存 pin。

## 七、工具 `tools/pb.py`（单文件 CLI，纯标准库）

```bat
tools\pb.cmd lint              :: 校验所有条目/战术板（缺图、坏 id、断链都报）
tools\pb.cmd build             :: 校验 + 生成 build/data.js + build/report.md
tools\pb.cmd new utility <id> --side T --type smoke      :: 生成条目模板
tools\pb.cmd new tactic <id> --side T                    :: 生成战术板模板
tools\pb.cmd shots <截图目录> --id <id> [--dry-run]       :: 截图批量归位
tools\pb.cmd pack             :: 生成发布包 dist\cs2-playbook.zip（见第九节）
```

- **「同步并打包.bat」（根目录，使用者的唯一入口）**：双击 = `pb build` + `pb pack` + 完成提示。网页里改完任何内容，双击它一次即同步项目数据并刷新发布包。
- pb.py 的其余命令（lint/new/shots/verify）只服务于开发会话，不出现在给使用者的指引里。

- `shots` 规则：文件名含 `id+槽位`（`mirage-t-smoke-window_2-aim.png`）直接入座；认不出的按修改时间顺序配给 `--id` 指定条目；只复制不搬动原文件，覆盖前存 `.bak`。
- `build/report.md`：缺图清单、draft/verified 统计、断链引用。

## 八、副屏置顶（AutoHotkey v2）

`tools/pin.ahk`：`F4` 切换鼠标下窗口置顶；`F3` 切换 ~40% 半透明。`tools/pin.bat` 一键启动。装好 AutoHotkey v2 后双击 bat 即可，进游戏前点一下查看器窗口再按 F4。置顶脚本是**自己的增强**，不属于发布包。

## 九、打包分发（发朋友直接打开）

`tools/pb.cmd pack` 生成 `dist/cs2-playbook.zip`，解压后结构：

```text
cs2-playbook/
  index.html            双击即开（与自用版同一套查看器代码）
  help.html             使用说明页（⚙ 设置「📖 使用说明」打开；纯静态无 JS，六个大白话问答）
  build/data.js         全部条目 + 战术板数据
  media/  assets/       图片与图标，全部相对路径
  使用说明.txt          三行：双击 index.html / F11 全屏 / 仅限朋友间小范围使用
```

- 包内**不含** tools/、content/、tactics/ 源文件和 pin.ahk——朋友只要看，不要录。
- 自用目录和发布包共用同一套 viewer 代码，`pb pack` 只做拷贝 + 出说明，不维护两套。
- zip 文件名带日期（`cs2-playbook-20260930.zip`），微信/QQ 直接发得动（注意单文件 ≤1~2GB 都没问题，图片量级远达不到）。
- 朋友版同样显示 source 署名——分发不删署名。

## 十、内容流水线（来源档）

| 档 | 来源 | 入库状态 | 说明 |
| --- | --- | --- | --- |
| self | 游戏 F12 截图 → `pb shots` 归位 | verified | 每条道具的最终归宿 |
| video | B 站教学抽帧（yt-dlp + ffmpeg） | draft | 优先 tatukunn / 冷锋 / 蒋道具 / 祖灵Zu1ing；1080p 拉源、关键帧抽 站位/瞄点/效果 三帧；记 UP 主 |
| web | 图片搜索 | draft | 兜底，画质差时不 |
| friend | 朋友修改包导入（I20） | draft | 朋友浏览器内录制 → ⚙📤 导出 JSON → 队长 ⚙📥 预览勾选导入；status 一律 draft、不覆盖队长侧实测状态与同名报点坐标 |

- 抖音不做批量抓取（反爬），需要时手动保存图片再走 `pb shots`。
- video/web/friend 来源先进 draft 队列；**只有自己进游戏复现过才转 verified**。
- 教学视频画面里自带的字幕标注（如祖灵视频的「左键跳投一颗」）正是投法字段的对照物——抽帧入库时照着填 click/move/action；字幕留在图里无妨。
- `tools/harvest.py`（P4 实现，可懒加载）：输入视频 URL → 输出候选帧 + 建议条目，人工挑帧确认后入库。

## 十一、首批内容（Mirage T 全套，11 条 + 1 板）

道具（全部 T 方，具体线位以视频研究 + 实测为准）：

| id | 内容 | 阶段 |
| --- | --- | --- |
| mirage-t-smoke-window | 出生点跳投封窗户烟 | 中路默认第一烟 |
| mirage-t-molly-connector | 中路连接口火 | 配合抢中路 |
| mirage-t-flash-jungle | A 执行 jungle 闪 | A 包 |
| mirage-t-flash-ct | A 执行 CT 闪 | A 包 |
| mirage-t-smoke-stairs | A 执行楼梯烟 | A 包 |
| mirage-t-molly-sandwich | 三明治/连接口火 | A 包 |
| mirage-t-flash-palace | 宫殿跳闪进 A | A 包 |
| mirage-t-smoke-market | apps 出封 market 烟 | B 包 |
| mirage-t-molly-b-site | B 点内火 | B 包 |
| mirage-t-flash-apps | B 执行过肩闪 | B 包 |
| mirage-t-smoke-connector-a | A 跳台封链接烟（快提 A） | A 包，来源：祖灵Zu1ing BV1ght86rEww「最快跳台链接烟」 |

战术板：`mirage-t-default`（控中路，A/B 二选一）。

## 十二、分期与验收

| 期 | 内容 | 验收标准 |
| --- | --- | --- |
| P1 | 骨架 + 查看器 + 置顶脚本 | 双击 index.html 可用；竖屏 2K 布局正常；过滤/搜索/键盘/lightbox 可用；3 条示例卡片完整渲染；pin 脚本生效；`pb pack` 产物解压后双击可用 |
| P2 | Mirage T 10 条 draft 上线 | 每条 ≥3 图且来源署名齐全；report 无 ERROR |
| P3 | 战术板 | 雷达底图入库（含来源许可）；mirage-t-default 动线 + 时间轴完整；道具联动跳转可用 |
| P4 | 流水线完善 | harvest.py 抽帧可用；实测转 verified 流程跑通；（可选）练习 cfg 生成、动线标注编辑器 |

## 十三、明确不做

- 不解包 VPK（前车之鉴，投入产出为负）。
- 不上 Electron / 前端框架 / pip 第三方依赖。
- 不做账号、云同步、多用户。
- 带他人水印/署名的素材仅本地查阅，不对外发布。
