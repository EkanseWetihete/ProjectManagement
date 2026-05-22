#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./start.sh"
  echo "Starts the backend and frontend production servers in the background."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
RUNTIME_DIR="$BACKEND_DIR/runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_LOG_FILE="$RUNTIME_DIR/backend.log"
FRONTEND_LOG_FILE="$RUNTIME_DIR/frontend.log"
BACKEND_HOST="${PM_BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${PM_BACKEND_PORT:-8000}"
FRONTEND_HOST="${PM_FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${PM_FRONTEND_PORT:-3000}"

for candidate in \
  "$BACKEND_DIR/.venv/bin/python" \
  "$BACKEND_DIR/.venv/Scripts/python.exe" \
  "$SCRIPT_DIR/.venv/bin/python" \
  "$SCRIPT_DIR/.venv/Scripts/python.exe"
do
  if [[ -f "$candidate" ]]; then
    PYTHON_EXE="$candidate"
    break
  fi
done

PYTHON_EXE="${PYTHON_EXE:-$BACKEND_DIR/.venv/bin/python}"

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

require_not_running() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    return 0
  fi

  local existing_pid
  existing_pid="$(<"$pid_file")"

  if is_running "$existing_pid"; then
    echo "$name is already running with PID $existing_pid." >&2
    exit 1
  fi

  rm -f "$pid_file"
}

if [[ ! -f "$PYTHON_EXE" ]]; then
  echo "Missing virtual environment Python: $PYTHON_EXE" >&2
  exit 1
fi

if [[ ! -f "$FRONTEND_DIR/.next/BUILD_ID" ]]; then
  echo "Missing frontend production build: $FRONTEND_DIR/.next/BUILD_ID" >&2
  echo "Run 'cd frontend && npm run build' before starting production." >&2
  exit 1
fi

mkdir -p "$RUNTIME_DIR"

require_not_running "Backend server" "$BACKEND_PID_FILE"
require_not_running "Frontend server" "$FRONTEND_PID_FILE"

touch "$BACKEND_LOG_FILE" "$FRONTEND_LOG_FILE"

cd "$BACKEND_DIR"
nohup env PYTHONUNBUFFERED=1 "$PYTHON_EXE" -m uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" >> "$BACKEND_LOG_FILE" 2>&1 &
backend_pid=$!
echo "$backend_pid" > "$BACKEND_PID_FILE"

cd "$FRONTEND_DIR"
nohup npm run start -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT" >> "$FRONTEND_LOG_FILE" 2>&1 &
frontend_pid=$!
echo "$frontend_pid" > "$FRONTEND_PID_FILE"

echo "Backend started in the background."
echo "PID: $backend_pid"
echo "Address: $BACKEND_HOST:$BACKEND_PORT"
echo "Log: $BACKEND_LOG_FILE"
echo
echo "Frontend started in the background."
echo "PID: $frontend_pid"
echo "Address: $FRONTEND_HOST:$FRONTEND_PORT"
echo "Log: $FRONTEND_LOG_FILE"