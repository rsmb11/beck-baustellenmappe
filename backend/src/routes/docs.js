const router = require('express').Router();
const auth   = require('../middleware/auth');
const path   = require('path');
const fs     = require('fs');

const DOCS_PATH = process.env.DOCS_PATH || '/var/www/beck-docs';
const DOCS_URL  = process.env.DOCS_URL  || 'https://beck-app.ipv64.de/docs';

function readDir(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const relPath = base ? `${base}/${item.name}` : item.name;
    const absPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push({ type: 'folder', name: item.name, path: relPath, children: readDir(absPath, relPath) });
    } else {
      const ext  = path.extname(item.name).toLowerCase().slice(1);
      const stat = fs.statSync(absPath);
      results.push({
        type: 'file',
        name: item.name,
        path: relPath,
        ext,
        size: stat.size,
        modified: stat.mtime,
        url: `${DOCS_URL}/${relPath}`
      });
    }
  }
  return results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, 'de');
  });
}

function flattenFiles(items, folder = '') {
  const files = [];
  for (const item of items) {
    if (item.type === 'folder') {
      files.push(...flattenFiles(item.children, item.path));
    } else {
      files.push({ ...item, folder });
    }
  }
  return files;
}

// GET /api/docs  – Verzeichnisbaum
router.get('/', auth, (req, res) => {
  try {
    const tree = readDir(DOCS_PATH);
    res.json({ tree, base_url: DOCS_URL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET /api/docs/search?q=... – Suche
router.get('/search', auth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  try {
    const tree  = readDir(DOCS_PATH);
    const files = flattenFiles(tree);
    const results = q
      ? files.filter(f => f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q))
      : files;
    res.json(results.slice(0, 100));
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
