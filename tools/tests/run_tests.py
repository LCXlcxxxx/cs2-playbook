# -*- coding: utf-8 -*-
r"""run_tests.py — R1-A 测试固化：核心回归套件（行为零变化安全网）。
由 `tools\pb.cmd test` 调用；也可直接 `python -X utf8 tools\tests\run_tests.py`。
- 载体：Python http.server（IAB/goto 不支持 file:// 的原因见 docs/DEV.md 坑清单）
- 浏览器：playwright headless chromium（可选依赖，缺失时 pb test 优雅跳过）
- 像素基线：tools/tests/baseline/<name>.png（入库）；产物输出 build/_tests/（不入库）
- 纪律：每个用例自建状态（goto + 切 Tab），执行顺序按 CASES 注册表显式声明
"""
import argparse
import http.server
import shutil
import socket
import sys
import threading
import functools
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import imgdiff  # noqa: E402
import helpers as H  # noqa: E402

TESTS_DIR = Path(__file__).resolve().parent
BASELINE_DIR = TESTS_DIR / "baseline"
OUT_DIR = ROOT / "build" / "_tests"
SHOTS_DIR = OUT_DIR / "shots"

RESULTS = {"pass": [], "fail": [], "note": []}


def case(name):
    def deco(fn):
        fn._case_name = name
        return fn
    return deco


def goto(page, base, url_path="/index.html"):
    page.goto(base + url_path)
    page.wait_for_load_state("domcontentloaded")
    H.wait_boot(page)
    H.wait_all_images(page)


def go_entries(page):
    """切到道具 Tab 列表（等渲染）。"""
    H.mw_click(page, '#tabs button[data-tab="entries"]')
    page.wait_for_timeout(300)


def clear_search(page):
    page.evaluate("""() => { const s = document.getElementById('search');
        s.value = ''; s.dispatchEvent(new Event('input')); }""")
    page.wait_for_timeout(150)


def row_ids(page):
    return page.evaluate(
        """() => [...document.querySelectorAll('.entry-row')]
             .map(r => r.dataset.id).filter(Boolean)"""
    )


def entry_of(page, eid):
    return page.evaluate(
        """(id) => { const e = PLAYBOOK.entries.find(x => x.id === id);
                      return e ? { id: e.id, type: e.type, side: e.side,
                                   status: e.status, difficulty: e.difficulty,
                                   title: e.title, move: e.move } : null; }""",
        eid,
    )


def set_map(page, key):
    page.evaluate(
        """(k) => { const s = document.getElementById('map-filter');
             s.value = k; s.dispatchEvent(new Event('change')); }""",
        key,
    )
    page.wait_for_timeout(250)


def click_layer(page, mark):
    """按文本点图层按钮（📍/💥/🕒）。"""
    idx = page.evaluate(
        """(mark) => [...document.querySelectorAll('.layer-btn')]
              .findIndex(b => b.textContent.includes(mark))""",
        mark,
    )
    assert idx >= 0, f"图层按钮未找到：{mark}"
    page.evaluate(
        """(i) => [...document.querySelectorAll('.layer-btn')][i].click()""", idx
    )
    page.wait_for_timeout(350)


# ---------------------------------------------------------------- S1 顶栏过滤
@case("顶栏/默认 Tab=战术板 且地图切换记忆")
def s1_tab_and_map(page, base):
    goto(page, base)
    active = H.mw_text(page, "#tabs button.active")
    assert active == "战术板", f"默认 Tab 应为战术板，实际 {active!r}"
    set_map(page, "de_dust2")
    stored = page.evaluate("() => localStorage.getItem('pb-map')")
    assert stored == "de_dust2", f"pb-map 应为 de_dust2，实际 {stored!r}"
    set_map(page, "de_mirage")


@case("顶栏/类型过滤只留 smoke 且计数正确")
def s1_type_filter(page, base):
    goto(page, base)
    go_entries(page)
    H.mw_click(page, '#type-filter button[data-type="smoke"]')
    page.wait_for_timeout(250)
    ids = row_ids(page)
    assert ids, "smoke 过滤后无行（Mirage 应有烟）"
    for eid in ids:
        e = entry_of(page, eid)
        assert e["type"] == "smoke", f"{eid} 类型 {e['type']} 泄入 smoke 过滤"
    expected = page.evaluate(
        """() => PLAYBOOK.entries.filter(e => e.map === 'de_mirage'
              && e.type === 'smoke' && !['broken','retired'].includes(e.status)).length"""
    )
    assert len(ids) == expected, f"行数 {len(ids)} != 可见 smoke 数 {expected}"
    H.mw_click(page, '#type-filter button[data-type="smoke"]')   # 还原
    page.wait_for_timeout(200)


