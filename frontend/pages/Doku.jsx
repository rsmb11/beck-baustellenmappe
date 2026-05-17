import { useEffect, useState } from 'react'
import api from '../api'

export default function Doku() {
  const [projects, setProjects] = useState([])
  const [selProj, setSelProj]   = useState('')
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [text, setText]         = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    api.get('/projects').then(r => {
      const aktive = r.data.filter(p => p.status === 'aktiv')
      setProjects(r.data)
      if (aktive.length > 0) setSelProj(aktive[0].id)
      else if (r.data.length > 0) setSelProj(r.data[0].id)
    })
  }, [])

  useEffect(() => { if (selProj) loadEntries() }, [selProj])

  async function loadEntries() {
    setLoading(true)
    try { const r = await api.get(`/projects/${selProj}/entries`); setEntries(r.data) }
    finally { setLoading(false) }
  }

  async function saveEntry() {
    if (!text.trim() || !selProj) return
    setSaving(true)
    try {
      await api.post(`/projects/${selProj}/entries`, { content: text })
      setText('')
      await loadEntries()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Dokumentation</div>
        <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }}
          value={selProj} onChange={e => setSelProj(e.target.value)}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* Neuer Eintrag */}
      <div className="card" style={{ padding:12, marginBottom:14 }}>
        <div style={{ fontSize:12, color:'#888780', marginBottom:6 }}>Neuer Eintrag</div>
        <textarea className="input" rows={4} value={text} onChange={e => setText(e.target.value)}
          placeholder="Was wurde heute gemacht? Materialien, Messwerte, Besonderheiten, nächste Schritte..." />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn btn-primary btn-sm" onClick={saveEntry} disabled={saving || !text.trim() || !selProj}>
            {saving ? <span className="spinner" style={{ width:12, height:12 }} /> : 'Eintrag speichern'}
          </button>
        </div>
      </div>

      {/* Einträge */}
      <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Bautagebuch</div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {entries.map(e => (
          <div key={e.id} className="card" style={{ padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1D9E75', flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>{e.author_name}</span>
              <span style={{ fontSize:11, color:'#888780' }}>
                {new Date(e.entry_date).toLocaleDateString('de-DE', { weekday:'short', day:'numeric', month:'short' })}
              </span>
              {e.files?.length > 0 && (
                <span style={{ marginLeft:'auto', fontSize:10, background:'#E6F1FB', color:'#185FA5', padding:'1px 7px', borderRadius:20 }}>
                  📎 {e.files.length} Dateien
                </span>
              )}
            </div>
            <div style={{ fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{e.content}</div>
          </div>
        ))}
        {!loading && entries.length === 0 && (
          <div style={{ textAlign:'center', padding:32, color:'#888780', fontSize:13 }}>
            {selProj ? 'Noch keine Einträge für dieses Projekt' : 'Kein Projekt ausgewählt'}
          </div>
        )}
      </div>
    </div>
  )
}
