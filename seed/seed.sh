#!/usr/bin/env bash
set -euo pipefail

if command -v docker compose >/dev/null 2>&1; then
  echo "Seeding via docker compose backend container..."
  docker compose exec -T backend npm run seed:all
  docker compose exec -T backend npm run audit:verify
else
  echo "Docker compose not found. Seeding via local node..."
  (cd backend && npm run seed:all && npm run audit:verify)
fi