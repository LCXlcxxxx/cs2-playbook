# 迭代 I38 开发包 — 战术板「道具图层」：落点图标铺图 + 点落点看连线/开卡片（压轴）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行（单阶段）。
> 前置：建议 I37 先执行（都改 app.js；且道具图层与拼音搜索天然联动——搜索时地图上的道具图标同步收窄）。
> 背景（2026-10-02 完美平台对比认定的最大差距）：战术板地图目前只有报点名标签，看不到「哪里有道具」。
> 对标平台做法：道具按类型图标铺在落点上，点落点显示 起点→落点 连线，再点开卡片。
> 设计取向（用户偏好）：少堆按钮——图层切换并入现有 mode-btns 行，报点/道具二选一显示。

## 现状速览（已核实，2026-10-04）

- 战术板地图卡片：app.js ~2478-2545——`.map-card` → `.radar-wrap.map-wrap` → `img.radar` + `.callout-layer`
  （报点标签百分比定位）；mode-btns 行现有 ◎全部/🚀道具起点/🎯道具目标 三键（setDrillMode）。
- 可见条目管线：`entryMatch`（地图+阵营+类型+搜索+失效开关交集，~816）；类型/阵营过滤时地图已按
  `visibleEntries` 收窄报点（~2484-2493）。坐标来自 callouts（u/v 0~1）；条目→坐标的既有判定：
  `originIs` / `targetIs`+`strictSpotMatch`（~2486-2488）。
- 跳转：`jumpToEntry(id)`（~4085）切道具 Tab 并清过滤。
- 拼接图（Nuke/Train）：报点是百分比定位，道具层同法即天然兼容（I2 结论）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行迭代 I38（战术板道具图层）。只改 assets/js/app.js + style.css。
动手前先读：docs/iterations/ITER-I38.md 现状速览、app.js 2478-2560（地图卡片渲染与模式按钮）、
jumpToEntry、TYPE_INFO（类型图标）、entryMatch。

一、图层切换
1. mode-btns 行最左加二键图层切换：「📍 报点」/「💥 道具」，state.mapLayer ∈ {"callouts","nades"}，
   localStorage pb-map-layer 持久化（缺省 callouts）。nades 模式下隐藏三个钻取模式按钮与 .callout-layer
   标签层（钻取语义属于报点层，不叠加）；切回 callouts 一切如旧。
2. 卡片角标文案 nades 模式改为：「道具模式：图标=落点，点图标看从哪丢、再点开道具」。

二、道具层渲染（nades 模式）
1. 数据：本图条目走 entryMatch 全管线（地图/阵营/类型/搜索/失效开关都生效——与列表所见一致）。
   每条目展开为 (条目, 每个 target 值) 对，target 用既有 targetIs/strictSpotMatch 对齐 callouts 取 u/v
   （~2486-2488 同款判定）；对不上坐标的跳过，map-note 计数「N 颗道具的落点没对上报点，未显示」。
2. 落点图标：<div class="nade-layer">（absolute inset 0）内按 target 坐标放百分比定位按钮——
   类型图标（TYPE_INFO[e.type].icon）+ 数量角标（同坐标聚合 >1 时 ×N）；侧营描边色区分
   （T/CT/both 用现有变量）；title=「起点→目标，投法」逐行。
3. 点击图标：选中态高亮；在 <svg class="nade-lines">（viewBox 0 0 100 100、preserveAspectRatio=none、
   线加 vector-effect="non-scaling-stroke"、虚线）画该落点各条目的 起点→落点 连线（origin 坐标同法解析，
   解析不到的条目不画线但仍在列表）；同时底部弹出小清单（图标+标题+投法徽章），点条目 jumpToEntry(id)。
   点空白处/Esc/再点同一图标取消选中并清线清单。
4. Esc 层级：道具清单 < 预览/编辑器等既有捕获监听 < onKey 主链，逐层关闭不穿透。

