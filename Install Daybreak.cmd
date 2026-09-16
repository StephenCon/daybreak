@echo off
title Install Daybreak
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo Setup could not finish. The message above explains what happened.
)
pause
