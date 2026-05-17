require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Datei-Vorschau (Fotos direkt abrufbar wenn angemeldet)
// Authentifizierung per Query-Token für direkten Dateizugriff
const auth = require('./middleware/auth');
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
app.use('/uploads', (req, res, next) => {
  // Token aus Query-String erlauben (für img src=...)
  if (req.query.token) req.headers['authorization'] = `Bearer ${req.query.token}`;
  next();
}, auth, express.static(UPLOAD_PATH));

// API-Routen
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/entries', require('./routes/entries'));
app.use('/api/projects/:projectId/files',   require('./routes/files'));
app.use('/api/projects/:projectId/reports', require('./routes/reports'));
app.use('/api', require('./routes/folders'));
app.use('/api/access-codes', require('./routes/accessCodes'));
app.use('/api/wiki', require('./routes/wiki'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/form-templates', require('./routes/forms'));
app.use('/api/projects/:projectId/forms', require('./routes/forms'));

// Health-Check
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Frontend (wird im Produktivbetrieb von nginx serviert, hier als Fallback)
const FRONTEND = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(FRONTEND)) {
  app.use(express.static(FRONTEND));
  app.get('*', (req, res) => res.sendFile(path.join(FRONTEND, 'index.html')));
}

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Beck Baustellenmappe Backend läuft auf Port ${PORT}`));

