#!/usr/bin/env bash
# Run Qora EPOS as an Electron desktop window in development mode.
# The web/server runs via the existing dev workflow; Electron loads
# http://localhost:5000 once it is responding.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npx concurrently -k -n web,electron -c blue,green \
  "npm run dev" \
  "npx wait-on http://127.0.0.1:5000 && cd electron && npm run dev"