@case("顶栏/阵营过滤 CT 只留 CT 与 both")
def s1_side_filter(page, base):
    goto(page, base)
    go_entries(page)
    H.mw_click(page, '#side-filter button[data-side="CT"]')
    page.wait_for_timeout(250)
    ids = row_ids(page)
    assert ids, "CT 过滤后无行"
    for eid in ids:
        e = entry_of(page, eid)
        assert e["side"] in ("CT", "both"), f"{eid} side={e['side']} 泄入 CT 过滤"
    H.mw_click(page, '#side-filter button[data-side=""]')   # 全部
    page.wait_for_timeout(200)


@case("顶栏/搜索分词「难度:简单 烟」AND 组合")
def s1_search_tokens(page, base):
    goto(page, base)
    go_entries(page)
    page.fill("#search", "难度:简单 烟")
    page.wait_for_timeout(250)
    ids = row_ids(page)
    assert ids, "难度:简单 烟 无命中（Mirage 应有 easy 烟）"
    for eid in ids:
        e = entry_of(page, eid)
        assert e["difficulty"] == "easy", f"{eid} difficulty={e['difficulty']} 泄入"
        hay = page.evaluate(
            """(id) => hayOf(PLAYBOOK.entries.find(x => x.id === id)).includes('烟')""",
            eid,
        )
        assert hay, f"{eid} hay 不含「烟」"
    clear_search(page)


@case("顶栏/chips 同维互斥 + 跨维 AND + 清除")
def s1_chips(page, base):
    goto(page, base)
    go_entries(page)

    def chip_on():
        return H.mw_all_text(page, "#chip-filter .fchip.on")
    H.mw_click(page, '#chip-filter [data-fchip="jump"]')
    page.wait_for_timeout(200)
    assert chip_on() == ["跳投"], f"跳投应亮，实际 {chip_on()}"
    H.mw_click(page, '#chip-filter [data-fchip="run"]')
    page.wait_for_timeout(200)
    assert chip_on() == ["跑投"], f"跑投应顶掉跳投，实际 {chip_on()}"
    for eid in row_ids(page):
        e = entry_of(page, eid)
        assert e["move"] in ("w", "run"), f"{eid} move={e['move']} 泄入跑投"
    H.mw_click(page, '#chip-filter [data-fchip="verified"]')
    page.wait_for_timeout(200)
    assert sorted(chip_on()) == ["已实测", "跑投"], f"应跨维双亮，实际 {chip_on()}"
    for eid in row_ids(page):
        e = entry_of(page, eid)
        assert e["status"] == "verified" and e["move"] in ("w", "run"), f"{eid} 泄入 AND"
    H.mw_click(page, "[data-fchipclear]")
    page.wait_for_timeout(200)
    assert chip_on() == [], "清除后不应有选中 chip"


@case("顶栏/📦 只看战术包开关")
def s1_sets_toggle(page, base):
    goto(page, base)
    go_entries(page)
    H.mw_click(page, "#sets-toggle")
    page.wait_for_timeout(250)
    heads = H.mw_all_text(page, ".list-group-head")
    assert "📦 战术包" not in heads, "只看视图不应有 📦 战术包 分组头"
    assert "默认" not in heads and "爆点" not in heads, f"phase 分组头未隐藏: {heads}"
    assert H.mw_count(page, ".pkg-row") > 0, "只看视图应有套装行"
    H.mw_click(page, ".pkg-row")
    page.wait_for_timeout(200)
    assert H.mw_count(page, ".set-members .entry-row") > 0, "套装行应可展开"
    H.mw_click(page, "#sets-toggle")   # 关
    page.wait_for_timeout(250)
    heads = H.mw_all_text(page, ".list-group-head")
    assert "默认" in heads, "关闭只看应还原 phase 分组"


# ---------------------------------------------------------------- S2 列表
@case("列表/分组结构（📦 区在 phase 分组前）")
def s2_groups(page, base):
    goto(page, base)
    go_entries(page)
    heads = H.mw_all_text(page, ".list-group-head")
    assert heads and heads[0] == "📦 战术包", \
        f"首组头应为 📦 战术包（Mirage 有套装且无收藏），实际 {heads}"
    assert "默认" in heads, f"应有 phase 分组头，实际 {heads}"
    assert heads.index("📦 战术包") < heads.index("默认"), "📦 区应在 phase 分组之前"
    rows = H.mw_count(page, ".entry-row")
    foot = H.mw_text(page, ".list-foot") or ""
    n = page.evaluate(
        """() => PLAYBOOK.entries.filter(e => e.map === 'de_mirage'
             && !['broken','retired'].includes(e.status)).length"""
    )
    assert rows >= n, f"列表行 {rows} 少于可见条目 {n}（叠加视图允许重复但不少于）"
    assert str(n) in foot, f"foot 计数 {foot!r} 应含 {n}"


