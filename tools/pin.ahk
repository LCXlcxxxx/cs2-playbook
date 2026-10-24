#Requires AutoHotkey v2.0
#SingleInstance Force
; pin.ahk — 副屏置顶小工具
;   F4：切换鼠标所指窗口的置顶
;   F3：切换鼠标所指窗口的 ~40% 半透明

F4:: {
    MouseGetPos ,,, &hwnd, 2
    if !hwnd
        return
    WinSetAlwaysOnTop(-1, hwnd)   ; -1 = 切换
    top := WinGetAlwaysOnTop(hwnd)
    ToolTip(top ? "已置顶（F4 取消）" : "已取消置顶")
    SetTimer () => ToolTip(), -1200
}

F3:: {
    static on := false
    MouseGetPos ,,, &hwnd, 2
    if !hwnd
        return
    on := !on
    if on
        WinSetTransparent(153, hwnd)   ; 153/255 ≈ 60% 不透明 ≈ 40% 半透明
    else
        WinSetTransparent("Off", hwnd)
    ToolTip(on ? "半透明开（F3 还原）" : "半透明关")
    SetTimer () => ToolTip(), -1200
}
