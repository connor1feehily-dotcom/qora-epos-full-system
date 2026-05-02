#!/usr/bin/env bash
# Build the Qora EPOS Back Office Android app (.apk).
#
# Usage:
#   QORA_SERVER_URL="https://your-deployed-qora.replit.app" bash scripts/mobile-build.sh
#
# Requirements (one-time setup on the build machine):
#   - Java JDK 17+
#   - Android Studio (or Android command-line tools + ANDROID_HOME env var)
#
# Output: android/app/build/outputs/apk/debug/app-debug.apk

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -z "${QORA_SERVER_URL:-}" ]; then
  echo "WARNING: QORA_SERVER_URL is not set."
  echo "The mobile app needs a server URL to talk to (e.g. your deployed Qora URL)."
  echo "Re-run with:  QORA_SERVER_URL=\"https://...\" bash $0"
  echo ""
  read -p "Continue with no server URL (offline-only shell)? [y/N] " ok
  [ "$ok" = "y" ] || exit 1
fi

echo "==> Building web app..."
npm run build

if [ ! -d "android" ]; then
  echo "==> First run — adding Android platform via Capacitor..."
  npx cap add android
fi

echo "==> Syncing web build into Android project..."
npx cap sync android

echo "==> Building APK with Gradle..."
cd android
./gradlew assembleDebug

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  echo ""
  echo "==> Done. APK: $APK"
  ls -lh "$APK"
  echo ""
  echo "Install on a phone via USB:  adb install -r \"$APK\""
  echo "Or sideload by copying the .apk file to the phone and tapping it."
else
  echo "Build finished but APK not found at expected path. Check Gradle output above."
  exit 1
fi
