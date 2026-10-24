# 迭代 I5 开发包 — 零命令行改造：道具二级页面 + 网页内实测/传图 + 同步图标

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：用户明确反馈「不想碰命令行，一切操作在网页上完成」。AGENTS.md 已新增硬性约束一.8
> （零命令行使用）并解除「编辑器不可改 status」的旧红线。本迭代落实。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I5，零命令行改造）。先读 assets/js/app.js 的
state/render 分支（道具列表、accordionCard、entryEditor、drillCard）、条目本地覆盖层
（pb-entries-v1：edited/deleted/added + dumpEntryMd）、IndexedDB 用法（idbGet/idbSet，
存文件夹句柄的库），再动手。改前端记得 index.html 的 ?v= 递增。

一、道具 Tab 改二级页面（用户主诉：从上往下翻太麻烦）
1. 一级 = 紧凑列表页：每行 = 类型图标 + 标题 + 投法徽章 + 难度点 + 状态徽章（待验证/已实测），
   行高紧凑，一屏能看 15+ 行；顶部沿用现有过滤条（地图/T/CT/类型/搜索），行按 阶段分组
   （默认 / 爆点 / 回防 / 下包后…），组头吸顶可选。列表底部显示「N 条 · M 条已实测」。
2. 点行进入二级详情页 = 现有折叠栏大图样式（accordionCard 全量内容：oneline 大字、
   投法徽章+难度、图片竖排带角标、注意事项折叠、编辑按钮），左上角「← 返回列表」；
   详情页底部加「‹ 上一条 / 下一条 ›」（按当前列表顺序循环）。
3. 键盘：列表页 ↑/↓ 或 J/K 移动高亮、Enter 进入详情；详情页 ←/→ 切换上/下一条、
   Esc/Backspace 返回列表。state 里加 entryDrill（记忆当前列表滚动位置，返回时还原）。
4. 战术板 Tab 行为不变；道具 Tab 的搜索命中高亮、失效也显示开关等既有逻辑在一级页生效。

二、网页内「标记已实测」（替代 pb verify，用户不再碰命令行）
1. 详情页状态徽章可点击：「待验证」点弹确认（「确认已在游戏内稳定复现？」）→
   status=verified + checked=今天；「已实测」点确认 → 退回 draft。写进条目覆盖层
   （pb-entries-v1.edited）并走既有 dumpEntryMd 写回链路（关联文件夹时写 data/entries/*.md）。
2. 编辑表单里的 status 字段同步放开：下拉 可选 待验证/已实测/已失效/弃用，
   改成 verified 时自动填 checked=今天（可改），老红线「编辑器不可改 status」废止（AGENTS.md 已改）。
3. 确认弹窗用现有 toast/confirm 风格组件，不用 alert（会阻塞自动化）。
4. pb verify 命令行保留不动（开发会话用），但一切用户文档/界面文案不得再提它。

三、网页内图片上传/替换（替代 pb shots，用户不再碰命令行）
1. 详情页每个图片槽位（站位/瞄点/落点/效果 + 扩展槽）右上角加「上传/替换」按钮：
   <input type=file accept="image/*">，选图后前端处理——宽 >1920 用 canvas 等比压到 1920，
   输出 jpg（质量 0.85）或保持 png；按槽位命名（1-stand/2-aim/3-landing/4-result/5-alt…）。
2. 写盘：已关联项目文件夹 → 直接写入 media/<map>/<id>/<槽位>.<ext>；未关联 →
   图片 Blob 暂存 IndexedDB（新建 store，key = entryId + "/" + 槽位），页面用 objectURL
   立即显示，角标「未同步」；关联后或点「同步」时补写盘。
3. 条目覆盖层记录 images 槽位清单变化（新增/替换/删除槽位），保证不跑 pb build 也能立即正确显示；
   覆盖层与磁盘一致的时机由「同步并打包.bat」收敛。
4. 槽位支持删除（删扩展槽；四个基础槽只允许替换不允许删）。
5. pb shots 命令行保留不动，用户文档不再提它。

四、根目录「同步并打包.bat」+ 未同步提示
1. 新建根目录 同步并打包.bat（UTF-8 中文回显需 chcp 65001 >nul）：
   @echo off → chcp 65001 >nul → cd /d %~dp0 → call tools\pb.cmd build → call tools\pb.cmd pack
   → echo 同步完成，发布包已更新 → pause。任何报错 pause 住让用户拍照发群里。
2. 查看器顶栏加一个小状态点：存在未同步改动（覆盖层/IndexedDB 图片非空）时显示
   「● 有未同步修改，双击桌面『同步并打包.bat』」轻提示；点它可复制这句话。
3. README.md 的「日常使用」章节改写为零命令行版本（网页改 → 双击同步），命令行内容
   折叠到「开发者」一节。

红线：不改 pb.py 与数据文件格式；dumpEntryMd 与 pb.py 解析器必须保持互逆
（status/checked 进出一致）；四个基础图槽的槽位命名规范不变（media/<map>/<id>/1-stand…）；
发布包结构不变（朋友版仍零环境）。
验收清单（逐项自检）：
- [x] 道具 Tab 默认落在一级列表，行点击进详情，返回还原滚动位置；键盘全链路可用
- [x] 详情页「待验证 → 已实测」确认后变绿、checked 自动填今天；退回变橙；关联文件夹时
       data/entries/*.md 的 status/checked 同步变化
- [x] 每个槽位可上传/替换图片：>1920 自动压缩；未关联时显示「未同步」角标且刷新后仍在；
       关联后写盘到 media/<map>/<id>/ 正确命名
- [x] 双击 同步并打包.bat：窗口显示 build+pack 成功，dist zip 时间戳更新，解压可见新内容
- [x] 顶栏未同步提示出现/消失正确
- [x] pb lint / pb build 通过；?v= 已递增；发布包解压双击可用
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I5 | 创建（用户反馈"不想碰命令行"）：道具 Tab 二级页面（列表→详情+上/下一条）；网页内标记已实测/退回（status 编辑解锁，AGENTS.md 红线同步废止）；图片槽位网页上传/替换（自动压缩、IndexedDB 暂存、关联写盘）；根目录同步并打包.bat + 顶栏未同步提示 |
| 2026-10-01 | I5 | 执行完成：①道具 Tab 二级页面（阶段分组紧凑列表 12 行/详情复用 entryCard/←返回/‹›上下一条/键盘 ↑↓+Enter+←→+Esc/Backspace/滚动位置记忆）；②网页内标记已实测（详情页状态徽章两段确认 verified+checked=今天/退回 draft；编辑器 status 下拉放开+实测日期字段，新增仍强制 draft）；③图片槽位网页上传（>1920 canvas 压缩 jpg0.85；关联写盘/未关联 IndexedDB 暂存+「未同步」角标+刷新保留；扩展槽可删；同步徽章一键补写盘）；④同步并打包.bat（GBK 编码避 chcp 解析坑，中文回显验证）+ 顶栏未同步徽章 + README 零命令行改写 + ?v=12。附带修复：allIdbImages 双请求竞态永挂（getAll/getAllKeys 都要 onsuccess）；无损合并被浏览器快照冲掉的磁盘 callouts（从 dist zip 找回 4 个 Mirage 点位，用户手放的 Nuke52/Vertigo50 保留） |
