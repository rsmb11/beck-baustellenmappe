import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { IconUpload, IconSearch } from '@tabler/icons-react'

export default function Dateien() {
  const [projects, setProjects] = useState([])
  const [files, setFiles]       = useState([])
  const [selProj, setSelProj]   = useState('all')
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data))
  }, [])

  useEffect(() => {
    loadFiles()
  }, [selProj])

  async function loadFiles() {
    setLoading(true)
    try {
      if (selProj === 'all') {
        // Alle Projekte → Dateien sammeln
        const projs = await api.get('/projects')
        const all = await Promise.all(
          projs.data.map(p => api.get(`/projects/${p.id}/files`).then(r => r.data.map(f => ({ ...f, project_title: p.title }))))
        )
        setFiles(all.flat().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)))
      } else {
        const r = await api.get(`/projects/${selProj}/files`)
        const proj = projects.find(p => p.id === selProj)
        setFiles(r.data.map(f => ({ ...f, project_title: proj?.title })))
      }
    } finally { setLoading(false) }
  }

  const displayed = files.filter(f => {
    const matchType   = filter === 'all' || f.file_type === filter
    const matchSearch = !search || f.original_name.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div style={{ padding:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Alle Dateien</div>
      </div>

      {/* Filter Bar */}
      <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
        <select className="input" style={{ width:'auto', fontSize:12, padding:'6px 10px' }} value={selProj} onChange={e => setSelProj(e.target.value)}>
          <option value="all">Alle Projekte</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[['all','Alle'],['foto','Fotos'],['pdf','PDFs'],['dokument','Dokumente']].map(([val, label]) => (
          <button key={val} className="btn btn-sm" onClick={() => setFilter(val)}
            style={{ background: filter===val ? '#E1F5EE' : '#fff', color: filter===val ? '#0F6E56' : '#5F5E5A', borderColor: filter===val ? '#9FE1CB' : '#DDD8D0' }}>
            {label}
          </button>
        ))}
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <IconSearch size={14} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#888780' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Suchen..." style={{ paddingLeft:28, width:140, fontSize:12, padding:'5px 8px 5px 28px' }} />
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
        {displayed.map(f => {
          const isFoto = f.file_type === 'foto'
          return (
            <a key={f.id} href={`/uploads/${f.file_path}?token=${token}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
              <div className="card" style={{ overflow:'hidden', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#1D9E75'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#DDD8D0'}>
                <div style={{ aspectRatio:'4/3', background: isFoto ? '#FEF3E8' : '#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                  <span style={{ fontSize:28 }}>{isFoto ? '🖼️' : '📄'}</span>
                  <span style={{ position:'absolute', top:4, right:4, fontSize:9, padding:'1px 6px', borderRadius:4, background: isFoto ? '#E6F1FB' : '#FCEBEB', color: isFoto ? '#185FA5' : '#A32D2D', fontWeight:600 }}>
                    {f.file_type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name}</div>
                  <div style={{ fontSize:10, color:'#888780', marginTop:1 }}>{f.project_title}</div>
                  <div style={{ fontSize:10, color:'#888780' }}>{new Date(f.created_at).toLocaleDateString('de-DE')}</div>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {!loading && displayed.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'#888780', fontSize:13 }}>
          Keine Dateien gefunden
        </div>
      )}
    </div>
  )
}
