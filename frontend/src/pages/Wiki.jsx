import { useEffect, useState } from 'react'
import api from '../api'
import {
  IconPlus, IconSearch, IconBook, IconPencil, IconTrash, IconX,
  IconCheck, IconChevronDown, IconChevronUp, IconMessageCircle,
  IconUpload, IconFileTypePdf, IconPhoto, IconAlertTriangle,
  IconBulb, IconTool, IconMapPin, IconExternalLink, IconLink
} from '@tabler/icons-react'

const CATEGORIES = {
  heizung:  { label:'Heizung',   color:'#FCEBEB', ic:'#A32D2D' },
  sanitaer: { label:'Sanitär',   color:'#E6F1FB', ic:'#185FA5' },
  klima:    { label:'Klima',     color:'#FAEEDA', ic:'#854F0B' },
  elektro:  { label:'Elektro',   color:'#F0EAFB', ic:'#6B3FA0' },
  sonstiges:{ label:'Sonstiges', color:'#F1EFE8', ic:'#5F5E5A' },
}

export default function Wiki() {
  const [entries, setEntries]     = useState([])
  const [manufacturers, setMfr]   = useState([])
  const [search, setSearch]       = useState('')
  const [selCat, setSelCat]       = useState('')
  const [selMfr, setSelMfr]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [selEntry, setSelEntry]   = useState(null)
  const [detail, setDetail]       = useState(null)
  const [modal, setModal]         = useState(null)
  const [editEntry, setEditEntry] = useState(null)
  const [toast, setToast]         = useState(null)
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')
  const [fileServer, setFileServer] = useState({ url: '', name: 'NAS Dokumentenablage' })

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    api.get('/settings/public').then(r => {
      if (r.data.file_server_url) setFileServer({ url: r.data.file_server_url, name: r.data.file_server_name || 'NAS' })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadEntries(), 300)
    return () => clearTimeout(t)
  }, [search, selCat, selMfr])

  useEffect(() => {
    if (selEntry) loadDetail(selEntry.id)
  }, [selEntry])

  async function loadAll() {
    setLoading(true)
    try {
      const [e, m] = await Promise.all([
        api.get('/wiki'),
        api.get('/wiki/meta/manufacturers')
      ])
      setEntries(e.data)
      setMfr(m.data)
    } finally { setLoading(false) }
  }

  async function loadEntries() {
    const params = {}
    if (search) params.q = search
    if (selCat) params.category = selCat
    if (selMfr) params.manufacturer = selMfr
    const r = await api.get('/wiki', { params })
    setEntries(r.data)
  }

  async function loadDetail(id) {
    const r = await api.get(`/wiki/${id}`)
    setDetail(r.data)
  }

  function showToast(msg, type='success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function deleteEntry(id) {
    if (!confirm('Eintrag löschen?')) return
    await api.delete(`/wiki/${id}`)
    setSelEntry(null); setDetail(null)
    showToast('Gelöscht')
    loadAll()
  }

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>Störungs-Wiki</div>
          <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>Fehlercodes, Ursachen und Lösungen</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditEntry(null); setModal('new') }}>
          <IconPlus size={14} /> Neuer Eintrag
        </button>
      </div>

      {/* Suche + Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <IconSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#888780' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Fehlercode, Gerät, Symptom suchen..." style={{ paddingLeft:32 }} />
        </div>
        <select className="input" style={{ width:'auto', minWidth:120 }} value={selCat} onChange={e => setSelCat(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input" style={{ width:'auto', minWidth:130 }} value={selMfr} onChange={e => setSelMfr(e.target.value)}>
          <option value="">Alle Hersteller</option>
          {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Zwei-Spalten Layout */}
      <div style={{ display:'flex', gap:12 }}>

        {/* Liste */}
        <div style={{ width: selEntry ? 280 : '100%', flexShrink:0, transition:'width 0.2s' }}>
          {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {entries.map(e => {
              const cat = CATEGORIES[e.category] || CATEGORIES.sonstiges
              const isActive = selEntry?.id === e.id
              return (
                <div key={e.id} className="card" onClick={() => setSelEntry(e)}
                  style={{ padding:'11px 14px', cursor:'pointer',
                    border: isActive ? '1.5px solid #1D9E75' : '0.5px solid #DDD8D0',
                    background: isActive ? '#F7FAF9' : '#fff' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <IconTool size={16} color={cat.ic} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        {e.error_code && (
                          <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, background:'#1a1a1a', color:'#fff', padding:'1px 7px', borderRadius:5 }}>{e.error_code}</span>
                        )}
                        <span style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</span>
                      </div>
                      <div style={{ fontSize:11, color:'#888780' }}>
                        {e.manufacturer && `${e.manufacturer} `}{e.device && `· ${e.device}`}
                      </div>
                      <div style={{ display:'flex', gap:6, marginTop:4 }}>
                        <span style={{ fontSize:10, background:cat.color, color:cat.ic, padding:'1px 7px', borderRadius:20 }}>{cat.label}</span>
                        {e.comment_count > 0 && <span style={{ fontSize:10, color:'#888780' }}>💬 {e.comment_count}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {!loading && entries.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'#888780' }}>
              <IconBook size={40} color="#DDD8D0" style={{ display:'block', margin:'0 auto 12px' }} />
              <div style={{ fontSize:14 }}>Keine Einträge gefunden</div>
            </div>
          )}
        </div>

        {/* Detail */}
        {selEntry && detail && (
          <div style={{ flex:1, minWidth:0 }}>
            <div className="card" style={{ padding:'14px 16px', marginBottom:10 }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    {detail.error_code && (
                      <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, background:'#1a1a1a', color:'#fff', padding:'2px 10px', borderRadius:6 }}>{detail.error_code}</span>
                    )}
                    <span style={{ fontSize:15, fontWeight:600 }}>{detail.title}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#888780' }}>
                    {detail.manufacturer}{detail.device ? ` · ${detail.device}` : ''}
                    {' · '}{CATEGORIES[detail.category]?.label}
                    {' · '}{detail.created_by_name}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button className="btn btn-sm" onClick={() => { setEditEntry(detail); setModal('edit') }}><IconPencil size={13} /></button>
                  {me.role === 'admin' && <button className="btn btn-sm" onClick={() => deleteEntry(detail.id)} style={{ color:'#A32D2D' }}><IconTrash size={13} /></button>}
                  <button className="btn btn-sm" onClick={() => { setSelEntry(null); setDetail(null) }}><IconX size={13} /></button>
                </div>
              </div>

              {/* Inhalt */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <Section icon={<IconAlertTriangle size={15} color="#A32D2D"/>} title="Fehlerbild / Symptom" color="#FCEBEB">
                  {detail.symptom}
                </Section>
                {detail.cause && (
                  <Section icon={<IconBulb size={15} color="#854F0B"/>} title="Ursache" color="#FAEEDA">
                    {detail.cause}
                  </Section>
                )}
                {detail.solution && (
                  <Section icon={<IconCheck size={15} color="#0F6E56"/>} title="Lösung / Vorgehen" color="#E1F5EE">
                    <div style={{ whiteSpace:'pre-wrap' }}>{detail.solution}</div>
                  </Section>
                )}
                {detail.project_refs && (
                  <Section icon={<IconMapPin size={15} color="#185FA5"/>} title="Bereits aufgetreten bei" color="#E6F1FB">
                    {detail.project_refs}
                  </Section>
                )}
                {detail.external_links && (
                  <Section icon={<IconBook size={15} color="#6B3FA0"/>} title="Externe Dokumente / Links" color="#F0EAFB">
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {detail.external_links.split('\n').filter(l => l.trim()).map((link, i) => {
                        const isUrl = link.startsWith('http')
                        const fullUrl = isUrl ? link : (fileServer.url ? `${fileServer.url}/${link.replace(/^\//, '')}` : null)
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                            {fullUrl ? (
                              <a href={fullUrl} target="_blank" rel="noreferrer"
                                style={{ display:'inline-flex', alignItems:'center', gap:5, color:'#185FA5', fontSize:13 }}>
                                📄 {link}
                                <IconExternalLink size={12} />
                              </a>
                            ) : (
                              <span style={{ fontSize:13, color:'#5F5E5A' }}>📄 {link}</span>
                            )}
                          </div>
                        )
                      })}
                      {!fileServer.url && <div style={{ fontSize:11, color:'#888780' }}>💡 Dateiserver-URL in den Einstellungen konfigurieren für direkte Links</div>}
                    </div>
                  </Section>
                )}
              </div>
            </div>

            {/* Dateien */}
            {detail.files?.length > 0 && (
              <div className="card" style={{ padding:'12px 14px', marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:8 }}>Anhänge ({detail.files.length})</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {detail.files.map(f => (
                    <a key={f.id} href={`/uploads/${f.file_path}?token=${token}`} target="_blank" rel="noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'#F7F4F0', borderRadius:8, fontSize:12, color:'#1a1a1a', textDecoration:'none' }}>
                      {f.file_type==='foto' ? <IconPhoto size={14} color="#BA7517"/> : <IconFileTypePdf size={14} color="#A32D2D"/>}
                      {f.original_name}
                    </a>
                  ))}
                </div>
                <label className="btn btn-sm" style={{ marginTop:8, cursor:'pointer' }}>
                  <IconUpload size={13} /> Datei anhängen
                  <input type="file" multiple style={{ display:'none' }} onChange={async e => {
                    const fd = new FormData()
                    for (const f of e.target.files) fd.append('files', f)
                    await api.post(`/wiki/${detail.id}/files`, fd)
                    loadDetail(detail.id)
                    showToast('Datei hochgeladen')
                  }} />
                </label>
              </div>
            )}

            {/* Kommentare */}
            <div className="card" style={{ padding:'12px 14px' }}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:10 }}>
                Kommentare & Ergänzungen ({detail.comments?.length || 0})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                {detail.comments?.map(c => (
                  <div key={c.id} style={{ padding:'8px 10px', background:'#F7F4F0', borderRadius:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>{c.author_name}</span>
                      <span style={{ fontSize:10, color:'#888780' }}>{new Date(c.created_at).toLocaleDateString('de-DE')}</span>
                      {(c.user_id === me.id || me.role === 'admin') && (
                        <button onClick={async () => {
                          await api.delete(`/wiki/${detail.id}/comments/${c.id}`)
                          loadDetail(detail.id)
                        }} style={{ marginLeft:'auto', border:'none', background:'none', cursor:'pointer', color:'#A32D2D' }}>
                          <IconTrash size={12} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.5 }}>{c.content}</div>
                  </div>
                ))}
              </div>
              <CommentBox entryId={detail.id} onSave={() => { loadDetail(detail.id); showToast('Kommentar gespeichert') }} />
            </div>
          </div>
        )}
      </div>

      {(modal === 'new' || modal === 'edit') && (
        <WikiModal
          entry={modal === 'edit' ? editEntry : null}
          manufacturers={manufacturers}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null)
            loadAll()
            if (selEntry) loadDetail(selEntry.id)
            showToast(modal === 'new' ? 'Eintrag angelegt' : 'Gespeichert')
          }}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

function Section({ icon, title, color, children }) {
  return (
    <div style={{ background:color, borderRadius:8, padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, fontSize:12, fontWeight:500 }}>
        {icon}{title}
      </div>
      <div style={{ fontSize:13, lineHeight:1.6 }}>{children}</div>
    </div>
  )
}

function CommentBox({ entryId, onSave }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!text.trim()) return
    setSaving(true)
    try {
      await api.post(`/wiki/${entryId}/comments`, { content: text })
      setText('')
      onSave()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', gap:8 }}>
      <textarea className="input" rows={2} value={text} onChange={e => setText(e.target.value)}
        placeholder="Ergänzung oder Erfahrung hinzufügen..." style={{ flex:1 }} />
      <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !text.trim()}
        style={{ alignSelf:'flex-end' }}>
        {saving ? <span className="spinner" style={{ width:12,height:12 }} /> : <IconCheck size={13} />}
      </button>
    </div>
  )
}

