-- ============================================================
-- Beck Sanitär – Baustellenmappe Datenbankschema
-- PostgreSQL
-- ============================================================

-- Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BENUTZER
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,       -- bcrypt hash
    role        VARCHAR(20) NOT NULL DEFAULT 'monteur', -- 'admin' | 'monteur'
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KUNDEN
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    address     TEXT,
    city        VARCHAR(100),
    zip         VARCHAR(10),
    phone       VARCHAR(50),
    email       VARCHAR(150),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJEKTE / BAUSTELLEN
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    address         TEXT,
    city            VARCHAR(100),
    zip             VARCHAR(10),
    project_type    VARCHAR(50),             -- 'heizung' | 'sanitaer' | 'klima' | 'wartung' | 'sonstiges'
    status          VARCHAR(20) NOT NULL DEFAULT 'geplant', -- 'geplant' | 'aktiv' | 'abgeschlossen' | 'pausiert'
    start_date      DATE,
    end_date        DATE,
    notes           TEXT,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projekt ↔ Monteur Zuweisung
CREATE TABLE IF NOT EXISTS project_members (
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- ============================================================
-- DOKUMENTATION / BAUTAGEBUCH
-- ============================================================
CREATE TABLE IF NOT EXISTS entries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATEIEN (Fotos, PDFs, Dokumente)
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entry_id        UUID REFERENCES entries(id) ON DELETE SET NULL,  -- optional: an Eintrag hängen
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,       -- UUID-Dateiname auf Disk
    file_path       TEXT NOT NULL,               -- relativer Pfad im Upload-Verzeichnis
    mime_type       VARCHAR(100),
    file_size       BIGINT,                      -- Bytes
    file_type       VARCHAR(20),                 -- 'foto' | 'pdf' | 'dokument' | 'protokoll' | 'sonstiges'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KI-BERICHTE (gespeicherte Zusammenfassungen)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type     VARCHAR(50) NOT NULL,        -- 'abnahme' | 'gewaehrleistung' | 'wartung'
    content         TEXT NOT NULL,               -- generierter Berichtstext
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDIZES für Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer   ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_entries_project     ON entries(project_id);
CREATE INDEX IF NOT EXISTS idx_entries_date        ON entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_files_project       ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_entry         ON files(entry_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_project  ON ai_reports(project_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEMO-DATEN (für Testumgebung)
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
-- Passwort: "beck2026" (bcrypt, in Produktion ändern!)
('Admin Beck', 'admin@becksanitaer.de', '$2b$10$rOVxhpJv1O1yMfUeNGqnhOFqM3Q3Jz8yR5kL2mN4pW6xS9dH8cKqK', 'admin'),
('Thomas Maier', 'maier@becksanitaer.de', '$2b$10$rOVxhpJv1O1yMfUeNGqnhOFqM3Q3Jz8yR5kL2mN4pW6xS9dH8cKqK', 'monteur'),
('Klaus Schmidt', 'schmidt@becksanitaer.de', '$2b$10$rOVxhpJv1O1yMfUeNGqnhOFqM3Q3Jz8yR5kL2mN4pW6xS9dH8cKqK', 'monteur')
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, address, city, zip, phone) VALUES
('Familie Müller', 'Gartenstr. 12', 'Heilbronn', '74072', '07131 123456'),
('Familie Wagner', 'Kirchstr. 4', 'Neckarsulm', '74172', '07132 654321'),
('Keller GmbH', 'Industriestr. 8', 'Heilbronn', '74076', '07131 999000')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GRUPPEN
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- ============================================================
-- ORDNER
-- ============================================================
CREATE TABLE IF NOT EXISTS folders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, parent_id, name)
);

-- ============================================================
-- ORDNER-BERECHTIGUNGEN
-- ============================================================
CREATE TABLE IF NOT EXISTS folder_permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id   UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    can_write   BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(folder_id, group_id)
);

