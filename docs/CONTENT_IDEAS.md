# CS2 内容建议：道具清单 + 打法要点（2026-10-02 网络调研）

> 本文档是规划会话的调研产出，供后续录入排期参考。所有道具点位均为**候选清单**——入库一律 `draft`，
> 自己进游戏复现过才能转 verified（AGENTS.md 一.5）。弹道细节以视频画面/游戏内实测为准，本文不编造坐标。
> 来源：HLTV / Valve 官方公告 / BLAST.tv / CritFeed / BoostRoom / Scope.gg / Refrag / CS2Util / VPENADES / cs2pulse / B站（详见文末与各节来源）。

---

## 一、地图池现状（⚠ 与项目记录不一致，需修正）

**现役 Active Duty（2026-07-06 起）**：Dust2、Mirage、Inferno、Nuke、Ancient、Anubis、**Cache**
（来源：HLTV《Cache replaces Overpass》、Valve Season 5 公告）

变动时间线：
| 时间 | 变动 |
| --- | --- |
| 2025 初 | Train 入池，替换 Vertigo |
| 2025-07 | Overpass 入池，Anubis 出池 |
| 2026-01 | **Anubis 回归，Train 出池** |
| 2026-07 | **Cache（Source2 重制版）入池，Overpass 出池** |

**对项目的影响**：
1. `maps.json` 里 Train 的 `duty: true` 已过时 → 改 `false`（图和报点保留，天梯还能遇到，只是优先级降）。
2. **Cache 完全未注册**（maps.json 无条目、无雷达、无报点）→ 新图入池三个月，选图率 6.6% 且玩家普遍不熟点位，
   是"速查手册"价值最高的场景之一。前置工作：注册 `de_cache` + 官方雷达入库 + 报点表（可再走一次北辰/社区报点图流程）。
3. Overpass/Vertigo/Office 保持 `duty: false` 不动。

**选图率（Premier，2026-07~09，Scope.gg 数据）→ 内容优先级依据**：
| 优先级 | 地图 | 选图率 | 现有条目数 |
| --- | --- | --- | --- |
| ① | Dust2 | 25.9% | 18（缺 CT 方与闪光） |
| ② | Mirage | 26.3%（第一） | 0（v1 已归档 _archive/mirage-v1/） |
| ③ | Inferno | 11.3% | 0 |
| ④ | Ancient | 11.2% | 0 |
| ⑤ | Nuke | 10.5% | 0 |
| ⑥ | Anubis | 8.1% | 0 |
| ⑦ | Cache | 6.6% | 0（连图都没注册） |

Mirage+Dust2 合计占对局一半以上，**这两张图覆盖完 = 覆盖日常一半对局**。

---

## 二、Dust2 补全清单（在现有 18 条基础上查缺补漏）

现有：T 烟 12 颗（叉箱/中门/中门拱门/A大保护×2/A门/A短空调/A小隔断/B门/警家/狗洞/暗道）、T 火 3 颗（B门/中门/箱子左）、T 闪 1 颗（狗洞自助）、CT 烟 1 颗（B门回防）。

### 缺口（按优先级）

**T 方执行包补全（打 A/B 现在缺关键件）**
| 建议条目 id | 类型/目标 | 说明 |
| --- | --- | --- |
| dust2-t-smoke-a-cross | 烟/A大十字（A site cross） | A 执行断警家spawn视野，Long 贴箱平投或蓝箱双键跳投 |
| dust2-t-smoke-b-window | 烟/B窗 | B 执行与 B 门烟配套，洞口外平投 |
| dust2-t-smoke-mid-to-b | 烟/中转B断警家（Xbox 后跳投） | 中 B 夹击的核心烟，断 CT 增援枪线 |
| dust2-t-smoke-long-corner | 烟/A大拐角 | 开局早投，安全下 A 大 |
| dust2-t-molly-goose | 火/鹅位 Goose | A 执行清最阴蹲位 |
| dust2-t-molly-car | 火/A大车位 Car | 「不烧车拿不了 A 大」 |
| dust2-t-molly-a-site | 火/A短→包点锚位 | 把 A 点锚烧出来 |
| dust2-t-molly-b-window | 火/上洞→B窗 | 隔窗检查 B 区防绕后 |
| dust2-t-flash-a-long | 闪/A大门 pop | 独自破 A 大门 |
| dust2-t-flash-a-main | 闪/A main 二波进点闪 | 执行节奏闪 |
| dust2-t-flash-b-exec | 闪/B 执行反弹闪入洞口 | B 包缺的最后一颗 |
| dust2-t-he-a-site | 雷/A 包点 | 打包点残局收血（可选） |

