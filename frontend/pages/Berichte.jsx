import { useEffect, useState } from 'react'
import api from '../api'
import { IconSparkles, IconFileCheck, IconShieldCheck, IconClockBolt, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

const TYPES = [
  { key:'abnahme',        label:'Abnahme-Bericht',        icon:IconFileCheck,    desc:'Zusammenfassung aller Leistungen für Kunde und Akte' },
  { key:'gewaehrleistung',label:'Gewährleistungsdoku',     icon:IconShieldCheck,  desc:'Lückenloser Nachweis für den Gewährleistungsfall' },
  { key:'wartung',        label:'Wartungshistorie',        icon:IconClockBolt,    desc:'Alle Wartungen, Messwerte und Auffälligkeiten' },
]

export default function Berichte() {
  const [projects, setProjects]   = useState([])
  const [selProj, setSelProj]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [resultType, setResultType] = useState('')
  const [history, setHistory]     = useState([])
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    api.get('/projects').then(r => {
      setProjects(r.data)
      if (r.data.length > 0) setSelProj(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (selProj) api.get(`/projects/${selProj}/reports`).then(r => setHistory(r.data))
  }, [selProj, result])

  async function generate(type) {
    if (!selProj) return
    setLoading(true)
    setResult(null)
    setResultType(type)
    try {
      const { data } = await api.post(`/projects/${selProj}/reports`, { report_type: type })
      setResult(data.content)
    } catch (err) {
      setResult('Fehler: ' + (err.response?.data?.error || 'Unbekannter Fehler'))
    } finally { setLoading(false) }
  }

  const proj = projects.find(p => p.id === selProj)

  return (
    <div style={{ padding:14 }}>
      <div style={{ fontSize:17, fontWeight:600, marginBottom:14 }}>KI-Langzeitbericht</div>

      {/* Projekt wählen */}
      <div className="card" style={{ padding:14, marginBottom:14 }}>
        <div style={{ background:'#E1F5EE', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <IconSparkles size={20} color="#0F6E56" />
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'#085041' }}>Automatische Zusammenfassung</div>
            <div style={{ fontSize:11, color:'#0F6E56' }}>KI fasst alle Einträge und Notizen zusammen</div>
          </div>
        </div>

        <label className="label">Projekt auswählen</label>
        <select className="input" style={{ marginBottom:14 }} value={selProj} onChange={e => { setSelProj(e.target.value); setResult(null) }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        {/* Typ-Auswahl */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {TYPES.map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => generate(key)} disabled={loading}
              style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px', borderRadius:10, border:'0.5px solid #DDD8D0', background:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.12s', opacity: loading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor='#1D9E75'; e.currentTarget.style.background='#F7FAF9' }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#DDD8D0'; e.currentTarget.style.background='#fff' }}>
              <div style={{ width:38, height:38, borderRadius:9, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} color="#1D9E75" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:11, color:'#888780', lineHeight:1.4 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding:24, textAlign:'center' }}>
          <div className="spinner" style={{ marginBottom:10 }} />
          <div style={{ fontSize:13, color:'#888780' }}>KI erstellt Zusammenfassung...</div>
        </div>
      )}

      {/* Ergebnis */}
      {result && !loading && (
        <div className="card" style={{ padding:14, marginBottom:14, border:'0.5px solid #9FE1CB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#1D9E75' }} />
            <span style={{ fontSize:12, fontWeight:500, color:'#0F6E56' }}>
              {TYPES.find(t => t.key === resultType)?.label} · {proj?.title}
            </span>
          </div>
          <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap', color:'#1a1a1a' }}
            dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^— /gm, '• ') }} />
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const w = window.open('', '_blank')
              w.document.write(`<pre style="font-family:sans-serif;padding:20px;line-height:1.7">${result}</pre>`)
              w.print()
            }}>Drucken / PDF</button>
            <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(result)}>Kopieren</button>
          </div>
        </div>
      )}

      {/* Historie */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Gespeicherte Berichte</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {history.map(r => (
              <div key={r.id} className="card" style={{ overflow:'hidden' }}>
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{ width:'100%', padding:'11px 14px', display:'flex', alignItems:'center', gap:8, border:'none', background:'none', cursor:'pointer', textAlign:'left' }}>
                  <IconSparkles size={14} color="#1D9E75" />
                  <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{TYPES.find(t => t.key === r.report_type)?.label}</span>
                  <span style={{ fontSize:11, color:'#888780' }}>{new Date(r.created_at).toLocaleDateString('de-DE')}</span>
                  {expanded === r.id ? <IconChevronUp size={14} color="#888780" /> : <IconChevronDown size={14} color="#888780" />}
                </button>
                {expanded === r.id && (
                  <div style={{ padding:'0 14px 14px', fontSize:13, lineHeight:1.7, borderTop:'0.5px solid #DDD8D0', paddingTop:12 }}
                    dangerouslySetInnerHTML={{ __html: r.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
