# 迭代 I6 开发包 — 修复详情页翻图面板（恢复 I5 丢失的折叠栏缩略图交互）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：I5 重构详情页（entryCard）时把图片改成了全宽竖排堆叠，绕开了原 accordionCard 的
> 「缩略图 + 悬停大图面板（左右切换/展开大图）」交互；accordionCard/thumbPopup 已成死代码。
> 用户要求恢复快速翻图能力。数据文件一律不动。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器修复迭代（迭代 I6）。只改 assets/js/app.js（及 style.css）。
先读 entryCard()（约 1596 行）现在的图片竖排实现，以及已成死代码的
accordionCard()/thumbPopup()/openThumbPop()（约 941-1077 行）里可复用的交互样式。

一、详情页图片区改为「翻图面板」（恢复折叠栏缩略图的快速翻图能力，且更适合整页详情）
1. 布局：大图常驻（占详情页主视觉，高度约 60vh，object-fit contain）；
   大图下沿一行槽位 chips：站位 / 瞄点 / 落点 / 效果 / 扩展槽（按 slot 顺序），
   当前槽 chip 高亮；空槽 chip 显示「站位·缺图」样式但仍可选中。
2. 交互：
   - 点左右半区（复用原 pop-zone 样式，半透明 ‹ › ）在「有图的槽位」间循环切换；
   - 点 chips 直接跳槽位；点大图 = 展开 lightbox（沿用 openLightboxCtx，从当前槽起，可左右切换）；
   - 键盘不抢 ←/→（那仍是上一条/下一条）；可选加 [ / ] 键翻图。
3. 工具跟随当前槽位：大图右上角显示当前槽角标（站位…）+「上传/替换」+「未同步」角标 +
   扩展槽「删除」（两段确认，沿用现有 arm 模式）；空基础槽显示缺图占位 + 上传按钮。
   现有 uploadSlotImage/deleteSlotImage/compressToSlot/覆盖层逻辑全部复用，不改语义。
4. 进详情页默认选中第一个有图的槽位；上一条/下一条切换后同样重置。
5. 状态徽章/编辑/来源/注意事项等 entryCard 其余部分保持不变。

二、清理死代码
accordionCard、thumbPopup、renderThumbPop、stepThumbPop、hideThumbPop、openThumbPop
及其专属 CSS（acc-thumb/pop-zone 旧规则，翻图面板新样式可复用类名）一并移除或重构进新面板，
确保没有残留引用（全局 grep 确认）。

三、验收（强刷 Ctrl+F5）
- [x] 详情页一屏内完成翻图：chips 跳槽、左右区循环切换、点大图进 lightbox 且从当前槽起
- [x] 当前槽的上传/替换/未同步/删除（扩展槽）全部工作，行为与 I5 一致
- [x] 缺图槽（如 jungle 闪）显示占位并可上传
- [x] ←/→ 仍是上一条/下一条，不与翻图冲突
- [x] 上一条/下一条切换后翻图面板重置到第一个有图槽位
- [x] 无残留死代码引用；pb lint / pb build 通过；?v= 已递增；pb pack 重新打包
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I6 | 创建（用户反馈"I5 把折叠栏缩略图干没了"）：详情页图片区改翻图面板（大图常驻 + 槽位 chips + 左右切换 + 工具跟随当前槽位），清理 accordionCard/thumbPopup 死代码 |
| 2026-10-01 | I6 | 执行完成：entryCard 图片区改翻图面板（大图 16:9 自适应/宽屏限高 60vh + 槽位 chips 含「·缺图」虚线样式 + 左右半区在「有图槽位」间循环 + 点大图进 lightbox 从当前槽起 + [ ] 键翻图 + 工具跟随当前槽位：上传/替换·未同步角标·扩展槽删除两段确认）；进详情/上一下一条切换重置到第一个有图槽（同条目重渲染保持当前槽）；死代码清除：accordionCard/thumbPopup/renderThumbPop/stepThumbPop/hideThumbPop/openThumbPop/popCtx/popHideTimer/state.accOpen 及全部 acc-/#thumb-pop/pop-zone 旧 CSS（grep 零引用）；附带修：.viewer-empty 的 display:flex 覆盖 hidden 属性老坑。?v=13，lint 0 ERROR |
