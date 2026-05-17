import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  IconHome, IconFolder, IconFiles, IconNotebook,
  IconSparkles, IconLogout, IconTool
} from '@tabler/icons-react'

const tabs = [
  { to: '/',         icon: IconHome,      label: 'Start',    end: true },
  { to: '/projekte', icon: IconFolder,    label: 'Projekte' },
  { to: '/dateien',  icon: IconFiles,     label: 'Dateien'  },
  { to: '/doku',     icon: IconNotebook,  label: 'Doku'     },
  { to: '/berichte', icon: IconSparkles,  label: 'KI-Bericht'},
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/login') }

  // Initialen aus Name
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:900, margin:'0 auto' }}>

      {/* Topbar */}
      <div style={{ background:'#fff', borderBottom:'0.5px solid #DDD8D0', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <IconTool size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:500 }}>Beck Sanitär GmbH</div>
          <div style={{ fontSize:11, color:'#888780' }}>Baustellenmappe</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, fontWeight:500 }}>{user?.name}</div>
            <div style={{ fontSize:10, color:'#888780' }}>{user?.role === 'admin' ? 'Administrator' : 'Monteur'}</div>
          </div>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#9FE1CB', color:'#085041', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {initials}
          </div>
          <button className="btn btn-sm" onClick={handleLogout} title="Abmelden" style={{ padding:'5px 8px' }}>
            <IconLogout size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', paddingBottom:64 }}>
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:900, background:'#fff', borderTop:'0.5px solid #DDD8D0', display:'flex', zIndex:100 }}>
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} style={{ flex:1 }}
            className={({ isActive }) => isActive ? 'nav-active' : ''}>
            {({ isActive }) => (
              <div style={{ padding:'8px 4px 6px', textAlign:'center', color: isActive ? '#1D9E75' : '#888780', borderTop: isActive ? '2px solid #1D9E75' : '2px solid transparent', transition:'all 0.12s' }}>
                <Icon size={20} style={{ display:'block', margin:'0 auto 2px' }} />
                <div style={{ fontSize:10, fontWeight: isActive ? 500 : 400 }}>{label}</div>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
