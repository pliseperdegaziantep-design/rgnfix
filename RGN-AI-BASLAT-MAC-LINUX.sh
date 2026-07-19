#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
  cp ".env.example" ".env"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js yüklü değil."
  echo "Önce Node.js LTS kurun: https://nodejs.org/"
  exit 1
fi

echo "RGN AI hazırlanıyor..."
echo "İlk açılışta bağımlılıklar indirileceği için internet gerekir."

corepack enable
corepack prepare pnpm@10.4.1 --activate

if [ ! -d "node_modules" ]; then
  pnpm install
fi

echo "Uygulama açılıyor: http://localhost:3000"
if command -v open >/dev/null 2>&1; then
  open "http://localhost:3000" || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3000" || true
fi

export NODE_ENV=development
pnpm exec tsx watch server/_core/index.ts
