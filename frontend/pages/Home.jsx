import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import { IconCameraPlus, IconUpload, IconBook, IconSparkles, IconFlame, IconDroplet, IconTool, IconFolder, IconChevronRight } from '@tabler/icons-react'

const TYPE_IC = {
  heizung:  ['#FCEBEB','#A32D2D', IconFlame],
  sanitaer: ['#E6F1FB','#185FA5', IconDroplet],
  klima:    ['#FAEEDA','#854F0B', IconTool],
  wartung:  ['#F1EFE8','#5F5E5A', IconTool],
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [stats, setStats]       = useState({ projekte:0, wiki:0, dateien:0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/wiki'),
    ]).then(([p, w]) => {
      const aktive = p.data.filter(x => x.status === 'aktiv')
      setProjects(aktive.slice(0, 4))
      setStats({
        projekte: aktive.length,
        wiki:     w.data.length,
        dateien:  p.data.reduce((s, x) => s + (parseInt(x.file_count)||0), 0)
      })
    }).finally(() => setLoading(false))
  }, [])

  const now     = new Date()
  const hour    = now.getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend'
  const dateStr  = now.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })
  const firstName = user?.name?.split(' ')[0] || 'Admin'

  return (
    <div style={{ padding:'14px 14px 0' }}>

      {/* Greeting */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:500 }}>{greeting}, {firstName}</div>
        <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>{dateStr}</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
        {[
          { label:'Aktive Projekte', val: stats.projekte, color:'#1D9E75' },
          { label:'Wiki Einträge',   val: stats.wiki,     color:'#854F0B' },
          { label:'Dateien gesamt',  val: stats.dateien,  color:'#185FA5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'10px 10px 8px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:500, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:9, color:'#888780', marginTop:2, lineHeight:1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ fontSize:10, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Schnellzugriff</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
        {[
          { icon: IconCameraPlus, label:'Foto + Notiz',    sub:'Dokumentation',   bg:'#E1F5EE', ic:'#0F6E56', action:() => navigate('/doku') },
          { icon: IconBook,       label:'Störungs-Wiki',   sub:'Fehlercodes',     bg:'#FAEEDA', ic:'#854F0B', action:() => navigate('/wiki') },
          { icon: IconUpload,     label:'Datei hochladen', sub:'Dateiverwaltung', bg:'#E6F1FB', ic:'#185FA5', action:() => navigate('/projekte') },
          { icon: IconSparkles,   label:'KI-Bericht',      sub:'Zusammenfassung', bg:'#F0EAFB', ic:'#6B3FA0', action:() => navigate('/berichte') },
        ].map(({ icon: Icon, label, sub, bg, ic, action }) => (
          <button key={label} className="card" onClick={action}
            style={{ padding:'12px', display:'flex', alignItems:'center', gap:10, border:'none', cursor:'pointer', textAlign:'left', transition:'all 0.12s' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={ic} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{label}</div>
              <div style={{ fontSize:10, color:'#888780', marginTop:1 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Projects */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:10, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em' }}>Aktive Baustellen</div>
        <button onClick={() => navigate('/projekte')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#1D9E75', display:'flex', alignItems:'center', gap:2 }}>
          Alle <IconChevronRight size={12} />
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {projects.map(p => {
          const [bg, ic, Icon] = TYPE_IC[p.project_type] || ['#E1F5EE','#0F6E56', IconFolder]
          return (
            <button key={p.id} className="card" onClick={() => navigate(`/projekte/${p.id}`)}
              style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={ic} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {p.project_number && (
                    <span style={{ fontSize:10, background:'#F5F3EF', color:'#888780', padding:'1px 6px', borderRadius:5, fontFamily:'monospace', flexShrink:0 }}>
                      {p.project_number}
                    </span>
                  )}
                  <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                </div>
                <div style={{ fontSize:11, color:'#888780', marginTop:2 }}>{p.address}{p.city ? `, ${p.city}` : ''}</div>
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <span className="pill pill-aktiv">Aktiv</span>
                <div style={{ fontSize:10, color:'#888780' }}>{p.file_count} Dateien</div>
              </div>
            </button>
          )
        })}
        {!loading && projects.length === 0 && (
          <div className="card" style={{ padding:32, textAlign:'center', color:'#888780' }}>
            Keine aktiven Projekte
          </div>
        )}
      </div>
    </div>
  )
}
