@echo off
if not exist "%~dp0calendar-data.js" copy /Y "%~dp0templates\calendar-data.js" "%~dp0calendar-data.js" >nul
if not exist "%~dp0github-data.js" copy /Y "%~dp0templates\github-data.js" "%~dp0github-data.js" >nul
set "DAYBREAK_SCRIPT=%~dp0calendar-helper.py"
powershell.exe -NoProfile -Command "$python = Get-Command py.exe -ErrorAction SilentlyContinue; $argsList = @('-3'); if (-not $python) { $python = Get-Command python.exe -ErrorAction SilentlyContinue; $argsList = @() }; if (-not $python) { Write-Host 'Install Python 3, then run this launcher again.'; exit 1 }; $argsList += ([char]34 + $env:DAYBREAK_SCRIPT + [char]34); Start-Process -FilePath $python.Source -ArgumentList $argsList -WindowStyle Hidden"
if errorlevel 1 pause
