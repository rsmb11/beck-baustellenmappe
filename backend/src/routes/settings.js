const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  next();
}

// GET /api/settings  – alle Einstellungen (Admin) oder nur öffentliche (alle)
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value, description, updated_at FROM settings ORDER BY key');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/settings/public  – öffentliche Einstellungen für alle User (Firmenname, Dateiserver)
router.get('/public', auth, async (req, res) => {
  const PUBLIC_KEYS = ['company_name', 'file_server_url', 'file_server_name'];
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM settings WHERE key = ANY($1)', [PUBLIC_KEYS]);
    const result = {}
    rows.forEach(r => result[r.key] = r.value)
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// PUT /api/settings  – Einstellungen speichern (Admin)
router.put('/', auth, adminOnly, async (req, res) => {
  const updates = req.body; // { key: value, ... }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(updates)) {
      await client.query(`
        UPDATE settings SET value=$1, updated_by=$2, updated_at=NOW()
        WHERE key=$3`, [value, req.user.id, key]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

module.exports = router;