-- ============================================================
-- ORDNER-VORLAGEN
-- ============================================================
CREATE TABLE IF NOT EXISTS folder_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS folder_template_permissions (
    template_id UUID REFERENCES folder_templates(id) ON DELETE CASCADE,
    group_name  VARCHAR(100) NOT NULL,
    can_write   BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (template_id, group_name)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_folders_project    ON folders(project_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent     ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folder_perms       ON folder_permissions(folder_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ============================================================
-- ALTER files: folder_id hinzufügen
-- ============================================================
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);

-- ============================================================
-- STANDARD-GRUPPEN
-- ============================================================
INSERT INTO groups (name, description) VALUES
('Admin',   'Administratoren – Vollzugriff'),
('Büro',    'Büromitarbeiter – inkl. Angebote und Rechnungen'),
('Monteur', 'Monteure – Fotos, Protokolle, Pläne')
ON CONFLICT DO NOTHING;

-- Admin-User in Admin-Gruppe
INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id FROM groups g, users u
WHERE g.name = 'Admin' AND u.role = 'admin'
ON CONFLICT DO NOTHING;

-- ============================================================
-- STANDARD-ORDNER-VORLAGEN
-- ============================================================
INSERT INTO folder_templates (name, sort_order) VALUES
('Fotos Vorher',        1),
('Fotos Nachher',       2),
('Messprotokolle',      3),
('Pläne & Zeichnungen', 4),
('Angebote',            5),
('Rechnungen',          6),
('Sonstiges',           7)
ON CONFLICT DO NOTHING;

-- Berechtigungen: Alle Gruppen sehen allgemeine Ordner
INSERT INTO folder_template_permissions (template_id, group_name, can_write)
SELECT t.id, g, true FROM folder_templates t, (VALUES ('Admin'),('Büro'),('Monteur')) AS grps(g)
WHERE t.name IN ('Fotos Vorher','Fotos Nachher','Messprotokolle','Pläne & Zeichnungen','Sonstiges')
ON CONFLICT DO NOTHING;

-- Angebote + Rechnungen: nur Admin + Büro
INSERT INTO folder_template_permissions (template_id, group_name, can_write)
SELECT t.id, g, true FROM folder_templates t, (VALUES ('Admin'),('Büro')) AS grps(g)
WHERE t.name IN ('Angebote','Rechnungen')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASSWORT-DATENBANK (Hersteller-Standardcodes)
-- ============================================================
CREATE TABLE IF NOT EXISTS access_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer VARCHAR(100) NOT NULL,  -- Hersteller z.B. "Viessmann"
    device       VARCHAR(150),           -- Gerät/Serie z.B. "Vitodens 200"
    menu_level   VARCHAR(150),           -- Menü-Ebene z.B. "Servicemenü"
    code         VARCHAR(100) NOT NULL,  -- Der Code/Passwort
    hint         TEXT,                   -- Hinweis z.B. "langer Druck auf OK"
    tags         TEXT,                   -- Komma-getrennte Tags z.B. "heizung,gas"
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_codes_manufacturer ON access_codes(manufacturer);

-- Demo-Einträge
INSERT INTO access_codes (manufacturer, device, menu_level, code, hint) VALUES
('Viessmann', 'Vitodens 200-W', 'Servicemenü', '1234', 'OK-Taste lang drücken bis Menü erscheint'),
('Viessmann', 'Vitodens 100-W', 'Servicemenü', '1234', 'Gleichzeitig OK + Abbrechen 3 Sek.'),
('Buderus', 'GB172', 'Fachmannebene', '1993', 'Über Menü → Einstellungen → Fachmann'),
('Buderus', 'GB192', 'Fachmannebene', '1993', 'Gleicher Code wie GB172'),
('Wolf', 'CGB-2', 'Installateurbene', '0000', 'Nur im Standby-Modus zugänglich'),
('Vaillant', 'ecoTEC plus', 'd.00 Serviceebene', '17', 'Modus-Taste + Temperaturtaste gleichzeitig'),
('Vaillant', 'ecoTEC pro', 'Fachhandwerkerebene', '00', 'Reset über d.96'),
('Junkers', 'Cerapur', 'Servicemenü', '1234', 'Taste 3 Sek. halten'),
('Bosch', 'Condens 7000', 'Servicemenü', '1234', 'Identisch mit Junkers Cerapur'),
('Stiebel Eltron', 'WPL 15', 'Installateurmenü', '1111', 'Über Systemeinstellungen')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STÖRUNGS-WIKI
-- ============================================================
CREATE TABLE IF NOT EXISTS wiki_entries (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title        VARCHAR(200) NOT NULL,
    error_code   VARCHAR(50),                -- z.B. "E9", "F28"
    manufacturer VARCHAR(100),              -- z.B. "Viessmann"
    device       VARCHAR(150),              -- z.B. "Vitodens 200-W"
    category     VARCHAR(50),               -- 'heizung' | 'sanitaer' | 'klima' | 'elektro' | 'sonstiges'
    symptom      TEXT NOT NULL,             -- Was passiert / Fehlerbild
    cause        TEXT,                      -- Ursache
    solution     TEXT,                      -- Lösung / Vorgehen
    project_refs TEXT,                      -- Freitext: "Bereits bei Kunde Müller (Mai 2026)"
    tags         TEXT,                      -- Komma-getrennte Tags
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wiki_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id    UUID NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wiki_files (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id    UUID NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     TEXT NOT NULL,
    mime_type     VARCHAR(100),
    file_size     BIGINT,
    file_type     VARCHAR(20),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_entries_manufacturer ON wiki_entries(manufacturer);
CREATE INDEX IF NOT EXISTS idx_wiki_entries_error_code   ON wiki_entries(error_code);
CREATE INDEX IF NOT EXISTS idx_wiki_comments_entry       ON wiki_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_wiki_files_entry          ON wiki_files(entry_id);

-- Demo-Einträge
INSERT INTO wiki_entries (title, error_code, manufacturer, device, category, symptom, cause, solution, project_refs) VALUES
('Brenner startet nicht – E9 Fehler', 'E9', 'Viessmann', 'Vitodens 200-W', 'heizung',
 'Heizung zeigt Fehlercode E9, Brenner versucht zu starten aber geht wieder aus.',
 'Zündung defekt oder Gasventil öffnet nicht. Häufig auch verschmutzter Flammenfühler.',
 '1. Flammenfühler reinigen (Schleifpapier 400er). 2. Zündelektroden prüfen und einstellen (Abstand 3-4mm). 3. Gasventil auf Funktion prüfen. 4. Reset und Neustart.',
 'Bereits bei Kunde Meier, Gartenstr. 12 (März 2026)'),
('Wassermangel Fehler F4', 'F4', 'Buderus', 'GB172', 'heizung',
 'Anlage geht auf Störung F4, Manometer zeigt unter 0,8 bar.',
 'Zu wenig Wasser im System. Ausdehnungsgefäß defekt oder Wasser entweicht.',
 '1. Anlage auf 1,5 bar auffüllen. 2. Ausdehnungsgefäß prüfen (Vordruck ca. 0,5 bar). 3. Anlage auf Leckagen prüfen.',
 NULL),
('Durchlauferhitzer gibt kein warmes Wasser', NULL, 'Stiebel Eltron', 'DHE 18', 'sanitaer',
 'Gerät startet, aber Wasser bleibt kalt. Kein Fehlercode.',
 'Mindestdurchfluss nicht erreicht. Sicherheitstemperaturbegrenzer ausgelöst.',
 '1. STB prüfen und ggf. zurücksetzen (roter Knopf). 2. Durchflussmenge am Hahn erhöhen. 3. Sieb am Einlauf reinigen.',
 NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SYSTEM-EINSTELLUNGEN
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    description TEXT,
    updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standard-Einstellungen
INSERT INTO settings (key, value, description) VALUES
('company_name',     'Beck Sanitär GmbH',  'Firmenname (wird in der App angezeigt)'),
('file_server_url',  '',                    'Basis-URL für externen Dateiserver (z.B. http://192.168.1.50/daten)'),
('file_server_name', 'NAS Dokumentenablage','Anzeigename des Dateiservers'),
('ki_model',         'claude-sonnet-4-20250514', 'KI-Modell für Berichte'),
('max_upload_mb',    '50',                  'Maximale Upload-Größe in MB')
ON CONFLICT DO NOTHING;

-- Externe Links für Wiki-Einträge
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS external_links TEXT;

-- Projekt-Archiv Status
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Dateiserver Credentials in Settings
INSERT INTO settings (key, value, description) VALUES
('file_server_user',     '', 'Benutzername für Dateiserver-Login'),
('file_server_password', '', 'Passwort für Dateiserver-Login (wird verschlüsselt gespeichert)')
ON CONFLICT DO NOTHING;

-- Projektnummer
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(project_number);

-- ============================================================
-- FORMULARE / CHECKLISTEN
-- ============================================================

-- Formular-Vorlagen (z.B. "Druckprobe trocken", "Wartungsprotokoll")
CREATE TABLE IF NOT EXISTS form_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(50) DEFAULT 'sonstiges',
    fields      JSONB NOT NULL DEFAULT '[]',  -- Felddefinitionen
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ausgefüllte Formulare (pro Projekt)
CREATE TABLE IF NOT EXISTS form_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES form_templates(id) ON DELETE SET NULL,
    template_name   VARCHAR(200) NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}',  -- ausgefüllte Werte
    signature_customer  TEXT,  -- Base64 Unterschrift Auftraggeber
    signature_contractor TEXT, -- Base64 Unterschrift Auftragnehmer
    signed_at       TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_entries_project ON form_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_form_entries_template ON form_entries(template_id);

-- Standard Druckprobe Vorlage einfügen
INSERT INTO form_templates (name, description, category, fields) VALUES
('Druckprobenprotokoll Trinkwasser (trocken)',
 'Prüfmethode trocken – Prüfmedium Druckluft oder Inertgas (Viega)',
 'sanitaer',
 '[
   {"id":"bauvorhaben","type":"text","label":"Bauvorhaben / Bauabschnitt","required":true},
   {"id":"auftraggeber","type":"text","label":"Auftraggeber / Vertreter","required":true},
   {"id":"auftragnehmer","type":"text","label":"Auftragnehmer / Vertreter","required":true},
   {"id":"werkstoff","type":"text","label":"Werkstoff des Rohrleitungssystems","required":false},
   {"id":"anlagendruck","type":"number","label":"Anlagendruck (bar)","required":true},
   {"id":"pruefmedium","type":"select","label":"Prüfmedium","options":["Druckluft ölfrei","Stickstoff","CO2"],"required":true},
   {"id":"umgebungstemperatur","type":"number","label":"Umgebungstemperatur (°C)","required":true},
   {"id":"temperatur_pruefmedium","type":"number","label":"Temperatur Prüfmedium (°C)","required":true},
   {"id":"gesamtanlage","type":"select","label":"Geprüft als","options":["Gesamtanlage","Teilabschnitte"],"required":true},
   {"id":"leitungsvolumen","type":"number","label":"Leitungsvolumen (Liter)","required":true},
   {"id":"pruefzeit","type":"number","label":"Prüfzeit (Minuten)","required":true},
   {"id":"dichtheitspruefung_ok","type":"checkbox","label":"Keine Undichtigkeit festgestellt (Dichtheitsprüfung 150 mbar)","required":true},
   {"id":"belastungspruefung_dn","type":"select","label":"Belastungsprüfung DN","options":["DN ≤ 50 (Prüfdruck 3 bar)","DN > 50 (Prüfdruck 1 bar)"],"required":true},
   {"id":"belastungspruefung_ok","type":"checkbox","label":"Belastungsprüfung bestanden (10 Minuten)","required":true},
   {"id":"bemerkungen","type":"textarea","label":"Bemerkungen","required":false},
   {"id":"ort","type":"text","label":"Ort","required":true},
   {"id":"datum","type":"date","label":"Datum","required":true}
 ]'::jsonb
),
('Heizungsabnahme',
 'Abnahmeprotokoll für Heizungsanlagen',
 'heizung',
 '[
   {"id":"kunde","type":"text","label":"Kunde","required":true},
   {"id":"adresse","type":"text","label":"Adresse der Anlage","required":true},
   {"id":"hersteller","type":"text","label":"Hersteller / Typ","required":true},
   {"id":"seriennummer","type":"text","label":"Seriennummer","required":false},
   {"id":"baujahr","type":"text","label":"Baujahr","required":false},
   {"id":"betriebsdruck","type":"number","label":"Betriebsdruck (bar)","required":true},
   {"id":"vorlauftemp","type":"number","label":"Vorlauftemperatur (°C)","required":true},
   {"id":"ruecklauftemp","type":"number","label":"Rücklauftemperatur (°C)","required":true},
   {"id":"abgastemperatur","type":"number","label":"Abgastemperatur (°C)","required":false},
   {"id":"co2_gehalt","type":"number","label":"CO2-Gehalt (%)","required":false},
   {"id":"maengel","type":"textarea","label":"Festgestellte Mängel","required":false},
   {"id":"mängel_behoben","type":"checkbox","label":"Mängel wurden behoben","required":false},
   {"id":"einweisung","type":"checkbox","label":"Einweisung des Kunden erfolgt","required":true},
   {"id":"bemerkungen","type":"textarea","label":"Bemerkungen","required":false},
   {"id":"ort","type":"text","label":"Ort","required":true},
   {"id":"datum","type":"date","label":"Datum","required":true}
 ]'::jsonb
),
('Wartungsprotokoll Heizung',
 'Jährliches Wartungsprotokoll für Heizungsanlagen',
 'heizung',
 '[
   {"id":"kunde","type":"text","label":"Kunde","required":true},
   {"id":"adresse","type":"text","label":"Adresse","required":true},
   {"id":"anlage","type":"text","label":"Anlage / Typ","required":true},
   {"id":"seriennummer","type":"text","label":"Seriennummer","required":false},
   {"id":"betriebsstunden","type":"number","label":"Betriebsstunden","required":false},
   {"id":"filter_gereinigt","type":"checkbox","label":"Filter gereinigt","required":false},
   {"id":"brenner_gereinigt","type":"checkbox","label":"Brenner gereinigt","required":false},
   {"id":"elektroden_geprueft","type":"checkbox","label":"Elektroden geprüft / eingestellt","required":false},
   {"id":"dichtheit_geprueft","type":"checkbox","label":"Dichtheit geprüft","required":false},
   {"id":"betriebsdruck","type":"number","label":"Betriebsdruck (bar)","required":true},
   {"id":"abgastemperatur","type":"number","label":"Abgastemperatur (°C)","required":false},
   {"id":"co2","type":"number","label":"CO2-Gehalt (%)","required":false},
   {"id":"naechste_wartung","type":"date","label":"Nächste Wartung","required":false},
   {"id":"maengel","type":"textarea","label":"Mängel / Empfehlungen","required":false},
   {"id":"ort","type":"text","label":"Ort","required":true},
   {"id":"datum","type":"date","label":"Datum","required":true}
 ]'::jsonb
)
ON CONFLICT DO NOTHING;