function WikiModal({ entry, manufacturers, onClose, onSave }) {
  const [form, setForm] = useState({
    title:        entry?.title        || '',
    error_code:   entry?.error_code   || '',
    manufacturer: entry?.manufacturer || '',
    device:       entry?.device       || '',
    category:     entry?.category     || 'heizung',
    symptom:      entry?.symptom      || '',
    cause:        entry?.cause        || '',
    solution:     entry?.solution     || '',
    project_refs: entry?.project_refs || '',
    external_links: entry?.external_links || '',
    tags:         entry?.tags         || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [newMfr, setNewMfr] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!form.title || !form.symptom) { setError('Titel und Fehlerbild erforderlich'); return }
    setSaving(true); setError('')
    try {
      if (entry) await api.put(`/wiki/${entry.id}`, form)
      else       await api.post('/wiki', form)
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span style={{ fontWeight:500 }}>{entry ? 'Eintrag bearbeiten' : 'Neuer Wiki-Eintrag'}</span>
          <button className="btn btn-sm" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Titel *</label>
              <input className="input" value={form.title} onChange={set('title')} placeholder="z.B. Brenner startet nicht – E9 Fehler" />
            </div>
            <div>
              <label className="label">Fehlercode</label>
              <input className="input" value={form.error_code} onChange={set('error_code')} placeholder="z.B. E9, F28" style={{ fontFamily:'monospace', fontWeight:700 }} />
            </div>
            <div>
              <label className="label">Kategorie</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Hersteller</label>
              {newMfr ? (
                <div style={{ display:'flex', gap:4 }}>
                  <input className="input" value={form.manufacturer} onChange={set('manufacturer')} placeholder="Hersteller" autoFocus />
                  <button className="btn btn-sm" onClick={() => setNewMfr(false)}>↩</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:4 }}>
                  <select className="input" value={form.manufacturer} onChange={set('manufacturer')}>
                    <option value="">Hersteller wählen...</option>
                    {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-sm" onClick={() => setNewMfr(true)}><IconPlus size={13} /></button>
                </div>
              )}
            </div>
            <div>
              <label className="label">Gerät / Serie</label>
              <input className="input" value={form.device} onChange={set('device')} placeholder="z.B. Vitodens 200-W" />
            </div>
          </div>
          <div>
            <label className="label">Fehlerbild / Symptom *</label>
            <textarea className="input" rows={3} value={form.symptom} onChange={set('symptom')} placeholder="Was passiert? Wie äußert sich das Problem?" />
          </div>
          <div>
            <label className="label">Ursache</label>
            <textarea className="input" rows={2} value={form.cause} onChange={set('cause')} placeholder="Warum tritt das Problem auf?" />
          </div>
          <div>
            <label className="label">Lösung / Vorgehen</label>
            <textarea className="input" rows={4} value={form.solution} onChange={set('solution')} placeholder="Schritt für Schritt Anleitung..." />
          </div>
          <div>
            <label className="label">Bereits aufgetreten bei</label>
            <input className="input" value={form.project_refs} onChange={set('project_refs')} placeholder="z.B. Kunde Müller, Gartenstr. 12 (März 2026)" />
          </div>
          <div>
            <label className="label">Externe Dokumente / Links</label>
            <textarea className="input" rows={3} value={form.external_links} onChange={set('external_links')}
              placeholder={'Anleitungen/Viessmann/Vitodens200.pdf\noder https://www.viessmann.de/...\n(ein Eintrag pro Zeile)'} />
            <div style={{ fontSize:11, color:'#888780', marginTop:4 }}>
              Relative Pfade werden mit der Dateiserver-URL aus den Einstellungen verknüpft. Ein Link pro Zeile.
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <input className="input" value={form.tags} onChange={set('tags')} placeholder="z.B. brenner, zündung, gasventil" />
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
