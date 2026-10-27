# CS2 Playbook — 开发会话工作手册（DEV.md）

> 硬约束在 AGENTS.md；硬约束在 AGENTS.md；进度台账 docs/PROGRESS.md（先读后写；历史行归档在 docs/PROGRESS-archive.md，只读）；查看器行为规格 docs/UI.md。
> 本手册收编散在提示词与会话记忆里的开发约定，新会话先读这页再动手。

## 1. Shell 铁律（历史事故沉淀）

- **cmd 多命令只用 `&` 连接，永不用分号**——`del a ; b` 的分号曾是参数分隔符，tools/pb.py 被整个误删过三次（最近一次 2026-10-04，靠 `__pycache__` 字节码侥幸重建）。
- **cmd 内联中文的 `python -c` / `node -e` 多行必断**（GBK 静默吞掉、无输出假象）：一律用 Write 写临时脚本文件，`python -X utf8` 执行后删除（项目惯例放 build/ 下 `_xxx.py`，用完即删）。
- `findstr` 查中文不可靠（GBK/UTF-8 编码错位、/A 等参数歧义）：中文 grep 用临时 python 脚本或 PowerShell `Get-Content -Encoding UTF8`。tools/g.py 是历史尝试，同样别依赖。
- Edit 工具报 "File has been modified since read" = 并行会话写盘：**重读再改，绝不硬覆盖**；PROGRESS.md 追加行前必须重读表尾。
- 大区间代码替换后必须立即 `node --check assets\js\app.js` + grep 关键声明 + 浏览器冒烟（I41 曾误吞 I38 后端块的教训）；改 .cmd/.bat 用纯 ASCII，echo 内容禁半角括号。

## 2. git 流程（R0 起）

- 本地仓库在项目根（`git init -b main`）；**远端 origin = GitHub 公开仓库（2026-10-27 起，宪法一.11 已由「永不 push」修订为允许开发会话 push——分发与协作开发用）**。git.exe 位置：`%LocalAppData%\Programs\Git\cmd\git.exe`（npmmirror 便携版 2.56，**未加入 PATH**——winget 在本机因 GitHub 直连失败不可用，Dev 会话用全路径调用）。
- 仓库级身份已配（不动全局）：`user.name=cs2-playbook-dev`、`user.email=cs2-playbook-dev@localhost`（占位）、`core.autocrlf=false`（防整库换行抖动污染 diff）。
- **远端与 Pages（2026-10-27）**：`origin = https://github.com/LCXlcxxxx/cs2-playbook.git`（公开）；在线版 = `https://lcxlcxxxx.github.io/cs2-playbook/`（main 分支根目录即站点——build/data.js 因此必须入库，fetch JSON 禁令不可破的根因之一）；凭据走 GCM（首次 push 弹浏览器授权，存 Windows 凭据管理器）；github.com 走代理 `git config --global http.https://github.com.proxy http://127.0.0.1:11888`（端口跟随梯子，梯子端口变了我来改）。push 前提：工作区 clean、台账已记；大推送先 `git config http.postBuffer 524288000`。
- **提交规范**：每迭代 = 改动 + PROGRESS.md 台账行 + 一条 git 提交，信息格式 `ITER-Ixx: 摘要` 或 `Rx: 摘要`。大改前先做基线提交，保证重构本身可回滚。
- **并行规则（R1-D 后终态）**：五个 UI 域文件（pb-list/pb-detail/pb-tactics/pb-editor/pb-sortdesk）可各认领一个并行；**pb-core/pb-data/pb-sync/app.js 四个共享文件、index.html、style.css（单文件共享）与 pb.py 改动仍一律串行**（等前一会话台账入账且 `git status` 干净再动手）。app.js 瘦壳仅 334 行，动它的场景（新键盘钩子/新路由分支）天然少——「app.js 串行」实质已收敛为「共享文件串行」，无需专门解除。
- 不入库（.gitignore）：`dist/`、`build/`、`*.bak`、`*.zip`、`__pycache__/`、`cookies.txt`、`tools/_test*`；**media/ 与 文件夹批量录入/ 内容图片入库**（内容可回滚是核心收益，本地仓 ~290MB 可承受）。
- **红线**：git 只存在于开发会话；任何面向使用者的文档/界面/说明不得出现 git 字样。

## 3. 模块边界与并行开发（R1-B 拆分后）

assets/js/ 十文件加载序（index.html 同序，禁 ES module——file:// CORS）：**pb-core → pb-data → pb-filter → pb-sync → pb-list → pb-detail → pb-tactics → pb-editor → pb-sortdesk → app.js**。全部普通 script 共享全局作用域，原函数名未改；`window.PB` 仅作登记（PB.files）与共享 state 宿主（PB.state 指向同一 state 对象，诊断用）。