**CT 方整侧补全（现在只有 1 颗回防烟）**
| 建议条目 id | 类型/目标 | 说明 |
| --- | --- | --- |
| dust2-ct-molly-short-rush | 火/中→A短防rush | 秒扔保命火 |
| dust2-ct-molly-lower-tunnel | 火/中→下洞 | 清下洞近点 |
| dust2-ct-molly-b-car | 火/中→B车 | B 门被烟封也能用 |
| dust2-ct-smoke-long-delay | 烟/Car→A大门延迟烟 | 封 A 大 rush |
| dust2-ct-smoke-short-delay | 烟/A点→A短楼梯 | 延迟短道 |
| dust2-ct-smoke-tunnel-delay | 烟/B洞口 | 配火双延迟 |
| dust2-ct-flash-tunnel-push | 闪/上B洞反push | CT 反推 B |
| dust2-ct-retake-a | 闪+烟/A 回防组合（可拆多条） | 从 A 大/警家带道具进 |
| dust2-ct-flash-b-retake | 闪/中→B 回防 pop | 回防必带 |

> Dust2 目标形态：T 方 ~25 颗 + CT 方 ~10 颗。缺图条目从冷锋 BV1jnQrBrEVb / Tatukunn 面板视频抽帧入库最省事（与现有 12 颗同源同格式）。

---

## 三、Mirage 重建清单（选图率第一，v1 已归档）

v1 的 11 颗曾按 AGENTS.md 首批清单录入后归档；建议按下面的职业标准包重建（T 方优先）：

**T 开局（3 颗）**：窗烟 window（T家垃圾桶位，按D后跳投）、顶中烟 top-mid（垃圾桶顶平投）、连接口烟 connector（蹲进校线跳投）
**A 执行包（7-8 颗）**：警家烟 ct、楼梯烟 stairs、丛林烟 jungle（三烟缺一不可）、三明治火 sandwich、阴影位火 shadow（Palace→Shadow）、firebox 火、T屋顶闪（清 ramp）、宫殿跳闪 palace
**B 执行包（6 颗）**：market 窗烟、market 门烟（同站位双跳投）、板凳烟 bench、van 烟/火（Apps→Van）、厨房火 kitchen（Apps→Kitchen）、B 执行闪 apps-flash
**CT 方（5-6 颗）**：公寓延迟烟 apps-delay（分层补，第一颗快散再补第二颗）、ramp 防快攻火（Triple Box→A Ramp）、palace 烟（CT spawn 跳投）、A 回防火（Stairs→Firebox、Jungle→Ramp）、B 回防三烟、中路反清闪（A Short→Mid / Connector→Mid pop）

来源锚点：BLAST.tv Mirage 全烟详解、BoostRoom 20 烟指南、Scope.gg 十大火、B站冷锋 BV12eRcBnEkA / tatukunn BV1A36zBSES6。

---

## 四、Inferno 清单

点位中文名对照：banana=香蕉道、car=车、sandbags=沙袋、coffins=棺材、dark=暗角/黑屋、quad=四箱、oranges=橙箱、arch=拱门、library=图书馆、pit=坑、graveyard=墓地、boiler=锅炉房、apps=公寓。

**T 方（约 14 颗）**
- 抢香蕉道：开局火（烧 CT 前点，第一出生位扔+捏烟准备扑反火）、top banana 烟（瞄树顶）、car 烟（对齐垃圾桶角）、深香蕉烟 deep-banana
- B 执行：CT 深烟（必须封深）、棺材烟 coffins、暗角火 dark（sandbags→dark）、四箱火 quad、橙箱火 oranges×1-2、B 点 pop 闪
- A 执行：图书馆/拱门烟 library、墓地烟 graveyard、阳台烟 balcony、坑火 pit（A 执行核心火）、锅炉房火 boiler、公寓 pop 闪

