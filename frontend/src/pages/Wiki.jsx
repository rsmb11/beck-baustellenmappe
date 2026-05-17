import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route } from 'react-router-dom'
import api from '../api'
import {
  IconPlus, IconSearch, IconBook, IconPencil, IconTrash, IconX,
  IconCheck, IconUpload, IconFileTypePdf, IconPhoto, IconAlertTriangle,
  IconBulb, IconTool, IconMapPin, IconExternalLink, IconArrowLeft,
  IconMessageCircle, IconChevronDown
} from '@tabler/icons-react'

const CATEGORIES = {
  heizung:  { label:'Heizung',   color:'#FCEBEB', ic:'#A32D2D' },
  sanitaer: { label:'Sanitär',   color:'#E6F1FB', ic:'#185FA5' },
  klima:    { label:'Klima',     color:'#FAEEDA', ic:'#854F0B' },
  elektro:  { label:'Elektro',   color:'#F0EAFB', ic:'#6B3FA0' },
  sonstiges:{ label:'Sonstiges', color:'#F1EFE8', ic:'#5F5E5A' },
}

// ── Wiki Liste ────────────────────────────────────────────────────────────────
function WikiListe() {
  const navigate = useNavigate()
  const [entries, setEntries]       = useState([])
  const [manufacturers, setMfr]     = useState([])
  const [search, setSearch]         = useState('')
  const [selCat, setSelCat]         = useState('')
  const [selMfr, setSelMfr]         = useState('')
  const [loading, setLoading]       = useState(true)
  const me = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const t = setTimeout(() => loadEntries(), 300)
    return () => clearTimeout(t)
  }, [search, selCat, selMfr])

  async function loadAll() {
    setLoading(true)
    try {
      const [e, m] = await Promise.all([
        api.get('/wiki'),
        api.get('/wiki/meta/manufacturers')
      ])
      setEntries(e.data)
      setMfr(m.data)
    } finally { setLoading(false) }
  }

  async function loadEntries() {
    const params = {}
    if (search) params.q = search
    if (selCat) params.category = selCat
    if (selMfr) params.manufacturer = selMfr
    const r = await api.get('/wiki', { params })
    setEntries(r.data)
  }

  async function deleteEntry(e, id) {
    e.stopPropagation()
    if (!confirm('Eintrag löschen?')) return
    await api.delete(`/wiki/${id}`)
    loadAll()
  }

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:500 }}>Störungs-Wiki</div>
          <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>Fehlercodes, Ursachen und Lösungen</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/wiki/neu')}>
          <IconPlus size={14} /> Neuer Eintrag
        </button>
      </div>

      {/* Suche */}
      <div style={{ position:'relative', marginBottom:10 }}>
        <IconSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#888780' }} />
        <input className="input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Fehlercode, Gerät, Symptom suchen..." style={{ paddingLeft:32 }} />
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <select className="input" style={{ flex:1 }} value={selCat} onChange={e => setSelCat(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" style={{ flex:1 }} value={selMfr} onChange={e => setSelMfr(e.target.value)}>
          <option value="">Alle Hersteller</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {entries.map(e => {
          const cat = CATEGORIES[e.category] || CATEGORIES.sonstiges
          return (
            <button key={e.id} className="card" onClick={() => navigate(`/wiki/${e.id}`)}
              style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:12, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IconTool size={16} color={cat.ic} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                  {e.error_code && (
                    <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, background:'#1a1a1a', color:'#fff', padding:'1px 7px', borderRadius:5 }}>{e.error_code}</span>
                  )}
                  <span style={{ fontSize:13, fontWeight:500 }}>{e.title}</span>
                </div>
                <div style={{ fontSize:11, color:'#888780' }}>
                  {e.manufacturer}{e.device ? ` · ${e.device}` : ''}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, background:cat.color, color:cat.ic, padding:'1px 7px', borderRadius:20 }}>{cat.label}</span>
                  {e.comment_count > 0 && <span style={{ fontSize:10, color:'#888780' }}>💬 {e.comment_count}</span>}
                </div>
              </div>
              {me.role === 'admin' && (
                <button onClick={ev => deleteEntry(ev, e.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#A32D2D', flexShrink:0, padding:4 }}>
                  <IconTrash size={14} />
                </button>
              )}
            </button>
          )
        })}
        {!loading && entries.length === 0 && (
          <div className="card" style={{ padding:32, textAlign:'center', color:'#888780' }}>
            <IconBook size={40} color="#DDD8D0" style={{ display:'block', margin:'0 auto 12px' }} />
            <div>Keine Einträge gefunden</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Wiki Detail ───────────────────────────────────────────────────────────────
function WikiDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [fileServer, setFileServer] = useState({ url:'', name:'NAS' })
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  useEffect(() => {
    loadEntry()
    api.get('/settings/public').then(r => {
      if (r.data.file_server_url) setFileServer({ url: r.data.file_server_url, name: r.data.file_server_name || 'NAS' })
    }).catch(() => {})
  }, [id])

  async function loadEntry() {
    setLoading(true)
    try { const r = await api.get(`/wiki/${id}`); setEntry(r.data) }
    finally { setLoading(false) }
  }

  async function saveComment() {
    if (!comment.trim()) return
    setSaving(true)
    try { await api.post(`/wiki/${id}/comments`, { content: comment }); setComment(''); await loadEntry() }
    finally { setSaving(false) }
  }

  async function deleteComment(cid) {
    await api.delete(`/wiki/${id}/comments/${cid}`)
    loadEntry()
  }

  async function handleFileUpload(e) {
    const fd = new FormData()
    for (const f of e.target.files) fd.append('files', f)
    await api.post(`/wiki/${id}/files`, fd)
    loadEntry()
  }

  if (loading) return <div style={{ padding:32, textAlign:'center' }}><div className="spinner" /></div>
  if (!entry)  return <div style={{ padding:14 }}>Nicht gefunden</div>

  const cat = CATEGORIES[entry.category] || CATEGORIES.sonstiges

  return (
    <div style={{ padding:14 }}>
      <button className="btn btn-sm" onClick={() => navigate('/wiki')} style={{ marginBottom:12 }}>
        <IconArrowLeft size={14} /> Zurück
      </button>

      {/* Header */}
      <div className="card" style={{ padding:'14px 16px', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              {entry.error_code && (
                <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:700, background:'#1a1a1a', color:'#fff', padding:'2px 10px', borderRadius:6 }}>{entry.error_code}</span>
              )}
              <span style={{ fontSize:15, fontWeight:600 }}>{entry.title}</span>
            </div>
            <div style={{ fontSize:12, color:'#888780' }}>
              {entry.manufacturer}{entry.device ? ` · ${entry.device}` : ''} · <span style={{ background:cat.color, color:cat.ic, padding:'1px 7px', borderRadius:20, fontSize:11 }}>{cat.label}</span>
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => navigate(`/wiki/${id}/bearbeiten`)} style={{ flexShrink:0 }}>
            <IconPencil size={13} />
          </button>
        </div>

        {/* Sections */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Section icon={<IconAlertTriangle size={15} color="#A32D2D"/>} title="Fehlerbild / Symptom" color="#FCEBEB">
            {entry.symptom}
          </Section>
          {entry.cause && (
            <Section icon={<IconBulb size={15} color="#854F0B"/>} title="Ursache" color="#FAEEDA">
              {entry.cause}
            </Section>
          )}
          {entry.solution && (
            <Section icon={<IconCheck size={15} color="#0F6E56"/>} title="Lösung / Vorgehen" color="#E1F5EE">
              <div style={{ whiteSpace:'pre-wrap' }}>{entry.solution}</div>
            </Section>
          )}
          {entry.project_refs && (
            <Section icon={<IconMapPin size={15} color="#185FA5"/>} title="Bereits aufgetreten bei" color="#E6F1FB">
              {entry.project_refs}
            </Section>
          )}
          {entry.external_links && (
            <Section icon={<IconExternalLink size={15} color="#6B3FA0"/>} title="Dokumente / Links" color="#F0EAFB">
              {entry.external_links.split('\n').filter(l=>l.trim()).map((link,i) => {
                const isUrl = link.startsWith('http')
                const fullUrl = isUrl ? link : (fileServer.url ? `${fileServer.url}/${link.replace(/^\//,'')}` : null)
                return (
                  <div key={i} style={{ marginBottom:4 }}>
                    {fullUrl
                      ? <a href={fullUrl} target="_blank" rel="noreferrer" style={{ color:'#185FA5', fontSize:13, display:'inline-flex', alignItems:'center', gap:4 }}>📄 {link} <IconExternalLink size={11}/></a>
                      : <span style={{ fontSize:13 }}>📄 {link}</span>
                    }
                  </div>
                )
              })}
            </Section>
          )}
        </div>
      </div>

      {/* Anhänge */}
      {(entry.files?.length > 0 || true) && (
        <div className="card" style={{ padding:'12px 14px', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:500, marginBottom:8 }}>Anhänge {entry.files?.length > 0 ? `(${entry.files.length})` : ''}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {entry.files?.map(f => (
              <a key={f.id} href={`/uploads/${f.file_path}?token=${token}`} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#F7F4F0', borderRadius:8, fontSize:12, color:'#1a1a1a' }}>
                {f.file_type==='foto' ? <IconPhoto size={14} color="#BA7517"/> : <IconFileTypePdf size={14} color="#A32D2D"/>}
                {f.original_name}
              </a>
            ))}
            <label className="btn btn-sm" style={{ cursor:'pointer' }}>
              <IconUpload size={13}/> Anhängen
              <input type="file" multiple style={{ display:'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {/* Kommentare */}
      <div className="card" style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:12, fontWeight:500, marginBottom:10 }}>
          Kommentare & Ergänzungen ({entry.comments?.length || 0})
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {entry.comments?.map(c => (
            <div key={c.id} style={{ padding:'8px 10px', background:'#F7F4F0', borderRadius:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>{c.author_name}</span>
                <span style={{ fontSize:10, color:'#888780' }}>{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
                {(c.user_id === me.id || me.role === 'admin') && (
                  <button onClick={() => deleteComment(c.id)} style={{ marginLeft:'auto', border:'none', background:'none', cursor:'pointer', color:'#A32D2D' }}>
                    <IconTrash size={12}/>
                  </button>
                )}
              </div>
              <div style={{ fontSize:13, lineHeight:1.5 }}>{c.content}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <textarea className="input" rows={2} value={comment} onChange={e=>setComment(e.target.value)}
            placeholder="Ergänzung hinzufügen..." style={{ flex:1 }} />
          <button className="btn btn-primary btn-sm" onClick={saveComment} disabled={saving||!comment.trim()} style={{ alignSelf:'flex-end' }}>
            {saving ? <span className="spinner" style={{ width:12,height:12 }}/> : <IconCheck size={13}/>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Wiki Formular (Neu + Bearbeiten) ──────────────────────────────────────────
function WikiFormular() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id && id !== 'neu'
  const [manufacturers, setMfr] = useState([])
  const [form, setForm] = useState({
    title:'', error_code:'', manufacturer:'', device:'',
    category:'heizung', symptom:'', cause:'', solution:'',
    project_refs:'', external_links:'', tags:''
  })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [newMfr, setNewMfr]   = useState(false)
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  useEffect(() => {
    api.get('/wiki/meta/manufacturers').then(r => setMfr(r.data))
    if (isEdit) {
      api.get(`/wiki/${id}`).then(r => {
        const e = r.data
        setForm({ title:e.title||'', error_code:e.error_code||'', manufacturer:e.manufacturer||'',
          device:e.device||'', category:e.category||'heizung', symptom:e.symptom||'',
          cause:e.cause||'', solution:e.solution||'', project_refs:e.project_refs||'',
          external_links:e.external_links||'', tags:e.tags||'' })
      })
    }
  }, [id])

  async function save() {
    if (!form.title || !form.symptom) { setError('Titel und Fehlerbild erforderlich'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) await api.put(`/wiki/${id}`, form)
      else        await api.post('/wiki', form)
      navigate(isEdit ? `/wiki/${id}` : '/wiki')
    } catch (err) { setError(err.response?.data?.error || 'Fehler') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ padding:14 }}>
      <button className="btn btn-sm" onClick={() => navigate(isEdit?`/wiki/${id}`:'/wiki')} style={{ marginBottom:12 }}>
        <IconArrowLeft size={14}/> Zurück
      </button>
      <div style={{ fontSize:16, fontWeight:500, marginBottom:14 }}>{isEdit ? 'Eintrag bearbeiten' : 'Neuer Wiki-Eintrag'}</div>

      <div className="card" style={{ padding:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Titel *</label>
              <input className="input" value={form.title} onChange={set('title')} placeholder="z.B. Brenner startet nicht – E9 Fehler" />
            </div>
            <div>
              <label className="label">Fehlercode</label>
              <input className="input" value={form.error_code} onChange={set('error_code')} placeholder="E9, F28"
                style={{ fontFamily:'monospace', fontWeight:700 }} />
            </div>
            <div>
              <label className="label">Kategorie</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hersteller</label>
              {newMfr ? (
                <div style={{ display:'flex', gap:4 }}>
                  <input className="input" value={form.manufacturer} onChange={set('manufacturer')} placeholder="Hersteller" autoFocus />
                  <button className="btn btn-sm" onClick={()=>setNewMfr(false)}>↩</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:4 }}>
                  <select className="input" value={form.manufacturer} onChange={set('manufacturer')}>
                    <option value="">Hersteller wählen...</option>
                    {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-sm" onClick={()=>setNewMfr(true)}><IconPlus size={13}/></button>
                </div>
              )}
            </div>
            <div>
              <label className="label">Gerät / Serie</label>
              <input className="input" value={form.device} onChange={set('device')} placeholder="z.B. Vitodens 200-W" />
            </div>
          </div>
          <div>
            <label className="label">Fehlerbild / Symptom *</label>
            <textarea className="input" rows={3} value={form.symptom} onChange={set('symptom')} placeholder="Was passiert? Wie äußert sich das Problem?" />
          </div>
          <div>
            <label className="label">Ursache</label>
            <textarea className="input" rows={2} value={form.cause} onChange={set('cause')} placeholder="Warum tritt das Problem auf?" />
          </div>
          <div>
            <label className="label">Lösung / Vorgehen</label>
            <textarea className="input" rows={4} value={form.solution} onChange={set('solution')} placeholder="Schritt für Schritt..." />
          </div>
          <div>
            <label className="label">Bereits aufgetreten bei</label>
            <input className="input" value={form.project_refs} onChange={set('project_refs')} placeholder="z.B. Kunde Müller, März 2026" />
          </div>
          <div>
            <label className="label">Externe Dokumente / Links</label>
            <textarea className="input" rows={2} value={form.external_links} onChange={set('external_links')}
              placeholder={'Anleitungen/Viessmann/Vitodens200.pdf\noder https://www.viessmann.de/...'} />
            <div style={{ fontSize:11, color:'#888780', marginTop:4 }}>Ein Link pro Zeile</div>
          </div>
          <div>
            <label className="label">Tags</label>
            <input className="input" value={form.tags} onChange={set('tags')} placeholder="brenner, zündung, gasventil" />
          </div>
          {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{error}</div>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ justifyContent:'center' }}>
            {saving ? <span className="spinner" style={{ width:14,height:14 }}/> : <><IconCheck size={13}/> Speichern</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, color, children }) {
  return (
    <div style={{ background:color, borderRadius:8, padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, fontSize:12, fontWeight:500 }}>
        {icon}{title}
      </div>
      <div style={{ fontSize:13, lineHeight:1.6 }}>{children}</div>
    </div>
  )
}

export default function Wiki() {
  return (
    <Routes>
      <Route index            element={<WikiListe />} />
      <Route path="neu"       element={<WikiFormular />} />
      <Route path=":id"       element={<WikiDetail />} />
      <Route path=":id/bearbeiten" element={<WikiFormular />} />
    </Routes>
  )
}
