const router = require('express').Router({ mergeParams: true });
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// ── Vorlagen ──────────────────────────────────────────────────────────────────

// GET /api/form-templates
router.get('/form-templates', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM form_templates ORDER BY category, name'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/form-templates/:id
router.get('/form-templates/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM form_templates WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/form-templates
router.post('/form-templates', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  const { name, description, category, fields } = req.body;
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO form_templates (name, description, category, fields, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, category || 'sonstiges', JSON.stringify(fields || []), req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/form-templates/:id
router.delete('/form-templates/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  try {
    await pool.query('DELETE FROM form_templates WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// ── Ausgefüllte Formulare ─────────────────────────────────────────────────────

// GET /api/projects/:projectId/forms
router.get('/projects/:projectId/forms', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.*, u.name AS created_by_name
      FROM form_entries f
      LEFT JOIN users u ON u.id = f.created_by
      WHERE f.project_id = $1
      ORDER BY f.created_at DESC`, [req.params.projectId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/projects/:projectId/forms/:id
router.get('/projects/:projectId/forms/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM form_entries WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/projects/:projectId/forms
router.post('/projects/:projectId/forms', auth, async (req, res) => {
  const { template_id, template_name, data, signature_customer, signature_contractor } = req.body;
  if (!template_name) return res.status(400).json({ error: 'Vorlagenname erforderlich' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO form_entries (project_id, template_id, template_name, data, signature_customer, signature_contractor, signed_at, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.projectId, template_id || null, template_name,
       JSON.stringify(data || {}),
       signature_customer || null, signature_contractor || null,
       (signature_customer || signature_contractor) ? new Date() : null,
       req.user.id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PUT /api/projects/:projectId/forms/:id  – Formular aktualisieren (Unterschriften hinzufügen)
router.put('/projects/:projectId/forms/:id', auth, async (req, res) => {
  const { data, signature_customer, signature_contractor } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE form_entries SET
        data=$1,
        signature_customer=COALESCE($2, signature_customer),
        signature_contractor=COALESCE($3, signature_contractor),
        signed_at=CASE WHEN $2 IS NOT NULL OR $3 IS NOT NULL THEN NOW() ELSE signed_at END
      WHERE id=$4 AND project_id=$5 RETURNING *`,
      [JSON.stringify(data || {}), signature_customer || null, signature_contractor || null,
       req.params.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/projects/:projectId/forms/:id
router.delete('/projects/:projectId/forms/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM form_entries WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

module.exports = router;