**CT 方（约 8 颗）**：香蕉道防rush火+反rush闪、三档延迟烟（入口/半墙/深段）、下中门延迟烟、公寓延迟烟、B 点内防守火（dark/coffins）、car 回防闪、A 回防闪

**打法要点（战术板素材）**：T 默认分兵控香蕉/中路/公寓三区，香蕉归属大程度看出生点；B 走分推（1-2 人提前埋伏 car）+ 烧 Dark/Quad + 封 Arch 侧包抄；CT 2+3（B 只放 2 人），B anchor 一明一暗；回防 B 几乎不可能 → 优先留人守 B。

来源锚点：B站冷锋 BV1rZ17BiEff、tatukunn BV13Bv6BpEjm（CT 方入门）/BV1L1bt67Ebe（TOP10 进攻道具）、CritFeed/BoostRoom/Profilerr。

---

## 五、Ancient 清单

**T 方（约 12 颗）**
- 抢中路三件套：肘位烟 elbow（封 CT 狙视野）、中门烟 mid-doors、甜甜圈火 donut（配合）
- A 执行：甜甜圈烟 donut、神庙烟 temple（封最强 anchor）、CT 侧烟、台阶烟 stairs、洞穴火 cave、过点闪
- B 执行：B 通道烟 b-lane（站投即可）、CT 侧烟、B 洞烟 cave、坡道火 ramp

**CT 方（约 4-5 颗）**：A main 单向烟（反弹落角，省着用）、肘位防御烟、各点位延迟火、回防组合。

**打法要点**：中路=全图枢纽，抢中路永远优先于进点，至少 2 人带道具协同；「拿完中路必须转成东西」——压 Donut 分 A / 假中路骗旋转；B 的前提是 Cave 控制+B 通道压力；CT 最关键角色是 Donut 位。

来源锚点：B站冷锋 BV1NLvyB9Ezi、CritFeed ancient-smokes、BoostRoom/BuyBoosting。

---

## 六、Nuke 清单

点位对照：outside=外场、hut=黄房子、squeaky=响门、secret=秘道、rafters=铁板、heaven=天上、hell=地狱、ramp=坡道、vents=通风管。

**T 方（约 12 颗）**
- 外场：烟墙×2（T Red→Secret，标志性道具）、秘道单烟快攻版、mini 烟（防 garage 反拉）、garage 方向烟、过点闪
- A（upper）：天上烟 heaven（全图最难烟之一）、mini 烟、hut 闪+squeaky 闪、黄房子火（TRoof 投）
- B（ramp）：坡道过点烟 ramp-cross、坡道深处烟 deep-ramp、大箱火 big-box、入口闪
- 转点：秘道火（Redbox 投）、通风管烟 vents（post-plant）

**CT 方（约 6-7 颗）**：外场防rush火（看到电线杆上前一步扔）、gla1ve 烟（封 T 中路架枪）、silo 雷（jump throw 炸半血）、garage 单向烟（高段位）、坡道防守烟、回防三件套（double doors/window/control）。

**打法要点**：外场是心脏——控外场逼 CT 旋转；新手最小道具包=外场烟+heaven 烟+ramp 烟+upper 闪；CT 平衡布阵 1 外场+1 ramp+2 upper+1 lower；外场位是信息中枢（Garage/EliGE 位/Secret 干扰位）；「确认了再转」。

来源锚点：B站冷锋 BV1mfSjBDE2r、tatukunn BV1Lz421a7Vj（23颗进攻道具）/BV1KBNweWEp6（铁板）、CS-rubeN BV1xdNCzaEse、CritFeed/Refrag/BoostRoom。

---

## 七、Anubis 清单

**T 方（约 13 颗）**
- 抢中/水下：中窗烟 mid-window、中连接烟 connector、神庙烟 temple、中桥烟 bridge、中门火
- A 执行：天堂烟 heaven（Boat 位投）、摄像头房烟 camera-room（站投）、street 烟、喷泉火 fountain、平台火 plat
- B 执行：B 窗烟（T spawn 最右门最快）、B 连接烟 connector、包点左烟、CT 出口烟（蹲投）、B 神庙烟、包点后位火 back-site

