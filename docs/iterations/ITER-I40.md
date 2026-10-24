# 迭代 I40 开发包 — ⚙ 册子待办面板 + Ctrl+V 直接贴图进图槽

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，粘贴下面提示词执行。
> 背景（2026-10-04 用户拍板三功能之二、之三，均为小件合包）：
> ① lint 报告（缺图/待验证）只在开发侧文件里，用户永远看不到——⚙ 里放一个健康面板，
> 册子自己提醒哪些颗还没录完（如 Mirage 13 号曾缺瞄点/效果图，靠口头告知不靠谱）；
> ② 用户主输入是 F12/QQ 截图，现在要"存文件→选文件→上传"三步——改成 Ctrl+V 直接贴进图槽。
> 前置：无（与 I37/I38/I39 无代码依赖；若与 I39 同期执行，后执行者以 grep 复核锚点为准）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I40：册子待办面板 + Ctrl+V 贴图）。改 assets/js/app.js、
style.css、help.html（可选一句话）。动手前 grep 核实锚点（I40 编写时快照，以 grep 为准）：
⚙ 设置弹层 settingsPanel 结构（I17 建、I20 加 📤📥、搁置区节）、data.entries 的 images 结构
（{slot,label,path}）、BASE_SLOTS=["1-stand","2-aim","4-result"]、STATUS_CN、entryDetailPage 与
viewerSlotByEntry（当前翻图槽位）、openEntryEditor 的槽位行（data-imgslot 输入）、uploadSlotImage
（编辑器/详情上传共用，I36 修复后的全路径版本）、分拣台 SORT_SLOTS 槽位按钮（data-sp-slot）与其
图片写入路径、compressToSlot、state.entryView/state.editingId。

一、⚙ 设置加「册子待办」面板（放在最顶部或 📤📥 之前）
1. 统计行（只读数字+点击展开）：已实测 X 颗 / 待验证 Y 颗 / 已失效 Z 颗 / 缺基础图 N 颗
   （缺 1-stand/2-aim/4-result 任一即计入，按 e.images 的 slot 判断；统计范围=当前失效开关
   状态下的可见条目，与列表口径一致）。
2. 每组可展开为条目行：类型图标 + 标题 + 缺哪几个槽（角标 chips）；点击行 = 关闭设置弹层 +
   跳该条目详情页（state.entryView=id, tab=entries, render()）——用户直接在详情页补图/补状态。
3. 全部完成时显示一行「✓ 册子很健康：没有待办」。数据全部来自内存 data.entries 即时计算，
   不读 build/report.md（那个是开发侧的）。

二、Ctrl+V 直接贴图（图片类剪贴板才响应，文本粘贴不受影响）
1. document 级 paste 监听：clipboardData 里没有 image 项 → 直接 return（永不拦截文字粘贴）。
2. 目标槽位判定（按优先级取第一个命中的）：
   a. 道具编辑器打开（state.editingId）：取「最后点过焦点」的槽位行（focusin 记录，缺省=第一个
      缺失的基础槽）；
   b. 详情页打开（state.entryView）：取当前翻图槽位（viewerSlotByEntry 现有变量；缺省=第一个
      缺失基础槽）；
   c. 分拣台可见：取最后点过的 data-sp-slot 槽位（focusin/click 记录；无记录 toast 指引）；
   d. 都没有：toast「先在道具详情/编辑器里点一下要填的图槽，再 Ctrl+V」。
3. 上传复用既有管线：剪贴板 image 项转 File（new File([blob], "clipboard.png")）→ compressToSlot →
   a/b 走 uploadSlotImage 同款逻辑（ready 写盘 / 未授权 IndexedDB 暂存，I36 全路径语义）；
   c 走分拣台自己的槽位写入函数（把 File 交给它现行的槽位处理，不另写一路存图代码）。
4. 成功 toast「站位 已贴入 ✓」/失败 toast；分拣台行槽贴入后缩略图即时刷新。
5. 防呆：粘贴目标槽位已有图时直接覆盖（与"替换图片"同语义），toast 说明已替换。
6. help.html「常见问题」节加一行：截图后直接在图槽上 Ctrl+V 就能贴图，不用先存文件。

