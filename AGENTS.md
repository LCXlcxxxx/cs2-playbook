# CS2 Playbook — 项目宪法（AGENTS.md）

> 本文件只放硬约束与数据模型。进度真相 docs/PROGRESS.md（先读后写）、开发手册 docs/DEV.md、查看器行为规格 docs/UI.md。
> 使用场景：CS2 游戏中忘道具点位 / 打法时，在副屏（27 英寸 2K **竖屏**）快速查看。

## 文档地图
- `docs/PROGRESS.md` — 唯一进度真相（迭代台账）；任何会话先读后写，判断迭代是否执行只认内容验证（grep 关键改动），不认文件 mtime
- `docs/DEV.md` — 开发会话工作手册：Shell 铁律、测试坑、git 流程、迭代五步、工具与环境速查
- `docs/UI.md` — 查看器行为规格：顶栏/过滤组合/列表/详情/编辑器/战术板三图层/Esc 链/锚点导航
- `docs/RECORD.md` — 零命令行录入工作流；`docs/BUILD_PLAN.md` / `docs/PROMPTS.md` — 历史参考（现状以台账为准）
- `docs/CONTENT_IDEAS.md` — 内容路线图与素材库；`docs/iterations/` — 迭代开发包（ITER-Ixx.md）

## 一、定位与硬性约束
1. **单栏长滚动，不锁竖屏**：竖屏 1440×2560 为基准（栏宽 ≈1200px）；>1440 视口渐进加宽上限 ≈1560px、纯文本块独立行宽上限（图宽文窄）。明确不做的只有横屏双栏（列表+详情）布局——竖屏上瞄点图会挤到看不清。
2. **图片优先**：一条道具的价值 = 图能让人 3 秒复现。文字只做短标注（oneline + 图上角标），不写长文。
3. **静态零服务**：双击根目录 `index.html` 必须直接可用（file:// 协议）。不起本地服务器、不引入打包器/框架。
4. **零第三方依赖**：Python 工具只用标准库；查看器只用原生 HTML/CSS/JS。
5. **状态诚实**：每条条目必须有 `status`。没实测过永远是 `draft`（橙），自己进游戏复现过才能 `verified`（绿）。
6. **素材署名**：凡来自视频/网页的图片，`source` 必须记 UP 主/网站与 URL，署名永远保留、不剥离水印。项目非商用，面向 CS2 新手学习交流，可公开分享（2026-10-26 用户定稿：UP 主允许转载）。
7. **可分发**：发布包朋友拿到后不装任何环境，解压双击就能用。
8. **零命令行使用**：使用者的一切日常操作（改内容/传图/标记实测/打包分发）必须网页内或双击完成；命令行工具只留给开发会话，任何给使用者的指引不得出现命令行与 git 字样。
9. **进度台账制度**：`docs/PROGRESS.md` 唯一权威进度记录——完成工作立即在「执行记录」表末尾追加并更新「当前状态」；动手写开发包或判断项目状态前必须先读它；台账历史行可整体归档至 docs/PROGRESS-archive.md（搬运不改写），PROGRESS.md 仍为唯一进度真相。
10. **数据一致性铁律**：文件是唯一权威。浏览器覆盖层仅作「未写盘修改的暂存+显示缓存」（savedAt 对账，builtAt ≥ savedAt 自动退役进搁置区，绝不静默丢弃）；开发会话重建 data.js 或改 entries/callouts 前，磁盘文件比 data.js 新必须以磁盘为准重建，禁止用会话内存数据覆盖磁盘；index.html 的 ?v= 由 pb build/pack 自动递增，不手动管理。
11. **git 地基**：项目根本地仓库（无远端、永不 push）；每迭代 = 改动 + 台账行 + 一条提交；提交流程与并行规则见 docs/DEV.md。git 只存在于开发会话，使用者零感知。

## 二、目录结构
```text
AGENTS.md  宪法 | README.md  入口 | index.html  查看器（双击即开）| help.html  使用说明 | 同步并打包.bat  使用者唯一入口
docs/  PROGRESS（台账）DEV UI RECORD BUILD_PLAN PROMPTS CONTENT_IDEAS CHECK-01* iterations/
data/  maps.json（注册表）+ callouts.json（报点 u/v 0~1）+ glossary.md（术语）+ entries/（条目一 .md 一条）
tactics/  战术板一 .md 一板 | assets/  radar/ + js/css/ + icons/
media/<map>/<id>/  道具截图（固定槽位，见四）——media/ 与 文件夹批量录入/（素材池+已录入/ 归档）均入 git
tools/  pb.py（单文件 CLI）+ pb.cmd + pin.ahk/pin.bat + pydict.json + harvest.py
build/ dist/（生成产物，不入 git）| _archive/  归档留底 | simhei.ttf  标注字体
```

