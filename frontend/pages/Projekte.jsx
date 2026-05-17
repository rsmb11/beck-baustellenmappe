import { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route } from 'react-router-dom'
import api from '../api'
import { IconPlus, IconArrowLeft, IconFlame, IconDroplet, IconTool, IconFiles, IconNotebook, IconInfoCircle, IconUpload, IconCamera } from '@tabler/icons-react'

const TYPES = { heizung:'Heizung', sanitaer:'Sanitär', klima:'Klima', wartung:'Wartung', sonstiges:'Sonstiges' }
const STATUS_OPTS = ['geplant','aktiv','abgeschlossen','pausiert']
const TYPE_OPTS   = Object.keys(TYPES)

// ── Projekt-Liste ─────────────────────────────────────────────────────────────
function ProjektListe() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false)) }, [])

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Alle Projekte</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
          <IconPlus size={14} /> Neues Projekt
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {projects.map(p => (
          <button key={p.id} className="card" onClick={() => navigate(`/projekte/${p.id}`)}
            style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</span>
              </div>
              <div style={{ fontSize:11, color:'#888780' }}>{p.address}{p.city ? `, ${p.city}` : ''} · {TYPES[p.project_type] || p.project_type}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
              <span className={`pill pill-${p.status}`}>{p.status}</span>
              <div style={{ fontSize:10, color:'#888780' }}>{p.file_count} Dateien</div>
            </div>
          </button>
        ))}
      </div>

      {showNew && <NeuesProjektModal onClose={() => setShowNew(false)} onSave={p => { setProjects(prev => [p, ...prev]); setShowNew(false) }} />}
    </div>
  )
}

// ── Neues Projekt Modal ───────────────────────────────────────────────────────
function NeuesProjektModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title:'', address:'', city:'', zip:'', project_type:'sanitaer', status:'geplant', start_date:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.title) return
    setSaving(true)
    try {
      const { data } = await api.post('/projects', form)
      onSave(data)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Neues Projekt</span>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div><label className="label">Projektname *</label><input className="input" value={form.title} onChange={set('title')} placeholder="z.B. Heizungsanlage Müller" /></div>
          <div><label className="label">Adresse</label><input className="input" value={form.address} onChange={set('address')} placeholder="Straße und Hausnummer" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
            <div><label className="label">Stadt</label><input className="input" value={form.city} onChange={set('city')} /></div>
            <div><label className="label">PLZ</label><input className="input" value={form.zip} onChange={set('zip')} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div><label className="label">Typ</label>
              <select className="input" value={form.project_type} onChange={set('project_type')}>
                {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPES[t]}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Startdatum</label><input className="input" type="date" value={form.start_date} onChange={set('start_date')} /></div>
          <div><label className="label">Notizen</label><textarea className="input" rows={3} value={form.notes} onChange={set('notes')} placeholder="Besonderheiten, Hinweise..." /></div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.title}>
            {saving ? <span className="spinner" style={{ width:14, height:14 }} /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Projekt Detail ────────────────────────────────────────────────────────────
function ProjektDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tab, setTab] = useState('dateien')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => setProject(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding:24, textAlign:'center' }}><div className="spinner" /></div>
  if (!project) return <div style={{ padding:24 }}>Projekt nicht gefunden</div>

  return (
    <div style={{ padding:14 }}>
      <button className="btn btn-sm" onClick={() => navigate('/projekte')} style={{ marginBottom:12 }}>
        <IconArrowLeft size={14} /> Zurück
      </button>

      {/* Header */}
      <div className="card" style={{ padding:'14px 16px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600 }}>{project.title}</div>
            <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>{project.address}{project.city ? `, ${project.zip} ${project.city}` : ''}</div>
          </div>
          <span className={`pill pill-${project.status}`}>{project.status}</span>
        </div>
        <div style={{ display:'flex', gap:14, marginTop:12, flexWrap:'wrap' }}>
          {project.customer_name && <Info label="Kunde" val={project.customer_name} />}
          {project.start_date && <Info label="Start" val={new Date(project.start_date).toLocaleDateString('de-DE')} />}
          <Info label="Dateien" val={project.file_count || 0} />
          <Info label="Einträge" val={project.entry_count || 0} />
        </div>
        {project.notes && <div style={{ fontSize:12, color:'#5F5E5A', marginTop:10, padding:'8px 10px', background:'#F7F4F0', borderRadius:8 }}>{project.notes}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'0.5px solid #DDD8D0', marginBottom:14 }}>
        {[['dateien','Dateien',IconFiles],['doku','Dokumentation',IconNotebook],['info','Projektinfo',IconInfoCircle]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex:1, padding:'9px 4px', fontSize:12, border:'none', background:'none', cursor:'pointer',
              color: tab===key ? '#1D9E75' : '#888780',
              borderBottom: tab===key ? '2px solid #1D9E75' : '2px solid transparent',
              fontWeight: tab===key ? 500 : 400, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'dateien' && <DateienTab projectId={id} />}
      {tab === 'doku'    && <DokuTab    projectId={id} />}
      {tab === 'info'    && <InfoTab    project={project} />}
    </div>
  )
}

function Info({ label, val }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
      <span style={{ color:'#888780' }}>{label}:</span>
      <span style={{ fontWeight:500 }}>{val}</span>
    </div>
  )
}

