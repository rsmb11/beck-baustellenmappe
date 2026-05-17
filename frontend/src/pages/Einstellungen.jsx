import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'
import {
  IconBuilding, IconServer, IconBrain, IconUpload,
  IconCheck, IconAlertTriangle, IconRefresh, IconExternalLink
} from '@tabler/icons-react'

const SECTIONS = [
  {
    key: 'firma',
    icon: IconBuilding,
    title: 'Firmeninformationen',
    color: '#E1F5EE',
    ic: '#0F6E56',
    fields: [
      { key: 'company_name', label: 'Firmenname', placeholder: 'Beck Sanitär GmbH', hint: 'Wird in der App-Kopfzeile angezeigt' },
    ]
  },
  {
    key: 'dateiserver',
    icon: IconServer,
    title: 'Externer Dateiserver (NAS)',
    color: '#E6F1FB',
    ic: '#185FA5',
    fields: [
      { key: 'file_server_url',      label: 'Basis-URL',      placeholder: 'http://192.168.1.50/daten', hint: 'URL zum NAS-Dateiserver. Leer lassen wenn nicht verwendet.' },
      { key: 'file_server_name',     label: 'Anzeigename',    placeholder: 'NAS Dokumentenablage', hint: 'Wird im Wiki als Link-Bezeichnung angezeigt' },
      { key: 'file_server_user',     label: 'Benutzername',   placeholder: 'nas-user', hint: 'Benutzername für Dateiserver-Login (optional)' },
      { key: 'file_server_password', label: 'Passwort',       placeholder: '••••••••', type: 'password', hint: 'Passwort für Dateiserver-Login (optional)' },
    ]
  },
  {
    key: 'ki',
    icon: IconBrain,
    title: 'KI-Integration',
    color: '#F0EAFB',
    ic: '#6B3FA0',
    fields: [
      { key: 'ki_model', label: 'KI-Modell', placeholder: 'claude-sonnet-4-20250514', hint: 'Anthropic-Modell für automatische Berichte' },
    ]
  },
  {
    key: 'upload',
    icon: IconUpload,
    title: 'Datei-Upload',
    color: '#FAEEDA',
    ic: '#854F0B',
    fields: [
      { key: 'max_upload_mb', label: 'Max. Upload-Größe (MB)', placeholder: '50', type: 'number', hint: 'Maximale Dateigröße pro Upload' },
    ]
  },
]

export default function Einstellungen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState({})
  const [changed, setChanged]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const r = await api.get('/settings')
      const map = {}
      r.data.forEach(s => map[s.key] = s.value)
      setSettings(map)
    } finally { setLoading(false) }
  }

  function handleChange(key, value) {
    setSettings(s => ({ ...s, [key]: value }))
    setChanged(c => ({ ...c, [key]: true }))
  }

  async function save() {
    if (!Object.keys(changed).length) return
    setSaving(true)
    try {
      const updates = {}
      Object.keys(changed).forEach(k => updates[k] = settings[k])
      await api.put('/settings', updates)
      setChanged({})
      showToast('Einstellungen gespeichert')
    } catch {
      showToast('Fehler beim Speichern', 'error')
    } finally { setSaving(false) }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const hasChanges = Object.keys(changed).length > 0

  if (loading) return <div style={{ padding:32, textAlign:'center' }}><div className="spinner" /></div>

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>Einstellungen</div>
          <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>System-Konfiguration</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {hasChanges && (
            <button className="btn btn-sm" onClick={loadSettings}>
              <IconRefresh size={13} /> Zurücksetzen
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !hasChanges}>
            {saving ? <span className="spinner" style={{ width:13,height:13 }} /> : <><IconCheck size={13} /> Speichern</>}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div style={{ background:'#FAEEDA', border:'0.5px solid #F0C97A', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <IconAlertTriangle size={15} color="#854F0B" />
          <span style={{ color:'#854F0B' }}>Ungespeicherte Änderungen — bitte oben auf "Speichern" klicken.</span>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {SECTIONS.map(section => (
          <div key={section.key} className="card" style={{ overflow:'hidden' }}>
            <div style={{ background:section.color, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'0.5px solid #DDD8D0' }}>
              <section.icon size={18} color={section.ic} />
              <div style={{ fontSize:14, fontWeight:500, color:section.ic }}>{section.title}</div>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input
                    className="input"
                    type={field.type || 'text'}
                    value={settings[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ borderColor: changed[field.key] ? '#1D9E75' : undefined }}
                  />
                  {field.hint && (
                    <div style={{ fontSize:11, color:'#888780', marginTop:4 }}>{field.hint}</div>
                  )}
                  {/* Vorschau für Dateiserver-URL */}
                  {field.key === 'file_server_url' && settings[field.key] && (
                    <div style={{ marginTop:6, padding:'8px 10px', background:'#F7F4F0', borderRadius:8, fontSize:12 }}>
                      <span style={{ color:'#888780' }}>Beispiel-Link: </span>
                      <a href={`${settings[field.key]}/Anleitungen/Beispiel.pdf`} target="_blank" rel="noreferrer"
                        style={{ color:'#185FA5', display:'inline-flex', alignItems:'center', gap:4 }}>
                        {settings[field.key]}/Anleitungen/Beispiel.pdf
                        <IconExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Info-Box: Umzug auf Synology */}
        <div className="card" style={{ padding:'14px 16px', background:'#F7F4F0', border:'0.5px solid #DDD8D0' }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>💡 Umzug auf Synology NAS</div>
          <div style={{ fontSize:12, color:'#5F5E5A', lineHeight:1.7 }}>
            Wenn die App auf das Synology NAS umgezogen wird, reicht es die <strong>Basis-URL</strong> hier anzupassen:<br />
            <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, fontSize:11 }}>http://NAS-IP/daten</code> oder 
            <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, fontSize:11, marginLeft:6 }}>https://baustelle.becksanitaer.de/nas</code><br />
            Alle Links im Wiki funktionieren dann automatisch mit der neuen URL.
          </div>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
