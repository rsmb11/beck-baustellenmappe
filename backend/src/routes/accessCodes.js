const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/access-codes  – alle Codes, durchsuchbar
router.get('/', auth, async (req, res) => {
  const { q, manufacturer } = req.query;
  try {
    let query = `
      SELECT a.*, u.name AS created_by_name, ub.name AS updated_by_name
      FROM access_codes a
      LEFT JOIN users u  ON u.id  = a.created_by
      LEFT JOIN users ub ON ub.id = a.updated_by
      WHERE 1=1`;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND (a.manufacturer ILIKE $${params.length} OR a.device ILIKE $${params.length} OR a.menu_level ILIKE $${params.length} OR a.code ILIKE $${params.length} OR a.hint ILIKE $${params.length} OR a.tags ILIKE $${params.length})`;
    }
    if (manufacturer) {
      params.push(manufacturer);
      query += ` AND a.manufacturer = $${params.length}`;
    }
    query += ' ORDER BY a.manufacturer, a.device, a.menu_level';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET /api/access-codes/manufacturers – alle Hersteller für Filter
router.get('/manufacturers', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT manufacturer FROM access_codes ORDER BY manufacturer'
    );
    res.json(rows.map(r => r.manufacturer));
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/access-codes
router.post('/', auth, async (req, res) => {
  const { manufacturer, device, menu_level, code, hint, tags } = req.body;
  if (!manufacturer || !code) return res.status(400).json({ error: 'Hersteller und Code erforderlich' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO access_codes (manufacturer, device, menu_level, code, hint, tags, created_by, updated_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,
      [manufacturer, device, menu_level, code, hint, tags, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PUT /api/access-codes/:id
router.put('/:id', auth, async (req, res) => {
  const { manufacturer, device, menu_level, code, hint, tags } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE access_codes SET manufacturer=$1, device=$2, menu_level=$3, code=$4,
        hint=$5, tags=$6, updated_by=$7, updated_at=NOW()
      WHERE id=$8 RETURNING *`,
      [manufacturer, device, menu_level, code, hint, tags, req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// DELETE /api/access-codes/:id  (nur Admin)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  try {
    await pool.query('DELETE FROM access_codes WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