## 三、数据模型
### 3.1 道具条目 `data/entries/<id>.md`
id 由系统自动生成与维护（`{map去前缀}-{side}-{type}-{两位序号}`，全小写连字符）；改 map/side/type 时 id 前缀自动跟随并迁移全部关联（.md/media/引用/浏览器键），用户无需感知；朋友包 id 冲突按 -f2 后缀导入。
```yaml
id: mirage-t-smoke-01
map: de_mirage
side: T                  # T | CT | both
type: smoke              # smoke | flash | molotov | he
click: lmb               # lmb | rmb | both —— 三字段必填，组合即完整投法
move: stand              # stand | crouch | w | walk-step | shift | shift-w | run
action: jump             # direct | jump | crouch-jump
origin: T 出生点白箱      # 中文地标（报点表里的名字）
target: window           # 报点名；多落点用行内数组
title: 封窗户烟
oneline: 贴白箱角，准星顶天窗右沿，跳投   # 一句话「怎么扔」，卡片最大字号的一行
difficulty: normal       # easy 简单 | normal 中等 | hard 困难（枚举，中文只在显示层）
phase: [default]         # execute 爆点 | default 默认 | retake 回防 | postplant 防守 | anti-eco 科研（可多选，键不变）
status: draft            # draft | verified | broken | retired
source: {kind: video, creator: tatukunn, url: https://...}   # kind: self | video | web | friend
tags: [单向]              # 战术标签（搜索/筛选 chips 用）
sets: [A区爆弹]           # 可选：战术包（自由中文名数组，跨 phase 套装分组）
spots: [跳台, 宫殿巷道]   # 报点关联（对应 callouts.json 的 name，精确过滤）
```
可选字段：`checked`（仅 verified 必填，YYYY-MM-DD 实测日期）、`coords`（getpos 回填）、`related`（条目互链）、`pin_origin` / `pin_target(s)`（图层显示坐标覆写 `[u, v]` 0~1，键=报点名，含空格键须引号）。正文只写 ≤5 行注意事项（缝在哪、什么时候别用）。
**投法标签由三字段自动组合**，也是卡片必显示的徽章文案：`lmb+stand+jump` →「左键跳投」；`both+shift-w+jump` →「Shift+W·双键·跳投」；`rmb+stand+direct` →「右键轻抛」。lint 校验三字段枚举，禁止自由文本——组合写错等于练错。编辑器/列表/详情的交互行为见 docs/UI.md。
### 3.2 战术板 `tactics/<id>.md`
```yaml
id: dust2-plan-01        # 自动 id：<map去前缀>-plan-<两位序号>
map: de_dust2
side: both
title: 打法要点（大白话版）
window: 整局             # 适用回合时间窗
status: draft            # verified 必填 checked: YYYY-MM-DD（这块板游戏里跑通过）
uses: [dust2-t-smoke-xbox, dust2-t-smoke-mid-door]   # 引用的道具 id，必须真实存在
roles:                   # 可选：角色名（≤5 项；角色标钉在该角色第一个含 use 步骤的道具起点）
  - {name: 1号 狙}
timeline:                # 可选（≤20 步；t=倒计时 "M:SS"（1:55=开局 0:00=结束）；role=1-5 可空；
  - {t: "0:05", role: 1, use: dust2-t-smoke-mid-door}   # text 可空=显示端自动生成；use=可选道具 id）
```
正文 `##` 分节要点，每节几行不写散文。战术板由查看器网页内创建/维护（不做 5 人动线、不自估坐标入库；`players`/`steps` 已废弃）；朋友分享/导入**不含战术板**。三图层与报点编辑行为见 docs/UI.md。
### 3.3 地图注册表 `data/maps.json`
每张图登记：`name`（英文）、`cn`（中文）、`radar`（底图路径）、`radar_source`（origin/url/license，必填）、`duty`（是否现役地图池）。

