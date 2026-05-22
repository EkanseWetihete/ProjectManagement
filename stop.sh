#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./stop.sh"
  echo "Stops the backend and frontend production servers started by ./start.sh."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/backend/runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"

stop_pid() {
  local pid="$1"

  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  kill "$pid" 2>/dev/null || true

  for _ in {1..10}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return 0
    fi

    sleep 1
  done

  kill -9 "$pid" 2>/dev/null || true
}

stop_service() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name is not running."
    return 0
  fi

  local pid
  pid="$(<"$pid_file")"
  stop_pid "$pid"
  rm -f "$pid_file"
  echo "$name stopped."
}

stop_service "Frontend server" "$FRONTEND_PID_FILE"
stop_service "Backend server" "$BACKEND_PID_FILE"