三、回归确认（逐项）
1. 报点层零变化：三种钻取模式、报点筛选、双击语义、报点编辑器进出全部照旧（I1/I16/I23 语义不动）。
2. 过滤联动：类型（只点烟→地图只剩烟雾图标）、阵营、搜索（含 I37 拼音，如 chy）即时收窄图标；失效开关生效。
3. 拼接图（Nuke/Train 上下拼接）图标/连线落位正确（百分比天然兼容，抽 2 点核对）。
4. z-index 逐层核查：nade-layer < 地图卡片，popup 层不被其他 overlay 遮挡（参照 I24/I33 的 z 关系教训，
   每加一层就把现有各层 z 值列出来对一遍）。
5. 空态：当前过滤下没有任何可显示落点时，地图给出占位文案而不是白板。

红线：不动报点标签层与钻取/筛选语义；不动分拣台；不改数据文件（坐标一律来自 callouts，不新建落点数据）；
不引入第三方库；?v= 由 pb build 自动递增。
验收清单（逐项自检，Ctrl+F5 强刷后）——**2026-10-04 执行完毕，全过**
- [x] 图层切换可用且记忆（pb-map-layer 读写实测）；道具模式下报点标签隐藏、钻取按钮隐藏（执行中修复：初版漏隐藏，模板 `${nadesMode ? "" : ...}` 包掉），切回报点层一切如旧（52 标签回归）
- [x] 图标位置与报点名一致——**升级为全量核对**：Dust2 23/23、Mirage 13/13 图标 style 坐标与 callout u/v 零偏差；叉箱 [48.7%,41%] 精确压点；超市窗口当前无道具落点（全量核对覆盖其本意，特例如实标注）
- [x] 点图标出连线+清单，点清单条目跳转正确（jumpToEntry 清过滤）；Esc/空白/再点同图标三路径取消实测
- [x] 类型过滤联动（烟 13→10 全 smoke 图标）；同落点聚合 ×N 正确（5 处）；**对不上报点的计数提示两分支实测**（内存注入假 target：部分未匹配→「1 个落点没对上报点，未显示。」+图标保留；全部未匹配→「本图 N 颗道具…都没对上报点」+0 图标）
- [x] 拼接图落位正确（Nuke 1024×2048：内存注入临时条目——图标视觉中心/连线端点与报点 u/v 零偏差；Train 无条目、同机制不另测）；报点层全功能回归；控制台零报错
- [x] lint 0 ERROR / build / pack 通过（cs2-playbook-20261004.zip，?v=120）；PROGRESS.md 追加执行记录并更新当前状态

执行验收中修的三个 bug：① showLines 裸 `callouts` 引用（变量只在 calloutMapCard/collectNadeSpots 局部）→点图标全无反应，且 IAB isolated world evaluate 抓不到页面异常，靠读代码定位；② onNadeKey 每次 render 挂新 document 捕获监听不摘除——旧闭包 sel 残留为真时抢先 stopPropagation 吞掉新卡片 Esc →改全局单监听（nadeEscBound）+模块级 nadeClear 指针（setupNadeLayer 开头置 null，空态提前 return 路径也覆盖）；③ 钻取三按钮 nades 模式漏隐藏。
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-04 | I38 | 创建（压轴，对标完美平台的最大差距项）：战术板加「💥 道具」图层——条目按 target 报点坐标铺类型图标（同落点聚合 ×N、侧营描边），点图标画 起点→落点 连线 + 底部清单跳转；图层切换记忆 pb-map-layer，报点层/钻取语义零改动；与 I37 拼音搜索天然联动（搜索时图标同步收窄） |
| 2026-10-04 | I38 | **执行完成**（?v=120，pack cs2-playbook-20261004.zip，lint 0E/0W）：双层切换/图标聚合/连线清单/Esc 分层全落地；验收修三 bug（showLines 裸 callouts 引用、onNadeKey 监听泄漏吞 Esc→单监听+nadeClear 指针、钻取按钮漏隐藏）；图标坐标全量核对 Dust2 23/23 + Mirage 13/13 零偏差、拼接图 Nuke 注入法验证、未匹配计数两分支实测；验收清单全勾 |
