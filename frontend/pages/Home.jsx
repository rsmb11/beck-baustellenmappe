import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import {
  IconCameraPlus, IconUpload, IconBook, IconSparkles,
  IconFlame, IconDroplet, IconTool, IconFolder,
  IconChevronRight, IconBolt, IconFiles, IconBuildingWarehouse
} from '@tabler/icons-react'

const TYPE_CONFIG = {
  heizung:  { bg: '#FEF2F2', color: '#DC2626', accent: '#DC2626', icon: IconFlame   },
  sanitaer: { bg: '#EFF6FF', color: '#2563EB', accent: '#2563EB', icon: IconDroplet },
  klima:    { bg: '#FFFBEB', color: '#D97706', accent: '#D97706', icon: IconTool    },
  wartung:  { bg: '#F8FAFC', color: '#64748B', accent: '#64748B', icon: IconTool    },
}

const STATUS_ACCENT = {
  aktiv:         '#0EA472',
  geplant:       '#2563EB',
  abgeschlossen: '#94A3B8',
  pausiert:      '#D97706',
}

export default function Home() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [projects, setProjects] = useState([])
  const [stats, setStats]       = useState({ projekte: 0, wiki: 0, dateien: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/wiki')])
      .then(([p, w]) => {
        const aktive = p.data.filter(x => x.status === 'aktiv')
        setProjects(aktive.slice(0, 5))
        setStats({
          projekte: aktive.length,
          wiki:     w.data.length,
          dateien:  p.data.reduce((s, x) => s + (parseInt(x.file_count) || 0), 0),
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend'
  const dateStr  = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const firstName = user?.name?.split(' ')[0] || ''

  const quickActions = [
    { icon: IconCameraPlus, label: 'Foto + Notiz',    sub: 'Dokumentation',   bg: 'var(--teal-faint)',  ic: 'var(--teal)',  action: () => navigate('/doku')     },
    { icon: IconBook,       label: 'Störungs-Wiki',   sub: 'Fehlercodes',     bg: '#FFFBEB',             ic: '#D97706',      action: () => navigate('/wiki')     },
    { icon: IconUpload,     label: 'Datei hochladen', sub: 'Dateiverwaltung', bg: '#EFF6FF',             ic: '#2563EB',      action: () => navigate('/projekte') },
    { icon: IconSparkles,   label: 'KI-Bericht',      sub: 'Zusammenfassung', bg: '#F5F3FF',             ic: '#7C3AED',      action: () => navigate('/berichte') },
  ]

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)',
        padding: '20px 16px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(14,164,114,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:60, width:80, height:80, borderRadius:'50%', background:'rgba(14,164,114,0.05)', pointerEvents:'none' }} />

        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{dateStr}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {greeting}{firstName ? `, ${firstName}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
          {stats.projekte > 0 ? `${stats.projekte} aktive Baustelle${stats.projekte !== 1 ? 'n' : ''}` : 'Keine aktiven Baustellen'}
        </div>
      </div>

      {/* Stats — floating over hero */}
      <div style={{ padding: '0 16px', marginTop: -1 }}>
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {[
            { label: 'Aktiv',   value: stats.projekte, color: 'var(--teal)',  icon: IconBolt  },
            { label: 'Wiki',    value: stats.wiki,     color: '#D97706',      icon: IconBook  },
            { label: 'Dateien', value: stats.dateien,  color: '#2563EB',      icon: IconFiles },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '16px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="section-header">
          <div className="section-label">Schnellzugriff</div>
        </div>
        <div className="grid-2 stagger" style={{ marginBottom: 24 }}>
          {quickActions.map(({ icon: Icon, label, sub, bg, ic, action }) => (
            <button key={label} className="quick-action" onClick={action}>
              <div className="quick-action-icon" style={{ background: bg }}>
                <Icon size={20} color={ic} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Projects */}
        <div className="section-header">
          <div className="section-label">Aktive Baustellen</div>
          <button
            onClick={() => navigate('/projekte')}
            style={{ display:'flex', alignItems:'center', gap:2, fontSize:12, color:'var(--teal)', fontWeight:500, background:'none', border:'none', cursor:'pointer' }}
          >
            Alle <IconChevronRight size={14} />
          </button>
        </div>

        {loading && <div className="page-loading"><div className="spinner" /></div>}

        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => {
            const cfg = TYPE_CONFIG[p.project_type] || TYPE_CONFIG.wartung
            const Icon = cfg.icon
            const accent = STATUS_ACCENT[p.status] || '#94A3B8'
            const progress = Math.min(100, Math.max(10, (parseInt(p.file_count) || 0) * 8))

            return (
              <button
                key={p.id}
                className="project-card"
                onClick={() => navigate(`/projekte/${p.id}`)}
              >
                {/* Accent bar */}
                <div className="project-card-accent" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

                <div className="project-card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} color={cfg.color} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        {p.project_number && (
                          <span className="mono" style={{ fontSize:10, background:'var(--surface)', color:'var(--text-3)', padding:'1px 6px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', flexShrink:0 }}>
                            {p.project_number}
                          </span>
                        )}
                        <div style={{ fontSize: 14, fontWeight: 600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                          {p.title}
                        </div>
                      </div>
                      {(p.address || p.city) && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.address}{p.city ? `, ${p.city}` : ''}
                        </div>
                      )}

                      {/* Progress */}
                      <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                          {p.file_count} Dateien
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <span className={`pill pill-${p.status}`}>{p.status}</span>
                  </div>
                </div>
              </button>
            )
          })}

          {!loading && projects.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">
                  <IconBuildingWarehouse size={24} color="var(--text-3)" />
                </div>
                <div className="empty-title">Keine aktiven Projekte</div>
                <div className="empty-sub">Erstelle dein erstes Projekt unter "Projekte"</div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/projekte')}>
                  Projekt anlegen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