// ── Dateien Tab ───────────────────────────────────────────────────────────────
function DateienTab({ projectId }) {
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadFiles() }, [projectId])

  async function loadFiles() {
    setLoading(true)
    try { const r = await api.get(`/projects/${projectId}/files`); setFiles(r.data) }
    finally { setLoading(false) }
  }

  async function handleUpload(e) {
    const fs = e.target.files; if (!fs.length) return
    setUploading(true)
    const fd = new FormData()
    for (const f of fs) fd.append('files', f)
    try { await api.post(`/projects/${projectId}/files`, fd); await loadFiles() }
    finally { setUploading(false) }
  }

  const token = localStorage.getItem('token')

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <label className="btn btn-primary btn-sm" style={{ cursor:'pointer' }}>
          <IconUpload size={14} /> {uploading ? 'Lädt...' : 'Hochladen'}
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display:'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
        <label className="btn btn-sm" style={{ cursor:'pointer' }}>
          <IconCamera size={14} /> Foto
          <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        {files.map(f => {
          const isFoto = f.file_type === 'foto'
          return (
            <a key={f.id} href={`/uploads/${f.file_path}?token=${token}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
              <div className="card" style={{ overflow:'hidden', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#1D9E75'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#DDD8D0'}>
                <div style={{ aspectRatio:'4/3', background: isFoto ? '#FEF3E8' : '#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  {isFoto
                    ? <span style={{ fontSize:28 }}>🖼️</span>
                    : <span style={{ fontSize:28 }}>📄</span>
                  }
                  <span style={{ position:'absolute', top:4, right:4, fontSize:9, padding:'1px 6px', borderRadius:4, background: isFoto ? '#E6F1FB' : '#FCEBEB', color: isFoto ? '#185FA5' : '#A32D2D', fontWeight:600 }}>
                    {f.file_type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name}</div>
                  <div style={{ fontSize:10, color:'#888780', marginTop:1 }}>{new Date(f.created_at).toLocaleDateString('de-DE')}</div>
                </div>
              </div>
            </a>
          )
        })}

        {/* Upload Tile */}
        <label className="card" style={{ aspectRatio:'4/3', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', borderStyle:'dashed' }}>
          <IconPlus size={24} color="#1D9E75" />
          <span style={{ fontSize:11, color:'#888780', marginTop:4 }}>Hinzufügen</span>
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display:'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  )
}

// ── Doku Tab ──────────────────────────────────────────────────────────────────
function DokuTab({ projectId }) {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => { loadEntries() }, [projectId])

  async function loadEntries() {
    setLoading(true)
    try { const r = await api.get(`/projects/${projectId}/entries`); setEntries(r.data) }
    finally { setLoading(false) }
  }

  async function saveEntry() {
    if (!text.trim()) return
    setSaving(true)
    try { await api.post(`/projects/${projectId}/entries`, { content: text }); setText(''); await loadEntries() }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="card" style={{ padding:12, marginBottom:12 }}>
        <textarea className="input" rows={4} value={text} onChange={e => setText(e.target.value)}
          placeholder="Was wurde heute gemacht? Materialien, Messwerte, Besonderheiten..." />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-primary btn-sm" onClick={saveEntry} disabled={saving || !text.trim()}>
            {saving ? <span className="spinner" style={{ width:12, height:12 }} /> : 'Eintrag speichern'}
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {entries.map(e => (
          <div key={e.id} className="card" style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1D9E75', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>{e.author_name}</span>
              <span style={{ fontSize:11, color:'#888780' }}>{new Date(e.entry_date).toLocaleDateString('de-DE')}</span>
              {e.files?.length > 0 && <span style={{ marginLeft:'auto', fontSize:10, color:'#888780' }}>📎 {e.files.length} Dateien</span>}
            </div>
            <div style={{ fontSize:13, lineHeight:1.55 }}>{e.content}</div>
          </div>
        ))}
        {!loading && entries.length === 0 && (
          <div style={{ textAlign:'center', padding:32, color:'#888780', fontSize:13 }}>Noch keine Einträge</div>
        )}
      </div>
    </div>
  )
}

// ── Info Tab ──────────────────────────────────────────────────────────────────
function InfoTab({ project }) {
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          ['Typ', TYPES[project.project_type] || project.project_type],
          ['Status', project.status],
          ['Startdatum', project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : '–'],
          ['Enddatum',   project.end_date   ? new Date(project.end_date).toLocaleDateString('de-DE')   : '–'],
          ['Adresse', `${project.address || '–'}`],
          ['PLZ / Ort', `${project.zip || ''} ${project.city || ''}`],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize:11, color:'#888780', marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:500 }}>{v || '–'}</div>
          </div>
        ))}
      </div>
      {project.notes && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:'0.5px solid #DDD8D0' }}>
          <div style={{ fontSize:11, color:'#888780', marginBottom:5 }}>Notizen</div>
          <div style={{ fontSize:13, lineHeight:1.55 }}>{project.notes}</div>
        </div>
      )}
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function Projekte() {
  return (
    <Routes>
      <Route index    element={<ProjektListe />} />
      <Route path=":id" element={<ProjektDetail />} />
    </Routes>
  )
}
