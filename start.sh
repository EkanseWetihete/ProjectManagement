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
ENV_FILE="$SCRIPT_DIR/.env"
RUNTIME_DIR="$BACKEND_DIR/runtime"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
BACKEND_LOG_FILE="$RUNTIME_DIR/backend.log"
FRONTEND_LOG_FILE="$RUNTIME_DIR/frontend.log"
FRONTEND_NEXT_BIN="$FRONTEND_DIR/node_modules/.bin/next"
BACKEND_HOST="${PM_BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${PM_BACKEND_PORT:-8000}"
FRONTEND_HOST="${PM_FRONTEND_HOST:-0.0.0.0}"
FRONTEND_PORT="${PM_FRONTEND_PORT:-3000}"
BACKEND_VENV_DIR="$BACKEND_DIR/.venv"

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

if [[ "${PM_DEVELOPMENT_MODE:-false}" == "true" && "${PM_ALLOW_DEV_START:-0}" != "1" ]]; then
  echo "start.sh is for production only, but PM_DEVELOPMENT_MODE=true in $ENV_FILE." >&2
  echo "Set PM_DEVELOPMENT_MODE=false before starting the VPS services." >&2
  echo "If you intentionally need this, rerun with PM_ALLOW_DEV_START=1." >&2
  exit 1
fi

BACKEND_HOST="${PM_BACKEND_HOST:-$BACKEND_HOST}"
BACKEND_PORT="${PM_BACKEND_PORT:-$BACKEND_PORT}"
FRONTEND_HOST="${PM_FRONTEND_HOST:-$FRONTEND_HOST}"
FRONTEND_PORT="${PM_FRONTEND_PORT:-$FRONTEND_PORT}"

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

find_system_python() {
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi

  if command -v python >/dev/null 2>&1; then
    command -v python
    return 0
  fi

  return 1
}

ensure_backend_python() {
  if [[ -f "$PYTHON_EXE" ]]; then
    return 0
  fi

  local system_python
  if ! system_python="$(find_system_python)"; then
    echo "Missing Python runtime. Install python3 on the server before running start.sh." >&2
    exit 1
  fi

  echo "Creating backend virtual environment..."
  "$system_python" -m venv "$BACKEND_VENV_DIR"

  if [[ -f "$BACKEND_VENV_DIR/bin/python" ]]; then
    PYTHON_EXE="$BACKEND_VENV_DIR/bin/python"
  elif [[ -f "$BACKEND_VENV_DIR/Scripts/python.exe" ]]; then
    PYTHON_EXE="$BACKEND_VENV_DIR/Scripts/python.exe"
  else
    echo "Failed to create backend virtual environment at $BACKEND_VENV_DIR" >&2
    exit 1
  fi
}

ensure_backend_dependencies() {
  echo "Installing backend requirements..."
  "$PYTHON_EXE" -m pip install --upgrade pip
  "$PYTHON_EXE" -m pip install -r "$BACKEND_DIR/requirements.txt"
}

ensure_frontend_dependencies() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "Missing npm. Install Node.js and npm on the server before running start.sh." >&2
    exit 1
  fi

  echo "Installing frontend packages..."
  cd "$FRONTEND_DIR"
  npm install

  echo "Building frontend..."
  npm run build
}

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

ensure_backend_python
ensure_backend_dependencies
ensure_frontend_dependencies

if [[ ! -x "$FRONTEND_NEXT_BIN" ]]; then
  echo "Unable to find the Next.js runtime at $FRONTEND_NEXT_BIN after npm install." >&2
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
nohup "$FRONTEND_NEXT_BIN" start --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT" >> "$FRONTEND_LOG_FILE" 2>&1 &
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