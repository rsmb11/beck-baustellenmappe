#!/bin/bash
set -e
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIST="/var/www/beck-baustellenmappe"

echo "🔄 Update wird gestartet..."
cd "$REPO_DIR"
git pull

echo "⚛️  Frontend neu bauen..."
cd "$REPO_DIR/frontend"
npm install --silent
npm run build
cp -r dist/* "$FRONTEND_DIST/"

echo "🐳 Backend neu starten..."
cd "$REPO_DIR"
docker compose -f docker/docker-compose.vps.yml --env-file backend/.env up -d --build

echo "✅ Update abgeschlossen!"
