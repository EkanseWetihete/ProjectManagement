@echo off
setlocal EnableDelayedExpansion

if /I "%~1"=="--help" (
  echo Usage: %~nx0
  echo Stops the local backend and frontend dev servers by freeing their ports.
  exit /b 0
)

set "ROOT_DIR=%~dp0"
set "ENV_FILE=%ROOT_DIR%.env"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

if exist "%ENV_FILE%" (
  for /f "usebackq tokens=1,2 delims=|" %%A in (`powershell -NoProfile -Command "$envFile = [System.IO.Path]::GetFullPath('%ENV_FILE%'); $backendPort = 8000; $frontendPort = 3000; foreach ($line in Get-Content $envFile) { if ($line -match '^PM_BACKEND_URL_DEV=(.+)$') { try { $uri = [uri]$Matches[1]; if ($uri.Port -gt 0) { $backendPort = $uri.Port } } catch {} } elseif ($line -match '^PM_FRONTEND_PORT=(\d+)$') { $frontendPort = [int]$Matches[1] } }; Write-Output ($backendPort.ToString() + '|' + $frontendPort.ToString())"`) do (
    set "BACKEND_PORT=%%A"
    set "FRONTEND_PORT=%%B"
  )
)

call :stop_port %BACKEND_PORT% backend
call :stop_port %FRONTEND_PORT% frontend
exit /b 0

:stop_port
set "TARGET_PORT=%~1"
set "LABEL=%~2"
set "FOUND_PID="

for /f "delims=0123456789" %%A in ("%TARGET_PORT%") do (
  echo Invalid %LABEL% port: %TARGET_PORT%.
  exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "$connections = Get-NetTCPConnection -LocalPort %TARGET_PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($pid in $connections) { Write-Output $pid }" 2^>nul`) do (
  set "FOUND_PID=1"
  echo Stopping %LABEL% listener on port %TARGET_PORT% ^(PID %%A^)...
  taskkill /PID %%A /T /F >nul 2>&1
  if errorlevel 1 (
    echo Failed to stop PID %%A on port %TARGET_PORT%.
  ) else (
    echo Stopped PID %%A on port %TARGET_PORT%.
  )
)

if not defined FOUND_PID (
  echo No %LABEL% listener found on port %TARGET_PORT%.
)

exit /b 0