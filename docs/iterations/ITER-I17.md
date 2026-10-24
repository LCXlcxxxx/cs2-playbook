# 迭代 I17 开发包 — 全局设置（失效开关迁移+自定义移动）+ 收藏置顶 + 报点一致性 + 关联体验

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：用户四条反馈（2026-10-01，附截图）。前置：I16 已执行（?v=24）。
> 数据现状：条目 18（Dust2），12 颗 verified 已由用户在网页里改好投法。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I17）。改 assets/js/app.js、style.css、index.html、tools/pb.py。
动手前先 grep 核实：showArchived / archived-toggle、throwBadge 的 M 表、entryListPanel 分组渲染、
initRootHandle / btn-link-root、openCalloutPicker 与 calloutMapCard 的报点数据源。

一、全局设置（替换顶栏「失效也显示」）
1. index.html 删除 archived-toggle 勾选框；顶栏加「⚙」按钮（搜索框右侧）。
2. 点 ⌀ 打开设置弹层（overlay 风格同选点弹窗，Esc/取消可关）：
   - 「显示失效与弃用条目」开关：读写 localStorage pb-show-archived，state.showArchived 初始
     从这里取（原内存态迁移为持久化）；
   - 「自定义移动方式」：列表可添加/删除（文本输入+回车），存 pb-move-extra（字符串数组，
     值即显示名，如「蹲下」）；预置一项「蹲下」（首次初始化时若 key 不存在则写入 ["蹲下"]）；
   - 预留：以后设置项往这里加。
3. 编辑器「移动」下拉 = 内置 6 项 + pb-move-extra 自定义项（value=显示名本身）；
   throwBadge：move 在内置 M 表用映射，否则显示原始文本（如「蹲下·右键·轻抛」）。
4. tools/pb.py：ENUMS 校验 move 不在内置枚举时由 ERROR 降为 WARN（"自定义移动值"）；
   BADGE_MOVE 取值改 .get(move, str(move)) 容错（先看 throw_badge 现实现再改）。

二、收藏置顶
1. localStorage pb-favs（id 数组）。entryListPanel 每行「已实测」徽章右侧加星按钮
   （☆/⭐，click stopPropagation 切换收藏并重渲染，不触发行点击进详情）；
   entryDetailPage 头部同样加星。
2. 列表分组：在「默认」之前插「⭐ 收藏」分组，收藏条目从原 phase 分组中剔除不重复显示；
   收藏分组同样受当前地图/类型/搜索过滤约束。

三、报点图一致性（先诊断后修）
1. 现象：道具编辑的选点弹窗（openCalloutPicker）与首页报点图（calloutMapCard）里
   同名报点位置不同（如「空调」「头皮位」「电梯位」）。两处代码都读 allCallouts()，
   需先诊断：浏览器里对比「空调」在两处的渲染 left/top 百分比与 allCallouts 数据 u/v——
   数据不同则查数据源；数据相同则是容器/底图渲染差异。
2. 按诊断结果修复，目标是：同一报点在弹窗、首页、报点编辑器三处相对地图位置严格一致。
3. 顺带检查弹窗 61 点在 900px 容器里的可读性（标签过挤则加大弹窗宽度或支持缩放）。

四、关联项目文件夹体验（File System Access 授权太麻烦）
1. 现状根因：initRootHandle 在 queryPermission 非 granted 时把句柄丢弃（置 null），
   导致浏览器重启后必须重新 showDirectoryPicker 选文件夹。
2. 改为：句柄保留在 IndexedDB 不丢；initRootHandle 返回三态 ready / need-permission / none。
   工具栏按钮三态：「📁 关联项目文件夹」（none）→「🔑 重新授权项目文件夹」（need-permission，
   点击走 requestPermission，浏览器弹一次允许即可，无需重选文件夹）→「✔ 已关联」（ready）。
3. 文案写明关联目标：「选择项目根目录（含 index.html 的 CS2 文件夹）」；
   need-permission 时提示「浏览器重启后权限会过期，点一次重新授权即可」。
4. autoSyncOnBoot 在 need-permission 时保持静默（无法无手势授权），徽标继续提示。

五、收尾
1. index.html 三处 ?v= 以 grep 实际值递增（当前 24 → 25）。
2. pb lint / pb build / pb pack 跑一遍。

红线：投法三字段仍是受控枚举+设置里定义的自定义项，条目里不能随手写自由文本；
收藏只存浏览器不进 .md；不碰 12 颗 verified 条目的数据；不动 lightbox/重置按钮既有行为。
验收清单（逐项自检，强刷后）：
- [x] 顶栏无「失效也显示」；⚙ 设置弹层可开可关，失效开关迁移后行为不变
- [x] 设置里预置「蹲下」；编辑器移动下拉出现「蹲下」，选它保存后徽章显示「蹲下·左键·跳投」；
      pb lint 对自定义 move 只 WARN（实测 B门烟 move=蹲下 → WARN 非 ERROR，已还原）
- [x] 列表「⭐ 收藏」分组置顶；星按钮切换即时生效、不误触进详情；详情页星按钮同步
- [x] 报点一致性诊断结论：两处渲染同源一致（首页渲染 left=u 精确吻合）——"不一样"的真因是
      用户自加点「空调」曾存于浏览器叠加层，点「还原默认」清叠加层后被删。已把「空调」补进
      内置 callouts.json（u0.725 v0.34 草稿，可编辑器拖准），弹窗/首页均显示（62 点）
- [x] 模拟权限过期：句柄保留（rootPerm 三态），「🔑 重新授权」走 requestPermission 一键恢复，
      不需要重选文件夹；写盘入口在非 ready 时一律视为未关联（不误写）
- [x] lint / build / pack 通过；控制台无报错

执行说明（2026-10-01）：设置弹层复用选点弹窗的 overlay/互斥/Esc 机制；收藏存 localStorage
pb-favs 不进 .md；顶栏「失效也显示」删除后 ⚙ 设置里持久化（pb-show-archived）。
关联目标写进按钮提示：项目根目录（含 index.html 的 CS2 文件夹）。?v=24→25。
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I17 | 创建（用户四条反馈）：① 顶栏「失效也显示」迁入全局设置弹层（⚙），新增自定义移动方式（预置「蹲下」，pb.py 未知 move 降 WARN）② 收藏置顶（⭐ 行内/详情按钮 + 收藏分组，localStorage）③ 选点弹窗与首页报点图不一致——先诊断后修 ④ 关联体验：句柄不再丢弃，「🔑 重新授权」替代重选文件夹 |
| 2026-10-01 | I17 | 执行完成：A/B/D 全过；C 诊断=渲染同源一致，"不一样"实为用户自加点「空调」随叠加层清空丢失——已补进内置 callouts.json（62 点）。?v=24→25 |
