#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./start-backend.sh"
  echo "Starts only the backend server from the repo root."
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

if [[ ! -f "$PYTHON_EXE" ]]; then
  echo "Missing virtual environment Python: $PYTHON_EXE" >&2
  exit 1
fi

cd "$BACKEND_DIR"
exec "$PYTHON_EXE" -m uvicorn app.main:app --reload