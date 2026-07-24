#!/usr/bin/env bash
set -Eeuo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; cd "$project_dir"
[ -f .env ] || { echo 'Missing .env; copy .env.example and supply real secrets.' >&2; exit 1; }; set -a; . ./.env; set +a
[ "${#JWT_SECRET}" -ge 32 ] || { echo 'JWT_SECRET must contain at least 32 characters.' >&2; exit 1; }
for d in node_modules client/node_modules; do [ -d "$d" ] || { echo "Missing $d; prepare dependencies per OPERATIONS.md." >&2; exit 1; }; done
for port in "${SERVER_PORT:-3001}" "${CLIENT_PORT:-5173}"; do if lsof -ti ":$port" >/dev/null 2>&1; then echo "Port $port is occupied; refusing to terminate another process." >&2; exit 1; fi; done
pids=(); cleanup(){ for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }; trap cleanup EXIT INT TERM
npm run server & pids+=("$!"); (cd client && API_PROXY_TARGET="http://127.0.0.1:${SERVER_PORT:-3001}" npm run dev -- --host 127.0.0.1 --port "${CLIENT_PORT:-5173}" --strictPort) & pids+=("$!"); wait
