#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./stop-backend-background.sh"
  echo "Stops the backend server started by ./start-backend-background.sh."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$SCRIPT_DIR/backend/runtime"
PID_FILE="$RUNTIME_DIR/backend.pid"
ROTATOR_PID_FILE="$RUNTIME_DIR/backend-log-rotator.pid"

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

if [[ -f "$ROTATOR_PID_FILE" ]]; then
  rotator_pid="$(<"$ROTATOR_PID_FILE")"
  stop_pid "$rotator_pid"
  rm -f "$ROTATOR_PID_FILE"
fi

if [[ ! -f "$PID_FILE" ]]; then
  echo "Backend server is not running."
  exit 0
fi

server_pid="$(<"$PID_FILE")"
stop_pid "$server_pid"
rm -f "$PID_FILE"

echo "Backend server stopped."