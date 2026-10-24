# 迭代 I27 开发包 — Dust2 道具缺口补全（内容批次试点：冷锋 + tatukunn 横屏抽帧）

> 用法：在项目根目录 `D:\AI agent\ZCode data\CS2` 打开新的 ZCode 会话，先粘贴**阶段 A** 提示词执行；
> 阶段 A 停在「总览索引交用户核对」，用户确认后再开新会话粘贴**阶段 B** 提示词。
> 背景：当前 18 条条目全在 Dust2（12 verified + 6 draft），T 方执行包与 CT 方整侧有缺口（清单见下）。
> 本迭代是「视频抽帧录入」管线的第一次完整实战（此前 36 张批导入用的是现成截图）。
> **素材源约束（2026-10-02 用户定稿，红线）**：只用 tatukunn / 冷锋的**横屏**画面；祖灵/蒋道具竖屏源 pass。
> 点位必须是 **CS2 近 1-2 年**（视频发布 ≥2024-10、画面为 CS2 UI）。
> 目标清单权威版本在 docs/CONTENT_IDEAS.md 第二节；本文件内嵌一份便于开发会话直读。

---

## 粘贴提示词（阶段 A：校准 + 抽帧 + 总览索引 + 顺手项；**结束停在用户核对**）

```text
按 AGENTS.md 规范执行内容迭代 I27 阶段 A（Dust2 缺口补全的校准与抽帧）。本阶段不建条目、不改 data/entries/。
动手前先读：AGENTS.md、docs/iterations/ITER-I27.md（全文，含目标清单与红线）、docs/CONTENT_IDEAS.md 第一/二/九/十节、docs/RECORD.md。

〇、环境与素材校准（逐项落地；任何一项过不去就停下汇报，不用旧素材凑数）
1. yt-dlp + ffmpeg 可用性探测：缺就装（yt-dlp 走 pip 安装或独立 exe；ffmpeg 走 winget 或 gyan.dev 解压版加 PATH）。
   检查 tools/harvest.py（P4 产物，从未实战）能否直接复用；能用就用，不能就写一次性脚本——
   脚本放系统 TEMP 用完清理，输出中文前 chcp 65001 或设 PYTHONIOENCODING=utf-8。
2. 素材日期核验（yt-dlp --print 取 upload_date 即可，不必下载）：确认发布日期 ≥2024-10 且画面为 CS2——
   ① 冷锋 BV1jnQrBrEVb（Dust2 全图必学道具，横屏）
   ② tatukunn BV1ybF6eLEXv（沙二新手入门·进攻方篇，横屏）
   日期不满足或画面是 CSGO → 在该 UP 空间内找同图更新的道具视频替代并记录新 BV；找不到就停下汇报。
3. 下载两视频最高可用画质（首选 1080p 横屏；B 站 1080p 要登录 cookie 时用 yt-dlp --cookies-from-browser
   走用户浏览器）。拿不到 1080p 先停下汇报，不默默降级。源视频放系统 TEMP。
4. 实看校准（每视频抽 8-10 帧浏览），把结论补记进本文件「校准记录」节：
   画面是否第一人称完整横屏；有无 tatukunn 式道具信息面板（已知 tatukunn 预览视频面板在 1920×1440 的
   x730-1190 y990-1160，本次视频若有面板需重新定位）；冷锋视频的点位标注方式（字幕/标题/口播？）→ 定字段提取规则。

一、抽帧（每颗道具目标 ≥3 帧，帧存 build/staging-i27/<建议id>/ 命名 1-stand / 2-aim / 4-result）
1. 按视频分段切出每颗道具的段落（场景关键帧检测 + 固定间隔粗抽结合，段落边界人工/拼图判定）。
2. 每颗截三帧：1-stand 站位（全景、能看清地标参照：箱角/门框/地纹）＋ 2-aim 瞄点（准星与所对的边/点清晰）＋
   4-result 落点&效果（烟墙/火区/闪爆实际范围）。站位与瞄点同机位时，取段落前后两帧分别充当。
3. 竖屏/画幅不全的素材一律弃用（源约束）；单帧宽 >1920 压到 1920，保持 16:9 原比例。
4. 对照本文件「目标条目清单」逐颗预判归属（建议 id）；与现有 18 条重复的点位单独列「重复表」：
   现有 verified 的不重录不覆盖；现有 draft（3 颗祖灵火）有横屏同款的，列候选等用户决定，不自动替换。
5. 视频里没有对应内容的缺口点位，如实记「未找到」，不要硬凑、不要用搜来的老图顶替。

二、总览索引（停点交付物）
生成 build/staging-i27/_导入总览_I27_*.png 拼图缩略索引（每行：缩略三联图 + 建议 id + 目标点位 + 源视频与时间点），
连同以下内容一起汇报，**到此停下等用户核对确认**：
- 已核验素材信息（BV / 发布日期 / 实际画质）与抽帧规则（补记进本文件「校准记录」节）
- 已截帧点位清单、重复表、未找到清单

三、顺手项（与抽帧无依赖，可先做）
data/maps.json：de_train 的 duty true→false（Train 已 2026-01 出池，依据 docs/CONTENT_IDEAS.md 第一节与 HLTV 来源），
改完 tools\pb.cmd build 重建并确认 data.js 生效。

红线：不动 data/entries/ 现有条目；不删不改 media/ 任何现有图片；源视频与临时脚本用完即清；不引入打包器/第三方框架。
```

