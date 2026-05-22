import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  IconHome2, IconFolderFilled, IconNotebook, IconSparkles,
  IconLogout, IconTool, IconUsersGroup, IconKey, IconBook,
  IconSettings, IconBooks
} from '@tabler/icons-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  function handleLogout() { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'
  const firstName = user?.name?.split(' ')[0] || ''

  const tabs = [
    { to: '/',             icon: IconHome2,       label: 'Start',    end: true  },
    { to: '/projekte',     icon: IconFolderFilled, label: 'Projekte'            },
    { to: '/doku',         icon: IconNotebook,     label: 'Doku'                },
    { to: '/wiki',         icon: IconBook,         label: 'Wiki'                },
    { to: '/zugangscodes', icon: IconKey,          label: 'Codes'               },
    { to: '/dokumente',    icon: IconBooks,        label: 'Docs'                },
    { to: '/berichte',     icon: IconSparkles,     label: 'KI'                  },
    ...(user?.role === 'admin' ? [
      { to: '/benutzer',      icon: IconUsersGroup, label: 'Team'   },
      { to: '/einstellungen', icon: IconSettings,   label: 'Config' },
    ] : []),
  ]

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <IconTool size={18} color="#fff" />
        </div>
        <div>
          <div className="app-brand-name">Beck Connect</div>
          <div className="app-brand-sub">Beck Sanitär GmbH</div>
        </div>
        <div className="header-spacer" />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {firstName && (
            <div style={{ fontSize:12, color:'var(--text-3)', display:'none' }} className="desktop-only">
              {firstName}
            </div>
          )}
          <div className="avatar">{initials}</div>
          <button className="header-btn" onClick={handleLogout} title="Abmelden">
            <IconLogout size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className="nav-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <div className="nav-label">{label}</div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
