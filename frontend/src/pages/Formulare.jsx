import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Routes, Route } from 'react-router-dom'
import api from '../api'
import {
  IconPlus, IconArrowLeft, IconFileDescription, IconCheck,
  IconTrash, IconPencil, IconX, IconDownload, IconWriting
} from '@tabler/icons-react'

const CATEGORY_LABELS = {
  sanitaer: 'Sanitär', heizung: 'Heizung', klima: 'Klima', sonstiges: 'Sonstiges'
}

// ── Formularliste ─────────────────────────────────────────────────────────────
function FormularListe() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [forms, setForms]       = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/projects/' + projectId + '/forms'),
      api.get('/form-templates')
    ]).then(([f, t]) => { setForms(f.data); setTemplates(t.data) })
    .finally(() => setLoading(false))
  }, [projectId])

  async function deleteForm(id) {
    if (!confirm('Formular löschen?')) return
    await api.delete('/projects/' + projectId + '/forms/' + id)
    setForms(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:16, fontWeight:500 }}>Formulare & Protokolle</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>
          <IconPlus size={14} /> Neues Formular
        </button>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {forms.map(f => (
          <div key={f.id} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <IconFileDescription size={20} color="#0F6E56" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{f.template_name}</div>
              <div style={{ fontSize:11, color:'#888780', marginTop:2 }}>
                {f.created_by_name} · {new Date(f.created_at).toLocaleDateString('de-DE')}
                {f.signed_at && <span style={{ marginLeft:8, color:'#1D9E75' }}>✓ Unterschrieben</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button className="btn btn-sm" onClick={() => navigate('/formulare/' + projectId + '/' + f.id)}>
                <IconPencil size={13} />
              </button>
              <button className="btn btn-sm" onClick={() => deleteForm(f.id)} style={{ color:'#A32D2D' }}>
                <IconTrash size={13} />
              </button>
            </div>
          </div>
        ))}
        {!loading && forms.length === 0 && (
          <div className="card" style={{ padding:32, textAlign:'center', color:'#888780' }}>
            <IconFileDescription size={40} color="#DDD8D0" style={{ display:'block', margin:'0 auto 12px' }} />
            Noch keine Formulare ausgefüllt
          </div>
        )}
      </div>

      {/* Vorlage wählen Modal */}
      {showPicker && (
        <div className="modal-overlay">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span style={{ fontWeight:500 }}>Formular wählen</span>
              <button className="btn btn-sm" onClick={() => setShowPicker(false)}><IconX size={14} /></button>
            </div>
            <div className="modal-body">
              {Object.entries(
                templates.reduce((acc, t) => {
                  if (!acc[t.category]) acc[t.category] = []
                  acc[t.category].push(t)
                  return acc
                }, {})
              ).map(([cat, tmps]) => (
                <div key={cat}>
                  <div style={{ fontSize:11, color:'#888780', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  {tmps.map(t => (
                    <button key={t.id} className="card"
                      onClick={() => { setShowPicker(false); navigate('/formulare/' + projectId + '/neu/' + t.id) }}
                      style={{ width:'100%', padding:'12px 14px', display:'flex', alignItems:'center', gap:10, border:'none', cursor:'pointer', textAlign:'left', marginBottom:6 }}>
                      <IconFileDescription size={18} color="#1D9E75" />
                      <div>
                        <div style={{ fontSize:13, fontWeight:500 }}>{t.name}</div>
                        {t.description && <div style={{ fontSize:11, color:'#888780' }}>{t.description}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Unterschrift-Pad ──────────────────────────────────────────────────────────
function SignaturePad({ label, value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!value)

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function startDraw(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    setDrawing(true)
  }

  function draw(e) {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function endDraw(e) {
    e.preventDefault()
    if (!drawing) return
    setDrawing(false)
    setHasSignature(true)
    onChange(canvasRef.current.toDataURL())
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange(null)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <label className="label" style={{ marginBottom:0 }}>{label}</label>
        {hasSignature && (
          <button className="btn btn-sm" onClick={clear} style={{ fontSize:11, color:'#A32D2D' }}>
            <IconTrash size={12} /> Löschen
          </button>
        )}
      </div>
      <div style={{ border:'0.5px solid #DDD8D0', borderRadius:10, overflow:'hidden', background:'#FAFAFA', touchAction:'none' }}>
        <canvas ref={canvasRef} width={600} height={150}
          style={{ width:'100%', height:120, display:'block', cursor:'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>
      {!hasSignature && (
        <div style={{ fontSize:11, color:'#888780', textAlign:'center', marginTop:4 }}>
          Hier unterschreiben
        </div>
      )}
    </div>
  )
}

// ── Formular ausfüllen ────────────────────────────────────────────────────────
function FormularAusfuellen() {
  const { projectId, formId, templateId } = useParams()
  const navigate = useNavigate()
  const isNew = formId === 'neu' || !formId
  const [template, setTemplate] = useState(null)
  const [formEntry, setFormEntry] = useState(null)
  const [data, setData]           = useState({})
  const [sigCustomer, setSigCustomer]     = useState(null)
  const [sigContractor, setSigContractor] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    async function load() {
      if (isNew && templateId) {
        const t = await api.get('/form-templates/' + templateId)
        setTemplate(t.data)
        // Vorbelegung: Datum heute
        const defaults = {}
        t.data.fields.forEach(f => {
          if (f.id === 'datum') defaults.datum = new Date().toISOString().split('T')[0]
        })
        setData(defaults)
      } else if (formId) {
        const f = await api.get('/projects/' + projectId + '/forms/' + formId)
        setFormEntry(f.data)
        setData(f.data.data || {})
        setSigCustomer(f.data.signature_customer)
        setSigContractor(f.data.signature_contractor)
        if (f.data.template_id) {
          const t = await api.get('/form-templates/' + f.data.template_id)
          setTemplate(t.data)
        } else {
          setTemplate({ name: f.data.template_name, fields: [] })
        }
      }
      setLoading(false)
    }
    load()
  }, [formId, templateId])

  function setField(id, value) {
    setData(prev => ({ ...prev, [id]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      if (isNew) {
        await api.post('/projects/' + projectId + '/forms', {
          template_id:          template?.id,
          template_name:        template?.name,
          data,
          signature_customer:   sigCustomer,
          signature_contractor: sigContractor
        })
      } else {
        await api.put('/projects/' + projectId + '/forms/' + formId, {
          data,
          signature_customer:   sigCustomer,
          signature_contractor: sigContractor
        })
      }
      setSaved(true)
      setTimeout(() => navigate('/formulare/' + projectId), 1000)
    } finally { setSaving(false) }
  }

  function printForm() {
    const win = window.open('', '_blank')
    const fieldsHtml = template?.fields?.map(f => {
      const val = data[f.id]
      if (f.type === 'checkbox') return `<tr><td>${f.label}</td><td>${val ? '☑ Ja' : '☐ Nein'}</td></tr>`
      return `<tr><td>${f.label}</td><td>${val || '-'}</td></tr>`
    }).join('') || ''

    win.document.write(`
      <html><head><title>${template?.name}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}
      h2{margin-bottom:20px}table{width:100%;border-collapse:collapse}
      td{padding:8px 12px;border:1px solid #ddd;vertical-align:top}
      td:first-child{width:40%;font-weight:500;background:#f9f9f9}
      .sig{margin-top:20px;display:flex;gap:40px}.sig div{flex:1;text-align:center}
      .sig img{border:1px solid #ccc;width:100%;height:100px;object-fit:contain}
      </style></head><body>
      <h2>${template?.name}</h2>
      <table>${fieldsHtml}</table>
      ${sigCustomer || sigContractor ? `
      <div class="sig">
        <div>
          <p>Auftraggeber</p>
          ${sigCustomer ? `<img src="${sigCustomer}"/>` : '<div style="height:100px;border:1px solid #ccc"></div>'}
        </div>
        <div>
          <p>Auftragnehmer</p>
          ${sigContractor ? `<img src="${sigContractor}"/>` : '<div style="height:100px;border:1px solid #ccc"></div>'}
        </div>
      </div>` : ''}
      </body></html>
    `)
    win.print()
  }

  if (loading) return <div style={{ padding:32, textAlign:'center' }}><div className="spinner" /></div>

  return (
    <div style={{ padding:14 }}>
      <button className="btn btn-sm" onClick={() => navigate('/formulare/' + projectId)} style={{ marginBottom:12 }}>
        <IconArrowLeft size={14} /> Zurück
      </button>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:500 }}>{template?.name}</div>
        {!isNew && (
          <button className="btn btn-sm" onClick={printForm}>
            <IconDownload size={13} /> Drucken / PDF
          </button>
        )}
      </div>

      <div className="card" style={{ padding:16, marginBottom:14 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {template?.fields?.map(field => (
            <div key={field.id}>
              <label className="label">{field.label}{field.required && ' *'}</label>
              {field.type === 'text' && (
                <input className="input" value={data[field.id] || ''} onChange={e => setField(field.id, e.target.value)} />
              )}
              {field.type === 'number' && (
                <input className="input" type="number" step="0.1" value={data[field.id] || ''} onChange={e => setField(field.id, e.target.value)} />
              )}
              {field.type === 'date' && (
                <input className="input" type="date" value={data[field.id] || ''} onChange={e => setField(field.id, e.target.value)} />
              )}
              {field.type === 'textarea' && (
                <textarea className="input" rows={3} value={data[field.id] || ''} onChange={e => setField(field.id, e.target.value)} />
              )}
              {field.type === 'select' && (
                <select className="input" value={data[field.id] || ''} onChange={e => setField(field.id, e.target.value)}>
                  <option value="">Bitte wählen...</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {field.type === 'checkbox' && (
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background:'#F5F3EF', borderRadius:10 }}>
                  <input type="checkbox" checked={!!data[field.id]} onChange={e => setField(field.id, e.target.checked)}
                    style={{ width:20, height:20, cursor:'pointer' }} />
                  <span style={{ fontSize:13 }}>{field.label}</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unterschriften */}
      <div className="card" style={{ padding:16, marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <IconWriting size={16} color="#1D9E75" /> Unterschriften
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <SignaturePad label="Unterschrift Auftraggeber" value={sigCustomer} onChange={setSigCustomer} />
          <SignaturePad label="Unterschrift Auftragnehmer" value={sigContractor} onChange={setSigContractor} />
        </div>
      </div>

      {/* Speichern */}
      <button className="btn btn-primary" onClick={save} disabled={saving}
        style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14 }}>
        {saved
          ? <><IconCheck size={16} /> Gespeichert!</>
          : saving
            ? <span className="spinner" style={{ width:16, height:16 }} />
            : <><IconCheck size={16} /> Formular speichern</>
        }
      </button>
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function Formulare() {
  return (
    <Routes>
      <Route path=":projectId"                   element={<FormularListe />} />
      <Route path=":projectId/neu/:templateId"   element={<FormularAusfuellen />} />
      <Route path=":projectId/:formId"           element={<FormularAusfuellen />} />
    </Routes>
  )
}
