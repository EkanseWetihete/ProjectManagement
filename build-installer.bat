@echo off
setlocal

if /I "%~1"=="--help" (
  echo Usage: %~nx0
  echo Builds the Windows installer and copies updater files into backend\updates\win.
  exit /b 0
)

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "UPDATES_DIR=%ROOT_DIR%backend\updates\win"

cd /d "%FRONTEND_DIR%"
call npm run dist:win
if errorlevel 1 exit /b %errorlevel%

if not exist "%UPDATES_DIR%" mkdir "%UPDATES_DIR%"

copy /y "dist\latest.yml" "%UPDATES_DIR%\latest.yml" >nul
if errorlevel 1 exit /b %errorlevel%

copy /y "dist\*.exe" "%UPDATES_DIR%\" >nul
if errorlevel 1 exit /b %errorlevel%

copy /y "dist\*.exe.blockmap" "%UPDATES_DIR%\" >nul
if errorlevel 1 exit /b %errorlevel%

echo Installer and updater files copied to "%UPDATES_DIR%"