三、收尾
pb lint / build / pack；?v= 自动递增；一次性脚本清理；
docs/PROGRESS.md 执行记录表末尾追加一行并更新「当前状态」。

红线：不引入第三方依赖、file:// 直开；文字粘贴/既有复制（⧉）行为零影响；不改 pb.py；
不动 I19/I35/I39 语义；统计口径与列表可见性一致（失效开关关着时不把已失效计入待验证）。

验收清单（逐项自检，浏览器自动化优先）——**2026-10-04 执行完毕，全过**
- [x] 待办面板四组计数与内存口径一致（实测 41/10/0/0 与逐条重算相同）；内存即时算不读 report.md；点击缺图条目行（注入临时缺图条目验证）正确跳详情页并关闭设置
- [x] 无待办时健康行逻辑就位（当前 10 颗 draft → 显示待办组）；失效开关切换计数联动（口径函数读 state.showArchived，代码核验+开关切换实测计数不变因无 broken 条目）
- [x] Ctrl+V 三场景：详情页当前槽贴图（非 ready→idb 暂存 `idb:tmp-*/1-stand` ✓；ready→mock 写盘 `media/de_dust2/*/1-stand.png` ✓，render 重置 viewer 槽位为第一个有图槽=既有 I6 行为，贴入当前显示槽正确）；编辑器指定槽（focusin 记录 2-aim → 局部更新不丢表单 + hint「瞄点 已贴入 ✓」）✓；分拣台指定槽（lastSpSlot → sortPutToSlot src:"file"）✓；**>1920 自动压缩生效（2560→1920 实测）**
- [x] 文字粘贴不受影响（无 image 项直接 return，合成事件 notCanceled=true 证明零拦截；合成 ClipboardEvent 不触发浏览器真实插入行为，属测试环境固有限制）；无目标槽时指引 toast ✓；控制台零报错
- [x] lint 0E/0W / build / pack 通过（cs2-playbook-20261004.zip，?v=123）；测试残留已清（tmp idb 图 2 张、覆盖层 tmp edited、图层记忆）
用户侧确认清单：
- [ ] ⚙ 里能看到缺图/待验证清单，点一下就到那颗道具
- [ ] 游戏里 F12 截图 → QQ 里 Ctrl+C 截图 → 网页图槽 Ctrl+V，三秒进图
```

---

## 给用户的说明（大白话）

两个顺手的小改造：

**① ⚙ 设置里多了「册子待办」。** 哪几颗缺图、几颗还没实测、几颗失效了，一打开就知道，
点一条直接跳到那颗道具去补——不用再靠我或台账告诉你“13 号还缺图”这种话。

**② 截图直接 Ctrl+V。** 以前录一颗图要“存文件→点上传→选文件”三步；现在游戏里 F12 或 QQ 截图
（Ctrl+C 复制）之后，回到网页在要填的图槽上直接 Ctrl+V 就进去了，还能自动压缩。编辑器、详情页、
分拣台三处都支持。打字粘贴文字完全不受影响。

## 变更记录

| 日期 | 会话 | 记录 |
| --- | --- | --- |
| 2026-10-04 | 规划 | 创建本开发包（用户拍板三功能之二③合并小件包）：⚙ 册子待办面板（缺图/待验证/已失效计数+点击跳详情补图）+ Ctrl+V 贴图进图槽（编辑器/详情/分拣台三处，复用 I36 上传管线，文字粘贴零影响） |
| 2026-10-04 | 开发 | **执行完成**（?v=123，pack cs2-playbook-20261004.zip，lint 0E/0W）：① ⚙ 顶部「📖 册子待办」四组计数（已实测/待验证/已失效/缺基础图，内存即时算，口径随失效开关）+ 组展开条目行（缺图组带槽位 chips）+ 点击行关设置跳详情；② Ctrl+V：document paste 监听只认 image 项，目标优先级=编辑器（pasteEditorCtx 上下文+focusin 槽位记录，局部更新不丢表单；ready 写盘/idb 暂存双路径）→详情页（viewerSlotByEntry）→分拣台（lastSpSlot+sortPutToSlot）→指引 toast；help.html ① 补拼音搜索/图层/Ctrl+V 大白话说明 |
