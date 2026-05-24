import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import {
  IconCameraPlus, IconUpload, IconBook, IconSparkles,
  IconFlame, IconDroplet, IconTool, IconChevronRight,
  IconBolt, IconFiles, IconBuildingWarehouse
} from '@tabler/icons-react'

const TYPE_CONFIG = {
  heizung:  { bg:'rgba(220,38,38,.14)',  border:'rgba(220,38,38,.22)',  accent:'#dc2626', accentL:'#f87171', icon:IconFlame   },
  sanitaer: { bg:'rgba(37,99,235,.14)',  border:'rgba(37,99,235,.22)',  accent:'#2563eb', accentL:'#60a5fa', icon:IconDroplet },
  klima:    { bg:'rgba(217,119,6,.14)',  border:'rgba(217,119,6,.22)',  accent:'#d97706', accentL:'#fbbf24', icon:IconTool    },
  wartung:  { bg:'rgba(124,58,237,.14)', border:'rgba(124,58,237,.22)', accent:'#7c3aed', accentL:'#a78bfa', icon:IconTool    },
}

export default function Home() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [projects, setProjects] = useState([])
  const [stats, setStats]       = useState({ projekte:0, wiki:0, dateien:0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/wiki')])
      .then(([p, w]) => {
        const aktive = p.data.filter(x => x.status === 'aktiv')
        setProjects(aktive.slice(0, 6))
        setStats({
          projekte: aktive.length,
          wiki:     w.data.length,
          dateien:  p.data.reduce((s, x) => s + (parseInt(x.file_count) || 0), 0),
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend'
  const dateStr   = new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })
  const firstName = user?.name?.split(' ')[0] || ''

  const quickActions = [
    { icon:IconCameraPlus, label:'Foto + Notiz',    sub:'Dokumentation',   bg:'rgba(16,185,129,.15)', border:'rgba(16,185,129,.25)', ic:'#34d399', action:() => navigate('/doku')     },
    { icon:IconBook,       label:'Störungs-Wiki',   sub:'Fehlercodes',     bg:'rgba(245,158,11,.15)', border:'rgba(245,158,11,.25)', ic:'#fbbf24', action:() => navigate('/wiki')     },
    { icon:IconUpload,     label:'Hochladen',       sub:'Dateiverwaltung', bg:'rgba(59,130,246,.15)', border:'rgba(59,130,246,.25)', ic:'#60a5fa', action:() => navigate('/projekte') },
    { icon:IconSparkles,   label:'KI-Bericht',      sub:'Zusammenfassung', bg:'rgba(167,139,250,.15)',border:'rgba(167,139,250,.25)',ic:'#a78bfa', action:() => navigate('/berichte') },
  ]

  return (
    <div style={{ padding:'16px', maxWidth:900 }}>
      {/* Greeting */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:3 }}>{dateStr}</div>
        <div style={{ fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1.2 }}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </div>
        <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>
          {loading ? '…' : stats.projekte > 0
            ? `${stats.projekte} aktive Baustelle${stats.projekte !== 1 ? 'n' : ''}`
            : 'Keine aktiven Baustellen'}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {[
          { label:'Aktiv',   value:stats.projekte, color:'#34d399' },
          { label:'Wiki',    value:stats.wiki,     color:'#fbbf24' },
          { label:'Dateien', value:stats.dateien,  color:'#60a5fa' },
        ].map((s,i) => (
          <div key={s.label} style={{
            background:'rgba(24,24,27,0.8)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:14,
            padding:'14px 10px',
            textAlign:'center',
            backdropFilter:'blur(12px)',
          }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, letterSpacing:'-0.04em', lineHeight:1 }}>
              {loading ? '–' : s.value}
            </div>
            <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions — 4 Kacheln */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div className="section-label">Schnellzugriff</div>
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(2,1fr)',
        gap:10,
        marginBottom:24,
      }}>
        {quickActions.map(({ icon:Icon, label, sub, bg, border, ic, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              background:bg,
              border:`1px solid ${border}`,
              borderRadius:16,
              padding:'14px',
              display:'flex',
              flexDirection:'column',
              gap:10,
              cursor:'pointer',
              transition:'transform .18s, box-shadow .18s',
              textAlign:'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.filter='brightness(1.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.filter='' }}
          >
            <div style={{ width:42, height:42, borderRadius:12, background:`${bg}`, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={21} color={ic} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>{label}</div>
              <div style={{ fontSize:10, color:'var(--text-3)', marginTop:3 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Projects */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div className="section-label">Aktive Baustellen</div>
        <button onClick={() => navigate('/projekte')}
          style={{ display:'flex', alignItems:'center', gap:2, fontSize:12, color:'var(--teal)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
          Alle <IconChevronRight size={14} />
        </button>
      </div>

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2].map(i => (
            <div key={i} style={{ height:90, borderRadius:16, background:'rgba(255,255,255,0.04)', animation:'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {projects.map(p => {
          const cfg = TYPE_CONFIG[p.project_type] || TYPE_CONFIG.wartung
          const Icon = cfg.icon
          const progress = Math.min(100, Math.max(8, (parseInt(p.file_count)||0) * 8))
          const addr = [p.address, p.city].filter(Boolean).join(', ')

          return (
            <button
              key={p.id}
              onClick={() => navigate(`/projekte/${p.id}`)}
              style={{
                background:'rgba(24,24,27,0.8)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:16,
                overflow:'hidden',
                cursor:'pointer',
                backdropFilter:'blur(12px)',
                transition:'all .18s',
                textAlign:'left',
                width:'100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.filter='brightness(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.filter='' }}
            >
              {/* Accent bar */}
              <div style={{ height:3, background:`linear-gradient(90deg,${cfg.accent},${cfg.accentL})` }} />
              <div style={{ padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={19} color={cfg.accentL} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                      {p.project_number && (
                        <span style={{ fontSize:9, fontWeight:700, fontFamily:'monospace', color:cfg.accentL, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:'1px 6px', borderRadius:5 }}>
                          {p.project_number}
                        </span>
                      )}
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.title}
                      </span>
                    </div>
                    {addr && <div style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{addr}</div>}
                    {/* Progress */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                      <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${cfg.accent},${cfg.accentL})`, borderRadius:2 }} />
                      </div>
                      <span style={{ fontSize:10, color:'var(--text-3)', flexShrink:0 }}>{p.file_count} Dateien</span>
                    </div>
                  </div>
                  <span className={`pill pill-${p.status}`}>{p.status}</span>
                </div>
              </div>
            </button>
          )
        })}

        {!loading && projects.length === 0 && (
          <div style={{ background:'rgba(24,24,27,0.8)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px 24px', textAlign:'center' }}>
            <IconBuildingWarehouse size={32} color="var(--text-3)" style={{ margin:'0 auto 12px' }} />
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Keine aktiven Projekte</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Erstelle dein erstes Projekt</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/projekte')}>
              Projekt anlegen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
