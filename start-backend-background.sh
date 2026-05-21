#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./start-backend-background.sh"
  echo "Starts the backend server in the background and writes logs to backend/runtime/backend.log."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

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

RUNTIME_DIR="$BACKEND_DIR/runtime"
LOG_FILE="$RUNTIME_DIR/backend.log"
PID_FILE="$RUNTIME_DIR/backend.pid"
ROTATOR_PID_FILE="$RUNTIME_DIR/backend-log-rotator.pid"
HOST="${PM_BACKEND_HOST:-0.0.0.0}"
PORT="${PM_BACKEND_PORT:-8000}"
MAX_LINES=10000
KEEP_LINES=1000

if [[ ! -f "$PYTHON_EXE" ]]; then
  echo "Missing virtual environment Python: $PYTHON_EXE" >&2
  exit 1
fi

mkdir -p "$RUNTIME_DIR"

if [[ -f "$PID_FILE" ]]; then
  existing_pid="$(<"$PID_FILE")"
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "Backend server is already running with PID $existing_pid." >&2
    exit 1
  fi

  rm -f "$PID_FILE"
fi

if [[ -f "$ROTATOR_PID_FILE" ]]; then
  existing_rotator_pid="$(<"$ROTATOR_PID_FILE")"
  if [[ -n "$existing_rotator_pid" ]] && kill -0 "$existing_rotator_pid" 2>/dev/null; then
    kill "$existing_rotator_pid" 2>/dev/null || true
  fi

  rm -f "$ROTATOR_PID_FILE"
fi

touch "$LOG_FILE"

rotate_log() {
  local server_pid="$1"

  while kill -0 "$server_pid" 2>/dev/null; do
    local line_count
    line_count=$(wc -l < "$LOG_FILE")

    if (( line_count > MAX_LINES )); then
      local temp_file
      temp_file="$LOG_FILE.tmp"
      tail -n "$KEEP_LINES" "$LOG_FILE" > "$temp_file"
      mv "$temp_file" "$LOG_FILE"
    fi

    sleep 2
  done

  rm -f "$ROTATOR_PID_FILE"
}

cd "$BACKEND_DIR"
nohup env PYTHONUNBUFFERED=1 "$PYTHON_EXE" -m uvicorn app.main:app --host "$HOST" --port "$PORT" >> "$LOG_FILE" 2>&1 &
server_pid=$!
echo "$server_pid" > "$PID_FILE"

rotate_log "$server_pid" &
rotator_pid=$!
echo "$rotator_pid" > "$ROTATOR_PID_FILE"

echo "Backend server started in the background."
echo "PID: $server_pid"
echo "Address: $HOST:$PORT"
echo "Log: $LOG_FILE"