**CT 方（约 5 颗）**：T stairs 延迟烟（CT spawn 小墙角跳投）+楼梯火（Plateau 投）、水下争夺火/道具（水下白给=回防噩梦）、Drop/Heaven 火、A main 回防烟。

**打法要点**：T 侧偏强图（约 56.7% T 胜率）；核心同样是中路——没中路打哪都难；经典 B split=「wait Connector, hit together」（B Long 与 Connector 不许先动）；道具消耗大，拉扯期省着用；CT 丢中路的瞬间必须报点。

来源锚点：B站冷锋 BV18jryByEH1、砍柴少年 BV1o8GN63E6R、全能罗老师 BV1Wu411u7Xz、AYCS2 黑屋火 BV1umXuY7EuN、cs2pulse/bo3.gg。

---

## 八、Train 清单（⚠ 新版 2024-11，老 CSGO 材料不可直接搬）

新版结构变化：A 点三节车厢；Ivy 老入口被封；**Popdog 改走 Brown Halls 长廊**（老梯子没了）；B Upper 新增难清小屋（能穿常规 B Ramp 烟架枪）；全图降雨（外观）。

**T 方（约 11 颗）**
- A 执行四烟（BLAST.tv：全从 T spawn 附近投出，10 分钟能学完）：A 十字烟（瞄墙上的鸡）、Ivy 烟（瞄屋顶栏杆旁罐子）、Popdog 烟（瞄狗的白眼睛）、A 连接烟（瞄管道卡箍）；另有 camera 烟、E-Box 烟、火 Hell + 闪 Olof 角
- B 执行：B Ramp 烟（站投）、walkout 烟（蹲投）、E-Box 烟、B connector 烟、下包后 connector 烟（防回防）

**CT 方（约 4 颗）**：T Main 开局烟（掐 A rush）、Popdog 反制火、Z/connector 延迟道具、B 回防（B 容易回防，solo B 活着给信息即可）。

**打法要点**：整体偏 CT（类比 Nuke）；CT 标准 4A 布阵（A Main/Popdog/Connector/Ivy 各一人+solo B）；三大必争位=Popdog、Ivy、Connector；T 绝不能干拉 Popdog/Ivy；B 上层慢打/AWP、下层快攻。

来源锚点：B站冷锋 BV1byypBoE8i、轻语小鹿 BV1MZmLB1EQm、小天FreeZing BV1hVGVzNE5E、AYCS2 BV1YeUwBmE9a、BLAST.tv train 专文。

---

## 九、B站素材库（抽帧入库的骨干来源）

> **源约束（2026-10-02 用户定稿）**：录入只用 **tatukunn 与冷锋的横屏画面**（画幅完整，能截出站位/瞄点/效果三帧）；
> **祖灵Zu1ing、蒋道具 pass**——竖屏画幅不全，不作为录入源（已入库的 3 颗祖灵火 draft 保留、署名不删，后续可用横屏同款点位重录）。
> 道具点位必须为 **CS2 近 1-2 年**（视频发布 ≥2024-10、画面为 CS2 UI），入库前逐视频核验日期。

**冷锋「禁止干拉」七图系列 = 七张现役图的骨架素材（横屏，一套全覆盖）**：
| 图 | BV |
| --- | --- |
| Dust2 | BV1jnQrBrEVb（约68万播放） |
| Mirage | BV12eRcBnEkA |
| Inferno | BV1rZ17BiEff |
| Nuke | BV1mfSjBDE2r |
| Ancient | BV1NLvyB9Ezi |
| Anubis | BV18jryByEH1 |
| Train | BV1byypBoE8i |

**tatukunn 分图补充**（横屏，与现有 12 颗 Dust2 面板条目同源同格式）：
- 沙二入门（进攻方）BV1ybF6eLEXv、小镇 CT 入门 BV13Bv6BpEjm、小镇 TOP10 进攻 BV1L1bt67Ebe、Nuke 23 颗进攻 BV1Lz421a7Vj、Nuke 铁板 BV1KBNweWEp6、Mirage A2 火 BV1A36zBSES6

