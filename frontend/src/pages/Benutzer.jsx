import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  IconUserPlus, IconKey, IconUserOff, IconUserCheck,
  IconShield, IconUser, IconPencil, IconX, IconCheck, IconPlus, IconTrash
} from '@tabler/icons-react'

export default function Benutzer() {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null) // 'new' | 'edit' | 'pw' | 'pw-self'
  const [selUser, setSelUser]   = useState(null)
  const [toast, setToast]       = useState(null)

  // Nur Admin darf diese Seite sehen
  useEffect(() => {
    if (me?.role !== 'admin') { navigate('/'); return }
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try { const r = await api.get('/users'); setUsers(r.data) }
    finally { setLoading(false) }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function toggleActive(u) {
    try {
      if (u.active) {
        await api.delete(`/users/${u.id}`)
        showToast(`${u.name} deaktiviert`)
      } else {
        await api.put(`/users/${u.id}`, { ...u, active: true })
        showToast(`${u.name} aktiviert`)
      }
      loadUsers()
    } catch (err) {
      showToast(err.response?.data?.error || 'Fehler', 'error')
    }
  }

  async function deleteUser(u) {
    if (!confirm(`Benutzer "${u.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return
    try {
      await api.delete(`/users/${u.id}/permanent`)
      showToast(`${u.name} gelöscht`)
      loadUsers()
    } catch (err) { showToast(err.response?.data?.error || 'Fehler', 'error') }
  }

  const initials = u => u.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Benutzerverwaltung</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>
          <IconUserPlus size={14} /> Neuer Benutzer
        </button>
      </div>

      {/* Eigenes Passwort ändern */}
      <div className="card" style={{ padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'#9FE1CB', color:'#085041', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {initials(me)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500 }}>{me?.name} <span style={{ fontSize:11, color:'#1D9E75', fontWeight:400 }}>(ich)</span></div>
          <div style={{ fontSize:11, color:'#888780' }}>{me?.email}</div>
        </div>
        <button className="btn btn-sm" onClick={() => { setSelUser(me); setModal('pw-self') }}>
          <IconKey size={13} /> Passwort ändern
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      {/* Benutzerliste */}
      <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>
        Alle Benutzer ({users.length})
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, opacity: u.active ? 1 : 0.55 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background: u.role === 'admin' ? '#E1F5EE' : '#E6F1FB', color: u.role === 'admin' ? '#0F6E56' : '#185FA5', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {initials(u)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{u.name}</span>
                {u.role === 'admin'
                  ? <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, background:'#E1F5EE', color:'#0F6E56', padding:'1px 7px', borderRadius:20 }}><IconShield size={10} />Admin</span>
                  : <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, background:'#E6F1FB', color:'#185FA5', padding:'1px 7px', borderRadius:20 }}><IconUser size={10} />Monteur</span>
                }
                {!u.active && <span style={{ fontSize:10, background:'#F1EFE8', color:'#5F5E5A', padding:'1px 7px', borderRadius:20 }}>Inaktiv</span>}
              </div>
              <div style={{ fontSize:11, color:'#888780', marginTop:2 }}>{u.email}</div>
            </div>
            {u.id !== me?.id && (
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="btn btn-sm" title="Bearbeiten" onClick={() => { setSelUser(u); setModal('edit') }}>
                  <IconPencil size={13} />
                </button>
                <button className="btn btn-sm" title="Passwort setzen" onClick={() => { setSelUser(u); setModal('pw') }}>
                  <IconKey size={13} />
                </button>
                <button className="btn btn-sm" title={u.active ? 'Deaktivieren' : 'Aktivieren'} onClick={() => toggleActive(u)}
                  style={{ color: u.active ? '#A32D2D' : '#1D9E75' }}>
                  {u.active ? <IconUserOff size={13} /> : <IconUserCheck size={13} />}
                </button>
                <button className="btn btn-sm" title="Löschen" onClick={() => deleteUser(u)}
                  style={{ color:'#A32D2D' }}>
                  <IconTrash size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      <GruppenVerwaltung />

      {modal === "new"     && <NeuerBenutzerModal     onClose={() => setModal(null)} onSave={() => { loadUsers(); setModal(null); showToast('Benutzer angelegt') }} />}
      {modal === 'edit'    && <BenutzerEditModal      user={selUser} onClose={() => setModal(null)} onSave={() => { loadUsers(); setModal(null); showToast('Gespeichert') }} />}
      {modal === 'pw'      && <PasswortModal          user={selUser} adminMode onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Passwort geändert') }} />}
      {modal === 'pw-self' && <PasswortModal          user={selUser} onClose={() => setModal(null)} onSave={() => { setModal(null); showToast('Passwort geändert') }} />}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

// ── Neuer Benutzer Modal ──────────────────────────────────────────────────────
function NeuerBenutzerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'monteur' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.name || !form.email || !form.password) { setError('Alle Pflichtfelder ausfüllen'); return }
    setSaving(true); setError('')
    try { await api.post('/users', form); onSave() }
    catch (err) { setError(err.response?.data?.error || 'Fehler') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Neuer Benutzer</span>
          <button className="btn btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Vor- und Nachname" /></div>
          <div><label className="label">E-Mail *</label><input className="input" type="email" value={form.email} onChange={set('email')} placeholder="name@becksanitaer.de" /></div>
          <div><label className="label">Passwort *</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Mindestens 6 Zeichen" /></div>
          <div><label className="label">Rolle</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="monteur">Monteur</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:14,height:14 }} /> : 'Anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Benutzer bearbeiten Modal ─────────────────────────────────────────────────
function BenutzerEditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role, active: user.active })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true); setError('')
    try { await api.put(`/users/${user.id}`, form); onSave() }
    catch (err) { setError(err.response?.data?.error || 'Fehler') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Benutzer bearbeiten</span>
          <button className="btn btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div><label className="label">E-Mail</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Rolle</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="monteur">Monteur</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:14,height:14 }} /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Passwort Modal ────────────────────────────────────────────────────────────
function PasswortModal({ user, adminMode, onClose, onSave }) {
  const [oldPw, setOldPw]   = useState('')
  const [newPw, setNewPw]   = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    if (newPw.length < 6)       { setError('Mindestens 6 Zeichen'); return }
    if (newPw !== newPw2)       { setError('Passwörter stimmen nicht überein'); return }
    if (!adminMode && !oldPw)   { setError('Altes Passwort erforderlich'); return }
    setSaving(true); setError('')
    try {
      await api.put(`/users/${user.id}/password`, { old_password: oldPw, new_password: newPw })
      onSave()
    } catch (err) { setError(err.response?.data?.error || 'Fehler') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>Passwort {adminMode ? `von ${user.name} ` : ''}ändern</span>
          <button className="btn btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          {!adminMode && (
            <div><label className="label">Aktuelles Passwort</label>
              <input className="input" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          <div><label className="label">Neues Passwort</label>
            <input className="input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mindestens 6 Zeichen" />
          </div>
          <div><label className="label">Neues Passwort wiederholen</label>
            <input className="input" type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{error}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:14,height:14 }} /> : <><IconCheck size={13} /> Speichern</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Gruppen-Verwaltung (wird am Ende der Benutzer-Seite angehängt) ────────────
export function GruppenVerwaltung() {
  const [groups, setGroups]   = useState([])
  const [users, setUsers]     = useState([])
  const [selGroup, setSelGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [toast, setToast]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/groups'), api.get('/users')])
      .then(([g, u]) => { setGroups(g.data); setUsers(u.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selGroup) {
      api.get(`/groups/${selGroup.id}/members`).then(r => setMembers(r.data))
    }
  }, [selGroup])

  function showToast(msg, type='success') { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  async function createGroup() {
    if (!newName.trim()) return
    await api.post('/groups', { name: newName })
    setNewName(''); setShowNew(false)
    const r = await api.get('/groups'); setGroups(r.data)
    showToast('Gruppe angelegt')
  }

  async function deleteGroup(id) {
    if (!confirm('Gruppe löschen?')) return
    await api.delete(`/groups/${id}`)
    if (selGroup?.id === id) setSelGroup(null)
    const r = await api.get('/groups'); setGroups(r.data)
    showToast('Gruppe gelöscht')
  }

  async function toggleMember(userId) {
    const isMember = members.some(m => m.id === userId)
    if (isMember) {
      await api.delete(`/groups/${selGroup.id}/members/${userId}`)
    } else {
      await api.post(`/groups/${selGroup.id}/members`, { user_id: userId })
    }
    const r = await api.get(`/groups/${selGroup.id}/members`); setMembers(r.data)
    showToast(isMember ? 'Entfernt' : 'Hinzugefügt')
  }

  const initials = n => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>Gruppen-Verwaltung</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Gruppen Liste */}
        <div>
          <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Gruppen</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {groups.map(g => (
              <div key={g.id} className="card" onClick={() => setSelGroup(g)}
                style={{ padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                  border: selGroup?.id===g.id ? '1.5px solid #1D9E75' : '0.5px solid #DDD8D0',
                  background: selGroup?.id===g.id ? '#F7FAF9' : '#fff' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#0F6E56', flexShrink:0 }}>
                  {g.name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{g.name}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>{g.member_count} Mitglieder</div>
                </div>
                <button className="btn btn-sm" onClick={e=>{e.stopPropagation();deleteGroup(g.id)}} style={{ color:'#A32D2D', padding:'4px 6px' }}>
                  <IconTrash size={12} />
                </button>
              </div>
            ))}
          </div>
          {showNew ? (
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <input className="input" value={newName} onChange={e=>setNewName(e.target.value)}
                placeholder="Gruppenname" style={{ fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&createGroup()} autoFocus />
              <button className="btn btn-sm btn-primary" onClick={createGroup}>✓</button>
              <button className="btn btn-sm" onClick={()=>setShowNew(false)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-sm" onClick={()=>setShowNew(true)} style={{ width:'100%', marginTop:8, justifyContent:'center' }}>
              <IconPlus size={13} /> Neue Gruppe
            </button>
          )}
        </div>

        {/* Mitglieder */}
        <div>
          <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
            {selGroup ? `Mitglieder: ${selGroup.name}` : 'Gruppe auswählen'}
          </div>
          {selGroup ? (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {users.filter(u => u.active).map(u => {
                const isMember = members.some(m => m.id === u.id)
                return (
                  <div key={u.id} onClick={() => toggleMember(u.id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                      background: isMember ? '#E1F5EE' : '#F7F4F0', border: isMember ? '0.5px solid #9FE1CB' : '0.5px solid #DDD8D0' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background: isMember?'#9FE1CB':'#DDD8D0', color: isMember?'#085041':'#5F5E5A', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {initials(u.name)}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight: isMember?500:400 }}>{u.name}</div>
                      <div style={{ fontSize:10, color:'#888780' }}>{u.role}</div>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:4, border:`1.5px solid ${isMember?'#1D9E75':'#DDD8D0'}`, background: isMember?'#1D9E75':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {isMember && <span style={{ color:'#fff', fontSize:11 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding:24, textAlign:'center', color:'#888780', fontSize:13, background:'#F7F4F0', borderRadius:10 }}>
              ← Gruppe auswählen um Mitglieder zu verwalten
            </div>
          )}
        </div>
      </div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
