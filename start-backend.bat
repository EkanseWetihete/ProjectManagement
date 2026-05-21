@echo off
setlocal

if /I "%~1"=="--help" (
  echo Usage: %~nx0
  echo Starts only the backend server from the repo root.
  exit /b 0
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "PYTHON_EXE=%ROOT_DIR%.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  echo Missing virtual environment Python: "%PYTHON_EXE%"
  exit /b 1
)

cd /d "%BACKEND_DIR%"
"%PYTHON_EXE%" -m uvicorn app.main:app --reload