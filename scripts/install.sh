#!/bin/bash
# ============================================================
# Beck Baustellenmappe – Installations-Script (VPS)
# Nutzung: sudo bash scripts/install.sh
# ============================================================
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="baustelle.sebma.ipv64.de"
FRONTEND_DIST="/var/www/beck-baustellenmappe"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Beck Baustellenmappe – Installation    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# --- Prüfungen ---
command -v docker        >/dev/null 2>&1 || { echo "❌ Docker nicht gefunden. Bitte zuerst installieren."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ docker-compose nicht gefunden."; exit 1; }
command -v node          >/dev/null 2>&1 || { echo "❌ Node.js nicht gefunden (für Frontend-Build)."; exit 1; }

# --- .env prüfen ---
if [ ! -f "$REPO_DIR/backend/.env" ]; then
    echo "📋 Keine .env gefunden – Vorlage wird kopiert..."
    cp "$REPO_DIR/backend/.env.example" "$REPO_DIR/backend/.env"
    echo ""
    echo "⚠️  Bitte jetzt die .env anpassen:"
    echo "   nano $REPO_DIR/backend/.env"
    echo ""
    echo "   Danach: sudo bash scripts/install.sh"
    exit 0
fi

# .env laden
export $(grep -v '^#' "$REPO_DIR/backend/.env" | xargs)

# --- Backend-Container starten ---
echo "🐳 Docker-Container starten..."
cd "$REPO_DIR"
docker compose -f docker/docker-compose.vps.yml up -d --build
echo "✅ Backend und Datenbank gestartet"

# --- Frontend bauen ---
echo ""
echo "⚛️  Frontend wird gebaut..."
cd "$REPO_DIR/frontend"
npm ci
npm run build
mkdir -p "$FRONTEND_DIST"
cp -r dist/* "$FRONTEND_DIST/"
echo "✅ Frontend deployed nach $FRONTEND_DIST"

# --- Nginx ---
echo ""
echo "🌐 Nginx konfigurieren..."
cp "$REPO_DIR/nginx/beck-baustellenmappe.conf" /etc/nginx/sites-available/beck-baustellenmappe
if [ ! -f /etc/nginx/sites-enabled/beck-baustellenmappe ]; then
    ln -s /etc/nginx/sites-available/beck-baustellenmappe /etc/nginx/sites-enabled/
fi

# SSL-Zertifikat holen (wenn noch nicht vorhanden)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "🔒 SSL-Zertifikat wird beantragt..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@becksanitaer.de
fi

nginx -t && systemctl reload nginx
echo "✅ Nginx konfiguriert und neu geladen"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Installation abgeschlossen!           ║"
echo "║                                          ║"
echo "║  🌐 https://$DOMAIN   ║"
echo "║  🔑 admin@becksanitaer.de / beck2026     ║"
echo "║     (Passwort sofort ändern!)             ║"
echo "╚══════════════════════════════════════════╝"