@case("列表/收藏置顶（⭐ 分组出现且在首位）")
def s2_favs(page, base):
    goto(page, base)
    go_entries(page)
    first_id = page.evaluate("() => document.querySelector('.entry-row')?.dataset.id")
    H.mw_click(page, f'.entry-row[data-id="{first_id}"] .fav-btn')
    page.wait_for_timeout(250)
    heads = H.mw_all_text(page, ".list-group-head")
    assert heads[0] == "⭐ 收藏", f"收藏后首组头应 ⭐ 收藏，实际 {heads}"
    # 组头与行是平级兄弟（非容器包裹）：置顶组的首行 = 文档序第一个 .entry-row
    first_dom = page.evaluate("() => document.querySelector('.entry-row')?.dataset.id")
    assert first_dom == first_id, f"置顶组首行应为收藏条目，实际 {first_dom!r}"
    H.mw_click(page, f'.entry-row[data-id="{first_id}"] .fav-btn')   # 还原
    page.wait_for_timeout(250)
    assert H.mw_all_text(page, ".list-group-head")[0] != "⭐ 收藏", "取消收藏应还原"


@case("列表/sets 折叠展开与叠加视图")
def s2_sets_fold(page, base):
    goto(page, base)
    go_entries(page)
    total_before = H.mw_count(page, ".entry-row")
    name = page.evaluate("() => document.querySelector('.pkg-row')?.dataset.setrow")
    assert name, "Mirage 应有套装"
    H.mw_click(page, f'.pkg-row[data-setrow="{name}"]')
    page.wait_for_timeout(250)
    members = page.evaluate(
        """() => [...document.querySelectorAll('.set-members .entry-row')]
              .map(r => r.dataset.id)"""
    )
    assert members, "展开后应有成员行"
    for eid in members:   # 叠加视图：成员在成员区与 phase 分组各一次
        n = page.evaluate(
            """(id) => document.querySelectorAll(`.entry-row[data-id="${id}"]`).length""", eid
        )
        assert n == 2, f"{eid} 应出现 2 次，实际 {n}"
    H.mw_click(page, f'.pkg-row[data-setrow="{name}"]')   # 收起还原
    page.wait_for_timeout(200)
    assert H.mw_count(page, ".entry-row") == total_before, "收起后行数应还原"


@case("列表/行渲染（投法着色/难度徽章/状态贴右/前缀弱化）")
def s2_row_render(page, base):
    goto(page, base)
    go_entries(page)
    jump_id = page.evaluate(
        """() => PLAYBOOK.entries.find(e => e.map === 'de_mirage'
             && (e.action === 'jump' || e.action === 'crouch-jump')
             && !['broken','retired'].includes(e.status))?.id"""
    )
    if jump_id:
        cls = page.evaluate(
            """(id) => document.querySelector(`.entry-row[data-id="${id}"] .badge-throw`)?.className""",
            jump_id,
        )
        assert "bt-jump" in (cls or ""), f"{jump_id} 投法徽章应 bt-jump，实际 {cls!r}"
    badge = page.evaluate(
        """() => { const b = document.querySelector('.entry-row .diff-badge');
            return b ? { cls: b.className, text: b.textContent.trim() } : null; }"""
    )
    assert badge and any(d in badge["cls"] for d in ("diff-easy", "diff-normal", "diff-hard")), \
        f"难度徽章缺三档类：{badge}"
    assert badge["text"] in ("简单", "中等", "困难"), f"难度徽章文字异常 {badge}"
    # 状态贴右（I48）：Chrome 对 flex auto margin 的 getComputedStyle 返回 used value（0px），
    # 改查样式表规则本身（选择器存在且 margin-left: auto）
    rule_ok = page.evaluate(
        """() => [...document.styleSheets].some(s => { try {
             return [...s.cssRules].some(r => r.selectorText === '.entry-row .badge-status'
               && (r.style.marginLeft === 'auto' || /margin-left:\\s*auto/.test(r.cssText))); }
             catch { return false; } })"""
    )
    assert rule_ok, "样式表应含 .entry-row .badge-status { margin-left: auto }（状态贴右）"
    prefixed = page.evaluate(
        """() => PLAYBOOK.entries.find(e => e.map === 'de_mirage'
              && !['broken','retired'].includes(e.status) && (() => {
              const m = String(e.title||'').match(/^([A-Za-z0-9][A-Za-z0-9_.]{0,15})-(?=.)/);
              return m && /[\\u4e00-\\u9fff]/.test(e.title.slice(m[0].length)); })())?.id"""
    )
    if prefixed:
        has = page.evaluate(
            """(id) => !!document.querySelector(`.entry-row[data-id="${id}"] .row-prefix`)""", prefixed
        )
        assert has, f"{prefixed} 应有 .row-prefix 弱化前缀"
    else:
        RESULTS["note"].append("前缀弱化：库内暂无拉丁前缀标题条目，断言跳过")


# ---------------------------------------------------------------- S3 详情
def _open_first_row_with_image(page):
    first = page.evaluate(
        """() => { const ok = PLAYBOOK.entries.find(e => e.map === 'de_mirage'
              && !['broken','retired'].includes(e.status) && (e.images||[]).length);
              return ok?.id; }"""
    )
    assert first, "找不到带图条目"
    H.mw_click(page, f'.entry-row[data-id="{first}"]')
    page.wait_for_timeout(300)
    H.wait_all_images(page)


