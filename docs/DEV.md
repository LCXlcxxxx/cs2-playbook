# CS2 Playbook — 开发会话工作手册（DEV.md）

> 硬约束在 AGENTS.md；进度台账 docs/PROGRESS.md（先读后写）；查看器行为规格 docs/UI.md。
> 本手册收编散在提示词与会话记忆里的开发约定，新会话先读这页再动手。

## 1. Shell 铁律（历史事故沉淀）

- **cmd 多命令只用 `&` 连接，永不用分号**——`del a ; b` 的分号曾是参数分隔符，tools/pb.py 被整个误删过三次（最近一次 2026-10-04，靠 `__pycache__` 字节码侥幸重建）。
- **cmd 内联中文的 `python -c` / `node -e` 多行必断**（GBK 静默吞掉、无输出假象）：一律用 Write 写临时脚本文件，`python -X utf8` 执行后删除（项目惯例放 build/ 下 `_xxx.py`，用完即删）。
- `findstr` 查中文不可靠（GBK/UTF-8 编码错位、/A 等参数歧义）：中文 grep 用临时 python 脚本或 PowerShell `Get-Content -Encoding UTF8`。tools/g.py 是历史尝试，同样别依赖。
- Edit 工具报 "File has been modified since read" = 并行会话写盘：**重读再改，绝不硬覆盖**；PROGRESS.md 追加行前必须重读表尾。
- 大区间代码替换后必须立即 `node --check assets\js\app.js` + grep 关键声明 + 浏览器冒烟（I41 曾误吞 I38 后端块的教训）；改 .cmd/.bat 用纯 ASCII，echo 内容禁半角括号。

## 2. git 流程（R0 起）

- 本地仓库在项目根（`git init -b main`，**无远端、永不 push**）。git.exe 位置：`%LocalAppData%\Programs\Git\cmd\git.exe`（npmmirror 便携版 2.56，**未加入 PATH**——winget 在本机因 GitHub 直连失败不可用，Dev 会话用全路径调用）。
- 仓库级身份已配（不动全局）：`user.name=cs2-playbook-dev`、`user.email=cs2-playbook-dev@localhost`（占位）、`core.autocrlf=false`（防整库换行抖动污染 diff）。
- **提交规范**：每迭代 = 改动 + PROGRESS.md 台账行 + 一条 git 提交，信息格式 `ITER-Ixx: 摘要` 或 `Rx: 摘要`。大改前先做基线提交，保证重构本身可回滚。
- **并行规则**：R1（代码重构）完成前，动 app.js 的迭代一律**串行**——等前一会话台账入账且 `git status` 干净再动手；R1 拆文件后才可分支并行。
- 不入库（.gitignore）：`dist/`、`build/`、`*.bak`、`*.zip`、`__pycache__/`、`cookies.txt`、`tools/_test*`；**media/ 与 文件夹批量录入/ 内容图片入库**（内容可回滚是核心收益，本地仓 ~290MB 可承受）。
- **红线**：git 只存在于开发会话；任何面向使用者的文档/界面/说明不得出现 git 字样。

## 3. 迭代五步清单（缺一不可）

① 规范 delta（涉及 AGENTS/UI/DEV 的先改文档）→ ② 代码 → ③ 验收（`pb lint` 0 ERROR + 浏览器/脚本实测）→ ④ PROGRESS.md 台账行 → ⑤ git 提交。

## 4. 测试坑清单（浏览器自动化，血泪沉淀）

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

## 5. 工具参考（开发会话专用）

```bat
tools\pb.cmd lint                    :: 校验（0 ERROR 才能过 bat；WARN 不拦）
tools\pb.cmd build                   :: 校验 + build/data.js + build/report.md + index.html ?v= 自动递增
tools\pb.cmd pack                    :: 同 build + 生成 dist/cs2-playbook-YYYYMMDD.zip
tools\pb.cmd new utility <id> --side T --type smoke --map de_mirage   :: 条目模板
tools\pb.cmd new tactic <id> --side T                                 :: 战术板模板
tools\pb.cmd shots <目录> --id <id> [--dry-run]                       :: 截图归位（只复制不搬动，覆盖前存 .bak；认不出的按 mtime 配给 --id）
tools\pb.cmd verify <id> [--broken]   :: CLI 标记实测（网页编辑器可替代）
tools\pb.cmd migrate-difficulty       :: I51 一次性迁移（难度 1-5 → easy/normal/hard，每文件 .bak，幂等）
```

- `build/report.md`：缺图清单、draft/verified 统计、战术包（sets）统计、拼音索引、问题清单。
- 「同步并打包.bat」= build + pack，使用者的唯一入口；开发会话验证 bat 直接 `call "同步并打包.bat"`。
- 双端对称纪律：投法徽章/枚举/中文表在 pb.py 与 app.js 各一份（CHECK-01 验证过 63 组合），**改一处必须 grep 另一处**；mdScalar/mdKey 与 pb.py dump_doc/dkey 同理（字典键引号规则以读端 _KEY_RE 裸键白名单为准）。

## 6. 环境速查（2026-10 现状）

- Python 3.12：`%LocalAppData%\Programs\Python\Python312`；多命令 python 一律加 `-X utf8`。
- git：npmmirror 便携版 2.56，`%LocalAppData%\Programs\Git\cmd\git.exe`（未入 PATH；本机 winget 因 GitHub 直连失败不可用，下载走 npmmirror 镜像）。
- ffmpeg：pip 的 imageio-ffmpeg 自带二进制（harvest.py 的 find_ffmpeg 已内置回退）；中文标注字体 simhei.ttf 在项目根。
- yt-dlp：pip 装；B 站未登录可拉 1080P30（仅 4K/1080P60 要会员）；竖屏视频分辨率判定用 `width<=1920`。
- AutoHotkey v2：`%LocalAppData%\Programs\AutoHotkey\v2`（pin.bat 已探测此路径）。