| 文件 | 行数 | 职责 |
| --- | --- | --- |
| pb-core.js | ~220 | $/$$、常量表（TYPE_INFO/PHASE_*/BASE_SLOTS…）、state 单仓、toast、存储键、moveExtra/favs、throwBadge 族、地图排序 |
| pb-data.js | ~255 | dumpEntryMd/parseEntryMd、dumpTacticMd/parseTacticMd/flowVal、难度三档（DIFF_*/diffEnum/徽章） |
| pb-sync.js | ~1460 | I19 引擎：覆盖层/搁置区/补写、FS Access 写盘族、图片 idb/压缩、朋友修改回流、resetLocalEdits |
| pb-filter.js | ~200 | hayOf/报点匹配/pinOrCallout/FILTER_CHIPS/entryMatch/拼音/难度语法 |
| pb-list.js | ~330 | 列表分组/行渲染/sets 折叠/详情导航入口/I49 锚点导航 |
| pb-detail.js | ~335 | 翻图面板/entryCard/lightbox |
| pb-tactics.js | ~935 | 报点地图卡/钻取/💥道具图层/✏️调点/🕒时间轴/tacticCard/jumpToEntry |
| pb-editor.js | ~1480 | 条目编辑器/选点弹窗/⚙ 设置弹层/战术板编辑器/报点编辑器 |
| pb-sortdesk.js | ~940 | 录入分拣台全部 |
| app.js | 334 | init/boot/render 路由壳/全局键盘 onKey |

**并行开发评估**：pb-list / pb-detail / pb-tactics / pb-editor / pb-sortdesk 五个 UI 域文件互不修改对方，可各认领一个并行（跨文件只读引用是安全的）；**pb-core（人人引用的常量与 state）、pb-data（双端对称契约）、pb-sync（被编辑器/列表调用的 I19 引擎）、app.js（render 路由+boot+全局键盘）四个共享文件改动仍需串行**。任何模块新增顶层 const/let 时注意加载序（先定义后执行的只有顶层语句；函数体运行时解析无此限制）。

## 4. 字段收口纪律（R1-C 起）

字段知识单一真相源 = tools/pb.py 的 `FIELD_REGISTRY`（entry/tactic 两节；键/类型/required/enum[值+中文名]/default/dump_order/dump_empty_array/import_merge/lint 规则名/cn）。build 注入 `window.PLAYBOOK.SCHEMA`，JS 侧经 pb-core 的 `schemaEnumPairs/schemaEnumValues/schemaImportMergeKeys` 消费（SCHEMA 缺失 warn 一次回落内置兜底）。

- **加字段 = 改 pb.py 注册表 + 必要 UI 特化**（如 chips 输入、难度 Radio、报点选择器这类特化交互留在编辑器原样）；dump 键序、new 模板、导入净化与合并清单、编辑器选项随注册表自动跟随。
- **JS 侧禁止再新增硬编码字段数组**——提交前 grep 自查：`pb-editor.js/pb-sync.js/pb-data.js` 内不得出现新的 `["title", "oneline", ...]` 式字段清单或 `["lmb", "左键"]` 式枚举字面量（现有：I34 表单校准 FIELDS=UI 特化保留、分拣台短标签 select=UI 特化保留、throwBadge/PHASE_CN 等中文显示表=显示层契约）。
- lint 规则两类：`enum_check: True` 的标量枚举由通用循环驱动；跨字段/内容级规则（id_pattern、source_kind、sets_shapes、pin_uv、timeline_steps 等）以 rule id 记录在字段 `lint` 键，实现在 lint() 内——改规则文案必须先跑 tools/tests/lint_fixtures.py 快照对比。

## 5. 迭代五步清单（缺一不可）

① 规范 delta（涉及 AGENTS/UI/DEV 的先改文档）→ ② 代码 → ③ 验收（`pb lint` 0 ERROR + `pb test` 全绿 + 关键页像素比对 0 diff）→ ④ PROGRESS.md 台账行 → ⑤ git 提交。

## 6. 测试坑清单（浏览器自动化，血泪沉淀）

