# 迭代 I10 开发包 — 报点编辑器：点地图报点自动跳到下方编辑行

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：用户反馈编辑报点时下方编辑列表太长难找——希望点击地图上的报点标签（如「叉箱」）
> 自动跳到编辑栏对应行。小改动，一个会话完成。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器小迭代（迭代 I10）。只改 assets/js/app.js 与 style.css，
不碰数据文件。先读 calloutEditor()/refreshEditor()/startDrag()（报点编辑器三件套）。

一、点地图报点标签 → 跳到编辑行并高亮
1. 编辑器里每个地图标签（.callout-label.draggable，data-idx）加点击跳转：
   点击后把 #editor-list 中对应 .editor-row[data-idx] 滚动到视口中央
   （scrollIntoView { behavior:"smooth", block:"center" }），给该行加高亮样式
   （如 .row-flash，背景闪 1.5s 后移除），并 focus 该行的 .f-name 输入框（光标置末尾）。
2. 与拖拽的冲突处理：startDrag 已在 pointerdown 接管，直接监听 click 可能被拖拽吞掉。
   在 startDrag 里记录指针累计位移，pointerup 时若位移 < 4px 视为「点击」，
   手动调用跳转逻辑（或用一个 dragged 标志位，在标签的 click 事件里判断非拖拽才跳转）。
3. 反向联动（顺手加）：编辑行获得焦点（click/focus 进 .f-name 或 .f-search）时，
   地图上对应报点标签加 .label-flash 高亮 1.5s，双向都能找到对方。

二、收尾
1. index.html 三处 ?v= 递增到 17（style.css / data.js / app.js 保持同号）。
2. pb lint / pb build / pb pack 跑一遍。

红线：不改拖拽本身的手感（位移阈值只用于区分点击）；不动数据与记录文件。
验收清单（逐项自检，强刷 ?v=17 后）：
- [x] 点地图上任意报点标签（如叉箱），编辑列表滚到对应行、高亮、名称框聚焦
- [x] 拖动报点换位后松手，不误触发跳转；轻点（无位移）触发跳转
- [x] 点编辑行的输入框，地图上对应标签闪高亮
- [x] lint / build / pack 通过；控制台无报错
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I10 | 创建（用户反馈"编辑栏太难找"）：编辑器点地图报点标签自动滚动到编辑行+高亮+聚焦；反向行→标签联动；拖拽/点击冲突以位移阈值区分 |
| 2026-10-01 | I10 | 执行完成：点标签（位移<4px 判点击）→ 编辑行滚动居中+row-flash 高亮+聚焦名称框；行 focusin 反向 label-flash；拖拽大位移不误触发。?v=16，浏览器实测三场景通过 |
