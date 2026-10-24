# 迭代 I31 开发包 — 修复 13 条空 oneline + oneline 全自动生成（分拣台/编辑器零输入）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 背景：用户用分拣台批量导入 13 颗 Mirage 烟（mirage-t-smoke-01..13），「备注（一句话）」列空着导入——
> 入库即 `oneline: ""`，pb lint「必填字段缺失: oneline」13 ERROR，bat 的 build 被拦。
> 起点目标投法标题都齐，缺的只是这行显示文案——可按既有字段自动生成，用户事后网页里润色。
> **修订（2026-10-03 用户反馈）**：备注批量导入时懒得输入、标题已有大部分信息——方案从「勾选/拦截」
> 改为**全自动生成**：分拣台空备注导入时直接生成，编辑器保存空 oneline 时自动生成，全程零输入、零拦截。

## 根因速览（已核实）

- 13 个文件 frontmatter 均为 `oneline: ""`，origin/target/click/move/action/title 齐全（可生成）。
- 分拣台导入校验（sortImportAll，I22）只拦 缺代号/缺起点/id 格式冲突，不校验备注——空备注静默入库。
- pb lint 对空 oneline 报 ERROR 本身正确（卡片大字不能是空的），必须在入库前把值填上。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I31。改动物：data/entries/mirage-t-smoke-01..13.md（只填 oneline）、
assets/js/app.js（分拣台导入 + 编辑器保存两处自动生成）。不碰其他条目，不动 pb.py。
动手前先读：docs/iterations/ITER-I31.md 根因速览、tools/pb.py 投法徽章中文组合逻辑（BADGE_*，查看器
throwBadge 的 Python 等价）、app.js sortImportAll（~2890-2995）与 ef-save（~1160 一带）。

一、批量修复现存 13 条（先做，解 bat 死锁）
1. 对 mirage-t-smoke-01..13.md：按各自 frontmatter 生成 oneline 并替换 `oneline: ""`——
   格式 = `{origin}→{target}，{投法组合中文}`；投法组合直接复用 pb.py 的 BADGE 组合逻辑
   （click 左键/右键/双键 + move（stand 按既有徽章规则省略）+ action 直接投/跳投/蹲跳投，
   例：匪家→中远匪口，左键投掷 / 匪家→VIP，W前进·左键·跳投）。
2. target 是数组的用「/」连接；只改 oneline 一行，其余字段一字不动。
3. tools\pb.cmd lint 预期 0 ERROR → build → pack；grep 确认 13 条 oneline 均非空。
4. 汇报生成的 13 条 oneline 清单，提醒用户可在网页编辑器里随手润色。

二、分拣台导入：空备注自动生成（零输入）
1. sortImportAll 生成 entry 时：row.notes.trim() 为空 → 用同行 origin/target/click/move/action
   按一.1 同款格式自动生成 oneline（与 pb.py 徽章组合同一套中文映射）；
   非空照旧用用户输入。不拦截、不加勾选框。
2. 导入完成 toast 补计数：「成功 N 条（其中 M 条一句话自动生成，可在编辑器润色）」。

三、编辑器保存：空 oneline 自动生成（不拦截）
1. ef-save 时 oneline 为空 → 用表单当前 origin/target/click/move/action 自动生成填入再保存，
   toast「一句话怎么扔 已自动生成：…」；用户填了就用用户的。

红线：不动 pb.py 的 lint 规则；不改 13 条之外任何条目；不引入第三方依赖；?v= 由 pb build 自动递增。
验收清单（逐项自检，Ctrl+F5 强刷后）：
- [ ] lint 0 ERROR / build / pack 通过；双击「同步并打包.bat」全流程跑通
- [ ] 13 条 oneline 非空且格式统一（起点→目标，投法）；浏览器抽查 2 条卡片大字显示正常
- [ ] 分拣台导入：备注留空直接导入成功且 oneline 自动生成（卡片显示正常），填了备注用用户的
- [ ] 编辑器清空 oneline 保存：自动生成并保存成功，卡片正常
- [ ] 控制台零报错；PROGRESS.md 追加执行记录并更新当前状态
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-03 | I31 | 创建：① 修复——分拣台导入的 13 颗 Mirage 烟 `oneline: ""`（备注列空着导入，lint 13 ERROR 拦 build），按 frontmatter 既有字段批量生成「起点→目标，投法」；② 预防——分拣台导入校验补「缺备注」（默认自动生成/拦截列出/跳过三选）+ 编辑器 ef-save 拦空 oneline。lint 规则不动 |
| 2026-10-03 | I31 | 修订（用户反馈「备注批量导入时用处不大、懒得输入」）：② 从「勾选/拦截三选」改为**全自动生成**——分拣台空备注导入直接生成（toast 带计数）、编辑器空 oneline 保存时自动生成（不再拦截），全程零输入零拦截；一（13 条修复）与红线不变 |
