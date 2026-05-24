import { useEffect, useState } from 'react'
import api from '../api'
import { IconPlus, IconSearch, IconKey, IconPencil, IconTrash, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react'

export default function Zugangscodes() {
  const [codes, setCodes]               = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [search, setSearch]             = useState('')
  const [selMfr, setSelMfr]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [selCode, setSelCode]           = useState(null)
  const [toast, setToast]               = useState(null)
  const [expanded, setExpanded]         = useState({})  // alle standardmäßig ZUGEKLAPPT
  const me = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const t = setTimeout(() => loadCodes(), 300)
    return () => clearTimeout(t)
  }, [search, selMfr])

  async function loadAll() {
    setLoading(true)
    try {
      const [c, m] = await Promise.all([
        api.get('/access-codes'),
        api.get('/access-codes/manufacturers')
      ])
      setCodes(c.data)
      setManufacturers(m.data)
    } finally { setLoading(false) }
  }

  async function loadCodes() {
    const params = {}
    if (search) params.q = search
    if (selMfr) params.manufacturer = selMfr
    const r = await api.get('/access-codes', { params })
    setCodes(r.data)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function deleteCode(id) {
    if (!confirm('Eintrag löschen?')) return
    await api.delete(`/access-codes/${id}`)
    showToast('Gelöscht')
    loadAll()
  }

  function toggleMfr(mfr) {
    setExpanded(e => ({ ...e, [mfr]: !e[mfr] }))
  }

  // Bei Suche alle aufklappen
  useEffect(() => {
    if (search || selMfr) {
      const open = {}
      codes.forEach(c => { open[c.manufacturer] = true })
      setExpanded(open)
    }
  }, [search, selMfr])

  const grouped = codes.reduce((acc, c) => {
    if (!acc[c.manufacturer]) acc[c.manufacturer] = []
    acc[c.manufacturer].push(c)
    return acc
  }, {})

  return (
    <div style={{ padding:14, maxWidth:800 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>Zugangscodes</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Hersteller-Standardcodes für Servicemenüs</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSelCode(null); setModal('new') }}>
          <IconPlus size={14} /> Neuer Eintrag
        </button>
      </div>

      {/* Suche + Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <IconSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Hersteller, Gerät, Menü, Code suchen..." style={{ paddingLeft:32 }} />
        </div>
        <select className="input" style={{ width:'auto', minWidth:140 }} value={selMfr} onChange={e => setSelMfr(e.target.value)}>
          <option value="">Alle Hersteller</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      {/* Gruppiert nach Hersteller — standardmäßig ZUGEKLAPPT */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {Object.entries(grouped).map(([mfr, items]) => {
          const isOpen = !!expanded[mfr]
          return (
            <div key={mfr} style={{
              background:'rgba(24,24,27,0.8)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:14,
              overflow:'hidden',
              backdropFilter:'blur(12px)',
            }}>
              {/* Hersteller-Header */}
              <button
                onClick={() => toggleMfr(mfr)}
                style={{
                  width:'100%', padding:'12px 14px',
                  display:'flex', alignItems:'center', gap:10,
                  background: isOpen ? 'rgba(16,185,129,0.08)' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left',
                  borderBottom: isOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  transition:'background 0.15s',
                }}
              >
                <div style={{ width:34, height:34, borderRadius:9, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <IconKey size={16} color="#34d399" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{mfr}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>
                    {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}
                  </div>
                </div>
                <IconChevronDown
                  size={16} color="var(--text-3)"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }}
                />
              </button>

              {/* Einträge — nur wenn offen */}
              {isOpen && items.map((c, i) => (
                <div key={c.id} style={{
                  padding:'12px 14px',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  display:'flex', alignItems:'flex-start', gap:12,
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Gerät + Menü-Badge */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                      {c.device && (
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.device}</span>
                      )}
                      {c.menu_level && (
                        <span style={{ fontSize:11, background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)', padding:'1px 8px', borderRadius:20 }}>
                          {c.menu_level}
                        </span>
                      )}
                    </div>

                    {/* Code — prominent, kopierbar */}
                    <div
                      onClick={() => { navigator.clipboard?.writeText(c.code); showToast('Code kopiert ✓') }}
                      style={{
                        display:'inline-flex', alignItems:'center', gap:8,
                        background:'rgba(16,185,129,0.1)',
                        border:'1px solid rgba(16,185,129,0.25)',
                        color:'#34d399',
                        padding:'6px 14px', borderRadius:10,
                        marginBottom:8, cursor:'pointer',
                        transition:'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.1)'}
                    >
                      <IconKey size={13} color="#34d399" />
                      <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, letterSpacing:3 }}>{c.code}</span>
                      <span style={{ fontSize:10, color:'var(--text-3)', marginLeft:2 }}>tippen zum kopieren</span>
                    </div>

                    {c.hint && (
                      <div style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.5, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'6px 10px', marginBottom:6 }}>
                        💡 {c.hint}
                      </div>
                    )}
                    <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>
                      {c.created_by_name || '–'}
                      {c.updated_by_name && c.updated_by_name !== c.created_by_name && ` · ${c.updated_by_name}`}
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn btn-sm" onClick={() => { setSelCode(c); setModal('edit') }}>
                      <IconPencil size={13} />
                    </button>
                    {me.role === 'admin' && (
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCode(c.id)}>
                        <IconTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {!loading && codes.length === 0 && (
        <div style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>
          <IconKey size={36} color="var(--text-3)" style={{ display:'block', margin:'0 auto 12px', opacity:0.4 }} />
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Keine Einträge gefunden</div>
          <div style={{ fontSize:12, marginTop:2 }}>Ersten Zugangscode hinzufügen</div>
        </div>
      )}

      {(modal === 'new' || modal === 'edit') && (
        <CodeModal
          code={modal === 'edit' ? selCode : null}
          manufacturers={manufacturers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadAll(); showToast(modal === 'new' ? 'Eintrag angelegt' : 'Gespeichert') }}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

function CodeModal({ code, manufacturers, onClose, onSave }) {
  const [form, setForm] = useState({
    manufacturer: code?.manufacturer || '',
    device:       code?.device       || '',
    menu_level:   code?.menu_level   || '',
    code:         code?.code         || '',
    hint:         code?.hint         || '',
    tags:         code?.tags         || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [newMfr, setNewMfr] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.manufacturer || !form.code) { setError('Hersteller und Code erforderlich'); return }
    setSaving(true); setError('')
    try {
      if (code) await api.put(`/access-codes/${code.id}`, form)
      else       await api.post('/access-codes', form)
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Speichern')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{code ? 'Eintrag bearbeiten' : 'Neuer Zugangscode'}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">Hersteller *</label>
            {newMfr ? (
              <div style={{ display:'flex', gap:6 }}>
                <input className="input" value={form.manufacturer} onChange={set('manufacturer')} placeholder="z.B. Viessmann" autoFocus />
                <button className="btn btn-sm" onClick={() => setNewMfr(false)}>↩</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:6 }}>
                <select className="input" value={form.manufacturer} onChange={set('manufacturer')}>
                  <option value="">Hersteller wählen...</option>
                  {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button className="btn btn-sm" onClick={() => setNewMfr(true)} title="Neuer Hersteller"><IconPlus size={13} /></button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="label">Gerät / Serie</label>
            <input className="input" value={form.device} onChange={set('device')} placeholder="z.B. Vitodens 200-W" />
          </div>
          <div className="form-group">
            <label className="label">Menü-Ebene</label>
            <input className="input" value={form.menu_level} onChange={set('menu_level')} placeholder="z.B. Servicemenü, Fachmannebene" />
          </div>
          <div className="form-group">
            <label className="label">Code / Passwort *</label>
            <input className="input" value={form.code} onChange={set('code')} placeholder="z.B. 1234"
              style={{ fontFamily:'monospace', fontSize:18, letterSpacing:3 }} />
          </div>
          <div className="form-group">
            <label className="label">Hinweis zur Eingabe</label>
            <textarea className="input" rows={2} value={form.hint} onChange={set('hint')} placeholder="z.B. OK-Taste 3 Sek. gedrückt halten..." />
          </div>
          <div className="form-group">
            <label className="label">Tags (kommagetrennt)</label>
            <input className="input" value={form.tags} onChange={set('tags')} placeholder="z.B. heizung, gas, brennwert" />
          </div>
          {error && (
            <div style={{ background:'var(--red-bg)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.25)', padding:'8px 12px', borderRadius:8, fontSize:13 }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:14, height:14 }} /> : <><IconCheck size={13} /> Speichern</>}
          </button>
        </div>
      </div>
    </div>
  )
}
