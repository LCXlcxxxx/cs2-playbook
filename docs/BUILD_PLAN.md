# CS2 Playbook 开发计划

> 执行方式：在项目根目录 `D:\AI agent\ZCode data\CS2` 开新 ZCode 会话，粘贴 `docs/PROMPTS.md` 里对应阶段的提示词。
> 本计划与 AGENTS.md 冲突时，**以 AGENTS.md 为准**。

## 0. 现状（P0 已完成，即本开发包）

- 规范：`AGENTS.md`（最高约束）
- 骨架：`data/maps.json`（7 张现役图）、`data/glossary.md`（Mirage 术语表）、
  `data/entries/` 11 条 Mirage T 条目（draft 骨架，字段初判待核对）、
  `tactics/mirage-t-default.md`（战术板骨架）
- 未开始：`tools/`、查看器（index.html + assets/）、全部图片、雷达图

## 1. 里程碑总览

| 阶段 | 内容 | 外部依赖 | 备注 |
| --- | --- | --- | --- |
| P1 | 工具链 pb.py + 竖屏查看器 + 置顶脚本 + 打包 | Python ≥3.10（仅标准库）；AHK v2 可选 | 一个会话可完成 |
| P2 | 11 条内容补全（三图 + 字段核对） | yt-dlp + ffmpeg（可手动兜底） | 需要联网检索 B 站 |
| P3 | 战术板（雷达图 + 动线 + 时间轴） | 雷达底图 | 依赖 P1 查看器 |
| P4 | 抽帧流水线 harvest.py + verify 流程 + 可选增强 | 同 P2 | 可选增强做前先问用户 |

## 2. P1 — 工具链 + 查看器

### 2.1 tools/pb.py（单文件 CLI，纯标准库）+ tools/pb.cmd

- 环境：Python ≥3.10；源码 UTF-8；控制台输出前 `sys.stdout.reconfigure(encoding="utf-8")`（Windows GBK 控制台防乱码）。
- pb.cmd：探测顺序 `py -3` → `python` → 环境变量 `KB_PYTHON`；都不行给安装提示。

**pb lint**（只校验不写文件）：
- frontmatter 解析器自写（仅支持本项目出现的形态：`键: 值`、行内数组、一层嵌套）；遇到不认识的语法**直接报错，不猜**。
- 道具必填：`id map side type click move action origin target title oneline difficulty phase status`
- 战术板必填：`id map side title window status uses players steps`
- 枚举校验（枚举表见第 8 节）；id 规则 `^{map去de_前缀}-{side小写}-{type}-{…}$` 且前缀与 map 字段一致
- 引用完整性：`related` / `uses` 必须指向存在的 id
- 图槽检查：`media/<map>/<id>/` 缺 `1-stand` / `2-aim` / `4-result` → WARN（不阻塞）
- `status=verified` 强制 `checked` 日期；draft 占比 >80% → INFO
- 输出 ERROR/WARN/INFO 分级 + 统计；有 ERROR 退出码 1

**pb build**：先 lint，通过后生成 `build/data.js`：
`window.PLAYBOOK = { generated_at, maps, entries: […], tactics: […] }`
（每条 entry 附 images 槽位清单与缺槽标记）；另生成 `build/report.md`（缺图清单、draft 统计、断链）。

**pb new**：`new utility <id> --side T --type smoke` / `new tactic <id> --side T`，模板内嵌 pb.py，自动建 `media/<map>/<id>/` 目录。

**pb shots**：扫描截图目录；文件名含 `<id>+<槽位名>` 直接入座；`--id` 时其余按修改时间依序分配该条目缺的槽位；**只复制不搬动**；覆盖前存 `.bak`；`--dry-run` 只打印计划。

**pb pack**：生成 `dist/cs2-playbook-YYYYMMDD.zip`：index.html + assets/(js|css|icons) + build/data.js + media/ + 使用说明.txt（三行：双击 index.html / F11 全屏 / 仅限朋友间小范围使用）。**不含** tools/、content 源文件、tactics/、AGENTS.md。

### 2.2 查看器（根目录 index.html + assets/js/app.js + assets/css/style.css）

