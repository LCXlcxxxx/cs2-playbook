# CS2 Playbook — 道具速查与战术板

CS2 游戏中快速查看道具点位与默认打法的副屏工具。

- 项目规范（最高约束）：[AGENTS.md](AGENTS.md)
- 开发计划（分期任务与技术要点）：[docs/BUILD_PLAN.md](docs/BUILD_PLAN.md)
- 迭代开发包（查看器功能迭代）：[docs/iterations/](docs/iterations/)

## 日常使用（零命令行）

1. **看道具**：双击 `index.html` → 道具 Tab 列表点行进详情（←/→ 切换上/下一条）。
2. **改内容**：详情页点「编辑」改字段/传图片/标记已实测；改动即时保存在浏览器。
3. **调报点**：战术板 → ⚙ 编辑报点，拖拽/增删/改名（首次点「🔗 关联」授权后自动写回文件）。
4. **同步打包**：双击根目录 **「同步并打包.bat」** —— 它是你唯一的"命令"：把网页里的修改
   固化到项目数据并刷新 dist 发布包。顶栏出现「● 有未同步修改」时记得双击它。

## 首次建议

- 点道具页顶部「📁 关联项目文件夹」选择本项目文件夹一次：之后编辑直接写回
  `data/entries/*.md` 与 `media/`，图片不再暂存浏览器。
- 副屏置顶：双击 `tools\pin.bat`（F4 置顶 / F3 半透明，需 AutoHotkey v2）。

## 开发者

命令行工具（开发会话用，使用者无需接触）：

```bat
tools\pb.cmd lint                :: 校验数据
tools\pb.cmd build               :: 校验 + 生成 build/data.js + report.md
tools\pb.cmd new utility <id> --side T --type smoke     :: 新条目模板
tools\pb.cmd shots <截图目录> --id <id> --dry-run        :: 截图归位
tools\pb.cmd verify <id>         :: 实测转 verified / --broken 标记失效
tools\pb.cmd pack                :: 生成发布包 dist/cs2-playbook-YYYYMMDD.zip
python tools\harvest.py <B站URL或本地视频> --map de_mirage   :: 视频抽帧流水线
```

- 改了 `data/`、`tactics/` 或前端代码后：`pb build`（数据）+ 递增 index.html 的 `?v=`
  （前端防缓存）。
- 迭代开发流程见 docs/iterations/ 下的 ITER-*.md。