@case("详情/进详情+图片加载+lightbox")
def s3_detail_lightbox(page, base):
    goto(page, base)
    go_entries(page)
    _open_first_row_with_image(page)
    assert H.mw_count(page, ".entry.card") == 1, "应进详情页"
    img_ok = page.evaluate(
        """() => { const i = document.querySelector('.viewer-img');
             return i && !i.hidden ? i.naturalWidth > 0 : true; }"""
    )
    assert img_ok, "翻图面板大图未加载"
    H.mw_click(page, ".viewer-img")
    page.wait_for_timeout(250)
    hidden = page.evaluate("() => document.getElementById('lightbox').hidden")
    assert not hidden, "点大图应开 lightbox"
    H.doc_press(page, "Escape")
    page.wait_for_timeout(200)
    assert page.evaluate("() => document.getElementById('lightbox').hidden"), "Esc 应关 lightbox"


@case("详情/←→ 切换与 Backspace 回列表")
def s3_detail_nav(page, base):
    goto(page, base)
    go_entries(page)
    _open_first_row_with_image(page)
    t1 = H.mw_text(page, ".entry.card .card-head h2")
    H.doc_press(page, "ArrowRight")
    page.wait_for_timeout(250)
    t2 = H.mw_text(page, ".entry.card .card-head h2")
    assert t1 != t2, f"→ 应切下一条（{t1!r} 未变）"
    H.doc_press(page, "ArrowLeft")
    page.wait_for_timeout(250)
    assert H.mw_text(page, ".entry.card .card-head h2") == t1, "← 应回上一条"
    H.doc_press(page, "Backspace")
    page.wait_for_timeout(250)
    assert H.mw_count(page, ".entry-row") > 0, "Backspace 应回列表"


def set_manage(page, on):
    """R2-A：切换查阅/管理模式（幂等）。"""
    page.evaluate(
        """(on) => { if (state.manage !== on) document.getElementById('manage-toggle').click(); }""",
        on,
    )
    page.wait_for_timeout(250)


def display_of(page, selector):
    """首匹配元素的计算 display（无元素返回 null）——查阅模式隐藏是 CSS display:none。"""
    return page.evaluate(
        """(sel) => { const el = document.querySelector(sel);
             return el ? getComputedStyle(el).display : null; }""",
        selector,
    )


# ---------------------------------------------------------------- S4 编辑器（mock FS）
STUB_JS = """(() => {
  const writes = {}; window.__writes = writes;
  const makeFile = (path) => ({
    kind: 'file', name: path.split('/').pop(),
    createWritable: async () => {
      const buf = [];
      return {
        write: async (d) => { buf.push(d); },
        close: async () => { window.__writes[path] = await new Blob(buf).text(); },
      };
    },
    getFile: async () => { throw new Error('stub: 只支持写，不支持读'); },
  });
  const makeDir = (path) => ({
    kind: 'directory', name: path.split('/').pop(),
    getDirectoryHandle: async (n, _o) => makeDir(path + '/' + n),
    getFileHandle: async (n, _o) => makeFile(path + '/' + n),
  });
  rootDirHandle = makeDir('root');
  rootPerm = 'ready';
})()"""


@case("编辑器/新建→暂存→mock FS 写盘链路")
def s4_editor_write(page, base):
    goto(page, base)
    go_entries(page)
    set_manage(page, True)   # R2-A：编辑入口在管理模式
    page.evaluate(STUB_JS)
    H.mw_click(page, "#btn-add-entry")
    page.wait_for_timeout(300)
    diff_on = page.evaluate(
        """() => document.querySelector('#ef-difficulty .diff-opt.on')?.dataset.diff"""
    )
    assert diff_on == "easy", f"新建智能默认应 简单，实际 {diff_on!r}"
    page.evaluate("""() => {
      document.getElementById('ef-title').value = 'R1A写盘测试';
      document.getElementById('ef-oneline').value = '测试一句话';
    }""")
    H.mw_click(page, "#ef-save")
    page.wait_for_timeout(400)
    H.assert_toast(page, "id 已自动生成")
    written = page.evaluate("() => window.__writes || {}")
    md = next((v for k, v in written.items() if k.endswith(".md")), None)
    key = next((k for k in written if k.endswith(".md")), None)
    assert md, f"mock FS 未捕获 .md 写盘：{list(written)[:3]}"
    for token in ("title: R1A写盘测试", "status: draft", "difficulty: easy",
                  "oneline: 测试一句话"):   # 难度=智能默认（stand+direct→easy，上方已断言）
        assert token in md, f"写盘内容缺 {token!r}"
    page.evaluate("() => localStorage.removeItem('pb-entries-v1')")
    page.reload()
    page.wait_for_load_state("domcontentloaded")
    H.wait_boot(page)


