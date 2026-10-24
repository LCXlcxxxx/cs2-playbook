@echo off
rem 使用者唯一入口：网页里改完内容，双击我一次 = 同步数据 + 刷新发布包
cd /d %~dp0
echo ============================================
echo   CS2 Playbook 同步并打包
echo ============================================
echo.
echo [1/2] 把项目数据刷新进页面与发布包...
call tools\pb.cmd build
if errorlevel 1 goto fail
echo.
echo [2/2] 生成发布包 dist\cs2-playbook-日期.zip ...
call tools\pb.cmd pack
if errorlevel 1 goto fail
echo.
echo 同步完成，发布包已更新！可以把 dist 里最新的 zip 发给朋友了。
echo （按任意键关闭本窗口）
pause >nul
exit /b 0

:fail
echo.
echo 出错了！请把本窗口截图发到群里求助。
pause
exit /b 1
