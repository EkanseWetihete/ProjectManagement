@echo off
setlocal EnableDelayedExpansion

if /I "%~1"=="--help" (
  echo Usage: %~nx0
  echo Fetches and fast-forward pulls the current branch from origin, then starts the backend server.
  echo Requires the project root to be a git repository with a clean working tree.
  exit /b 0
)

set "ROOT_DIR=%~dp0"

git -C "%ROOT_DIR%" rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 (
  echo Project root is not a git repository: "%ROOT_DIR%"
  echo Initialize git at the project root or run this on the server checkout that contains both backend and frontend.
  exit /b 1
)

for /f "usebackq delims=" %%i in (`git -C "%ROOT_DIR%" branch --show-current`) do set "BRANCH=%%i"
if not defined BRANCH (
  echo Unable to determine the current git branch.
  exit /b 1
)

for /f "usebackq delims=" %%i in (`git -C "%ROOT_DIR%" status --porcelain`) do set "GIT_STATUS=%%i"
if defined GIT_STATUS (
  echo Refusing to pull because the working tree has uncommitted changes.
  exit /b 1
)

git -C "%ROOT_DIR%" fetch origin "%BRANCH%"
if errorlevel 1 exit /b %errorlevel%

git -C "%ROOT_DIR%" pull --ff-only origin "%BRANCH%"
if errorlevel 1 exit /b %errorlevel%

call "%ROOT_DIR%start-backend.bat"