**已 pass（仅存档备查，不录入）**：
- 祖灵Zu1ing：B1套装 BV1hbmmYLENg、进攻烟大全 BV1ssaA6vEBx、A包一线烟 BV1CEA6zVEzN、B区守法 BV14HaA6qEwK、回防连招 BV1n5h86PEa3 / BV17Bhb6ZEDh、中路线权 BV1irhb6dETZ、三颗火 BV1HxaY6jEam、Mirage rush 烟 BV1JUaa66EjR
- 蒋道具：香蕉道入门 BV1Rwad6cEWS、Mirage 全图进攻烟 BV1rXai6sEz8、沙二校长带你玩 BV1yUeXzFEit、Nuke 校长带你玩 BV1hbBaBTEui

**其他候选 UP（画幅/日期未核验，用前先确认横屏 + CS2 近 1-2 年）**：捏捏N1enie（全图核心投掷物 58.6万播放 BV1b2421Z7su）、CS-rubeN（X分钟学完系列，注意部分是 2021-2022 老视频）、Cy1z_cs2、CSGO-DOUBLEup、CS2战术讲堂（职业单点位拆解）、马隔（全点位自助闪）

> BV 号均来自 B 站搜索结果抓取；入库时以 BV 链接记入 `source.url`，署名记 `source.creator`。两处存疑（BV1zV411R78h、BV1Fztd6wELf）入库前需人工复核。

> BV 号均来自 B 站搜索结果抓取；入库时以 BV 链接记入 `source.url`，署名记 `source.creator`。两处存疑（BV1zV411R78h、BV1Fztd6wELf）入库前需人工复核。

---

## 十、入库注意事项（内容质量红线）

1. **CS2 体积烟机制**：爆炸物（HE/火）可以吹散烟雾——中门烟会被 CT 用 HE 打掉；CSGO 时代「烟里留缝」类点位大量失效。
   凡 2023 年前的弹道材料，入库前必须游戏内复现或标注存疑。
2. **老图新版本**：Train 是 2024-11 重制版（第八节的结构变化必须写进条目正文注意事项）；Dust2/Mirage/Inferno 弹道也有 CS2 微调。
3. **素材新鲜度与画幅（2026-10-02 用户定稿）**：道具点位必须来自 **CS2 近 1-2 年**（视频发布 ≥2024-10、画面为 CS2 UI，入库前逐视频核验）；
   录入只用 **tatukunn / 冷锋横屏画面**，祖灵/蒋道具竖屏源 pass（详见第九节）。
4. **status 纪律**：视频抽帧一律 draft；只有自己进游戏复现过才 verified。现有 12 颗 Dust2 verified 的投法是用户指认的，实战手感仍待复测（PROGRESS 已记录）。
5. **每图建议起步量**：开局烟 2-3 颗 + 每个包点执行包 5-6 颗 + CT 防rush/回防 4-6 颗 ≈ **每图 15-20 颗起步**，先覆盖「天梯最常用」再补科研位。
   全七图满编约 120 颗——按第二~八节优先级分批录，不要一口气。
6. **战术板**：`tactics/` 目前为空。每图先做一块「T 默认」板（本文各节打法要点即内容素材），
   引用该图已入库的道具 id（`uses` 字段必须真实存在，lint 会查断链）——所以顺序是**先录道具、后建板**。

---

## 附：主要来源

- HLTV：Cache replaces Overpass（/news/44984）、Anubis replaces Train（/news/43600）、Overpass replaces Anubis（/news/42197）
- Valve 官方：counter-strike.net Season 5 公告、Rush Hour 更新（2026-09-22）
- 选图率：community.skin.club（Scope.gg 数据）、leetify.com/data-library
- 道具站：blast.tv（Dust2/Mirage/Train 全烟详解）、critfeed.com、boostroom.com、profilerr.net、cs2util.com、csnades.vpesports.com（Inferno 163 颗/Nuke 97 颗索引）、cs2pulse.com、refrag.gg、blog.scope.gg（2020 年火弹文，点位仍有效）、cs2improve.com（交互图）
- 中文：B站各 UP（见第九节）、知乎专栏、游民星空、5EPlay、skin.club 中文
