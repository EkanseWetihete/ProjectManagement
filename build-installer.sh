#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: ./build-installer.sh"
  echo "Builds the Windows installer and copies updater files into backend/updates/win."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
UPDATES_DIR="$SCRIPT_DIR/backend/updates/win"

cd "$FRONTEND_DIR"
npm run dist:win

mkdir -p "$UPDATES_DIR"
cp -f dist/latest.yml "$UPDATES_DIR/latest.yml"
cp -f dist/*.exe "$UPDATES_DIR/"
cp -f dist/*.exe.blockmap "$UPDATES_DIR/"

echo "Installer and updater files copied to $UPDATES_DIR"