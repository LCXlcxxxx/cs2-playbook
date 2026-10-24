# 迭代 I9 开发包 — 修复报点编辑器空白（fsStatus/fsHandle 声明被误删）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 根因已由规划会话在浏览器中实测复现并定位（见下），本迭代是小修，一个会话可完成。

---

## 根因（已复现，2026-10-01）

用户报告：I8 之后点「⚙ 编辑报点」页面空白。规划会话用本地服务器 + 浏览器自动化实测，
控制台报错：

```
Uncaught ReferenceError: fsStatus is not defined @assets/js/app.js:1315
```

链路：点击编辑报点 → render() → calloutEditor() → refreshEditor() 第 1315 行读 `fsStatus` →
**该变量从未声明** → 严格模式抛 ReferenceError → render 中断 → #cards 已清空 → 空白。

核实：`fsStatus`（约 20 处使用）与 `fsHandle`（10 处使用）**均无任何 let/var/const 声明**——
两个声明在 I6 死代码清理时被连同清理区域一起误删（初判在约 963 行 initFsHandle 之前的位置，
原形如 `let fsHandle = null; let fsStatus = "init";`）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器修复迭代（迭代 I9）。根因已定位（见本文件「根因」节），
按以下步骤修，全程以 grep 与浏览器实测为准：

一、恢复丢失的声明
1. 在 assets/js/app.js 的 callouts 文件关联区块（async function initFsHandle() 之前，
   约 963 行空行处）恢复声明：
   let fsHandle = null;      // 关联的 data/callouts.json 文件句柄（IndexedDB 持久化）
   let fsStatus = "init";    // ready | need-permission | need-link | unsupported | init
2. grep 确认 "let fsStatus" 与 "let fsHandle" 各恰好一处，且位于所有使用点之前
   （首个使用点约在 965 行 initFsHandle 内）。
3. 顺手排查同一次清理是否还误删了其他声明：对 app.js 里所有赋值式使用的顶层变量
   （如 rootDirHandle、entryListPlaceholder、lbCtx、popCtx 等）抽查声明是否存在；
   最直接的办法是浏览器控制台跑一遍全功能后确认无任何 ReferenceError。

二、版本号纪律（本次必须真实落地）
1. index.html 的 style.css / data.js / app.js 引用 ?v= 递增到 15。
   （注：I7 执行记录声称升到 14，但 index.html 实际仍是 13——这次以 grep "?v=" 的
   实际输出为准写入变更记录，不允许再出现"声称已升"与磁盘不符。）
2. 强刷验证：确认浏览器加载的是 ?v=15 的资源。

三、浏览器实测验收（用本地服务器或 file:// 均可，逐项检查）
- [x] 点「⚙ 编辑报点」正常渲染：编辑器卡片、报点列表、🔗 关联按钮（未关联文件）、
      还原默认、导出按钮全部可见，控制台无 ReferenceError
- [x] 编辑器内拖拽一个报点 → 「导出 callouts.json」内容包含全部 10 图报点
- [x] 报点图卡片（非编辑态）渲染正常；起点/目标钻取正常
- [x] 道具页：编辑器、图片上传、状态徽章不受影响（rootDirHandle 是另一套句柄，确认未坏）
- [x] pb lint / pb build 通过；pb pack 重新打包

四、进度台账（AGENTS.md 一.9）
1. 在 docs/PROGRESS.md 执行记录表末尾补两行：
   - I8 的执行记录（此前会话漏记）：归档 12 条条目+media+战术板到 _archive/mirage-v1/，
     data.js 重建（条目空），新建 docs/RECORD.md（以磁盘实际状态核对后如实描述）
   - I9：恢复 fsStatus/fsHandle 声明修编辑器空白；?v=15；浏览器实测通过
2. 更新「当前状态」：下一步待办改为用户侧动作（录入 Mirage 道具，见 docs/RECORD.md）。

红线：除恢复声明与版本号外不改任何逻辑；不动数据文件。
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I9 | 创建（规划会话浏览器实测定位）：I6 死代码清理误删 `let fsHandle`/`let fsStatus` 声明 → 编辑报点 render 中断空白；恢复声明 + ?v=15 落地 + PROGRESS.md 补记 I8 |
| 2026-10-01 | I9 | 执行完成：恢复 let fsHandle/fsStatus 声明（initFsHandle 之前，声明各恰好一处）；grep 确认 rootDirHandle/lbCtx/entryRows/entryListPlaceholder 声明均在、popCtx 无残留引用；?v=13→15（发现 I7 执行记录声称的 14 与磁盘实际 13 不符，按实际递增）；浏览器实测：编辑报点正常渲染（52 行/导出/还原/🔗 未关联文件），控制台无 ReferenceError；道具页编辑器/状态徽章/图片暂存不受影响；I8 后 data.entries 为空，报点点击走报点过滤属正确回退 |
