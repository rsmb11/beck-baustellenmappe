const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nur für Administratoren' });
  next();
}

// ── Hilfsfunktion: Prüfe ob User Zugriff auf Ordner hat ──────────────────────
async function userCanAccessFolder(userId, folderId) {
  // Admin hat immer Zugriff
  const adminCheck = await pool.query('SELECT role FROM users WHERE id=$1', [userId]);
  if (adminCheck.rows[0]?.role === 'admin') return { read: true, write: true };

  const { rows } = await pool.query(`
    SELECT fp.can_write FROM folder_permissions fp
    INNER JOIN groups g ON g.id = fp.group_id
    INNER JOIN group_members gm ON gm.group_id = g.id
    WHERE fp.folder_id = $1 AND gm.user_id = $2
    LIMIT 1`, [folderId, userId]);

  if (!rows.length) return { read: false, write: false };
  return { read: true, write: rows[0].can_write };
}

// ── GRUPPEN ───────────────────────────────────────────────────────────────────

// GET /api/groups
router.get('/groups', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.*, COUNT(gm.user_id) AS member_count
      FROM groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id
      GROUP BY g.id ORDER BY g.name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/groups/:id/members
router.get('/groups/:id/members', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role FROM users u
      INNER JOIN group_members gm ON gm.user_id = u.id
      WHERE gm.group_id = $1 ORDER BY u.name`, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/groups
router.post('/groups', auth, adminOnly, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO groups (name, description) VALUES ($1,$2) RETURNING *',
      [name, description]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Gruppe existiert bereits' });
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PUT /api/groups/:id
router.put('/groups/:id', auth, adminOnly, async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE groups SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description, req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/groups/:id
router.delete('/groups/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM groups WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// POST /api/groups/:id/members  – Mitglied hinzufügen
router.post('/groups/:id/members', auth, adminOnly, async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// DELETE /api/groups/:id/members/:userId
router.delete('/groups/:id/members/:userId', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM group_members WHERE group_id=$1 AND user_id=$2',
      [req.params.id, req.params.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/users/:id/groups – Gruppen eines Benutzers
router.get('/users/:id/groups', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.* FROM groups g
      INNER JOIN group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = $1 ORDER BY g.name`, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// ── ORDNER-VORLAGEN ───────────────────────────────────────────────────────────

// GET /api/folder-templates
router.get('/folder-templates', auth, async (req, res) => {
  try {
    const templates = await pool.query('SELECT * FROM folder_templates ORDER BY sort_order');
    const perms     = await pool.query('SELECT * FROM folder_template_permissions');
    const result = templates.rows.map(t => ({
      ...t,
      permissions: perms.rows.filter(p => p.template_id === t.id)
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// PUT /api/folder-templates/:id/permissions
router.put('/folder-templates/:id/permissions', auth, adminOnly, async (req, res) => {
  const { permissions } = req.body; // [{ group_name, can_write }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM folder_template_permissions WHERE template_id=$1', [req.params.id]);
    for (const p of permissions) {
      await client.query(
        'INSERT INTO folder_template_permissions (template_id, group_name, can_write) VALUES ($1,$2,$3)',
        [req.params.id, p.group_name, p.can_write]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

// ── ORDNER ────────────────────────────────────────────────────────────────────

// GET /api/projects/:projectId/folders  – Ordnerbaum mit Berechtigungsprüfung
router.get('/projects/:projectId/folders', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    let folders;
    if (isAdmin) {
      const { rows } = await pool.query(
        'SELECT * FROM folders WHERE project_id=$1 ORDER BY name',
        [req.params.projectId]);
      folders = rows;
    } else {
      // Nur Ordner zu denen der User über Gruppen Zugriff hat
      const { rows } = await pool.query(`
        SELECT DISTINCT f.* FROM folders f
        INNER JOIN folder_permissions fp ON fp.folder_id = f.id
        INNER JOIN group_members gm ON gm.group_id = fp.group_id
        WHERE f.project_id = $1 AND gm.user_id = $2
        ORDER BY f.name`, [req.params.projectId, req.user.id]);
      folders = rows;
    }

    // Dateien pro Ordner zählen
    const counts = await pool.query(
      'SELECT folder_id, COUNT(*) AS file_count FROM files WHERE project_id=$1 GROUP BY folder_id',
      [req.params.projectId]);
    const countMap = {};
    counts.rows.forEach(r => countMap[r.folder_id] = parseInt(r.file_count));

    // Berechtigungen pro Ordner für diesen User laden
    const perms = isAdmin ? [] : (await pool.query(`
      SELECT fp.folder_id, fp.can_write FROM folder_permissions fp
      INNER JOIN group_members gm ON gm.group_id = fp.group_id
      WHERE gm.user_id = $1`, [req.user.id])).rows;

    const permMap = {};
    perms.forEach(p => {
      if (!permMap[p.folder_id]) permMap[p.folder_id] = false;
      if (p.can_write) permMap[p.folder_id] = true;
    });

    const result = folders.map(f => ({
      ...f,
      file_count: countMap[f.id] || 0,
      can_write:  isAdmin ? true : (permMap[f.id] || false)
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/projects/:projectId/folders  – Ordner anlegen
router.post('/projects/:projectId/folders', auth, async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name erforderlich' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ordner anlegen
    const { rows } = await client.query(`
      INSERT INTO folders (project_id, parent_id, name, created_by)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.projectId, parent_id || null, name, req.user.id]);
    const folder = rows[0];

    // Standard-Berechtigungen aus Vorlagen übernehmen wenn kein parent_id
    if (!parent_id) {
      const template = await client.query(
        'SELECT * FROM folder_templates WHERE name=$1', [name]);
      if (template.rows[0]) {
        const tPerms = await client.query(
          'SELECT * FROM folder_template_permissions WHERE template_id=$1', [template.rows[0].id]);
        for (const tp of tPerms.rows) {
          const grp = await client.query('SELECT id FROM groups WHERE name=$1', [tp.group_name]);
          if (grp.rows[0]) {
            await client.query(
              'INSERT INTO folder_permissions (folder_id, group_id, can_write) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
              [folder.id, grp.rows[0].id, tp.can_write]);
          }
        }
      } else {
        // Kein Template → alle Gruppen bekommen Zugriff
        const allGroups = await client.query('SELECT id FROM groups');
        for (const g of allGroups.rows) {
          await client.query(
            'INSERT INTO folder_permissions (folder_id, group_id, can_write) VALUES ($1,$2,true) ON CONFLICT DO NOTHING',
            [folder.id, g.id]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...folder, file_count: 0, can_write: true });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Ordner existiert bereits' });
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

// DELETE /api/projects/:projectId/folders/:id
router.delete('/projects/:projectId/folders/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM folders WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    if (rows[0].created_by !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Keine Berechtigung' });
    await pool.query('DELETE FROM folders WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// GET /api/projects/:projectId/folders/:id/permissions
router.get('/projects/:projectId/folders/:id/permissions', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT fp.*, g.name AS group_name FROM folder_permissions fp
      INNER JOIN groups g ON g.id = fp.group_id
      WHERE fp.folder_id = $1`, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Serverfehler' }); }
});

// PUT /api/projects/:projectId/folders/:id/permissions
router.put('/projects/:projectId/folders/:id/permissions', auth, adminOnly, async (req, res) => {
  const { permissions } = req.body; // [{ group_id, can_write }]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM folder_permissions WHERE folder_id=$1', [req.params.id]);
    for (const p of permissions) {
      await client.query(
        'INSERT INTO folder_permissions (folder_id, group_id, can_write) VALUES ($1,$2,$3)',
        [req.params.id, p.group_id, p.can_write]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

// POST /api/projects/:projectId/folders/init – Vorlage auf Projekt anwenden
router.post('/projects/:projectId/folders/init', auth, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const templates = await client.query('SELECT * FROM folder_templates ORDER BY sort_order');

    for (const t of templates.rows) {
      // Ordner anlegen
      const { rows } = await client.query(`
        INSERT INTO folders (project_id, name, created_by)
        VALUES ($1,$2,$3)
        ON CONFLICT (project_id, parent_id, name) DO UPDATE SET name=EXCLUDED.name
        RETURNING id`, [req.params.projectId, t.name, req.user.id]);
      const folderId = rows[0].id;

      // Berechtigungen setzen
      const tPerms = await client.query(
        'SELECT * FROM folder_template_permissions WHERE template_id=$1', [t.id]);
      await client.query('DELETE FROM folder_permissions WHERE folder_id=$1', [folderId]);
      for (const tp of tPerms.rows) {
        const grp = await client.query('SELECT id FROM groups WHERE name=$1', [tp.group_name]);
        if (grp.rows[0]) {
          await client.query(
            'INSERT INTO folder_permissions (folder_id, group_id, can_write) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [folderId, grp.rows[0].id, tp.can_write]);
        }
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  } finally { client.release(); }
});

module.exports = router;
