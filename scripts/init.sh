#!/usr/bin/env bash
# One-shot local bootstrap for the Mashov dashboard.
#
#   bash scripts/init.sh           # full setup
#   bash scripts/init.sh --reseed  # only re-run the seed
#
# What it does:
#   1. Installs workspace deps (skipped if node_modules exists).
#   2. Brings up the MongoDB container via docker compose.
#   3. Copies .env files from .env.example if missing.
#   4. Waits for Mongo to accept connections.
#   5. Runs the seed (clears + repopulates collections).
#
# Assumes Docker Desktop is running. If you already run mongod natively on
# :27017 the docker compose step is a no-op safe to ignore.

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

RESEED_ONLY=0
if [[ "${1:-}" == "--reseed" ]]; then RESEED_ONLY=1; fi

log() { printf "\033[1;34m[init]\033[0m %s\n" "$*"; }
die() { printf "\033[1;31m[init]\033[0m %s\n" "$*" >&2; exit 1; }

ensure_env() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$target" ]]; then
    if [[ -f "$example" ]]; then
      cp "$example" "$target"
      log "created $target from $(basename "$example")"
    else
      die "missing $example — cannot create $target"
    fi
  fi
}

wait_for_mongo() {
  log "waiting for mongo on :27017…"
  for _ in $(seq 1 60); do
    if (echo > /dev/tcp/127.0.0.1/27017) >/dev/null 2>&1; then
      log "mongo is up"
      return 0
    fi
    sleep 1
  done
  die "mongo did not come up within 60s — is Docker running?"
}

if [[ $RESEED_ONLY -eq 0 ]]; then
  if [[ ! -d node_modules ]]; then
    log "installing workspace deps"
    npm install
  else
    log "node_modules present — skipping install"
  fi

  ensure_env "apps/api/.env.example" "apps/api/.env"
  ensure_env "apps/web/.env.example" "apps/web/.env.local"

  if command -v docker >/dev/null 2>&1; then
    log "bringing up mongo via docker compose"
    docker compose up -d mongo
  else
    log "docker not found — assuming mongo is already running on :27017"
  fi

  wait_for_mongo
fi

log "running seed"
npm run seed

log "done. start the dev servers with: npm run dev"
