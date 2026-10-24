# 迭代 I2 开发包 — 全地图报点扩充（北辰 V3.1 导入）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，把下面代码块整段粘贴执行。
> 前置：数据准备与方案决策已由规划会话完成（见「已完成的准备」），本迭代做核对、拼接与入库。

---

## 已完成的准备（规划会话，无需重做）

- 来源：知乎@北辰《CS2 地图点位报点大全》V3.1（zhuanlan.zhihu.com/p/692204460），十张报点图已识图提取，原图存 `docs/reference/callouts-beichen/<map>.jpg`（含来源 README，不进发布包）。
- `data/callouts.json` 已合并 **7 张单幅地图共 352 个报点草稿**（de_dust2 60 / de_inferno 55 / de_train 63 / de_overpass 56 / de_anubis 46 / de_ancient 36 / cs_office 36），坐标为识图估计值，待本迭代核对。
- 坐标系已验证：文章图与官方雷达取景一致，u/v 可直接迁移（用已校正的 de_mirage 抽查「匪家/A 包点/警家」全部吻合）。
- `data/maps.json` 已新增 `de_vertigo` / `de_overpass` / `cs_office`（人质图 cs_ 前缀），10 张雷达底图已在 `assets/radar/`（来源 2mlml/cs2-radar-images，master 分支；含 de_nuke_lower / de_vertigo_lower / de_train_lower 三张下层图，radar_lower 字段已登记）。
- **Nuke / Vertigo 未入库**：文章这两图是「主面板 + 下层面板」双视图，取景与官方单层雷达不一致，直接迁移会产生看似正确的错位数据。名单见提示词第四节。

## 用户已拍板的决策（2026-10-01）

1. **Mirage B 点包位补充：做**（提示词第二节）。
2. **双层地图不做上/下切换按钮**：把上下两层**纵向拼接成一张大图**展示，报点直接落在对应半区（提示词第三节）。

---

## 粘贴提示词

