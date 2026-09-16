@echo off
if not exist "%~dp0calendar-data.js" copy /Y "%~dp0templates\calendar-data.js" "%~dp0calendar-data.js" >nul
if not exist "%~dp0github-data.js" copy /Y "%~dp0templates\github-data.js" "%~dp0github-data.js" >nul
start "" "%~dp0index.html"
