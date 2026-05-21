#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./update-and-start-backend.sh"
  echo "Fetches and fast-forward pulls the current branch from origin, then starts the backend server."
  echo "Requires the project root to be a git repository with a clean working tree."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! git -C "$SCRIPT_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Project root is not a git repository: $SCRIPT_DIR" >&2
  echo "Initialize git at the project root or run this on the server checkout that contains both backend and frontend." >&2
  exit 1
fi

branch="$(git -C "$SCRIPT_DIR" branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "Unable to determine the current git branch." >&2
  exit 1
fi

if [[ -n "$(git -C "$SCRIPT_DIR" status --porcelain)" ]]; then
  echo "Refusing to pull because the working tree has uncommitted changes." >&2
  exit 1
fi

git -C "$SCRIPT_DIR" fetch origin "$branch"
git -C "$SCRIPT_DIR" pull --ff-only origin "$branch"

exec "$SCRIPT_DIR/start-backend.sh"