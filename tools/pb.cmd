@echo off
rem pb.cmd - launcher for pb.py (probe: KB_PYTHON / py -3 / python)
rem NOTE: no chcp here - a parent .bat calling this would lose its parse position
setlocal
set "SCRIPT=%~dp0pb.py"
set "PY="

if defined KB_PYTHON if exist "%KB_PYTHON%" set "PY=%KB_PYTHON%"

if not defined PY (
  py -3 -c "" >nul 2>&1 && set "PY=py -3"
)
if not defined PY (
  python -c "" >nul 2>&1 && set "PY=python"
)

if not defined PY (
  echo [pb] Python not found, need 3.10 or newer. Install:
  echo   winget install Python.Python.3.12  then reopen terminal
  echo or set env KB_PYTHON to your python.exe full path.
  exit /b 1
)

%PY% "%SCRIPT%" %*
exit /b %ERRORLEVEL%
