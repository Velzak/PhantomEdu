#!/bin/sh
set -e
mkdir -p /data/games /data/uploads/thumbnails
npx prisma migrate deploy
if [ "${RUN_SEED:-true}" = "true" ]; then
  npx tsx prisma/seed.ts || true
fi
exec node server.js