```text
按 AGENTS.md 规范执行报点扩充迭代（迭代 I2）。先读 assets/js/app.js 的报点渲染
（left:u*100% / top:v*100% 百分比定位）、「道具起点/目标」钻取与「⚙ 编辑报点」写回逻辑，
再读 data/callouts.json 现状（8 图 401 点；除 de_mirage 外的 7 图 352 点是导入的草稿坐标）。

一、草稿坐标核对（核心任务）
1. 参考图在 docs/reference/callouts-beichen/<map>.jpg（取景与官方雷达一致）。
   逐图对照 assets/radar/<map>.png 检查每个报点 u/v：7 张图 =
   de_dust2 / de_inferno / de_ancient / de_train / de_overpass / de_anubis / cs_office。
2. 明显偏差（目测 >0.03）直接改 callouts.json 修正；拿不准的保持原值并列入最终报告。
3. 同图内 name 必须唯一；search 别名不得指向同名不同点（严格同名匹配依赖这一点）。
4. 改完跑 pb lint + pb build，打开查看器逐图检查报点渲染与起点/目标钻取。

二、Mirage B 点包位补充（用户已拍板）
mirage.jpg 的 B 点区有三个包位标注（对照参考图核对位置后追加，只增不改）：
1. 二楼包位（箭头指向 B 点二楼侧下包位，草稿 u/v ≈ 0.230 / 0.245）
2. B小包位（≈ 0.230 / 0.272）
3. 安全包位（≈ 0.155 / 0.315）
search 别名给全（如 B小包位→["B小包位","小包位"]）。包位是小区域，位置差一点没关系，
以能区分三个包位为准。

三、双层地图拼接大图（用户已拍板：上下拼一张图，不做切换按钮）
1. 用 ffmpeg 把上下两层纵向拼接（上层在上、下层在下，1024×2048），接缝画一条白色分隔带：
   ffmpeg 路径：python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
   中文标注字体：C:\Windows\Fonts\simhei.ttf（drawtext 可用时给上下半区各加「上层 外场/A」
   「下层 B 点」字样，drawtext 不可用就只画分隔带，不强求）。
   命令示例（不含文字）：
   <ffmpeg> -y -i assets/radar/de_nuke.png -i assets/radar/de_nuke_lower.png ^
     -filter_complex "[0][1]vstack,drawbox=x=0:y=1016:w=iw:h=14:color=white@0.9:t=fill" ^
     assets/radar/de_nuke_combined.png
   de_vertigo 同理 → de_vertigo_combined.png（文字写「大厦上层」「大厦下层」）。
2. maps.json：de_nuke / de_vertigo 的 radar 改指向 *_combined.png；radar_lower 字段保留；
   radar_source 注明「上下层拼接图（原始单层图保留溯源）」。
3. 查看器零改动兼容（已验证：报点定位是百分比，无正方形假设）。
   拼接后半区坐标换算：上半区 u/v 不变；下层报点 v = 0.5 + v_original / 2。
4. Train 暂不拼接（下层报点没有数据来源，拼接反而要让现有 63 点全部换算），
   等有下层点位数据时再拼。

四、Nuke / Vertigo 报点入库（按拼接图坐标系，宁缺毋滥）
两图文章面板是官方雷达的裁剪变框，做法：用 ffmpeg crop 从参考图裁出文章面板，与官方
单层雷达叠图对齐，求出面板→官方的偏移与缩放；对齐验证（≥3 个地标——包点/出生点/标志性
掩体——线性一致）通过后，把下面名单换算写入 callouts.json（下层报点按第三节第 3 条换算 v）。
验证不过的部分先不入库，在报告里留待用户在「⚙ 编辑报点」手动放置。
1. Nuke 主面板（外场/A）：狙位、铁板斜坡、铁板、连接、双架、屋檐、三楼下、三楼、贩卖机、
   陈列室、忍者位、一层、黄房、更衣室、CT箱、警家、垃圾桶、匪厅、卡车、外场、铁门房、铁门、
   山上/水箱、凹槽、正门、正门上、三箱、管道、死管、仓库箱、狙击位、红房/大仓、红箱、K1、匪家
2. Nuke 下层（B 点）：B斜坡、忍者位、控制室、二层、活门、死门、死点、管道、K2/洗手间、
   K1走廊、管道外、K1楼梯
3. Vertigo 主面板（大厦上层）：柱子、B包点、三箱、二箱、一箱、一箱后、电箱、跳台、老跳台、
   木板/双架位、B楼梯、警家、匪一楼、匪楼梯、匪家/T、后路、中路、中路箱子、中厅、电梯房、
   A连接、狙位、后门、外围、红箱、白箱、A小、黄布/铁板、大坡、小坡、A平台、沙袋、电梯间、
   匪二楼、发电机、匪家、51区
4. Vertigo 下层（大厦下层）：一箱、木板/双架位、B楼梯、B连接、连接、长廊、桥、A坡下/叉车、
   电梯间下、厕所、黄布/铁板、大坡、小坡

五、顺手项
1.（可选，先问用户）tools\pb.cmd 在部分终端因 GBK 误析中文注释而报错
  （python tools\pb.py 直跑正常），可顺手修（chcp 65001 或去掉中文注释）。

红线：不覆盖 de_mirage 已有报点（第二节包位是新增，允许）；未验证坐标不得标成已校准；
Train 不拼接；拼接图必须保留原始单层图作溯源。
验收清单（逐项自检）：
- [ ] 8 张图报点在查看器全部渲染，无叠在明显错误位置的点
- [ ] de_mirage 新增 3 个包位报点，与参考图位置一致
- [ ] de_nuke_combined.png / de_vertigo_combined.png 生成，maps.json 指向拼接图，
      查看器显示正常、上下半区报点不串位
- [ ] Nuke/Vertigo 报点入库结论或留待清单在报告中有明确交代
- [ ] pb lint / pb build / pb pack 通过
```

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-09-30 | I2 | 创建：7 图 352 点草稿入库；10 张雷达底图 + 3 张下层图；maps.json 增 3 图；Nuke/Vertigo 校准任务下发 |
| 2026-10-01 | I2 | 用户拍板并入包：① Mirage B 点包位补充（附草稿坐标）；② 双层方案定为上下拼接大图，不做切换按钮（附 ffmpeg 命令、字体路径、查看器兼容性验证结论、下半区 v 换算公式）；Train 暂不拼接 |
| 2026-10-01 | I2 | 执行完成：7 图 352 点叠加核对全部通过（无 ≥0.03 偏差）；Mirage 新增 3 包位（共 52 点）；de_nuke/de_vertigo 拼接图生成（1024×2048，白带+字标）并入 maps.json；Nuke/Vertigo 名单因文章面板为裁剪变框、换算线性验证未达标 → 留待编辑器手动放置（名单见本文件第四节） |
| 2026-10-01 | I2 | 规划会话补录：Nuke/Vertigo 报点以「文章名单 + 官方雷达知识落位」入库（de_nuke 52 / de_vertigo 50，跨层同名点加前缀如 B 管道/K1 大厅/下层大坡），坐标为草稿可在编辑器微调，第四节名单全部覆盖；落位脚本 build/_place_nv.py 可重新生成 |
