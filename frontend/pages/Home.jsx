import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import { IconCameraPlus, IconUpload, IconFileDescription, IconSparkles, IconHomeFilled, IconDroplet, IconFlame, IconTool } from '@tabler/icons-react'

const TYPE_ICONS = { heizung: IconFlame, sanitaer: IconDroplet, klima: IconTool, wartung: IconTool }
const TYPE_COLORS = { heizung:'#FCEBEB', sanitaer:'#E6F1FB', klima:'#FAEEDA', wartung:'#F1EFE8' }
const TYPE_IC = { heizung:'#A32D2D', sanitaer:'#185FA5', klima:'#854F0B', wartung:'#5F5E5A' }

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.filter(p => p.status === 'aktiv').slice(0,4))).finally(() => setLoading(false))
  }, [])

  const now = new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div style={{ padding:14 }}>
      {/* Greeting */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:600 }}>{greeting}, {user?.name?.split(' ')[0]}</div>
        <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>{now}</div>
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:20 }}>
        {[
          { icon: IconCameraPlus,     label:'Foto + Notiz',  action:() => navigate('/doku') },
          { icon: IconUpload,         label:'Datei hochladen', action:() => navigate('/dateien') },
          { icon: IconFileDescription,label:'Rapport',       action:() => navigate('/doku') },
          { icon: IconSparkles,       label:'KI-Bericht',    action:() => navigate('/berichte') },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} className="card" onClick={action}
            style={{ padding:'12px 6px', textAlign:'center', border:'none', cursor:'pointer', transition:'all 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#DDD8D0'}>
            <Icon size={22} color="#1D9E75" style={{ display:'block', margin:'0 auto 6px' }} />
            <span style={{ fontSize:11, color:'#5F5E5A' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Active projects */}
      <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
        Aktive Baustellen
      </div>

      {loading && <div style={{ textAlign:'center', padding:24 }}><div className="spinner" /></div>}

      {!loading && projects.length === 0 && (
        <div className="card" style={{ padding:24, textAlign:'center', color:'#888780' }}>
          Keine aktiven Projekte
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {projects.map(p => {
          const Icon = TYPE_ICONS[p.project_type] || IconHomeFilled
          const bg   = TYPE_COLORS[p.project_type] || '#E1F5EE'
          const ic   = TYPE_IC[p.project_type]     || '#0F6E56'
          return (
            <button key={p.id} className="card" onClick={() => navigate(`/projekte/${p.id}`)}
              style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={ic} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                <div style={{ fontSize:11, color:'#888780', marginTop:2 }}>{p.address}{p.city ? `, ${p.city}` : ''}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <span className={`pill pill-${p.status}`}>{p.status}</span>
                <div style={{ fontSize:10, color:'#888780' }}>
                  {p.file_count} Dateien · {p.entry_count} Einträge
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {projects.length > 0 && (
        <button className="btn" style={{ width:'100%', justifyContent:'center', marginTop:10 }} onClick={() => navigate('/projekte')}>
          Alle Projekte anzeigen
        </button>
      )}
    </div>
  )
}