# ---------------------------------------------------------------- S5 战术板
@case("战术板/三图层切换（报点→💥道具→🕒时间轴→报点）")
def s5_layers(page, base):
    goto(page, base)
    labels = H.mw_count(page, ".callout-label")
    assert labels > 0, f"报点层应有大图标注，实际 {labels}"
    btns = H.mw_all_text(page, ".layer-btn")
    assert any("💥" in b for b in btns) and any("🕒" in b for b in btns), f"图层按钮缺失: {btns}"
    click_layer(page, "💥")
    nades = H.mw_count(page, ".nade-icon")
    assert nades > 0, f"💥道具层应有落点图标，实际 {nades}"
    H.mw_click(page, ".nade-icon")
    page.wait_for_timeout(250)
    assert H.mw_count(page, ".nade-icon.sel") == 1, "点图标应选中"
    assert H.mw_count(page, ".nade-popup") == 1, "应有清单弹层"
    H.doc_press(page, "Escape")
    page.wait_for_timeout(200)
    assert H.mw_count(page, ".nade-icon.sel") == 0, "Esc 应取消选中"
    click_layer(page, "🕒")
    assert H.mw_count(page, ".tl-boards") >= 0, "时间轴层应渲染"
    click_layer(page, "📍")
    assert H.mw_count(page, ".callout-label") == labels, "回报点层标注数应一致"


@case("战术板/时间轴步骤按倒计时降序排序")
def s5_timeline_sort(page, base):
    goto(page, base)
    # 注入临时乱序板（de_dust2）：断言 1:40 → 0:30 → 0:30（倒计时大→小，同刻按编辑序）
    page.evaluate("""() => {
      PLAYBOOK.tactics.push({
        id: 'dust2-plan-99', map: 'de_dust2', side: 'T',
        title: 'R1A排序测试板', window: '整局', status: 'draft', uses: [],
        roles: [], timeline: [
          { t: '0:30', text: '三十秒动作' },
          { t: '1:40', text: '开局动作' },
          { t: '0:30', text: '同刻动作' },
        ],
        sections: [],
      });
      render();
    }""")
    set_map(page, "de_dust2")
    click_layer(page, "🕒")
    chips = page.evaluate(
        """() => [...document.querySelectorAll('.tl-boards button')].map(b => b.textContent.trim())"""
    )
    target = next((i for i, c in enumerate(chips) if "R1A排序测试板" in c), None)
    assert target is not None, f"注入板未出现在板 chips：{chips}"
    page.evaluate(
        """(i) => [...document.querySelectorAll('.tl-boards button')][i].click()""", target
    )
    page.wait_for_timeout(300)
    times = H.mw_all_text(page, ".tl-step .tl-t")
    assert times == ["1:40", "0:30", "0:30"], f"时间轴排序应为 1:40/0:30/0:30，实际 {times}"
    page.reload()   # 清注入
    page.wait_for_load_state("domcontentloaded")
    H.wait_boot(page)


# ---------------------------------------------------------------- R2-A 两模式
@case("R2A/查阅模式默认无修改入口，切管理齐全")
def r2a_modes(page, base):
    goto(page, base)   # 新载入默认查阅
    # 道具 Tab
    go_entries(page)
    assert display_of(page, ".entries-toolbar") == "none", "查阅模式列表工具栏应 display:none"
    # 详情页
    page.evaluate("() => document.querySelector('.entry-row').click()")
    page.wait_for_timeout(300)
    assert display_of(page, ".entry-edit") == "none", "查阅模式详情编辑按钮应 display:none"
    assert display_of(page, ".badge-status-btn") == "none", "查阅模式状态切换应 display:none"
    assert display_of(page, ".viewer-tools") == "none", "查阅模式上传/替换应 display:none"
    page.evaluate("() => { state.entryView = null; render(); }")
    page.wait_for_timeout(250)
    # 战术板 Tab
    H.mw_click(page, '#tabs button[data-tab="tactics"]')
    page.wait_for_timeout(300)
    assert display_of(page, "#add-tactic") == "none", "查阅模式 ＋ 新增战术板应 display:none"
    assert display_of(page, "#open-editor") == "none", "查阅模式 ⚙ 编辑报点应 display:none"
    assert display_of(page, "[data-tedit]") == "none", "查阅模式战术板 ⚙ 编辑应 display:none"
    # 切管理 → 全部出现（flex/block 正常渲染）
    set_manage(page, True)
    go_entries(page)
    d = display_of(page, ".entries-toolbar")
    assert d == "flex", f"管理模式工具栏应 display:flex，实际 {d}"
    page.evaluate("() => document.querySelector('.entry-row').click()")
    page.wait_for_timeout(300)
    assert display_of(page, ".entry-edit") not in (None, "none"), "管理模式详情应有编辑按钮"
    assert display_of(page, ".badge-status-btn") not in (None, "none"), "管理模式详情应有状态切换"
    assert display_of(page, ".viewer-tools") not in (None, "none"), "管理模式详情应有上传/替换"
    page.evaluate("() => { state.entryView = null; render(); }")
    page.wait_for_timeout(250)
    H.mw_click(page, '#tabs button[data-tab="tactics"]')
    page.wait_for_timeout(300)
    assert display_of(page, "#add-tactic") not in (None, "none"), "管理模式应有 ＋ 新增战术板"
    assert display_of(page, "#open-editor") not in (None, "none"), "管理模式应有 ⚙ 编辑报点"
    assert display_of(page, "[data-tedit]") not in (None, "none"), "管理模式应有战术板 ⚙ 编辑"
    set_manage(page, False)   # 还原查阅（像素基线用默认态）
    page.wait_for_timeout(200)


