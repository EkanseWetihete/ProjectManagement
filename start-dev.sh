#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./start-dev.sh"
  echo "Starts the backend in the background and the frontend web app in the current shell."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

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

if [[ ! -f "$PYTHON_EXE" ]]; then
  echo "Missing virtual environment Python: $PYTHON_EXE" >&2
  exit 1
fi

cleanup() {
  if [[ -n "${backend_pid:-}" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid"
  fi
}

trap cleanup EXIT INT TERM

cd "$BACKEND_DIR"
"$PYTHON_EXE" -m uvicorn app.main:app --reload &
backend_pid=$!

cd "$FRONTEND_DIR"
npm run dev