- 纯原生 HTML/CSS/JS；数据 `<script src="build/data.js">` 引入；**禁止 fetch**（file:// 会被 CORS 拦）。
- 布局：sticky 顶栏（Tab「道具｜战术板」→ 地图 → T/CT → 烟/闪/火/雷图标 → 搜索框）；主体单栏 max-width ≈1200px 居中；横屏自动两侧留白。
- 道具卡片自上而下：状态色条（draft 橙 / verified 绿 / broken·retired 灰，后两者默认隐藏+开关）→ 类型图标 + 标题 → oneline 大字 → 投法徽章（拼接规则见第 8 节）+ 难度徽章（I51 三档：色点+简单/中等/困难）→ 图片竖排（槽位角标：站位/瞄点/落点/效果；缺槽显示带标签的占位块）→ 折叠注意事项。
- 战术板卡片：雷达大图 + SVG 动线层（viewBox 0 0 1000 1000，u/v×1000）+ 时间轴步骤 + uses 道具缩略条（点击滚动到对应道具卡）。players/steps 为空显示「待绘制」占位。
- 键盘：`/` 聚焦搜索、`Esc` 关闭/清空、`J/K` 或 `↑/↓` 卡片间跳转（滚动跟随）；点击图片 lightbox。
- 字号：正文 ≥18px，角标 ≥15px。

### 2.3 置顶脚本（tools/pin.ahk + pin.bat）

- AutoHotkey **v2** 语法：F4 切换鼠标指向窗口的置顶（MouseGetPos 取 hwnd → WinSetAlwaysOnTop）；F3 切换 ~40% 透明（WinSetTransparent 204 / 还原）。
- pin.bat 启动 ahk；未装 AHK 时提示 `winget install AutoHotkey.AutoHotkey`。

### 2.4 P1 验收清单

- [ ] 双击 index.html（file://）正常渲染：11 条卡片 + 1 块战术板占位
- [ ] 地图/T·CT/类型过滤、搜索、J/K、lightbox 可用
- [ ] 竖屏 1440×2560 与横屏 2560×1440 各看一遍，布局均正常
- [ ] `pb lint` / `pb build` / `pb shots --dry-run` / `pb pack` 全部可运行
- [ ] pack 出的 zip 解压到任意路径双击 index.html 可用（无 tools 依赖）
- [ ] F4/F3 在记事本上验证生效

## 3. P2 — 11 条内容补全

**前置安装**：`winget install yt-dlp.Yt-dlp`、`winget install Gyan.FFmpeg`。
B 站 1080p 偶尔要登录：`--cookies-from-browser edge`；yt-dlp 报错先 `-U` 自更新。

每条流程：

1. **检索**：B 站搜「Mirage + 点位名 + 烟/闪/火」，优先 tatukunn / 冷锋 / 蒋道具 / 祖灵Zu1ing；看视频日期确认线位没过时。
2. **取帧**：yt-dlp 下载 → ffmpeg 挑三帧——站位（全景含地标）、瞄点（准星清晰）、效果（烟成/火铺开/闪爆）。手动 `-ss` 定位或 `select='gt(scene,0.3)'` 场景切变。
3. **处理**：宽 >1920 压到 1920（`-vf scale=1920:-2`），不裁剪（保准星上下文）。
4. **归位**：命名 `1-stand/2-aim/4-result.(png|jpg|webp)` 放入 `media/de_mirage/<id>/`（或存临时目录后 `pb shots` 归位）。
5. **回填**：oneline（可参考视频字幕原文改写）、origin、click/move/action 核对、source（creator + BV 号）、difficulty 校正、正文 ≤5 行注意事项。视频里自带的「左键跳投」等字幕就是投法字段的对照物。

兜底：拉不到的视频改图片搜索（source.kind=web）；再不行列出点位名请用户游戏内 F12 截图 → `pb shots`。

顺序建议：窗户烟 → 连接火 → A 包六件（jungle 闪/CT 闪/楼梯烟/三明治火/宫殿闪/跳台链接烟）→ B 包三件。

**验收**：lint 无 ERROR；report 显示 11 条均 ≥3 槽；每条 source 可溯源；抽 3 条与视频对照无误。

## 4. P3 — 战术板

