#!/usr/bin/env bash
# Inserts the mock data (איילה + ישי יוסף) into MongoDB.
#
# What it does:
#   1. Connects to MONGO_URL (default mongodb://localhost:27017/mashov).
#   2. Clears: kids, homework, scheduleSlots, grades, behaviorEvents,
#      messages, notifications.
#   3. Repopulates them from apps/api/src/seed/data.ts.
#
# Usage:
#   bash scripts/seed.sh                                 # local mongo
#   MONGO_URL=mongodb://host:port/db bash scripts/seed.sh
#   railway run --service=api bash scripts/seed.sh      # on Railway

set -euo pipefail

cd "$(dirname "$0")/.."

echo "[seed] target: ${MONGO_URL:-mongodb://localhost:27017/mashov}"
npm run -w @mashov/api seed
