import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route } from 'react-router-dom'
import api from '../api'
import {
  IconPlus, IconArrowLeft, IconFiles, IconNotebook, IconInfoCircle,
  IconUpload, IconCamera, IconFolder, IconFolderOpen, IconFile,
  IconFileTypePdf, IconFileDescription, IconTrash, IconArchive,
  IconChevronRight, IconChevronDown, IconLock, IconSettings, IconClipboardList
} from '@tabler/icons-react'

const TYPES = { heizung:'Heizung', sanitaer:'Sanitär', klima:'Klima', wartung:'Wartung', sonstiges:'Sonstiges' }
const STATUS_OPTS = ['geplant','aktiv','abgeschlossen','pausiert']
const TYPE_OPTS   = Object.keys(TYPES)

// ── Type config für Smart Cards ──────────────────────────────────────────────
const TYPE_CFG = {
  heizung:  { accent: '#dc2626', accentL: '#f87171', bg: 'rgba(220,38,38,.13)', border: 'rgba(220,38,38,.22)',
    icon: (c='#f87171') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  sanitaer: { accent: '#2563eb', accentL: '#60a5fa', bg: 'rgba(37,99,235,.13)',  border: 'rgba(37,99,235,.22)',
    icon: (c='#60a5fa') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg> },
  klima:    { accent: '#d97706', accentL: '#fbbf24', bg: 'rgba(217,119,6,.13)',  border: 'rgba(217,119,6,.22)',
    icon: (c='#fbbf24') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  wartung:  { accent: '#7c3aed', accentL: '#a78bfa', bg: 'rgba(124,58,237,.13)', border: 'rgba(124,58,237,.22)',
    icon: (c='#a78bfa') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  sonstiges:{ accent: '#0ea472', accentL: '#34d399', bg: 'rgba(14,164,114,.13)', border: 'rgba(14,164,114,.22)',
    icon: (c='#34d399') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
}

function getWarnReason(p) {
  if (!p.file_count || parseInt(p.file_count) === 0) return 'Noch keine Dateien hochgeladen'
  if (p.status === 'aktiv' && p.notes?.toLowerCase().includes('wartung')) return 'Wartung prüfen'
  return null
}

function fileAgeDot(lastFile) {
  if (!lastFile) return '#4a5754'
  const d = lastFile.days_ago || 0
  if (d <= 1) return '#34d399'
  if (d <= 7) return '#f59e0b'
  return '#ef4444'
}

// ── Smart Project Card ────────────────────────────────────────────────────────
function SmartProjektCard({ p, onArchive, onClick }) {
  const [open, setOpen] = useState(false)
  const cfg     = TYPE_CFG[p.project_type] || TYPE_CFG.sonstiges
  const warn    = getWarnReason(p)
  const progress= Math.min(100, Math.max(8, (parseInt(p.file_count) || 0) * 7))
  const addr    = [p.address, p.city].filter(Boolean).join(', ')
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addr)}`
  const phone   = p.phone || null

  const cardStyle = {
    background: warn ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.042)',
    border: warn
      ? '1px solid rgba(239,68,68,0.35)'
      : '0.5px solid rgba(255,255,255,0.09)',
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform .18s, background .15s, box-shadow .18s',
    animation: warn ? 'warnPulse 2.5s ease-in-out infinite' : 'none',
  }

  return (
    <div style={cardStyle}>
      {/* Shimmer accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accentL})`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position:'absolute', top:0, left:'-100%', width:'40%', height:'100%',
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)',
          animation:'shimAccent 3s ease-in-out infinite',
        }}/>
      </div>

      {/* Body */}
      <div style={{ padding:'13px 14px 14px' }} onClick={() => { setOpen(!open) }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          {/* Type icon */}
          <div style={{ width:40, height:40, borderRadius:12, background:cfg.bg, border:`0.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {cfg.icon(cfg.accentL)}
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
              {p.project_number && (
                <span style={{ fontSize:9, fontWeight:700, fontFamily:'monospace', color:cfg.accentL, background:cfg.bg, border:`0.5px solid ${cfg.border}`, padding:'2px 6px', borderRadius:5, flexShrink:0 }}>
                  {p.project_number}
                </span>
              )}
              <div style={{ fontSize:15, fontWeight:700, color:'#e8eeec', letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {p.title}
              </div>
            </div>
            {addr && <div style={{ fontSize:11, color:'#4a5754', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{addr}</div>}
          </div>

          {/* Status badge */}
          {warn ? (
            <span style={{ flexShrink:0, fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, background:'rgba(239,68,68,.15)', color:'#f87171', border:'0.5px solid rgba(239,68,68,.3)', display:'flex', alignItems:'center', gap:4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Aktion
            </span>
          ) : (
            <span className={`pill pill-${p.status}`}>{p.status}</span>
          )}
        </div>

        {/* Warn reason */}
        {warn && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:8, fontSize:10, fontWeight:700, background:'rgba(239,68,68,.1)', border:'0.5px solid rgba(239,68,68,.25)', color:'#f87171', borderRadius:8, padding:'4px 9px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {warn}
          </div>
        )}

        {/* Progress + last file */}
        <div style={{ marginTop:11 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ flex:1, height:4, background:'rgba(255,255,255,.05)', borderRadius:2, overflow:'hidden', position:'relative' }}>
              <div style={{ height:'100%', borderRadius:2, background:`linear-gradient(90deg,${cfg.accent},${cfg.accentL})`, width:`${progress}%`, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:'-100%', width:'100%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)', animation:'shimAccent 2s ease-in-out infinite' }}/>
              </div>
            </div>
            <span style={{ fontSize:10, color:'#4a5754', flexShrink:0 }}>{p.file_count} Dateien</span>
          </div>

          {/* Last file preview */}
          {p.last_file_name ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#546360', padding:'5px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:fileAgeDot(p.last_file), flexShrink:0 }}/>
              <span style={{ color:'#4a5754', fontSize:10, flexShrink:0 }}>Zuletzt:</span>
              <span style={{ color:'#8a9693', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{p.last_file_name}</span>
              {p.last_file_date && <span style={{ marginLeft:'auto', flexShrink:0, color:'#364240', fontSize:10 }}>{new Date(p.last_file_date).toLocaleDateString('de-DE',{day:'numeric',month:'short'})}</span>}
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#364240', padding:'5px 8px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'0.5px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#4a5754', flexShrink:0 }}/>
              <span style={{ fontSize:10, color:'#364240' }}>Noch keine Dateien</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (expand on tap) */}
      <div style={{
        maxHeight: open ? 100 : 0,
        overflow: 'hidden',
        transition: 'max-height .28s cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{ padding:'0 14px 14px', borderTop:'0.5px solid rgba(255,255,255,.07)', paddingTop:10, display:'flex', gap:8 }}>
          <a href={mapsUrl} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 12px', borderRadius:12, fontSize:12, fontWeight:700, background:'rgba(14,164,114,.14)', color:'#34d399', border:'0.5px solid rgba(14,164,114,.25)', textDecoration:'none', transition:'all .18s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Route starten
          </a>
          {phone ? (
            <a href={`tel:${phone}`} onClick={e => e.stopPropagation()}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 12px', borderRadius:12, fontSize:12, fontWeight:700, background:'rgba(37,99,235,.14)', color:'#60a5fa', border:'0.5px solid rgba(37,99,235,.25)', textDecoration:'none', transition:'all .18s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.36 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 5.55 5.55l1.02-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></svg>
              Anrufen
            </a>
          ) : (
            <button onClick={e => { e.stopPropagation(); window.location.href = '/projekte/' + p.id }}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px 12px', borderRadius:12, fontSize:12, fontWeight:700, background:'rgba(255,255,255,.05)', color:'#8a9693', border:'0.5px solid rgba(255,255,255,.09)', cursor:'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8a9693" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              Öffnen
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onArchive(e, p) }}
            style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.09)', display:'flex', alignItems:'center', justifyContent:'center', color:'#4a5754', cursor:'pointer', flexShrink:0 }}
            title={p.archived ? 'Wiederherstellen' : 'Archivieren'}>
            <IconArchive size={16} color={p.archived ? '#34d399' : '#4a5754'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProjektListe ──────────────────────────────────────────────────────────────
function ProjektListe() {
  const navigate = useNavigate()
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showNew, setShowNew]       = useState(false)
  const [showArchiv, setShowArchiv] = useState(false)

  useEffect(() => { load() }, [showArchiv])

  async function load() {
    setLoading(true)
    api.get('/projects?archived=' + showArchiv).then(r => setProjects(r.data)).finally(() => setLoading(false))
  }

  async function toggleArchive(e, p) {
    e.stopPropagation()
    await api.put('/projects/' + p.id + '/archive', { archived: !p.archived })
    load()
  }

  const warnCount = projects.filter(p => getWarnReason(p)).length

  return (
    <div style={{ padding:14 }}>
      {/* CSS for shimmer + warn pulse */}
      <style>{`
        @keyframes shimAccent { 0%{left:-100%} 100%{left:200%} }
        @keyframes warnPulse {
          0%,100%{box-shadow:0 0 0 2px rgba(239,68,68,.2)}
          50%{box-shadow:0 0 0 4px rgba(239,68,68,.35),0 0 16px rgba(239,68,68,.12)}
        }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.02em' }}>
            {showArchiv ? '📦 Archiv' : 'Projekte'}
          </div>
          {warnCount > 0 && !showArchiv && (
            <div style={{ fontSize:11, color:'#f87171', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {warnCount} Projekt{warnCount !== 1 ? 'e' : ''} mit Handlungsbedarf
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="btn btn-sm" onClick={() => setShowArchiv(!showArchiv)}>
            {showArchiv ? '← Aktive' : '📦 Archiv'}
          </button>
          {!showArchiv && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
              <IconPlus size={14} /> Neu
            </button>
          )}
        </div>
      </div>

      {/* Skeleton loader */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height:110, borderRadius:18, background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize:'200% 100%', animation:'warnPulse 1.5s ease-in-out infinite' }}/>
          ))}
        </div>
      )}

      {/* Smart Cards */}
      {!loading && (
        <div>
          {projects.map(p => (
            <SmartProjektCard
              key={p.id}
              p={p}
              onArchive={toggleArchive}
              onClick={() => navigate('/projekte/' + p.id)}
            />
          ))}
          {projects.length === 0 && (
            <div className="card" style={{ padding:32, textAlign:'center', color:'#888780', fontSize:13 }}>
              {showArchiv ? 'Keine archivierten Projekte' : 'Keine aktiven Projekte'}
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NeuesProjektModal
          onClose={() => setShowNew(false)}
          onSave={p => { setProjects(prev => [p, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}

function NeuesProjektModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title:'', project_number:'', address:'', city:'', zip:'',
    project_type:'sanitaer', status:'geplant', start_date:'', notes:''
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.title) return
    setSaving(true)
    try {
      const { data } = await api.post('/projects', form)
      try { await api.post('/projects/' + data.id + '/folders/init') } catch {}
      onSave(data)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Neues Projekt</span>
          <button className="btn btn-sm" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
            <div>
              <label className="label">Projektname *</label>
              <input className="input" value={form.title} onChange={set('title')} placeholder="z.B. Heizungsanlage Müller" />
            </div>
            <div>
              <label className="label">Projektnummer</label>
              <input className="input" value={form.project_number} onChange={set('project_number')} placeholder="26-100" />
            </div>
          </div>
          <div>
            <label className="label">Adresse</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
            <div>
              <label className="label">Stadt</label>
              <input className="input" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="label">PLZ</label>
              <input className="input" value={form.zip} onChange={set('zip')} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <label className="label">Typ</label>
              <select className="input" value={form.project_type} onChange={set('project_type')}>
                {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPES[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Startdatum</label>
            <input className="input" type="date" value={form.start_date} onChange={set('start_date')} />
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
          </div>
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

function ProjektDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tab, setTab]         = useState('dateien')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projects/' + id).then(r => setProject(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding:24, textAlign:'center' }}><div className="spinner" /></div>
  if (!project) return <div style={{ padding:24 }}>Nicht gefunden</div>

  return (
    <div style={{ padding:14 }}>
      <button className="btn btn-sm" onClick={() => navigate('/projekte')} style={{ marginBottom:12 }}>
        <IconArrowLeft size={14} /> Zurück
      </button>
      <div className="card" style={{ padding:'14px 16px', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {project.project_number && (
                <span style={{ fontSize:11, background:'#F5F3EF', color:'#888780', padding:'2px 8px', borderRadius:6, fontFamily:'monospace' }}>
                  {project.project_number}
                </span>
              )}
              <div style={{ fontSize:16, fontWeight:600 }}>{project.title}</div>
            </div>
            <div style={{ fontSize:12, color:'#888780', marginTop:4 }}>
              {project.address}{project.city ? ', ' + project.zip + ' ' + project.city : ''}
            </div>
          </div>
          <span className={'pill pill-' + project.status}>{project.status}</span>
        </div>
        {project.notes && (
          <div style={{ fontSize:12, color:'#5F5E5A', marginTop:10, padding:'8px 10px', background:'#F7F4F0', borderRadius:8 }}>
            {project.notes}
          </div>
        )}
      </div>

      <div style={{ display:'flex', borderBottom:'0.5px solid #DDD8D0', marginBottom:14 }}>
        {[['dateien','Dateien',IconFiles],['doku','Dokumentation',IconNotebook],['formulare','Formulare',IconClipboardList],['info','Info',IconInfoCircle]].map(([key,label,Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex:1, padding:'9px 4px', fontSize:12, border:'none', background:'none', cursor:'pointer',
              color: tab===key ? '#1D9E75' : '#888780',
              borderBottom: tab===key ? '2px solid #1D9E75' : '2px solid transparent',
              fontWeight: tab===key ? 500 : 400,
              display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'dateien'   && <DateienTab projectId={id} />}
      {tab === 'doku'      && <DokuTab    projectId={id} />}
      {tab === 'formulare' && <FormulareTab projectId={id} />}
      {tab === 'info'      && <InfoTab    project={project} />}
    </div>
  )
}

function DateienTab({ projectId }) {
  const [folders, setFolders]       = useState([])
  const [files, setFiles]           = useState([])
  const [selFolder, setSelFolder]   = useState(null)
  const [view, setView]             = useState('ordner')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [showPermModal, setShowPermModal] = useState(null)
  const token = localStorage.getItem('token')
  const me    = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = me.role === 'admin'

  function downloadAll() {
    window.open('/api/projects/' + projectId + '/files/download-all?token=' + token, '_blank')
  }

  useEffect(() => { loadAll() }, [projectId])

  async function loadAll() {
    const [fr, fi] = await Promise.all([
      api.get('/projects/' + projectId + '/folders'),
      api.get('/projects/' + projectId + '/files')
    ])
    setFolders(fr.data)
    setFiles(fi.data)
  }

  async function handleUpload(e) {
    const fs = e.target.files
    if (!fs.length) return
    setUploading(true)
    const fd = new FormData()
    for (const f of fs) fd.append('files', f)
    if (selFolder && selFolder !== 'none') fd.append('folder_id', selFolder)
    try { await api.post('/projects/' + projectId + '/files', fd); await loadAll() }
    finally { setUploading(false) }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return
    await api.post('/projects/' + projectId + '/folders', { name: newFolderName })
    setNewFolderName('')
    setShowNewFolder(false)
    await loadAll()
  }

  async function deleteFile(fileId) {
    if (!confirm('Datei löschen?')) return
    await api.delete('/projects/' + projectId + '/files/' + fileId)
    await loadAll()
  }

  async function deleteFolder(folderId) {
    if (!confirm('Ordner löschen?')) return
    await api.delete('/projects/' + projectId + '/folders/' + folderId)
    if (selFolder === folderId) setSelFolder(null)
    await loadAll()
  }

  const rootFolders  = folders.filter(f => !f.parent_id)
  const selFolderObj = folders.find(f => f.id === selFolder)

  const displayedFiles = selFolder === null
    ? files
    : selFolder === 'none'
      ? files.filter(f => !f.folder_id)
      : files.filter(f => f.folder_id === selFolder)

  return (
    <div>
      {/* Tab Umschalter */}
      <div style={{ display:'flex', borderBottom:'0.5px solid #DDD8D0', marginBottom:14, alignItems:'center' }}>
        <button onClick={() => setView('ordner')}
          style={{ flex:1, padding:'9px', fontSize:12, border:'none', background:'none', cursor:'pointer',
            color: view==='ordner' ? '#1D9E75' : '#888780',
            borderBottom: view==='ordner' ? '2px solid #1D9E75' : '2px solid transparent',
            fontWeight: view==='ordner' ? 500 : 400 }}>
          Ordner
        </button>
        <button onClick={() => setView('dateien')}
          style={{ flex:1, padding:'9px', fontSize:12, border:'none', background:'none', cursor:'pointer',
            color: view==='dateien' ? '#1D9E75' : '#888780',
            borderBottom: view==='dateien' ? '2px solid #1D9E75' : '2px solid transparent',
            fontWeight: view==='dateien' ? 500 : 400 }}>
          Dateien {selFolderObj ? '(' + selFolderObj.name + ')' : '(alle)'}
        </button>
        <a href={'/api/projects/' + projectId + '/files/download-all?token=' + token}
          target="_blank" rel="noreferrer"
          className="btn btn-sm" style={{ margin:'0 4px', flexShrink:0, fontSize:11 }}
          title="Alle Dateien als ZIP herunterladen">
          ⬇ ZIP
        </a>
      </div>

      {/* Ordner-Ansicht */}
      {view === 'ordner' && (
        <div>
          {[
            { id: null,   label:'Alle Dateien', count: files.length },
            { id: 'none', label:'Ohne Ordner',  count: files.filter(f => !f.folder_id).length },
          ].map(item => (
            <div key={String(item.id)}
              onClick={() => { setSelFolder(item.id); setView('dateien') }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12,
                cursor:'pointer', marginBottom:8, background:'#fff', border:'0.5px solid #EAEAE8' }}>
              <IconFiles size={18} color="#1D9E75" />
              <span style={{ fontSize:14, flex:1, fontWeight:500 }}>{item.label}</span>
              <span style={{ fontSize:12, color:'#888780', background:'#F5F3EF', padding:'2px 10px', borderRadius:20 }}>{item.count}</span>
              <IconChevronRight size={16} color="#888780" />
            </div>
          ))}

          <div style={{ height:'0.5px', background:'#DDD8D0', margin:'8px 0 12px' }} />

          {rootFolders.map(f => (
            <div key={f.id}
              onClick={() => { setSelFolder(f.id); setView('dateien') }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12,
                cursor:'pointer', marginBottom:8, background:'#fff', border:'0.5px solid #EAEAE8' }}>
              <IconFolderOpen size={18} color="#BA7517" />
              <span style={{ fontSize:14, flex:1, fontWeight:500 }}>{f.name}</span>
              {!f.can_write && <IconLock size={13} color="#888780" />}
              <span style={{ fontSize:12, color:'#888780', background:'#F5F3EF', padding:'2px 10px', borderRadius:20 }}>
                {files.filter(x => x.folder_id === f.id).length}
              </span>
              {isAdmin && (
                <button onClick={e => { e.stopPropagation(); setShowPermModal(f) }}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#888780' }}>
                  <IconSettings size={14} />
                </button>
              )}
              {isAdmin && (
                <button onClick={e => { e.stopPropagation(); deleteFolder(f.id) }}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#A32D2D' }}>
                  <IconTrash size={14} />
                </button>
              )}
              <IconChevronRight size={16} color="#888780" />
            </div>
          ))}

          {isAdmin && (
            showNewFolder ? (
              <div style={{ display:'flex', gap:6, marginTop:8 }}>
                <input className="input" value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Ordnername" onKeyDown={e => e.key === 'Enter' && createFolder()} autoFocus />
                <button className="btn btn-sm btn-primary" onClick={createFolder}>OK</button>
                <button className="btn btn-sm" onClick={() => setShowNewFolder(false)}>X</button>
              </div>
            ) : (
              <button className="btn btn-sm" onClick={() => setShowNewFolder(true)}
                style={{ width:'100%', marginTop:8, justifyContent:'center' }}>
                <IconPlus size={13} /> Neuer Ordner
              </button>
            )
          )}
        </div>
      )}

      {/* Dateien-Ansicht */}
      {view === 'dateien' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <button className="btn btn-sm" onClick={() => setView('ordner')}>
              <IconArrowLeft size={13} /> Ordner
            </button>
            <div style={{ fontSize:13, fontWeight:500, flex:1 }}>
              {selFolder === null ? 'Alle Dateien' : selFolder === 'none' ? 'Ohne Ordner' : selFolderObj?.name}
            </div>
            {(selFolder === null || selFolder === 'none' || selFolderObj?.can_write !== false) && (
              <label className="btn btn-primary btn-sm" style={{ cursor:'pointer' }}>
                <IconUpload size={13} /> {uploading ? 'Lädt...' : 'Hochladen'}
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display:'none' }}
                  onChange={handleUpload} disabled={uploading} />
              </label>
            )}
            {(selFolder === null || selFolder === 'none' || selFolderObj?.can_write !== false) && (
              <label className="btn btn-sm" style={{ cursor:'pointer' }}>
                <IconCamera size={13} />
                <input type="file" accept="image/*" capture="environment" style={{ display:'none' }}
                  onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
            {displayedFiles.map(f => (
              <div key={f.id} className="card" style={{ overflow:'hidden' }}>
                <a href={'/uploads/' + f.file_path + '?token=' + token} target="_blank" rel="noreferrer">
                  <div style={{ aspectRatio:'4/3', background:'#F7F4F0', display:'flex',
                    alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {f.file_type === 'foto'
                      ? <img src={'/uploads/' + f.file_path + '?token=' + token}
                          alt={f.original_name}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.style.display='none' }} />
                      : f.mime_type === 'application/pdf'
                        ? <IconFileTypePdf size={36} color="#A32D2D" />
                        : <IconFileDescription size={36} color="#185FA5" />
                    }
                  </div>
                </a>
                <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {f.original_name}
                    </div>
                    <div style={{ fontSize:10, color:'#888780' }}>
                      {new Date(f.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <button onClick={() => deleteFile(f.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#A32D2D', padding:4, flexShrink:0 }}>
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
            <label className="card" style={{ aspectRatio:'4/3', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', cursor:'pointer', borderStyle:'dashed' }}>
              <IconPlus size={28} color="#1D9E75" />
              <span style={{ fontSize:12, color:'#888780', marginTop:6 }}>Hinzufügen</span>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display:'none' }} onChange={handleUpload} />
            </label>
          </div>

          {displayedFiles.length === 0 && (
            <div style={{ textAlign:'center', padding:32, color:'#888780', fontSize:13 }}>
              Keine Dateien
            </div>
          )}
        </div>
      )}

      {showPermModal && (
        <PermissionsModal
          folder={showPermModal}
          projectId={projectId}
          onClose={() => setShowPermModal(null)}
          onSave={() => { setShowPermModal(null); loadAll() }}
        />
      )}
    </div>
  )
}

function PermissionsModal({ folder, projectId, onClose, onSave }) {
  const [groups, setGroups] = useState([])
  const [perms, setPerms]   = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/groups'),
      api.get('/projects/' + projectId + '/folders/' + folder.id + '/permissions')
    ]).then(([gr, pr]) => { setGroups(gr.data); setPerms(pr.data) })
  }, [])

  const hasAccess = gid => perms.some(p => p.group_id === gid)
  const canWrite  = gid => perms.find(p => p.group_id === gid)?.can_write || false

  function toggle(gid, type) {
    setPerms(prev => {
      const exists = prev.find(p => p.group_id === gid)
      if (type === 'read') {
        return exists ? prev.filter(p => p.group_id !== gid) : [...prev, { group_id: gid, can_write: false }]
      } else {
        return exists
          ? prev.map(p => p.group_id === gid ? { ...p, can_write: !p.can_write } : p)
          : [...prev, { group_id: gid, can_write: true }]
      }
    })
  }

  async function save() {
    setSaving(true)
    try {
      await api.put('/projects/' + projectId + '/folders/' + folder.id + '/permissions', { permissions: perms })
      onSave()
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Berechtigungen: {folder.name}</span>
          <button className="btn btn-sm" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px 16px', alignItems:'center' }}>
            <div style={{ fontSize:11, color:'#888780', fontWeight:500 }}>Gruppe</div>
            <div style={{ fontSize:11, color:'#888780', fontWeight:500 }}>Lesen</div>
            <div style={{ fontSize:11, color:'#888780', fontWeight:500 }}>Schreiben</div>
            {groups.map(g => (
              <React.Fragment key={g.id}>
                <div style={{ fontSize:13 }}>{g.name}</div>
                <div style={{ textAlign:'center' }}>
                  <input type="checkbox" checked={hasAccess(g.id)} onChange={() => toggle(g.id, 'read')} />
                </div>
                <div style={{ textAlign:'center' }}>
                  <input type="checkbox" checked={canWrite(g.id)} onChange={() => toggle(g.id, 'write')} disabled={!hasAccess(g.id)} />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:14, height:14 }} /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DokuTab({ projectId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText]       = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => { loadEntries() }, [projectId])

  async function loadEntries() {
    setLoading(true)
    try {
      const r = await api.get('/projects/' + projectId + '/entries')
      setEntries(r.data)
    } finally { setLoading(false) }
  }

  async function saveEntry() {
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.post('/projects/' + projectId + '/entries', { content: text })
      setText('')
      await loadEntries()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="card" style={{ padding:12, marginBottom:12 }}>
        <textarea className="input" rows={4} value={text} onChange={e => setText(e.target.value)}
          placeholder="Was wurde heute gemacht?" />
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
              <span style={{ fontSize:11, color:'#888780' }}>
                {new Date(e.entry_date).toLocaleDateString('de-DE')}
              </span>
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

function FormulareTab({ projectId }) {
  const navigate = useNavigate()
  const [forms, setForms]       = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/projects/' + projectId + '/forms'),
      api.get('/form-templates')
    ]).then(([f, t]) => { setForms(f.data); setTemplates(t.data) })
    .finally(() => setLoading(false))
  }, [projectId])

  async function deleteForm(e, id) {
    e.stopPropagation()
    if (!confirm('Formular löschen?')) return
    await api.delete('/projects/' + projectId + '/forms/' + id)
    setForms(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>
          <IconPlus size={13} /> Neues Formular
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {forms.map(f => (
          <div key={f.id} className="card"
            onClick={() => navigate('/formulare/' + projectId + '/' + f.id)}
            style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <IconClipboardList size={18} color="#0F6E56" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{f.template_name}</div>
              <div style={{ fontSize:11, color:'#888780', marginTop:2 }}>
                {f.created_by_name} · {new Date(f.created_at).toLocaleDateString('de-DE')}
                {f.signed_at && <span style={{ marginLeft:8, color:'#1D9E75' }}>✓ Unterschrieben</span>}
              </div>
            </div>
            <button onClick={e => deleteForm(e, f.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#A32D2D', padding:4 }}>
              <IconTrash size={14} />
            </button>
          </div>
        ))}
        {!loading && forms.length === 0 && (
          <div style={{ textAlign:'center', padding:32, color:'#888780', fontSize:13 }}>
            Noch keine Formulare
          </div>
        )}
      </div>

      {showPicker && (
        <div className="modal-overlay">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span style={{ fontWeight:500 }}>Formular wählen</span>
              <button className="btn btn-sm" onClick={() => setShowPicker(false)}>X</button>
            </div>
            <div className="modal-body">
              {templates.map(t => (
                <button key={t.id} className="card"
                  onClick={() => { setShowPicker(false); navigate('/formulare/' + projectId + '/neu/' + t.id) }}
                  style={{ width:'100%', padding:'12px 14px', display:'flex', alignItems:'center', gap:10, border:'none', cursor:'pointer', textAlign:'left', marginBottom:6 }}>
                  <IconClipboardList size={18} color="#1D9E75" />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{t.name}</div>
                    {t.description && <div style={{ fontSize:11, color:'#888780' }}>{t.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoTab({ project }) {
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          ['Projektnummer', project.project_number || '-'],
          ['Typ', TYPES[project.project_type] || project.project_type],
          ['Status', project.status],
          ['Start', project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : '-'],
          ['Ende',  project.end_date   ? new Date(project.end_date).toLocaleDateString('de-DE')   : '-'],
          ['Adresse', project.address || '-'],
          ['PLZ / Ort', (project.zip || '') + ' ' + (project.city || '')],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize:11, color:'#888780', marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:500 }}>{v || '-'}</div>
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

export default function Projekte() {
  return (
    <Routes>
      <Route index      element={<ProjektListe />} />
      <Route path=":id" element={<ProjektDetail />} />
    </Routes>
  )
}
