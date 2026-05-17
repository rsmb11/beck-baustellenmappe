import { useEffect, useState } from 'react'
import api from '../api'
import { IconPlus, IconSearch, IconKey, IconPencil, IconTrash, IconX, IconCheck, IconChevronDown } from '@tabler/icons-react'

export default function Zugangscodes() {
  const [codes, setCodes]               = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [search, setSearch]             = useState('')
  const [selMfr, setSelMfr]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)  // 'new' | 'edit'
  const [selCode, setSelCode]           = useState(null)
  const [toast, setToast]               = useState(null)
  const [expanded, setExpanded]         = useState({})
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

  // Gruppieren nach Hersteller
  const grouped = codes.reduce((acc, c) => {
    if (!acc[c.manufacturer]) acc[c.manufacturer] = []
    acc[c.manufacturer].push(c)
    return acc
  }, {})

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>Zugangscodes</div>
          <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>Hersteller-Standardcodes für Servicemenüs</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSelCode(null); setModal('new') }}>
          <IconPlus size={14} /> Neuer Eintrag
        </button>
      </div>

      {/* Suchleiste */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <IconSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#888780' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Hersteller, Gerät, Menü, Code suchen..." style={{ paddingLeft:32 }} />
        </div>
        <select className="input" style={{ width:'auto', minWidth:140 }} value={selMfr} onChange={e => setSelMfr(e.target.value)}>
          <option value="">Alle Hersteller</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      {/* Gruppierte Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {Object.entries(grouped).map(([mfr, items]) => (
          <div key={mfr} className="card" style={{ overflow:'hidden' }}>
            {/* Hersteller-Header */}
            <button onClick={() => setExpanded(e => ({ ...e, [mfr]: !e[mfr] }))}
              style={{ width:'100%', padding:'11px 14px', display:'flex', alignItems:'center', gap:10, border:'none', background:'#F7F4F0', cursor:'pointer', textAlign:'left' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IconKey size={16} color="#fff" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{mfr}</div>
                <div style={{ fontSize:11, color:'#888780' }}>{items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}</div>
              </div>
              <IconChevronDown size={16} color="#888780" style={{ transform: expanded[mfr] ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </button>

            {/* Einträge */}
            {(expanded[mfr] !== false) && items.map((c, i) => (
              <div key={c.id} style={{ padding:'10px 14px', borderTop:'0.5px solid #DDD8D0', display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    {c.device && <span style={{ fontSize:12, fontWeight:500 }}>{c.device}</span>}
                    {c.menu_level && <span style={{ fontSize:11, background:'#E6F1FB', color:'#185FA5', padding:'1px 8px', borderRadius:20 }}>{c.menu_level}</span>}
                  </div>
                  {/* Code prominent anzeigen */}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1a1a1a', color:'#fff', padding:'4px 12px', borderRadius:8, marginBottom:6, cursor:'pointer' }}
                    onClick={() => { navigator.clipboard?.writeText(c.code); showToast('Code kopiert') }}>
                    <IconKey size={13} />
                    <span style={{ fontFamily:'monospace', fontSize:15, fontWeight:600, letterSpacing:2 }}>{c.code}</span>
                    <span style={{ fontSize:10, opacity:0.6 }}>kopieren</span>
                  </div>
                  {c.hint && <div style={{ fontSize:12, color:'#5F5E5A', lineHeight:1.4 }}>💡 {c.hint}</div>}
                  <div style={{ fontSize:10, color:'#888780', marginTop:4 }}>
                    Eingetragen von {c.created_by_name || '–'}
                    {c.updated_by_name && c.updated_by_name !== c.created_by_name && ` · Bearbeitet von ${c.updated_by_name}`}
                  </div>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <button className="btn btn-sm" onClick={() => { setSelCode(c); setModal('edit') }}><IconPencil size={13} /></button>
                  {me.role === 'admin' && <button className="btn btn-sm" onClick={() => deleteCode(c.id)} style={{ color:'#A32D2D' }}><IconTrash size={13} /></button>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {!loading && codes.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'#888780' }}>
          <IconKey size={40} color="#DDD8D0" style={{ display:'block', margin:'0 auto 12px' }} />
          <div style={{ fontSize:14 }}>Keine Einträge gefunden</div>
          <div style={{ fontSize:12, marginTop:4 }}>Ersten Zugangscode hinzufügen</div>
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
      setError(err.response?.data?.error || 'Fehler')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>{code ? 'Eintrag bearbeiten' : 'Neuer Zugangscode'}</span>
          <button className="btn btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          <div>
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
          <div><label className="label">Gerät / Serie</label><input className="input" value={form.device} onChange={set('device')} placeholder="z.B. Vitodens 200-W" /></div>
          <div><label className="label">Menü-Ebene</label><input className="input" value={form.menu_level} onChange={set('menu_level')} placeholder="z.B. Servicemenü, Fachmannebene" /></div>
          <div>
            <label className="label">Code / Passwort *</label>
            <input className="input" value={form.code} onChange={set('code')} placeholder="z.B. 1234"
              style={{ fontFamily:'monospace', fontSize:16, letterSpacing:2 }} />
          </div>
          <div><label className="label">Hinweis zur Eingabe</label><textarea className="input" rows={2} value={form.hint} onChange={set('hint')} placeholder="z.B. OK-Taste 3 Sek. gedrückt halten..." /></div>
          <div><label className="label">Tags (kommagetrennt)</label><input className="input" value={form.tags} onChange={set('tags')} placeholder="z.B. heizung, gas, brennwert" /></div>
          {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{error}</div>}
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