@case("R2A/待写徽标两模式恒可见")
def r2a_badge(page, base):
    goto(page, base)
    # 在当前页面种一条暂存修改（不 reload——init script 会清 localStorage）→ 手动刷新徽标
    page.evaluate("""() => {
      const ov = { edited: {}, added: [], deleted: [], savedAt: {}, written: {} };
      const e = JSON.parse(JSON.stringify(PLAYBOOK.entries[0]));
      e.title = e.title + '（暂存）';
      ov.edited[e.id] = e;
      ov.savedAt[e.id] = '2000-01-01T00:00:00Z';
      ov.written[e.id] = false;
      localStorage.setItem('pb-entries-v1', JSON.stringify(ov));
      applyEntryOverrides();
      refreshSyncBadge();
    }""")
    page.wait_for_timeout(600)   # refreshSyncBadge 是 async
    b1 = page.evaluate(
        """() => { const b = document.getElementById('sync-badge');
             return { hidden: b.hidden, manage: state.manage }; }""")
    assert b1["hidden"] is False, f"查阅模式待写徽标应可见: {b1}"
    page.evaluate("() => document.getElementById('manage-toggle').click()")
    page.wait_for_timeout(250)
    b2 = page.evaluate(
        """() => { const b = document.getElementById('sync-badge');
             return { hidden: b.hidden, manage: state.manage }; }""")
    assert b2["hidden"] is False and b2["manage"] is True, f"管理模式待写徽标应可见: {b2}"
    page.evaluate("() => localStorage.removeItem('pb-entries-v1')")
    page.evaluate("() => { applyEntryOverrides(); refreshSyncBadge(); }")
    page.wait_for_timeout(300)


@case("R2A/筛选带两行制与灰阶")
def r2a_band(page, base):
    goto(page, base)
    go_entries(page)
    band = page.evaluate(
        """() => { const b = document.getElementById('filter-band');
             return { exists: !!b, idle: b?.classList.contains('pb-idle'),
                      rows: document.querySelectorAll('#topbar .tb-row').length }; }""")
    assert band["exists"] and band["rows"] == 2, f"顶栏应为两行制: {band}"
    assert band["idle"], "无筛选时应灰阶（pb-idle）"
    H.mw_click(page, '#type-filter button[data-type="smoke"]')
    page.wait_for_timeout(250)
    assert page.evaluate(
        """() => !document.getElementById('filter-band').classList.contains('pb-idle')"""), \
        "激活类型筛选后应去灰阶"
    H.mw_click(page, '#type-filter button[data-type="smoke"]')   # 还原
    page.wait_for_timeout(200)
    # 战术板 Tab：📦 隐藏（只对道具列表有效）
    H.mw_click(page, '#tabs button[data-tab="tactics"]')
    page.wait_for_timeout(300)
    assert page.evaluate("() => document.getElementById('sets-toggle').hidden"), \
        "战术板 Tab 下 📦 应隐藏"
    H.mw_click(page, '#tabs button[data-tab="entries"]')
    page.wait_for_timeout(200)
    assert not page.evaluate("() => document.getElementById('sets-toggle').hidden"), \
        "道具 Tab 下 📦 应显示"


