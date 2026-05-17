const router    = require('express').Router({ mergeParams: true });
const pool      = require('../db/pool');
const auth      = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REPORT_PROMPTS = {
  abnahme: (project, entries) => `
Du bist ein erfahrener SHK-Meister und erstellst einen professionellen Abnahme-Bericht.

Projekt: ${project.title}
Adresse: ${project.address}, ${project.zip} ${project.city}
Kunde: ${project.customer_name || '–'}
Zeitraum: ${project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : '–'} bis ${project.end_date ? new Date(project.end_date).toLocaleDateString('de-DE') : 'laufend'}

Bautagebuch-Einträge:
${entries.map(e => `${new Date(e.entry_date).toLocaleDateString('de-DE')} (${e.author_name}): ${e.content}`).join('\n')}

Erstelle einen strukturierten Abnahme-Bericht mit folgenden Abschnitten:
1. Projektübersicht
2. Erbrachte Leistungen (chronologisch)
3. Dokumentation & Nachweise
4. Ergebnis & Übergabestatus

Schreibe professionell, präzise und auf Deutsch. Maximal 400 Wörter.`,

  gewaehrleistung: (project, entries) => `
Du bist ein erfahrener SHK-Meister und erstellst eine Gewährleistungsdokumentation.

Projekt: ${project.title}
Adresse: ${project.address}, ${project.zip} ${project.city}
Ausgeführte Arbeiten laut Bautagebuch:
${entries.map(e => `${new Date(e.entry_date).toLocaleDateString('de-DE')}: ${e.content}`).join('\n')}

Erstelle eine lückenlose Gewährleistungsdokumentation mit:
1. Übersicht der ausgeführten Arbeiten
2. Chronologischer Nachweis der Arbeitsschritte
3. Besonderheiten und Hinweise
4. Gewährleistungsrelevante Punkte

Schreibe professionell, rechtssicher und auf Deutsch. Maximal 400 Wörter.`,

  wartung: (project, entries) => `
Du bist ein erfahrener SHK-Meister und erstellst eine Wartungshistorie.

Anlage/Projekt: ${project.title}
Adresse: ${project.address}, ${project.zip} ${project.city}
Dokumentierte Einträge:
${entries.map(e => `${new Date(e.entry_date).toLocaleDateString('de-DE')}: ${e.content}`).join('\n')}

Erstelle eine übersichtliche Wartungshistorie mit:
1. Anlagenübersicht
2. Chronologische Wartungs- und Servicehistorie
3. Festgestellte Mängel und Behebungen
4. Empfehlungen für nächste Wartung

Schreibe präzise und auf Deutsch. Maximal 400 Wörter.`
};

// POST /api/projects/:projectId/reports
router.post('/', auth, async (req, res) => {
  const { report_type } = req.body;
  if (!REPORT_PROMPTS[report_type])
    return res.status(400).json({ error: 'Ungültiger Berichtstyp. Erlaubt: abnahme, gewaehrleistung, wartung' });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(503).json({ error: 'KI-Bericht nicht konfiguriert (kein API-Key)' });

  try {
    // Projektdaten laden
    const projRes = await pool.query(`
      SELECT p.*, c.name AS customer_name FROM projects p
      LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.id = $1`, [req.params.projectId]);
    if (!projRes.rows[0]) return res.status(404).json({ error: 'Projekt nicht gefunden' });

    // Einträge laden
    const entryRes = await pool.query(`
      SELECT e.*, u.name AS author_name FROM entries e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.project_id = $1 ORDER BY e.entry_date ASC`, [req.params.projectId]);

    if (entryRes.rows.length === 0)
      return res.status(400).json({ error: 'Keine Einträge vorhanden – bitte zuerst Dokumentation anlegen' });

    const project = projRes.rows[0];
    const entries = entryRes.rows;
    const prompt  = REPORT_PROMPTS[report_type](project, entries);

    // Anthropic API aufrufen
    const message = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages:   [{ role: 'user', content: prompt }]
    });

    const content = message.content[0].text;

    // Bericht speichern
    const { rows } = await pool.query(`
      INSERT INTO ai_reports (project_id, created_by, report_type, content)
      VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.projectId, req.user.id, report_type, content]
    );

    res.json({ report: rows[0], content });
  } catch (err) {
    console.error('KI-Fehler:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen des Berichts' });
  }
});

// GET /api/projects/:projectId/reports – gespeicherte Berichte
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.name AS created_by_name FROM ai_reports r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.project_id = $1 ORDER BY r.created_at DESC`, [req.params.projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
