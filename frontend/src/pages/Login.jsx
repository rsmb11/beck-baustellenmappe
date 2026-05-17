import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { IconTool } from '@tabler/icons-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch { setError('E-Mail oder Passwort falsch') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#111816' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IconTool size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:500, color:'#E8EDE9' }}>Beck Connect</div>
          <div style={{ fontSize:11, color:'#6B7A72' }}>Beck Sanitär GmbH</div>
        </div>
      </div>

      {/* Login Card */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ marginBottom:28, textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:500, color:'#E8EDE9', marginBottom:6 }}>Willkommen zurück</div>
            <div style={{ fontSize:13, color:'#6B7A72' }}>Melde dich mit deinen Zugangsdaten an</div>
          </div>

          <div style={{ background:'#1A1F1E', border:'0.5px solid #232927', borderRadius:16, padding:24 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14 }}>
                <label className="label" style={{ color:'#9FE1CB' }}>E-Mail</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@becksanitaer.de" required autoFocus
                  style={{ background:'#111816', border:'0.5px solid #232927', color:'#E8EDE9' }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label className="label" style={{ color:'#9FE1CB' }}>Passwort</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ background:'#111816', border:'0.5px solid #232927', color:'#E8EDE9' }} />
              </div>
              {error && (
                <div style={{ background:'rgba(163,45,45,0.2)', color:'#F09595', padding:'8px 12px', borderRadius:10, fontSize:13, marginBottom:14 }}>
                  {error}
                </div>
              )}
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 16px', fontSize:14 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width:16,height:16 }} /> : 'Anmelden'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px', textAlign:'center', fontSize:11, color:'#6B7A72' }}>
        Beck Connect · Beck Sanitär GmbH
      </div>
    </div>
  )
}
