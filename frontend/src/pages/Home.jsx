import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import {
  IconCameraPlus, IconUpload, IconBook, IconSparkles,
  IconFlame, IconDroplet, IconTool, IconChevronRight,
  IconAlertTriangle, IconBuilding
} from '@tabler/icons-react'

const TYPE_CFG = {
  heizung:  { bg:'rgba(239,68,68,0.1)',    border:'rgba(239,68,68,0.2)',    a:'#EF4444', l:'#FCA5A5', icon:IconFlame   },
  sanitaer: { bg:'rgba(59,130,246,0.1)',   border:'rgba(59,130,246,0.2)',   a:'#3B82F6', l:'#93C5FD', icon:IconDroplet },
  klima:    { bg:'rgba(245,158,11,0.1)',   border:'rgba(245,158,11,0.2)',   a:'#F59E0B', l:'#FCD34D', icon:IconTool    },
  wartung:  { bg:'rgba(139,92,246,0.1)',   border:'rgba(139,92,246,0.2)',   a:'#8B5CF6', l:'#C4B5FD', icon:IconTool    },
}

function ageColor(file) {
  if (!file) return '#5C6270'
  const d = file.days_ago || 0
  if (d <= 1) return '#10B981'
  if (d <= 7) return '#F59E0B'
  return '#EF4444'
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [stats,    setStats]    = useState({ projekte:0, wiki:0, dateien:0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/wiki')])
      .then(([p, w]) => {
        const aktive = p.data.filter(x => x.status === 'aktiv')
        setProjects(aktive.slice(0, 6))
        setStats({
          projekte: aktive.length,
          wiki:     w.data.length,
          dateien:  p.data.reduce((s,x) => s + (parseInt(x.file_count)||0), 0),
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : 'Guten Abend'
  const dateStr  = new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })
  const name     = user?.name?.split(' ')[0] || ''

  const quick = [
    { icon:IconCameraPlus, label:'Foto + Notiz',  sub:'Dokumentieren',  c:'rgba(16,185,129,0.12)', b:'rgba(16,185,129,0.22)', ic:'#34D399', go:'/doku'     },
    { icon:IconBook,       label:'Störungs-Wiki', sub:'Fehlercodes',    c:'rgba(245,158,11,0.12)', b:'rgba(245,158,11,0.22)', ic:'#FCD34D', go:'/wiki'     },
    { icon:IconUpload,     label:'Hochladen',     sub:'Dateien',        c:'rgba(59,130,246,0.12)', b:'rgba(59,130,246,0.22)', ic:'#93C5FD', go:'/projekte' },
    { icon:IconSparkles,   label:'KI-Bericht',    sub:'Generieren',     c:'rgba(139,92,246,0.12)', b:'rgba(139,92,246,0.22)', ic:'#C4B5FD', go:'/berichte' },
  ]

  const warnCount = projects.filter(p => !p.file_count || parseInt(p.file_count) === 0).length

  return (
    <div style={{ padding:'20px 16px', maxWidth:900 }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4, fontWeight:500, letterSpacing:'0.03em', textTransform:'uppercase' }}>
          {dateStr}
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1.2 }}>
          {greeting}{name ? `, ${name}` : ''}
        </h1>
        <div style={{ fontSize:13, color:'var(--text-2)', marginTop:5, display:'flex', alignItems:'center', gap:12 }}>
          <span>{loading ? '…' : `${stats.projekte} aktive Baustelle${stats.projekte !== 1 ? 'n' : ''}`}</span>
          {warnCount > 0 && !loading && (
            <span style={{ display:'flex', alignItems:'center', gap:4, color:'#FCA5A5', fontSize:12 }}>
              <IconAlertTriangle size={12} />
              {warnCount} ohne Dateien
            </span>
          )}
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:24 }}>
        {[
          { label:'Aktiv',   val:stats.projekte, color:'#34D399', sub:'Projekte' },
          { label:'Wiki',    val:stats.wiki,     color:'#FCD34D', sub:'Einträge' },
          { label:'Dateien', val:stats.dateien,  color:'#93C5FD', sub:'Gesamt'  },
        ].map(s => (
          <div key={s.label} style={{
            background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
            padding:'14px 12px', textAlign:'center', boxShadow:'var(--shadow-xs)',
            transition:'all var(--t-med) var(--ease)',
          }}>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, letterSpacing:'-0.05em', lineHeight:1 }}>
              {loading ? '–' : s.val}
            </div>
            <div style={{ fontSize:10, color:'var(--text-3)', marginTop:5, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="section-header">
        <span className="section-label">Schnellzugriff</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
        {quick.map(({ icon:Icon, label, sub, c, b, ic, go }) => (
          <button
            key={label}
            onClick={() => navigate(go)}
            style={{
              background:c, border:`1px solid ${b}`, borderRadius:'var(--r-lg)',
              padding:'14px', display:'flex', flexDirection:'column', gap:10,
              cursor:'pointer', textAlign:'left',
              transition:'all var(--t-med) var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.15)'; e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter=''; e.currentTarget.style.transform=''; }}
            onMouseDown={e  => { e.currentTarget.style.transform='scale(0.98)'; }}
            onMouseUp={e    => { e.currentTarget.style.transform='translateY(-1px)'; }}
          >
            <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:`${c}`, border:`1px solid ${b}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={19} color={ic} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.01em' }}>{label}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Active Projects ── */}
      <div className="section-header">
        <span className="section-label">Aktive Baustellen</span>
        <button onClick={() => navigate('/projekte')}
          style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'var(--teal)', fontWeight:500, background:'none', border:'none', cursor:'pointer' }}>
          Alle <IconChevronRight size={13} />
        </button>
      </div>

      {/* Skeleton */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height:80, borderRadius:'var(--r-lg)',
              background:'linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%)',
              backgroundSize:'200% 100%',
              animation:'shimmer 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Project Cards */}
      {!loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {projects.map(p => {
            const cfg = TYPE_CFG[p.project_type] || TYPE_CFG.wartung
            const Icon = cfg.icon
            const warn = !p.file_count || parseInt(p.file_count) === 0
            const progress = Math.min(100, Math.max(5, (parseInt(p.file_count)||0) * 8))
            const addr = [p.address, p.city].filter(Boolean).join(', ')

            return (
              <button
                key={p.id}
                onClick={() => navigate(`/projekte/${p.id}`)}
                style={{
                  background:'var(--s2)',
                  border: warn ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                  borderRadius:'var(--r-lg)',
                  overflow:'hidden', cursor:'pointer', textAlign:'left', width:'100%',
                  transition:'all var(--t-med) var(--ease)',
                  boxShadow: warn ? '0 0 0 1px rgba(239,68,68,0.1)' : 'var(--shadow-xs)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--s3)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--s2)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=warn?'0 0 0 1px rgba(239,68,68,0.1)':'var(--shadow-xs)'; }}
              >
                {/* Accent line */}
                <div style={{ height:2, background:`linear-gradient(90deg, ${cfg.a}, ${cfg.l})` }} />

                <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:12 }}>
                  {/* Icon */}
                  <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <Icon size={18} color={cfg.l} />
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                      {p.project_number && (
                        <span style={{ fontSize:9, fontWeight:600, fontFamily:'monospace', color:cfg.l, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:'1px 6px', borderRadius:4, letterSpacing:'0.02em' }}>
                          {p.project_number}
                        </span>
                      )}
                      <span style={{ fontSize:14, fontWeight:600, color:'var(--text)', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.title}
                      </span>
                    </div>

                    {addr && (
                      <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {addr}
                      </div>
                    )}

                    {warn && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:500, color:'#FCA5A5', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'3px 8px', marginBottom:8 }}>
                        <IconAlertTriangle size={10} />
                        Noch keine Dateien
                      </div>
                    )}

                    {/* Progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${cfg.a},${cfg.l})`, borderRadius:'inherit', transition:'width 0.6s var(--ease)' }} />
                      </div>
                      <span style={{ fontSize:10, color:'var(--text-3)', flexShrink:0 }}>{p.file_count||0} Dateien</span>
                    </div>

                    {/* Last file */}
                    {p.last_file_name && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:6, fontSize:10, color:'var(--text-3)' }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:ageColor(p.last_file), flexShrink:0 }} />
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.last_file_name}</span>
                      </div>
                    )}
                  </div>

                  <span className={`pill pill-${p.status}`}>{p.status}</span>
                </div>
              </button>
            )
          })}

          {projects.length === 0 && (
            <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'40px 24px', textAlign:'center' }}>
              <IconBuilding size={32} color="var(--text-3)" style={{ margin:'0 auto 12px', opacity:0.5 }} />
              <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:6 }}>Keine aktiven Projekte</div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Erstelle dein erstes Projekt</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/projekte')}>
                Projekt anlegen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