# ---------------------------------------------------------------- R2-B 开战连翻
@case("R2B/📦 开战进入→J/K 翻→序号包名→Esc 回列表")
def r2b_set_runbook(page, base):
    goto(page, base)
    go_entries(page)
    page.wait_for_timeout(500)   # 等列表渲染完（含套装行）
    set_name = page.evaluate("() => document.querySelector('.pkg-row')?.dataset.setrow")
    assert set_name, f"Mirage 应有套装"
    page.evaluate("() => document.querySelector('[data-setrunbook]').click()")
    page.wait_for_timeout(400)
    assert not page.evaluate("() => document.getElementById('runbook').hidden"), "开战后 runbook 应可见"
    # 顶栏被覆盖（chrome 不存在）
    tb_visible = page.evaluate(
        """() => { const tb = document.getElementById('topbar');
             const rb = document.getElementById('runbook');
             const tr = rb.getBoundingClientRect();
             return tr.top <= 0 && tr.height >= window.innerHeight; }""")
    assert tb_visible, "runbook 应覆盖整个视口"
    # 序号 1/N + 包名
    num1 = page.evaluate("() => document.querySelector('.runbook-num').textContent")
    assert num1.startswith("1 /"), f"序号应 1/N，实际 {num1!r}"
    src = page.evaluate("() => document.querySelector('.runbook-src').textContent")
    assert set_name in src, f"来源名应含 {set_name!r}，实际 {src!r}"
    # J 翻页 → 2/N
    H.doc_press(page, "j")
    page.wait_for_timeout(500)   # 图片加载门控
    num2 = page.evaluate("() => document.querySelector('.runbook-num').textContent")
    assert num2.startswith("2 /"), f"J 后序号应 2/N，实际 {num2!r}"
    # → 翻页 → 3/N（如有）
    total = int(num1.split("/")[1].strip())
    if total >= 3:
        H.doc_press(page, "ArrowRight")
        page.wait_for_timeout(500)
        num3 = page.evaluate("() => document.querySelector('.runbook-num').textContent")
        assert num3.startswith("3 /"), f"→ 后序号应 3/N，实际 {num3!r}"
    # Esc 退出回列表
    H.doc_press(page, "Escape")
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.getElementById('runbook').hidden"), "Esc 应回列表"
    assert page.evaluate("() => state.runbook === null"), "state.runbook 应回 null"
    # 列表还在（来源视图未动）
    assert H.mw_count(page, ".pkg-row") >= 1, "来源列表应保留"


@case("R2B/战术板时间轴开战→首张=最早步骤道具")
def r2b_tactic_runbook(page, base):
    goto(page, base)
    # 注入临时板（de_dust2）带 use 步骤——倒计时降序 = 1:40 → 0:30
    ids = page.evaluate(
        """() => { const es = PLAYBOOK.entries.filter(e => e.map === 'de_dust2'
              && !['broken','retired'].includes(e.status));
              return es.length >= 2 ? [es[0].id, es[1].id] : null; }"""
    )
    assert ids, "Dust2 应有可用条目做时间轴夹具"
    page.evaluate("""(ids) => {
      PLAYBOOK.tactics.push({
        id: 'dust2-plan-98', map: 'de_dust2', side: 'T',
        title: 'R2B开战测试板', window: '整局', status: 'draft', uses: ids,
        roles: [], timeline: [
          { t: '0:30', use: ids[1], text: '三十秒动作' },
          { t: '1:40', use: ids[0], text: '开局动作' },
        ],
        sections: [],
      });
      render();
    }""", ids)
    set_map(page, "de_dust2")
    page.wait_for_timeout(250)
    # 找到测试板卡片并点开战
    page.evaluate(
        """() => { const btn = document.querySelector('[data-trunbook][data-trunbook="dust2-plan-98"]')
              || [...document.querySelectorAll('[data-trunbook]')]
                   .find(b => b.closest('.card')?.textContent.includes('R2B开战测试板'));
             btn.click(); }"""
    )
    page.wait_for_timeout(500)
    assert not page.evaluate("() => document.getElementById('runbook').hidden"), "开战后 runbook 应可见"
    # 首张 = 最早步骤（1:40）的道具
    first_id = page.evaluate(
        "() => state.runbook.items[0].entry.id")
    assert first_id == ids[0], f"首张应为 1:40 步骤的道具 {ids[0]}，实际 {first_id}"
    # K 回不行（已在首张）→ J 到 0:30 步骤
    H.doc_press(page, "j")
    page.wait_for_timeout(400)
    second_id = page.evaluate("() => state.runbook.items[1].entry.id")
    assert second_id == ids[1], f"第二张应为 0:30 步骤的道具 {ids[1]}，实际 {second_id}"
    # K 回到首张
    H.doc_press(page, "k")
    page.wait_for_timeout(400)
    back_id = page.evaluate("() => state.runbook.items[state.runbook.idx].entry.id")
    assert back_id == ids[0], "K 应回首张"
    # Esc 退出
    H.doc_press(page, "Escape")
    page.wait_for_timeout(250)
    assert page.evaluate("() => document.getElementById('runbook').hidden"), "Esc 应回战术板"
    page.reload()   # 清注入
    page.wait_for_load_state("domcontentloaded")
    H.wait_boot(page)