- **IAB（内置浏览器）goto 不支持 file://**：功能测试用项目根 `python -m http.server 8642` 当载体（应用本身零服务器依赖）；视口/像素级验收用 %TEMP% 下独立安装的 headless playwright（IAB 无视口控制）。
- **playwright evaluate 是隔离世界**：页面顶层变量/函数（state、dumpEntryMd、rootPerm…）读不到；stub（mock 句柄/权限旗标）必须用 `<script>` 标签注入主世界，结果写 `document.documentElement.dataset` 再读回。localStorage 在隔离世界可直接读写。
- **locator.press 不派发按键**：键盘事件一律 evaluate 派发 `new KeyboardEvent("keydown", {key:"Enter", bubbles:true})`；真实用户键盘不受影响。
- **locator.click / 顶栏 cua 坐标点击偶发 actionability 永超时**（force 也超时）：用主世界 `el.click()` 或页面中段 cua 坐标。
- **tab.reload() 有竞态且同 URL 命中内存缓存**：改完代码必须 `pb build`（自动 bump ?v=）后 `tabs.new()` 开新标签页；IAB 标签页会被环境跨轮回收（`tabs.list()` 变空属正常，重建即可）。
- **toast 的 DOM 是 `#toast`（id）不是 `.toast` 类**——此前多轮断言读 null 的真因。
- **合成 click 会把已激活的过滤再点关**：断言前先核对当前过滤状态（探针沿链四点复验再下结论）。
- J/K 高亮步进按 **entryRows 数据序**（≠ DOM 分组序）；列表行选择器是 `.entry-row`（button）不是 `.card`；地图切换控件是 `#map-filter`；默认 Tab=战术板。
- 行内交互元素（fav-btn / diffbtn 等）是 span 不是嵌套 button（entry-row 本身是 button），行 click handler 里 `closest` 命中即 return，不 stopPropagation。
- mock FS 句柄必须实现真实 API 形态（`.entries()` async generator、`h.kind="directory"`、getFile 返回真 File/Blob）；异步渲染后断言前等 300ms；测试残留先怀疑再怀疑代码（localStorage 键：pb-entries-v1 / pb-tactics-v1 / pb-callouts-v2 / pb-retired-v1 / pb-favs / pb-map-order / pb-sort-map）。
- Chrome 对 flex 项 `margin-left: auto` 的 getComputedStyle 返回 used value（0px）而非 "auto"——断言样式请查样式表规则（document.styleSheets.cssRules）而非计算样式。
- 列表分组头（.list-group-head）与行（.entry-row）是**平级兄弟**不是容器包裹——「某组首行」= 文档序下一个 .entry-row，不是组头.nextElementSibling.querySelectorAll。
- 测试用例必须自建状态（自己 goto + 切 Tab）并按显式注册表排序——按函数名字母序执行时，靠前用例遗留状态会污染后续全部断言（R1-A 首跑 4/16 的真因）。

## 7. 工具参考（开发会话专用）

```bat
tools\pb.cmd lint                    :: 校验（0 ERROR 才能过 bat；WARN 不拦）
tools\pb.cmd build                   :: 校验 + build/data.js + build/report.md + index.html ?v= 自动递增
tools\pb.cmd pack                    :: 同 build + 生成 dist/cs2-playbook-YYYYMMDD.zip
tools\pb.cmd new utility <id> --side T --type smoke --map de_mirage   :: 条目模板
tools\pb.cmd new tactic <id> --side T                                 :: 战术板模板
tools\pb.cmd shots <目录> --id <id> [--dry-run]                       :: 截图归位（只复制不搬动，覆盖前存 .bak；认不出的按 mtime 配给 --id）
tools\pb.cmd verify <id> [--broken]   :: CLI 标记实测（网页编辑器可替代）
tools\pb.cmd migrate-difficulty       :: I51 一次性迁移（难度 1-5 → easy/normal/hard，每文件 .bak，幂等）
tools\pb.cmd test                     :: R1-A 回归套件（playwright 可选依赖，缺失时优雅跳过）
```

- **回归套件**（tools/tests/）：16 个用例（顶栏过滤/chips/搜索分词/列表分组/收藏/sets 折叠/行渲染/详情/编辑器 mock FS 写盘/三图层/时间轴排序）+ 两视口三页像素比对。基线在 `tools/tests/baseline/`（入库），产物在 `build/_tests/`（不入库）。**改了行为（UI.md 规格）→ 删 baseline 对应 png 重跑一遍生成新基线，再跑一遍确认确定性**；纯重构（R1-B/C/D）不许动基线。
- 真实 playwright 的 evaluate 在**主世界**（与 IAB 隔离世界相反）——stub 可直接赋值顶层 let（rootPerm/rootDirHandle）；IAB 的 script 注入套路在真实 playwright 不需要。

- `build/report.md`：缺图清单、draft/verified 统计、战术包（sets）统计、拼音索引、问题清单。
- 「同步并打包.bat」= build + pack，使用者的唯一入口；开发会话验证 bat 直接 `call "同步并打包.bat"`。
- 双端对称纪律：投法徽章/枚举/中文表在 pb.py 与 app.js 各一份（CHECK-01 验证过 63 组合），**改一处必须 grep 另一处**；mdScalar/mdKey 与 pb.py dump_doc/dkey 同理（字典键引号规则以读端 _KEY_RE 裸键白名单为准）。

## 8. 环境速查（2026-10 现状）

- Python 3.12：`%LocalAppData%\Programs\Python\Python312`；多命令 python 一律加 `-X utf8`。
- git：npmmirror 便携版 2.56，`%LocalAppData%\Programs\Git\cmd\git.exe`（未入 PATH；winget 下载源在本机连不上 GitHub、装包走 npmmirror 镜像；github.com 直连 2026-10-27 实测可达，push/clone 正常）。
- ffmpeg：pip 的 imageio-ffmpeg 自带二进制（harvest.py 的 find_ffmpeg 已内置回退）；中文标注字体 simhei.ttf 在项目根。
- yt-dlp：pip 装；B 站未登录可拉 1080P30（仅 4K/1080P60 要会员）；竖屏视频分辨率判定用 `width<=1920`。
- AutoHotkey v2：`%LocalAppData%\Programs\AutoHotkey\v2`（pin.bat 已探测此路径）。
