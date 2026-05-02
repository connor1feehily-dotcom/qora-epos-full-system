#!/usr/bin/env bash
# Build the Qora EPOS desktop installer.
#
# Usage:
#   bash scripts/desktop-build.sh win      # Windows .exe (NSIS) + portable
#   bash scripts/desktop-build.sh linux    # Linux .AppImage
#   bash scripts/desktop-build.sh mac      # macOS .dmg (must run on macOS)
#
# Output: ./release/  (e.g. release/Qora-EPOS-Setup-1.0.0.exe)

set -euo pipefail

TARGET="${1:-win}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building web app + server bundle..."
npm run build

echo "==> Packaging desktop app for: $TARGET"
case "$TARGET" in
  win)   npx electron-builder --win   --projectDir electron ;;
  linux) npx electron-builder --linux --projectDir electron ;;
  mac)   npx electron-builder --mac   --projectDir electron ;;
  *) echo "Unknown target: $TARGET (use win | linux | mac)"; exit 1 ;;
esac

echo ""
echo "==> Done. Installer in: $ROOT/release/"
ls -lh "$ROOT/release/" 2>/dev/null || true
