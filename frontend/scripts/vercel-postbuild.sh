#!/bin/bash
set -e

if [ -f .vercel/output/config.json ]; then
  echo "[postbuild] .vercel/output already present, skipping"
  exit 0
fi

if [ -f dist/config.json ]; then
  echo "[postbuild] Restructuring dist into .vercel/output"
  mkdir -p .vercel/output/static .vercel/output/functions/__server.func
  cp -a dist/client/. .vercel/output/static/
  cp -a dist/server/. .vercel/output/functions/__server.func/
  cp dist/config.json .vercel/output/config.json
  exit 0
fi

echo "[postbuild] WARNING: neither .vercel/output nor dist/config.json found"
echo "[postbuild] dist contents:"
ls -la dist 2>/dev/null
echo "[postbuild] .vercel contents:"
ls -laR .vercel 2>/dev/null
exit 0
