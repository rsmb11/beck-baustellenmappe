import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  IconHome, IconFolder, IconNotebook, IconSparkles,
  IconLogout, IconTool, IconUsers, IconKey, IconBook,
  IconSettings, IconArchive
} from '@tabler/icons-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'

  const tabs = [
    { to: '/',             icon: IconHome,     label: 'Start',    end: true },
    { to: '/projekte',     icon: IconFolder,   label: 'Projekte' },
    { to: '/doku',         icon: IconNotebook, label: 'Doku'     },
    { to: '/wiki',         icon: IconBook,     label: 'Wiki'     },
    { to: '/zugangscodes', icon: IconKey,      label: 'Codes'    },
    { to: '/berichte',     icon: IconSparkles, label: 'KI'       },
    ...(user?.role === 'admin' ? [
      { to: '/benutzer',      icon: IconUsers,    label: 'Benutzer' },
      { to: '/einstellungen', icon: IconSettings, label: 'Config'   },
    ] : []),
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:960, margin:'0 auto' }}>

      {/* Header — dunkel */}
      <div style={{ background:'#111816', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <IconTool size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:'#E8EDE9' }}>Beck Connect</div>
          <div style={{ fontSize:10, color:'#6B7A72' }}>Beck Sanitär GmbH</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right', display:'none' }} className="hide-sm">
            <div style={{ fontSize:12, fontWeight:500, color:'#E8EDE9' }}>{user?.name}</div>
            <div style={{ fontSize:10, color:'#6B7A72' }}>{user?.role === 'admin' ? 'Administrator' : 'Monteur'}</div>
          </div>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#1D9E75', color:'#fff', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {initials}
          </div>
          <button onClick={handleLogout} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:8, color:'#6B7A72' }} title="Abmelden">
            <IconLogout size={18} color="#6B7A72" />
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflow:'auto', paddingBottom:68 }}>
        <Outlet />
      </div>

      {/* Bottom Nav — dunkel */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:960, background:'#111816', display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} style={{ flex:1 }}>
            {({ isActive }) => (
              <div style={{ padding:'8px 4px 6px', textAlign:'center', color: isActive ? '#1D9E75' : '#6B7A72', borderTop: isActive ? '2px solid #1D9E75' : '2px solid transparent', transition:'all 0.12s' }}>
                <Icon size={20} style={{ display:'block', margin:'0 auto 2px' }} />
                <div style={{ fontSize:9, fontWeight: isActive ? 500 : 400 }}>{label}</div>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
