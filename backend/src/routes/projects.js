const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/projects  – archived=true für Archiv
router.get('/', auth, async (req, res) => {
  const archived = req.query.archived === 'true';
  try {
    let query, params;
    const base = `
      SELECT p.*, c.name AS customer_name,
             COUNT(DISTINCT e.id) AS entry_count,
             COUNT(DISTINCT f.id) AS file_count
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN entries e ON e.project_id = p.id
      LEFT JOIN files f ON f.project_id = p.id`;

    if (req.user.role === 'admin') {
      query = `${base} WHERE p.archived = $1 GROUP BY p.id, c.name ORDER BY p.updated_at DESC`;
      params = [archived];
    } else {
      query = `${base}
        INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        WHERE p.archived = $2
        GROUP BY p.id, c.name ORDER BY p.updated_at DESC`;
      params = [req.user.id, archived];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
      FROM projects p LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    const members = await pool.query(`
      SELECT u.id, u.name, u.email FROM users u
      INNER JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id = $1`, [req.params.id]);
    res.json({ ...rows[0], members: members.rows });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  const { title, description, address, city, zip, project_type, status, start_date, end_date, customer_id, notes, member_ids, project_number } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel erforderlich' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO projects (title, description, address, city, zip, project_type, status, start_date, end_date, customer_id, notes, project_number, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title, description, address, city, zip, project_type||'sonstiges', status||'geplant', start_date, end_date, customer_id, notes, project_number||null, req.user.id]);
    const project = rows[0];
    const ids = [...new Set([req.user.id, ...(member_ids||[])])];
    for (const uid of ids) {
      await client.query('INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [project.id, uid]);
    }
    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  const { title, description, address, city, zip, project_type, status, start_date, end_date, customer_id, notes, project_number } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE projects SET title=$1, description=$2, address=$3, city=$4, zip=$5,
        project_type=$6, status=$7, start_date=$8, end_date=$9, customer_id=$10, notes=$11, project_number=$12
      WHERE id=$13 RETURNING *`,
      [title, description, address, city, zip, project_type, status, start_date, end_date, customer_id, notes, project_number||null, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// PUT /api/projects/:id/archive – archivieren / wiederherstellen
router.put('/:id/archive', auth, async (req, res) => {
  if (!['admin','monteur'].includes(req.user.role)) return res.status(403).json({ error: 'Keine Berechtigung' });
  const { archived } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE projects SET archived=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [archived, req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Keine Berechtigung' });
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

module.exports = router;
