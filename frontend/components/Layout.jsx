import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  IconHome2, IconFolderFilled, IconNotebook, IconSparkles,
  IconLogout, IconTool, IconUsersGroup, IconKey, IconBook,
  IconSettings, IconBooks, IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand
} from '@tabler/icons-react'

const TABS = (role) => [
  { to:'/',             icon:IconHome2,        label:'Dashboard', end:true  },
  { to:'/projekte',     icon:IconFolderFilled,  label:'Projekte'             },
  { to:'/doku',         icon:IconNotebook,      label:'Doku'                 },
  { to:'/wiki',         icon:IconBook,          label:'Wiki'                 },
  { to:'/zugangscodes', icon:IconKey,           label:'Codes'                },
  { to:'/dokumente',    icon:IconBooks,         label:'Docs'                 },
  { to:'/berichte',     icon:IconSparkles,      label:'KI'                   },
  ...(role === 'admin' ? [
    { to:'/benutzer',      icon:IconUsersGroup, label:'Team'   },
    { to:'/einstellungen', icon:IconSettings,   label:'Config' },
  ] : []),
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'
  const firstName = user?.name?.split(' ')[0] || ''
  const tabs = TABS(user?.role)

  return (
    <div className="app-shell">

      {/* ── Mobile Header ── */}
      <header className="app-header">
        <div className="app-logo">
          <IconTool size={17} color="#fff" />
        </div>
        <div>
          <div className="app-brand-name">Beck Connect</div>
          <div className="app-brand-sub">Beck Sanitär GmbH</div>
        </div>
        <div className="header-spacer" />
        <div className="avatar">{initials}</div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Abmelden">
          <IconLogout size={16} />
        </button>
      </header>

      {/* ── Desktop Sidebar ── */}
      <aside className={`sidebar${expanded ? ' expanded' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">
            <IconTool size={16} color="#fff" />
          </div>
          {expanded && (
            <div>
              <div className="sidebar-brand">Beck Connect</div>
              <div className="sidebar-sub">Beck Sanitär GmbH</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              title={!expanded ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} strokeWidth={isActive ? 2.1 : 1.7} />
                  {expanded && <span className="sidebar-label">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Avatar */}
          <div className="sidebar-avatar">
            <div className="sidebar-avatar-badge">{initials}</div>
            {expanded && (
              <div>
                <div className="sidebar-avatar-name">{user?.name || firstName}</div>
                <div className="sidebar-avatar-role">{user?.role === 'admin' ? 'Admin' : 'Monteur'}</div>
              </div>
            )}
          </div>

          {/* Toggle */}
          <div
            className="sidebar-toggle-btn"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Einklappen' : 'Ausklappen'}
          >
            {expanded
              ? <IconLayoutSidebarLeftCollapse size={18} strokeWidth={1.7} />
              : <IconLayoutSidebarLeftExpand  size={18} strokeWidth={1.7} />
            }
          </div>

          {/* Logout — nur wenn expanded */}
          {expanded && (
            <div className="sidebar-logout" onClick={handleLogout}>
              <IconLogout size={17} strokeWidth={1.7} />
              <span>Abmelden</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav (max 6 Tabs) ── */}
      <nav className="bottom-nav">
        {tabs.slice(0, 6).map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={label}
          >
            {({ isActive }) => (
              <Icon size={22} strokeWidth={isActive ? 2.1 : 1.6} />
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
