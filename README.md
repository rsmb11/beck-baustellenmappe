# Beck Sanitär – Digitale Baustellenmappe

Lokale Projektverwaltung für den SHK-Betrieb. Projektverwaltung, Dateiablage, Fotodokumentation und KI-gestützte Langzeitberichte.

---

## Schnellstart (VPS / Testumgebung)

```bash
git clone https://github.com/DEIN-REPO/beck-baustellenmappe.git
cd beck-baustellenmappe
sudo bash scripts/install.sh
```

Das Script prüft Abhängigkeiten, kopiert die `.env.example`, baut Frontend und Backend und richtet Nginx + SSL ein.

**Nach dem ersten Start:**
1. `.env` anpassen: `nano backend/.env`
2. Nochmals ausführen: `sudo bash scripts/install.sh`
3. Im Browser öffnen: `https://baustelle.sebma.ipv64.de`

**Login:** `admin@becksanitaer.de` / `beck2026` → **sofort ändern!**

---

## Auf Synology übertragen

```bash
# Auf dem Synology:
git clone https://github.com/DEIN-REPO/beck-baustellenmappe.git /opt/beck-baustellenmappe
cd /opt/beck-baustellenmappe
cp backend/.env.example backend/.env
nano backend/.env   # Synology-Pfade anpassen

# Synology Shared Folder anlegen: /volume1/baustellenmappe/
mkdir -p /volume1/baustellenmappe/{uploads,db}

docker-compose -f docker/docker-compose.synology.yml up -d --build
```

→ Erreichbar unter `http://NAS-IP:3004` (oder über Nginx Reverse Proxy in DSM)

---

## Updates einspielen

```bash
sudo bash scripts/update.sh
```

---

## Struktur

```
beck-baustellenmappe/
├── backend/            Node.js API-Server
│   ├── src/
│   │   ├── routes/     auth, projects, entries, files, reports
│   │   ├── middleware/ JWT-Auth
│   │   ├── db/         PostgreSQL-Pool
│   │   └── index.js    Einstiegspunkt
│   ├── .env.example    Konfigurationsvorlage
│   └── Dockerfile
├── frontend/           React Web-App (Tablets)
├── database/
│   └── schema.sql      PostgreSQL-Tabellen
├── docker/
│   ├── docker-compose.vps.yml       Testumgebung
│   └── docker-compose.synology.yml  Produktion NAS
├── nginx/
│   └── beck-baustellenmappe.conf
└── scripts/
    ├── install.sh
    └── update.sh
```

---

## API-Übersicht

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| POST | `/api/auth/login` | Anmelden |
| GET  | `/api/auth/me` | Aktueller Benutzer |
| GET  | `/api/projects` | Alle Projekte |
| POST | `/api/projects` | Neues Projekt |
| GET  | `/api/projects/:id` | Projektdetail |
| PUT  | `/api/projects/:id` | Projekt bearbeiten |
| GET  | `/api/projects/:id/entries` | Bautagebuch |
| POST | `/api/projects/:id/entries` | Neuer Eintrag |
| GET  | `/api/projects/:id/files` | Dateien |
| POST | `/api/projects/:id/files` | Datei(en) hochladen |
| GET  | `/api/projects/:id/files/:fid/download` | Herunterladen |
| POST | `/api/projects/:id/reports` | KI-Bericht erstellen |
| GET  | `/api/projects/:id/reports` | Gespeicherte Berichte |

---

## Konfiguration (.env)

| Variable | Beschreibung |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL-Passwort |
| `JWT_SECRET` | Zufälliger String ≥32 Zeichen |
| `UPLOAD_PATH` | Datei-Speicherpfad |
| `ANTHROPIC_API_KEY` | Claude API-Key (optional) |
| `CORS_ORIGIN` | Erlaubte Frontend-Domain |

---

## Port-Belegung (VPS)

| Port | Dienst |
|------|--------|
| 3004 | Backend API (intern, nur über nginx) |
| 5432 | PostgreSQL (nur intern im Docker-Netz) |
| 443  | Nginx HTTPS → baustelle.sebma.ipv64.de |

---

## Technologien

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Datenbank:** PostgreSQL 16
- **Dateien:** Multer, lokales Dateisystem
- **Auth:** JWT (7 Tage gültig)
- **KI:** Anthropic Claude API (optional)
- **Deployment:** Docker Compose, Nginx
