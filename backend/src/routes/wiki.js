const router  = require('express').Router();
const pool    = require('../db/pool');
const auth    = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_BASE = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, 'wiki');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/wiki  – alle Einträge, durchsuchbar
router.get('/', auth, async (req, res) => {
  const { q, manufacturer, category } = req.query;
  try {
    let query = `
      SELECT e.*, u.name AS created_by_name, ub.name AS updated_by_name,
             COUNT(DISTINCT c.id) AS comment_count,
             COUNT(DISTINCT f.id) AS file_count
      FROM wiki_entries e
      LEFT JOIN users u  ON u.id  = e.created_by
      LEFT JOIN users ub ON ub.id = e.updated_by
      LEFT JOIN wiki_comments c ON c.entry_id = e.id
      LEFT JOIN wiki_files f    ON f.entry_id = e.id
      WHERE 1=1`;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      query += ` AND (e.title ILIKE $${n} OR e.error_code ILIKE $${n} OR e.manufacturer ILIKE $${n} OR e.device ILIKE $${n} OR e.symptom ILIKE $${n} OR e.solution ILIKE $${n} OR e.tags ILIKE $${n})`;
    }
    if (manufacturer) { params.push(manufacturer); query += ` AND e.manufacturer = $${params.length}`; }
    if (category)     { params.push(category);     query += ` AND e.category = $${params.length}`; }

    query += ' GROUP BY e.id, u.name, ub.name ORDER BY e.updated_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/wiki/:id – Eintrag mit Kommentaren und Dateien
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await pool.query(`
      SELECT e.*, u.name AS created_by_name FROM wiki_entries e
      LEFT JOIN users u ON u.id = e.created_by WHERE e.id = $1`, [req.params.id]);
    if (!entry.rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });

    const comments = await pool.query(`
      SELECT c.*, u.name AS author_name FROM wiki_comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.entry_id = $1 ORDER BY c.created_at ASC`, [req.params.id]);

    const files = await pool.query(
      'SELECT * FROM wiki_files WHERE entry_id = $1 ORDER BY created_at', [req.params.id]);

    res.json({ ...entry.rows[0], comments: comments.rows, files: files.rows });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/wiki
router.post('/', auth, async (req, res) => {
  const { title, error_code, manufacturer, device, category, symptom, cause, solution, project_refs, external_links, tags } = req.body;
  if (!title || !symptom) return res.status(400).json({ error: 'Titel und Fehlerbild erforderlich' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO wiki_entries (title, error_code, manufacturer, device, category, symptom, cause, solution, project_refs, external_links, tags, created_by, updated_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`,
      [title, error_code, manufacturer, device, category||'sonstiges', symptom, cause, solution, project_refs, external_links, tags, req.user.id]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// PUT /api/wiki/:id
router.put('/:id', auth, async (req, res) => {
  const { title, error_code, manufacturer, device, category, symptom, cause, solution, project_refs, external_links, tags } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE wiki_entries SET title=$1, error_code=$2, manufacturer=$3, device=$4, category=$5,
        symptom=$6, cause=$7, solution=$8, project_refs=$9, external_links=$10, tags=$11, updated_by=$12, updated_at=NOW()
      WHERE id=$13 RETURNING *`,
      [title, error_code, manufacturer, device, category, symptom, cause, solution, project_refs, external_links, tags, req.user.id, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/wiki/:id (nur Admin)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  try {
    await pool.query('DELETE FROM wiki_entries WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/wiki/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Inhalt erforderlich' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO wiki_comments (entry_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, content]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/wiki/:id/comments/:cid
router.delete('/:id/comments/:cid', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT user_id FROM wiki_comments WHERE id=$1', [req.params.cid]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Keine Berechtigung' });
    await pool.query('DELETE FROM wiki_comments WHERE id=$1', [req.params.cid]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/wiki/:id/files
router.post('/:id/files', auth, upload.array('files', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Keine Dateien' });
  try {
    const saved = [];
    for (const f of req.files) {
      const rel = path.relative(UPLOAD_BASE, f.path);
      const mime = f.mimetype;
      const ftype = mime.startsWith('image/') ? 'foto' : mime === 'application/pdf' ? 'pdf' : 'dokument';
      const { rows } = await pool.query(`
        INSERT INTO wiki_files (entry_id, uploaded_by, original_name, stored_name, file_path, mime_type, file_size, file_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.params.id, req.user.id, f.originalname, f.filename, rel, mime, f.size, ftype]);
      saved.push(rows[0]);
    }
    res.status(201).json(saved);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/wiki/manufacturers
router.get('/meta/manufacturers', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT manufacturer FROM wiki_entries WHERE manufacturer IS NOT NULL ORDER BY manufacturer');
    res.json(rows.map(r => r.manufacturer));
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

module.exports = router;