1. **雷达底图**：搜索「CS2 radar images github」/ Simple Radar（社区重绘版）；要求 ≥1024px、含 A/B 点标注；下载到 `assets/radar/de_mirage.png`；`data/maps.json` 填 `radar_source: {origin, url, license}`——未填 lint WARN。
2. **填板**：`tactics/mirage-t-default.md` 的 players（5 个 `{n, u, v, role}`）与 steps（时间轴 + routes）。坐标一律 **0~1 归一化**（相对底图宽高），与分辨率解耦。参考动线：0:05 窗户烟起 1 号跟进中路 → 0:30 4 号协同控中路、2/3 号两翼卡信息 → 1:20 按分支转 A 或 B（画转向箭头）。
3. **渲染验证**：查看器战术板页——玩家编号圆点、路径箭头（draft 虚线）、时间轴、uses 缩略条联动跳转。

**验收**：AGENTS.md §十二 P3 行逐项通过。

## 5. P4 — 流水线与增强

1. **tools/harvest.py**：`python tools/harvest.py <B站URL或本地视频> --map de_mirage`——yt-dlp 拉源到临时目录 → ffmpeg 每 2 秒抽帧 + 场景帧 → 生成本地候选页（缩略图+时间戳）→ 用户选 3 帧槽位 → 自动压宽、命名、入 media/、回填 source；从标题/字幕抓「跳投/左键」给 click/move/action 建议。
2. **pb verify \<id\>**：交互确认后置 `status: verified` + `checked: 今天`；同步 lint/build。**没有用户实测确认，任何流程不得自动转 verified。**
3. 可选增强（做之前逐个征求用户同意）：练习 cfg 生成（setpos/setang/跳投绑定）；雷达动线标注小工具（点击取 u,v 写回 tactics）。

**验收**：harvest 端到端跑通 1 条；verify 后卡片变绿。

## 6. 技术要点与坑

1. **file:// 禁 fetch JSON**：数据只走 `build/data.js`（`window.PLAYBOOK=…`）+ `<script>`；图片相对路径 `<img>` 不受限。
2. **零第三方依赖红线**：pb.py 只用标准库（pathlib/re/json/zipfile/argparse/datetime）；YAML 解析器只支持项目内出现的形态，**宁可报错不要猜**。
3. **Windows 编码**：控制台输出前 reconfigure UTF-8；文件一律 UTF-8 无 BOM。
4. **路径全相对**：项目可整体搬移，pack 产物可在任何机器双击打开。
5. **雷达图授权**：优先明确允许个人使用的来源，来源必记 maps.json。
6. **yt-dlp**：B 站支持良好但要勤更新；抖音不做批量；下载仅限个人使用。
7. **图片**：只压宽不裁剪；槽位固定命名；截图保持游戏原生 16:9。
8. **前车之鉴**：不解包 VPK（旧项目投入产出为负）；占位数据必须显式标记 draft，不得冒充实测。

## 7. lint 规则明细

| 级别 | 规则 |
| --- | --- |
| ERROR | 必填字段缺失；枚举值非法；id 格式/前缀不符；related/uses 断链；frontmatter 语法不认识；verified 缺 checked；maps.json JSON 解析失败 |
| WARN | 缺图槽（1-stand/2-aim/4-result）；radar_source 未填；孤儿条目（无图无坐标且非 P2 之前状态）|
| INFO | draft 占比 >80%；verified 超 120 天未复测；difficulty 与投法常见组合不符（I51：stand+direct 却 hard）|

## 8. 枚举与投法徽章映射

| 字段 | 值 | 显示 |
| --- | --- | --- |
| side | T / CT / both | T 方 / CT 方 / 双方 |
| type | smoke / flash / molotov / he | 烟雾 / 闪光 / 燃烧 / 高爆 |
| click | lmb / rmb / both | 左键 / 右键 / 双键 |
| move | stand / w / shift / shift-w / run | （无前缀）/ W+ / Shift+ / Shift+W+ / 跑+ |
| action | direct / jump / crouch-jump | （无后缀）/ 跳投 / 蹲跳投 |
| phase | execute / default / retake / postplant / anti-eco | 爆点 / 默认 / 回防 / 下包后 / 反eco |
| status | draft / verified / broken / retired | 待验证(橙) / 已实测(绿) / 已失效(灰) / 弃用(灰) |

**徽章 = [move 前缀][click][action 后缀]**：
`lmb+stand+jump` → 「左键跳投」；`both+shift-w+jump` → 「Shift+W+双键跳投」；`lmb+w+jump` → 「W+左键跳投」；`rmb+stand+direct` → 「右键」。

## 9. 红线（违反即返工）

不解包 VPK；不引第三方运行时依赖；不 fetch JSON；不删素材署名；draft 不冒充 verified；发布包必须含全部署名且零环境可开。