## 四、图片规范
`media/<map>/<id>/` 固定槽位命名，查看器按序竖排叠角标：`1-stand`（站位，全景含可辨识地标）、`2-aim`（瞄点，准星居中看清对哪条边）、`4-result`（落点&效果，烟墙/火区/闪爆实际范围）。**完整条目至少 3 图，没图不算录完**；宽度上限 1920、png/jpg/webp、16:9 原比例；**单图目标 300-600KB**——网页上传/分拣台/粘贴写入时自动压缩至 ≤600KB（先降质量后缩宽，看得清为准，小图不重压）；扩展槽（`5-alt` 备选站位、`5-demo` 演示等）按文件名排序追加，个别道具补 `5-landing` 落点视角（不设基础槽）。

## 五、查看器与战术板行为
全部交互行为规格在 **docs/UI.md**（顶栏控件、过滤组合语义、列表/详情/编辑器、三图层、Esc 链、键盘动线、留白锚点导航、I19 数据链路的用户可见表现）。硬底线重申：单栏禁双栏（一.1）、正文 ≥18px 角标 ≥15px、file:// 直开且数据只经 `build/data.js` 以 `<script>` 引入（**禁止 fetch JSON**——file:// 被 CORS 拦死）、图片相对路径。

## 六、动线与点位坐标
- 一律存 **0~1 归一化坐标**（u 横向/v 纵向，相对底图宽高），渲染乘实际尺寸，换底图分辨率不失效；底图 `assets/radar/<map>.png` 边长 ≥1024px，**来源和许可必须写进 maps.json**。
- **定位语义**：报点=区域级，道具图层落点=精准位置（未调点停在报点中心；`pin_origin`/`pin_target(s)` 仅覆写图层画图坐标，报点层与一切匹配/过滤语义不受影响）。

## 七、工具（开发会话专用，使用者不可见）
「同步并打包.bat」（根目录）= `pb build` + `pb pack` + 完成提示，是使用者的唯一"命令"。pb.py 为单文件 CLI 纯标准库：`lint / build / pack / new / shots / verify / migrate-difficulty`，命令明细、shots 规则与 report 内容见 docs/DEV.md。双端对称纪律：徽章/枚举中文表在 pb.py 与 app.js 各一份，改一处必须 grep 另一处。

## 八、副屏置顶（AutoHotkey v2）
`tools/pin.ahk`：F4 切换鼠标下窗口置顶、F3 切换 ~40% 半透明；`tools/pin.bat` 一键启动。进游戏前点一下查看器窗口再按 F4。置顶是**自己的增强**，不属于发布包。

## 九、打包分发（发朋友直接打开）
`pb pack` 生成 `dist/cs2-playbook-YYYYMMDD.zip`（微信/QQ 直发得动），解压后 `index.html` 双击即开，含 `help.html`（⚙ 设置「📖 使用说明」打开的纯静态说明页）、`build/data.js`、`media/`、`assets/`、`使用说明.txt`。包内**不含** tools/、tactics/、data/ 源文件与 pin.ahk——朋友只要看，不要录。自用目录与发布包共用同一套查看器代码，`pb pack` 只做拷贝+出说明。朋友版同样显示 source 署名——分发不删署名。

## 十、内容流水线（来源档）
| 档 | 来源 | 入库状态 | 说明 |
| --- | --- | --- | --- |
| self | 游戏 F12 截图 → `pb shots` 归位 | verified | 每条道具的最终归宿 |
| video | B 站教学抽帧（yt-dlp + ffmpeg） | draft | 只用 tatukunn / 冷锋横屏（祖灵/蒋道具 pass）；点位须 CS2 近 1-2 年；1080p 拉源、关键帧抽三帧、记 UP 主 |
| web | 图片搜索 | draft | 兜底，画质差时不 |
| friend | 朋友修改包导入 | draft | 朋友浏览器录制 → ⚙📤 导出 JSON → 队长 ⚙📥 预览勾选导入；status 一律 draft、不覆盖队长侧实测状态与同名报点坐标 |

video/web/friend 先进 draft 队列，**只有自己进游戏复现过才转 verified**。教学视频字幕里的「左键跳投一颗」正是投法字段的对照物，抽帧入库照着填 click/move/action。抖音不做批量抓取（反爬）。

## 十一、明确不做
- 不解包 VPK（前车之鉴，投入产出为负）。
- 不上 Electron / 前端框架 / pip 第三方依赖。
- 不做账号、云同步、多用户。
- 不剥离他人水印/署名——原始出处随图走（见一.6）。
