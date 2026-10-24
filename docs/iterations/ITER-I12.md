# 迭代 I12 开发包 — lightbox 滚轮缩放（以光标为锚）+ 拖拽平移 + 双击复位

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 背景：副屏上看瞄点图，展开大图后准星还是太小。用户要求：lightbox 里滚轮缩放、以鼠标位置为锚点。
> 只改 assets/js/app.js 与 style.css，不碰数据文件。先读 renderLightbox()/openLightboxCtx()/
> lightboxStep()/closeLightbox() 现有实现。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行查看器迭代（迭代 I12）：lightbox 大图缩放。改 assets/js/app.js + style.css。

一、滚轮缩放（核心）
1. lightbox 打开时在其根节点监听 wheel（{ passive:false }，preventDefault 阻止页面滚动；
   ctrl+wheel 触控板双指捏合走同一处理）。
2. 缩放范围 1x–8x，每档 ×1.2 / ÷1.2；以光标为锚点：
   记 scale k 与平移 tx,ty（相对容器中心），滚轮后 k′=clamp(k×f, 1, 8)；
   光标相对容器中心 (mx,my)，新平移 tx′ = mx − (mx − tx) × (k′/k)，ty 同理；
   k′ 回到 1 时 tx=ty=0。transform 用 translate(tx,ty) scale(k′)，transform-origin: center。
3. 平移边界：k>1 时 clamp tx,ty，使图片不会完全拖出视口（|tx| ≤ (k−1)×容器宽/2，高同理）。

二、拖拽平移与复位
1. k>1 时光标为 grab（按住 grabbing），按下拖动即平移（pointer 事件，setPointerCapture）；
   k=1 时不启动拖拽。
2. 双击：k=1 → 以双击点为锚放大到 2x；k>1 → 复位 1x（清零平移）。
3. 键盘 + / − 步进缩放（锚点取容器中心），0 复位；←/→ 仍是上一张/下一张，
   切换图片与重新打开 lightbox 时一律复位 k=1、tx=ty=0。Esc 行为不变（关闭）。

三、状态提示与细节
1. 右下角小角标显示当前倍率（如「150%」，k=1 时隐藏或显示 100% 均可，样式弱化）。
2. 光标样式：k=1 时 zoom-in，k>1 时 grab/按住 grabbing。
3. lightbox 自身样式（暗底、左右点击区、标题 N/M）全部保留；左右点击区在 k>1 时仍可点击
   （切图并复位缩放）。

四、收尾
1. index.html 三处 ?v= 递增到 18（当前 17）。
2. pb lint / pb build / pb pack 跑一遍。

红线：不改动翻图面板（I6）与编辑器（I10/I11）已实现的行为；不碰数据文件；
lightbox 的既有键盘（←/→/Esc）语义不变。
验收清单（逐项自检，强刷 ?v=18 后）：
- [x] 光标对准准星滚轮放大：准星始终停在光标之下（锚点精确），最大 8x
- [x] 缩小到 1x 后平移清零；拖拽平移有边界，图片拖不出视口
- [x] 双击从 1x 放大到 2x、再双击复位；+/−/0 键盘可用
- [x] ←/→ 切图后缩放复位；Esc 关闭；背后页面不随滚轮滚动
- [x] 倍率角标正确；控制台无报错；lint / build / pack 通过
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-01 | I12 | 创建（用户需求：副屏看瞄点太小）：lightbox 滚轮以光标为锚缩放（1–8x）+ 拖拽平移带边界 + 双击/0 键复位 + 倍率角标；切图自动复位 |
| 2026-10-01 | I12 | 执行完成：lightbox 滚轮以光标为锚缩放（1–8x，×1.2 步进，ctrl+wheel 同路）；k>1 拖拽平移带边界 clamp（用 client 增量而非 movementX——合成事件 movementX 恒 0）；双击 1x↔2x 锚点缩放/复位；键盘 +/−/0；←/→ 切图与重开自动复位；倍率角标（k>1 高亮）；zoomed 光标 grab/grabbing。浏览器实测：滚轮 100→144→172.8%（锚 200/150 时 tx=-40/ty=-30 与公式精确一致）、pan +60/+40 生效且 clamp 生效、双击/键盘/切图复位/Esc 全过；?v=18，lint 0 ERROR |
