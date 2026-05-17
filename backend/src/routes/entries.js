const router = require('express').Router({ mergeParams: true });
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/projects/:projectId/entries
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, u.name AS author_name,
             json_agg(json_build_object('id', f.id, 'original_name', f.original_name, 'file_type', f.file_type, 'stored_name', f.stored_name)
               ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL) AS files
      FROM entries e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN files f ON f.entry_id = e.id
      WHERE e.project_id = $1
      GROUP BY e.id, u.name
      ORDER BY e.entry_date DESC, e.created_at DESC`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/projects/:projectId/entries
router.post('/', auth, async (req, res) => {
  const { content, entry_date } = req.body;
  if (!content) return res.status(400).json({ error: 'Inhalt erforderlich' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO entries (project_id, user_id, content, entry_date)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.projectId, req.user.id, content, entry_date || new Date().toISOString().split('T')[0]]
    );
    // Projekt updated_at aktualisieren
    await pool.query('UPDATE projects SET updated_at=NOW() WHERE id=$1', [req.params.projectId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// DELETE /api/projects/:projectId/entries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT user_id FROM entries WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Keine Berechtigung' });
    await pool.query('DELETE FROM entries WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
