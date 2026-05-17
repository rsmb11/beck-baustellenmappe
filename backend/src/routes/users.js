const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Nur Admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  next();
}

// GET /api/users – alle Benutzer
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/users – neuer Benutzer
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, E-Mail und Passwort erforderlich' });
  if (!['admin','monteur'].includes(role)) return res.status(400).json({ error: 'Ungültige Rolle' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, active, created_at',
      [name, email.toLowerCase(), hash, role || 'monteur']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'E-Mail bereits vergeben' });
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PUT /api/users/:id – Benutzer bearbeiten (Name, Rolle, aktiv)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, email, role, active } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name=$1, email=$2, role=$3, active=$4 WHERE id=$5 RETURNING id, name, email, role, active',
      [name, email?.toLowerCase(), role, active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'E-Mail bereits vergeben' });
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PUT /api/users/:id/password – Passwort ändern
// Admin: kann jedes Passwort ändern
// Benutzer selbst: muss altes Passwort angeben
router.put('/:id/password', auth, async (req, res) => {
  const isSelf  = req.user.id === req.params.id;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin) return res.status(403).json({ error: 'Keine Berechtigung' });

  const { old_password, new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ error: 'Neues Passwort mindestens 6 Zeichen' });

  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

    // Normaler Benutzer muss altes Passwort kennen
    if (isSelf && !isAdmin) {
      if (!old_password) return res.status(400).json({ error: 'Altes Passwort erforderlich' });
      const valid = await bcrypt.compare(old_password, rows[0].password);
      if (!valid) return res.status(401).json({ error: 'Altes Passwort falsch' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// DELETE /api/users/:id – Benutzer deaktivieren (nicht löschen)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: 'Eigenen Account nicht deaktivierbar' });
  try {
    await pool.query('UPDATE users SET active=false WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
