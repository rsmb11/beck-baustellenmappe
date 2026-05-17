import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('E-Mail oder Passwort falsch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F7F4F0', padding:16 }}>
      <div style={{ width:'100%', maxWidth:380 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'#1D9E75', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div style={{ fontSize:18, fontWeight:600 }}>Beck Sanitär</div>
          <div style={{ fontSize:13, color:'#888780', marginTop:3 }}>Digitale Baustellenmappe</div>
        </div>

        <div className="card" style={{ padding:24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label className="label">E-Mail</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@becksanitaer.de" required autoFocus />
            </div>
            <div style={{ marginBottom:20 }}>
              <label className="label">Passwort</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            {error && (
              <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13, marginBottom:14 }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px 16px', fontSize:14 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
