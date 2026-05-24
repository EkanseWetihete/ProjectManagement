#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./stop.sh"
  echo "Stops the backend and frontend production servers started by ./start.sh."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
RUNTIME_DIR="$SCRIPT_DIR/backend/runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_PORT="${PM_BACKEND_PORT:-8000}"
FRONTEND_PORT="${PM_FRONTEND_PORT:-3000}"

load_env_file() {
  local env_file="$1"

  if [[ ! -f "$env_file" ]]; then
    return 0
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"

    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    if [[ "$line" != *=* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      export "$key=$value"
    fi
  done < "$env_file"
}

load_env_file "$ENV_FILE"

BACKEND_PORT="${PM_BACKEND_PORT:-$BACKEND_PORT}"
FRONTEND_PORT="${PM_FRONTEND_PORT:-$FRONTEND_PORT}"

child_pids() {
  local pid="$1"
  ps -o pid= --ppid "$pid" 2>/dev/null | awk '{$1=$1; print}'
}

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

stop_pid_tree() {
  local pid="$1"
  local child_pid

  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  while IFS= read -r child_pid; do
    if [[ -n "$child_pid" ]]; then
      stop_pid_tree "$child_pid"
    fi
  done < <(child_pids "$pid")

  stop_pid "$pid"
}

listener_pids() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "( sport = :$port )" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u
    return 0
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null | sort -u
  fi
}

stop_service() {
  local name="$1"
  local pid_file="$2"
  local port="$3"
  local stopped=0

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(<"$pid_file")"
    stop_pid_tree "$pid"
    rm -f "$pid_file"
    stopped=1
  fi

  local listener_pid
  while IFS= read -r listener_pid; do
    if [[ -n "$listener_pid" ]]; then
      stop_pid_tree "$listener_pid"
      stopped=1
    fi
  done < <(listener_pids "$port")

  if [[ "$stopped" -eq 1 ]]; then
    echo "$name stopped."
    return 0
  fi

  echo "$name is not running."
}

stop_service "Frontend server" "$FRONTEND_PID_FILE" "$FRONTEND_PORT"
stop_service "Backend server" "$BACKEND_PID_FILE" "$BACKEND_PORT"