# -*- coding: utf-8 -*-
"""helpers.py — R1-A 测试坑位封装（DEV.md 坑清单的代码化）。
真实 playwright 的 evaluate 本就跑在主世界（与 IAB 隔离世界不同），
但 click/press 的坑仍在——统一走主世界 el.click() / KeyboardEvent 派发。"""
import time


def mw_click(page, selector):
    """主世界 el.click()：绕过 locator actionability 偶发永超时（DEV.md 坑 4）。"""
    ok = page.evaluate(
        """(sel) => { const el = document.querySelector(sel);
                       if (!el) return false; el.click(); return true; }""",
        selector,
    )
    if not ok:
        raise AssertionError(f"主世界点击目标不存在: {selector}")
    return True


def mw_click_all(page, selector):
    page.evaluate(
        """(sel) => [...document.querySelectorAll(sel)].forEach(el => el.click())""",
        selector,
    )


def mw_text(page, selector):
    return page.evaluate(
        """(sel) => document.querySelector(sel)?.textContent ?? null""", selector
    )


def mw_all_text(page, selector):
    return page.evaluate(
        """(sel) => [...document.querySelectorAll(sel)].map(e => e.textContent.trim())""",
        selector,
    )


def mw_count(page, selector):
    return page.evaluate(
        """(sel) => document.querySelectorAll(sel).length""", selector
    )


def mw_eval(page, expr, arg=None):
    return page.evaluate(expr, arg)


def el_press(page, selector, key):
    """主世界对元素派发 KeyboardEvent（DEV.md 坑 3：locator.press 不派发按键）。"""
    page.evaluate(
        """([sel, key]) => { const el = document.querySelector(sel);
              if (!el) return false; el.focus();
              el.dispatchEvent(new KeyboardEvent('keydown',
                {key, bubbles: true, cancelable: true}));
              return true; }""",
        [selector, key],
    )


def doc_press(page, key):
    """document 级按键派发（onKey / onNadeKey 等全局监听用）。"""
    page.evaluate(
        """(key) => document.dispatchEvent(new KeyboardEvent('keydown',
              {key, bubbles: true, cancelable: true}))""",
        key,
    )


def assert_toast(page, contains, timeout_ms=3000):
    """toast 断言：#toast（id）且带 .show（DEV.md 坑 6）。"""
    deadline = time.time() + timeout_ms / 1000
    last = None
    while time.time() < deadline:
        last = mw_text(page, "#toast") or ""
        cls = page.evaluate("""() => document.getElementById('toast')?.className ?? ''""")
        if contains in last and "show" in cls:
            return last
        time.sleep(0.1)
    raise AssertionError(f"toast 未出现「{contains}」，当前：{last!r}")


def wait_all_images(page, timeout_ms=8000):
    """等全部图片 complete（截图/断言前必须，避免图片未加载抖动）。"""
    page.wait_for_function(
        """() => [...document.images].every(i => i.complete && i.naturalWidth >= 0)""",
        timeout=timeout_ms,
    )


def wait_boot(page, timeout_ms=10000):
    """等 app 渲染完成：#cards 有内容且 data.js 就绪。"""
    page.wait_for_function(
        """() => window.PLAYBOOK && document.getElementById('cards') && (
               document.getElementById('cards').children.length > 0 ||
               document.getElementById('empty-filter')?.hidden === false)""",
        timeout=timeout_ms,
    )
