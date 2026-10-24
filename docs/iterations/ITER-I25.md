# 迭代 I25 开发包 — 阶段显示名改「防守/科研」+ 编辑器与分拣台补「阵营」栏位

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：用户拍板——阶段显示名「下包后/反eco」改为「防守/科研」（**只改显示名，数据键
> postplant/anti-eco 不变**，零迁移）；编辑器与分拣台补「阵营」栏位（side 字段早已存在，
> 编辑器一直没暴露，CT 内容开录后必须可见可改）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I25）。改 assets/js/app.js + tools/pb.py（如涉及
显示标签）+ docs/RECORD.md；不碰数据文件里任何 phase 键值。

一、阶段显示名更换（显示层 only）
1. 映射：postplant 下包后 → **防守**；anti-eco 反eco → **科研**。execute 爆点 /
   default 默认 / retake 回防 不变。
2. 更新点（全局 grep「下包后」「反eco」定位，界面层全部替换）：
   - app.js 的阶段中文映射表与编辑器阶段多选选项（PHASE_CN / PHASE_OPTS 或同名物）；
   - 道具列表分组组头、卡片 meta 的阶段徽章（它们应取自映射表，确认无硬编码）；
   - tools/pb.py：report/摘要里若有阶段中文显示，同步；
   - help.html（📖 使用说明）若列出阶段，同步；
   - docs/RECORD.md 若提到阶段名，同步。
3. **红线：数据键 postplant / anti-eco 一个字符都不改**；既有条目的 phase 值不动；
   docs/iterations/ 历史文档不改。改完抽查任一条目 .md 确认 phase 值仍为英文键。

二、编辑器与分拣台补「阵营」栏位
1. 条目编辑器：「类型」旁加「阵营」下拉，选项 T 方 / CT 方 / 双方（枚举 T/CT/both）；
   打开时读条目 side 字段；新建条目默认 T；保存写回 side。
2. 分拣台（I22）：每行加「阵营」下拉（同样三选项，默认 T），批量导入写进 side。
3. 与 I23 阵营过滤联动：side 数据正确后，顶栏 全部/T/CT 过滤、战术板地图、战术板卡片
   自然生效——本迭代不改过滤逻辑。
4. 数据文件格式不变（side 本就是必填字段，这次只是编辑器暴露它）。

三、收尾
1. pb build（版本号自动递增）+ pb lint + pb pack。
2. 全局 grep 确认：界面层（app.js / help.html / RECORD.md）已无「下包后」「反eco」
   显示文案；数据文件里 phase 键值全部仍为 postplant/anti-eco。

红线：phase 枚举键不变；side 枚举不变（T/CT/both）；不碰其他功能。
验收清单（逐项自检，强刷后）：
- [ ] 编辑器阶段多选与列表分组显示 爆点/默认/回防/防守/科研
- [ ] 抽查任一条目 .md：phase 值仍为 postplant/anti-eco 等英文键
- [ ] 编辑器有「阵营」下拉，改动保存后 .md 的 side 字段同步；分拣台行同
- [ ] 顶栏 全部/T/CT 过滤按新 side 数据正确收窄（含 both 双显）
- [ ] lint / build / pack 通过；控制台无报错
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-02 | I25 | 创建（用户拍板）：阶段显示名 下包后→防守、反eco→科研（仅显示层，数据键不变）；编辑器与分拣台补「阵营」下拉（T/CT/both，写回 side），与 I23 过滤器联动 |
