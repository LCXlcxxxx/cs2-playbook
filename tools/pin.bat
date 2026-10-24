@echo off
rem pin.bat — 启动置顶脚本（需要 AutoHotkey v2）
setlocal
set "AHK="

for %%P in (
  "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
  "C:\Program Files\AutoHotkey\v2\AutoHotkey32.exe"
  "C:\Program Files\AutoHotkey\AutoHotkey.exe"
  "%LocalAppData%\Programs\AutoHotkey\v2\AutoHotkey64.exe"
  "%LocalAppData%\Programs\AutoHotkey\v2\AutoHotkey32.exe"
) do if not defined AHK if exist %%P set "AHK=%%~P"

if not defined AHK (
  where AutoHotkey64.exe >nul 2>&1 && set "AHK=AutoHotkey64.exe"
)
if not defined AHK (
  where AutoHotkey.exe >nul 2>&1 && set "AHK=AutoHotkey.exe"
)

if not defined AHK (
  echo [pin] 未检测到 AutoHotkey v2。请先安装：
  echo     winget install AutoHotkey.AutoHotkey
  echo 装好后重新双击本文件即可。
  pause
  exit /b 1
)

start "" "%AHK%" "%~dp0pin.ahk"
echo [pin] 已启动：进游戏前点一下查看器窗口，再按 F4 置顶 / F3 半透明。