---

## 粘贴提示词（阶段 B：按确认清单建条目 + 验收；前置＝阶段 A 已完成且用户已确认）

```text
按 AGENTS.md 规范执行内容迭代 I27 阶段 B（Dust2 缺口条目入库）。
先读：AGENTS.md（重点 3.1 数据模型、四 图片规范）、docs/iterations/ITER-I27.md（含阶段 A 补记的校准记录
与用户确认结论）、docs/RECORD.md。

1. 按用户确认的清单逐颗建条目 data/entries/dust2-*.md（帧从 build/staging-i27/<id>/ 归位）：
   - id 用清单里的建议 id（已被占用时加 -2 后缀）；frontmatter 按 AGENTS.md 3.1 全填：
     status: draft；source {kind: video, creator: 冷锋 / tatukunn, url: 对应 BV 链接}；
     click/move/action 只按画面/字幕/面板能确认的填，确认不了保留模板占位并在正文标注「投法待实测」；
     origin/target 用 data/callouts.json de_dust2 报点表里的中文名（可用 search 别名匹配），
     spots 填 origin+target 去重；正文 ≤5 行注意事项（缝在哪/何时别用/视频关键提示）。
   - 图片归位 media/de_dust2/<id>/1-stand.png、2-aim.png、4-result.png（阶段 A 已压缩，勿二次压缩）。
   - 视频报点名对不上报点表时：优先别名匹配；报点表确实没有的点位名记「报点缺失清单」汇报，不擅自造坐标。
2. tools\pb.cmd lint（目标 0 ERROR；WARN 逐条评估处理）→ build（核对 build/report.md 新条目无缺图）→ pack。
3. 浏览器打开 index.html 强刷（Ctrl+F5）抽查：新条目渲染、三图竖排+角标、lightbox、投法徽章、
   顶栏 CT 过滤只出 CT 条目、搜索能命中新条目标题。
4. 汇报：新增 N 颗（全 draft）+ 重复表 / 报点缺失清单 / 投法待实测清单；提醒用户游戏实测后在网页标记 verified；
   按 AGENTS.md 一.9 在 docs/PROGRESS.md 执行记录末尾追加一行并更新「当前状态」。
```

---

## 目标条目清单（权威版 = docs/CONTENT_IDEAS.md 第二节；视频里没有的不硬凑）

| # | 建议 id | 类型/目标 | 提示 |
| --- | --- | --- | --- |
| 1 | dust2-t-smoke-a-cross | 烟 / A大十字 | 断警家 spawn 视野，A 执行件 |
| 2 | dust2-t-smoke-b-window | 烟 / B窗 | 与 B 门烟配套 |
| 3 | dust2-t-smoke-mid-to-b | 烟 / 中转B断警家 | Xbox 后跳投，中 B 夹击核心 |
| 4 | dust2-t-smoke-long-corner | 烟 / A大拐角 | 开局早投，安全下 A 大 |
| 5 | dust2-t-molly-goose | 火 / 鹅位 Goose | A 执行清蹲位 |
| 6 | dust2-t-molly-car | 火 / A大车位 Car | 「不烧车拿不了 A 大」 |
| 7 | dust2-t-molly-a-site | 火 / A短→包点锚位 | 把锚位烧出来 |
| 8 | dust2-t-molly-b-window | 火 / 上洞→B窗 | 隔窗清 B 区防绕后 |
| 9 | dust2-t-flash-a-long | 闪 / A大门 pop | 独自破门 |
| 10 | dust2-t-flash-a-main | 闪 / A main 二波闪 | 执行节奏闪 |
| 11 | dust2-t-flash-b-exec | 闪 / B 执行反弹闪 | 入洞口 |
| 12 | dust2-t-he-a-site | 雷 / A 包点 | 可选，视频有才录 |
| 13 | dust2-ct-molly-short-rush | 火 / 中→A短防rush | 秒扔保命火 |
| 14 | dust2-ct-molly-lower-tunnel | 火 / 中→下洞 | 清下洞近点 |
| 15 | dust2-ct-molly-b-car | 火 / 中→B车 | B 门被烟封也能用 |
| 16 | dust2-ct-smoke-long-delay | 烟 / Car→A大门延迟 | 封 A 大 rush |
| 17 | dust2-ct-smoke-short-delay | 烟 / A点→A短楼梯 | 延迟短道 |
| 18 | dust2-ct-smoke-tunnel-delay | 烟 / B洞口 | 配火双延迟 |
| 19 | dust2-ct-flash-tunnel-push | 闪 / 上B洞反push | CT 反推 B |
| 20 | dust2-ct-retake-a | 烟+闪 / A 回防组合 | 可拆 2-3 条，id 加 -a/-b 后缀 |
| 21 | dust2-ct-flash-b-retake | 闪 / 中→B 回防 pop | 回防必带 |

