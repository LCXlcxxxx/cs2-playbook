# 迭代 I7 开发包 — 槽位调整：删除「落点」，「效果」更名「落点&效果」

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：用户确认效果图天然包含落点信息，且全部现有条目均未使用 3-landing 槽（媒体目录零文件）。
> AGENTS.md §四 已同步修改（4-result 角标改「落点&效果」，3-landing 删除，个别需要落点视角时用扩展槽 5-landing）。
> 前置核对（2026-10-01）：I6 已执行完成（详情页翻图面板已上线，?v=13；accordionCard/thumbPopup 死代码已清理），
> pb.py 自 9/30 未改动。本包引用以该现状为准，动手前先 grep 核实。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行槽位调整迭代（迭代 I7）。改动小而分散，务必改干净、保持一致。
动手前先 grep "3-landing" 与 "效果" 定位全部引用点（下文行号可能因 I6 重构偏移，以 grep 为准）。

一、查看器 assets/js/app.js
1. 全局唯一的槽位标签表（SLOT_LABELS，含 ["1-stand","站位"]…）：
   删除 ["3-landing","落点"]；["4-result","效果"] 改为 ["4-result","落点&效果"]。
2. BASE_SLOTS：改为 ["1-stand", "2-aim", "4-result"]。
3. 详情页翻图面板与编辑器的所有槽位文案（chips 标签、缺图占位、角标、上传按钮旁标注）
   必须统一从槽位标签表取值；grep 硬编码的 "效果"/"落点" 文案，逐个改为取表或同步更新。
   注意标签含 & 字符，所有经过 innerHTML 拼接的出口必须 escapeHtml（全局检查）。
4. 编辑器/上传相关：任何槽位下拉或预设列表里去掉 3-landing；扩展槽能力不变
   （用户仍可自由加槽，能自定义命名即可，不必预置 5-landing）。

二、工具 tools/pb.py
1. 槽位标签表："4-result": "落点&效果"，删除 "3-landing" 行。
2. FLASH_ORDER / DEFAULT_ORDER：两表都删去 "3-landing"，统一为
   ["1-stand", "2-aim", "4-result"]。
3. lint 里「非闪光条目缺 3-landing」的 INFO 提示：整段删除。
4. required slots 逻辑里对非闪光追加 "3-landing" 的分支：删除，闪光与非闪光统一
   REQUIRED_SLOTS。检查该函数上下文，确认没有别处再引用 3-landing。
5. pb new 的条目模板若列了槽位说明，同步更新；全局 grep "3-landing" 确认清零
   （docs/ 目录的历史迭代文档不必改）。

三、收尾
1. pb lint：预期原先 8 条「非闪光条目缺 3-landing」INFO 全部消失，0 ERROR。
2. pb build 后浏览器强刷（?v= 递增到 14）验证：详情页翻图面板 chips 显示
   站位 / 瞄点 / 落点&效果（+扩展槽），编辑器与上传按钮不再出现落点槽。
3. pb pack 重新打包。

红线：不动 data/ 与 media/ 的任何现有文件；基础槽名 1-stand/2-aim/4-result 不变
（磁盘命名兼容）；翻图面板（I6）与同步（I5）功能不碰。
验收清单（逐项自检）：
- [x] 全局 grep "3-landing" 在 app.js / pb.py 中为零
- [x] 详情页翻图面板与编辑器显示「落点&效果」，无落点槽；chips、占位、上传、角标四处一致
- [x] lint 0 ERROR 且无 3-landing INFO；build / pack 通过；?v= 已递增到 14
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I7 | 创建（用户提议并拍板）：删 3-landing 基础槽（现有条目零使用）；4-result 角标改「落点&效果」；lint 的落点 INFO 提示删除；AGENTS.md §四 已同步 |
| 2026-10-01 | I7 | 修订：核实 I6 已执行完成（翻图面板上线、?v=13），删除过期行号引用，改为 grep 定位；明确「&」需 escapeHtml、四出口文案一致 |
| 2026-10-01 | I7 | 执行完成：app.js SLOT_LABELS/BASE_SLOTS 与 pb.py SLOT_LABELS/FLASH_ORDER/DEFAULT_ORDER 统一删 3-landing、4-result 标签改「落点&效果」；lint「非闪光缺落点」INFO 段与 required 追加分支删除；pb new 模板文案同步；grep 3-landing 在 app.js/pb.py 清零（浏览器实测：翻图面板 chips 与编辑器槽位行一致显示 站位/瞄点/落点&效果）；?v=14，lint 0 ERROR / 0 落点 INFO |
