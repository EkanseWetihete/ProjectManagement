@echo off
setlocal

if /I "%~1"=="--help" (
  echo Usage: %~nx0
  echo Starts the backend in a new window and the frontend web app in this window.
  exit /b 0
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "PYTHON_EXE=%ROOT_DIR%.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  echo Missing virtual environment Python: "%PYTHON_EXE%"
  exit /b 1
)

start "Project Management Backend" /D "%BACKEND_DIR%" cmd /k ""%PYTHON_EXE%" -m uvicorn app.main:app --reload"

cd /d "%FRONTEND_DIR%"
call npm run dev