const router   = require('express').Router({ mergeParams: true });
const pool     = require('../db/pool');
const auth     = require('../middleware/auth');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

// Upload-Verzeichnis (aus .env oder Standard)
const UPLOAD_BASE = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, req.params.projectId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/heic',
                     'application/pdf','application/msword',
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

function detectFileType(mime) {
  if (mime.startsWith('image/')) return 'foto';
  if (mime === 'application/pdf') return 'pdf';
  return 'dokument';
}

// GET /api/projects/:projectId/files
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.*, u.name AS uploader_name
      FROM files f
      LEFT JOIN users u ON u.id = f.uploaded_by
      WHERE f.project_id = $1
      ORDER BY f.created_at DESC`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/projects/:projectId/files  (Upload)
router.post('/', auth, upload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ error: 'Keine Dateien hochgeladen' });

  const { entry_id, folder_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saved = [];
    for (const f of req.files) {
      const rel = path.relative(UPLOAD_BASE, f.path);
      const { rows } = await client.query(`
        INSERT INTO files (project_id, entry_id, folder_id, uploaded_by, original_name, stored_name, file_path, mime_type, file_size, file_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [req.params.projectId, entry_id || null, folder_id || null, req.user.id,
         f.originalname, f.filename, rel, f.mimetype, f.size, detectFileType(f.mimetype)]
      );
      saved.push(rows[0]);
    }
    await client.query('UPDATE projects SET updated_at=NOW() WHERE id=$1', [req.params.projectId]);
    await client.query('COMMIT');
    res.status(201).json(saved);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  } finally {
    client.release();
  }
});

// GET /api/projects/:projectId/files/:id/download
router.get('/:id/download', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM files WHERE id=$1 AND project_id=$2', [req.params.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Datei nicht gefunden' });
    const full = path.join(UPLOAD_BASE, rows[0].file_path);
    res.download(full, rows[0].original_name);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// DELETE /api/projects/:projectId/files/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM files WHERE id=$1 AND project_id=$2', [req.params.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    if (rows[0].uploaded_by !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Keine Berechtigung' });

    // Datei löschen
    const full = path.join(UPLOAD_BASE, rows[0].file_path);
    if (fs.existsSync(full)) fs.unlinkSync(full);

    await pool.query('DELETE FROM files WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;

// GET /api/projects/:projectId/files/download-all  – alle Dateien als ZIP
router.get('/download-all', auth, async (req, res) => {
  const { projectId } = req.params;
  try {
    const { rows: files } = await pool.query(
      'SELECT * FROM files WHERE project_id = $1', [projectId]);
    const { rows: project } = await pool.query(
      'SELECT title FROM projects WHERE id = $1', [projectId]);

    if (!files.length) return res.status(404).json({ error: 'Keine Dateien vorhanden' });

    const archiver = require('archiver');
    const archive  = archiver('zip', { zlib: { level: 6 } });
    const title    = (project[0]?.title || 'Projekt').replace(/[^a-zA-Z0-9äöüÄÖÜ\-_]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.zip"`);
    archive.pipe(res);

    for (const f of files) {
      const filePath = path.join(UPLOAD_BASE, f.file_path);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: f.original_name });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Serverfehler' });
  }
});