素材：冷锋 BV1jnQrBrEVb + tatukunn BV1ybF6eLEXv（或校准后替代的 BV）。

## 验收清单（阶段 B 逐项自检）

- [ ] 新增条目全部 draft、source 署名（creator + BV URL）齐全、每条 ≥3 图
- [ ] 无竖屏素材、无 2024-10 前素材混入（校准记录可追溯）
- [ ] origin/target/spots 全部对齐报点表；报点缺失清单已单独列出
- [ ] lint 0 ERROR；report.md 新条目无缺图；pack 成功；浏览器渲染抽查通过
- [ ] 现有 18 条与 media/ 零改动；临时文件已清理；PROGRESS.md 已追加执行记录

## 校准记录（阶段 A 会话补记）

**2026-10-03 阶段 A 执行结论**：

| 项 | 结论 |
| --- | --- |
| 环境 | yt-dlp 2026.08.19 ✓；ffmpeg 走 imageio-ffmpeg v7.1 二进制（winget/GitHub/gyan.dev 直连全失败，pip 可用即满足）✓；**tools/harvest.py 完全可复用**（find_ffmpeg 已内置 imageio 回退，未实战即兼容） |
| 冷锋 BV1jnQrBrEVb | 《禁止干拉！炙热沙城Dust2最新全图必学道具！》upload **2026-03-25**，23.5 分钟，**1920×1080 横屏** ✓；未登录即可下 1080P 30帧（format 30080 avc1，462MB；4K/1080P60 才要会员），无需 cookie |
| tatukunn BV1ybF6eLEXv | 《沙二新手入门道具教学 进攻方篇》upload **2025-02-02**，4 分钟，**1920×1080 横屏** ✓（format 100050 avc1，40MB） |
| 画面校准·冷锋 | 第一人称完整横屏、CS2 UI ✓；**无道具信息面板**；点位标注方式=**画面左上大字幕「道具名+投法」**（如「蓝车火/W跳投」）＋**右上角「阵营-区域」角标**（T-中路/T-A大/CT-A点…）＋底部口播字幕（站位/瞄准细节）→ 字段提取规则：左上字幕→title 与 click/move/action（站投=stand+direct、跳投=stand+jump、跑投=run+direct、走一步投=walk-step+direct、W跳投=w+jump、跑一步跳投=walk-step+jump、双键跳投=both+jump、蹲投=crouch+jump、右键=rmb），右上角标→side 与区域归属 |
| 画面校准·tatukunn | 第一人称完整横屏、CS2 UI ✓；**无道具信息面板**（已知 1920×1440 面板是预览视频特有，本次教学实录无）；点位标注=**左上「序号.名称」字幕**（2.A大高闪…19.警口辅助闪）＋底部黄色字幕给站位/瞄准/投法细节；本次内容与现有 12 颗面板条目大量同点位（重复表），新增价值有限 |
| 抽帧规则 | 全片 20s/15s 间隔粗扫拼版定位段落 → 目标点位候选段 1-4s 间隔密抽拼版 → 逐帧目验选 1-stand（站位+地标）/2-aim（出手瞄准）/4-result（烟成/火燃/闪爆）；正式帧 1920×1080 原比例（≤1920 不压）；帧时间以实际 ffmpeg 抽取结果复核（拼版与正式抽帧有 ±1s 段落边界漂移，全部经大图 Read 复核修正 5 处） |

## 用户确认结论（阶段 A 停点后补记）

**2026-10-03 用户确认**：瞄点帧基本没问题；站位/效果帧"部分不太好"的地方**不再重抽，由用户后续在网页里手动替换**（上传/替换管线现成）——按现状全量入库。当轮即执行阶段 B：13 颗候选全部入库（含缺效果帧的 B洞深烟、语义待定的 B洞方向闪，均以正文注记），id 冲突 2 条已按 pb 规则改名（retake-a-fire→ct-molotov-retake-fire、retake-a-smoke→ct-smoke-retake-a-door）。替代 BV：无需（原 BV 全部达标）。

---

## 变更记录

| 日期 | 迭代 | 内容 |
| --- | --- | --- |
| 2026-10-02 | I27 | 创建（内容批次试点）：Dust2 缺口 21 颗，两阶段提示词（A＝环境/日期/画面三重校准+抽帧+总览索引+Train duty 顺手项，停在用户核对；B＝按确认清单建条目+lint/build/pack+台账）。红线：只用 tatukunn/冷锋横屏、CS2 近 1-2 年素材、verified 不重录、报点缺失不造坐标 |