@case("R2B/数字键 1-9 按顶栏序切图")
def r2b_num_keys(page, base):
    goto(page, base)
    # 按 2 → 切到 mapOrder()[1]
    expected = page.evaluate("() => mapOrder()[1]")
    page.evaluate(
        "() => document.dispatchEvent(new KeyboardEvent('keydown', {key: '2', bubbles: true}))")
    page.wait_for_timeout(300)
    actual = page.evaluate("() => state.map")
    assert actual == expected, f"按 2 应切到 {expected}，实际 {actual}"
    # pb-map 持久化
    stored = page.evaluate("() => localStorage.getItem('pb-map')")
    assert stored == expected, f"pb-map 应持久化 {expected}"
    # 按 1 → 回第一位
    first = page.evaluate("() => mapOrder()[0]")
    page.evaluate(
        "() => document.dispatchEvent(new KeyboardEvent('keydown', {key: '1', bubbles: true}))")
    page.wait_for_timeout(300)
    assert page.evaluate("() => state.map") == first, f"按 1 应切到 {first}"
    # 编辑器打开时数字键不切图（难度键优先）
    H.mw_click(page, '#tabs button[data-tab="entries"]')
    page.wait_for_timeout(250)
    page.evaluate("() => document.querySelector('.entry-row').click()")
    page.wait_for_timeout(300)
    page.evaluate("() => document.querySelector('.entry.card .entry-edit').click()")
    page.wait_for_timeout(300)
    page.evaluate(
        "() => document.dispatchEvent(new KeyboardEvent('keydown', {key: '2', bubbles: true}))")
    page.wait_for_timeout(200)
    assert page.evaluate("() => state.map") == first, "编辑器打开时按 2 不应切图（难度键优先）"
    page.evaluate("() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))")
    page.wait_for_timeout(200)



def _open_first_row(pg):
    first = pg.evaluate("() => document.querySelector('.entry-row')?.dataset.id")
    assert first, "列表无行可开详情"
    H.mw_click(pg, f'.entry-row[data-id="{first}"]')
    pg.wait_for_timeout(400)
    H.wait_all_images(pg)


PIXEL_PAGES = [
    ("tactics", lambda pg, bs: goto(pg, bs)),
    ("entries", lambda pg, bs: (goto(pg, bs),
                                go_entries(pg),
                                pg.wait_for_timeout(300))),
    ("detail", lambda pg, bs: (goto(pg, bs),
                               go_entries(pg),
                               _open_first_row(pg))),
]
VIEWPORTS = [(1440, 2560), (2560, 1440)]


@case("视口/1440×2560 与 2560×1440 关键页像素比对")
def s6_pixels(page, base):
    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
    BASELINE_DIR.mkdir(parents=True, exist_ok=True)
    checked = 0
    for (w, hgt) in VIEWPORTS:
        page.set_viewport_size({"width": w, "height": hgt})
        for name, opener in PIXEL_PAGES:
            opener(page, base)
            page.evaluate(
                "() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
            )
            shot = SHOTS_DIR / f"{name}-{w}x{hgt}.png"
            page.screenshot(path=str(shot), full_page=True)
            bl = BASELINE_DIR / shot.name
            if bl.exists():
                same, msg = imgdiff.diff(str(bl), str(shot))
                assert same, f"像素漂移 {shot.name}: {msg}"
            else:
                shutil.copyfile(shot, bl)
                RESULTS["note"].append(f"基线新建 {shot.name}（首跑）")
            checked += 1
    assert checked == len(VIEWPORTS) * len(PIXEL_PAGES), "像素页数不齐"
    page.set_viewport_size({"width": 1280, "height": 720})


CASES = [
    s1_tab_and_map, s1_type_filter, s1_side_filter, s1_search_tokens,
    s1_chips, s1_sets_toggle,
    s2_groups, s2_favs, s2_sets_fold, s2_row_render,
    s3_detail_lightbox, s3_detail_nav,
    s4_editor_write,
    s5_layers, s5_timeline_sort,
    r2a_modes, r2a_badge, r2a_band,
    r2b_set_runbook, r2b_tactic_runbook, r2b_num_keys,
    s6_pixels,
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(ROOT))
    args = ap.parse_args()
    root = Path(args.root).resolve()

    from playwright.sync_api import sync_playwright

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    http.server.SimpleHTTPRequestHandler.log_message = lambda *a, **k: None
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"

    print(f"== R1-A 回归套件 == 载体 {base}")
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        context = browser.new_context()
        context.add_init_script(
            "try { localStorage.clear(); localStorage.setItem('pb-map', 'de_mirage'); } catch(e) {}"
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        for fn in CASES:
            name = fn._case_name
            try:
                fn(page, base)
                RESULTS["pass"].append(name)
                print(f"  [PASS] {name}")
            except Exception as e:  # noqa: BLE001 —— 收齐全部失败继续跑
                RESULTS["fail"].append((name, str(e)))
                print(f"  [FAIL] {name}: {e}")
        browser.close()
    srv.shutdown()

    lines = [f"== R1-A 回归套件 == 载体 {base}",
             f"PASS {len(RESULTS['pass'])} / FAIL {len(RESULTS['fail'])}"]
    lines += [f"  PASS  {n}" for n in RESULTS["pass"]]
    lines += [f"  FAIL  {n}: {m}" for n, m in RESULTS["fail"]]
    lines += [f"  NOTE  {n}" for n in RESULTS["note"]]
    if errors:
        lines += [f"  CONSOLE-ERROR  {e}" for e in errors]
    (OUT_DIR / "report.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    if errors:
        print("存在页面级 console 错误 → 判失败")
        return 1
    return 1 if RESULTS["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
