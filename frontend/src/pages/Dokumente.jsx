import { useEffect, useState } from 'react'
import api from '../api'
import {
  IconSearch, IconFolder, IconFolderOpen, IconFileTypePdf,
  IconFile, IconChevronRight, IconChevronDown, IconExternalLink,
  IconBook2
} from '@tabler/icons-react'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function FileIcon({ ext }) {
  if (ext === 'pdf') return <IconFileTypePdf size={18} color="#A32D2D" />
  return <IconFile size={18} color="#185FA5" />
}

function FolderNode({ item, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = item.children?.length > 0

  return (
    <div>
      <div onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
          paddingLeft: 12 + depth * 18,
          cursor:'pointer', borderRadius:8, background: open ? '#F7FAF9' : 'transparent',
          color: open ? '#0F6E56' : '#1a1a1a' }}>
        {hasChildren
          ? (open ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />)
          : <span style={{ width:13 }} />}
        {open ? <IconFolderOpen size={17} color="#BA7517" /> : <IconFolder size={17} color="#BA7517" />}
        <span style={{ fontSize:14, fontWeight:500, flex:1 }}>{item.name}</span>
        <span style={{ fontSize:11, color:'#888780' }}>
          {item.children?.filter(c => c.type === 'file').length || 0} Dateien
        </span>
      </div>
      {open && hasChildren && (
        <div>
          {item.children.filter(c => c.type === 'folder').map(c => (
            <FolderNode key={c.path} item={c} depth={depth + 1} />
          ))}
          {item.children.filter(c => c.type === 'file').map(f => (
            <FileRow key={f.path} file={f} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function FileRow({ file, depth = 0 }) {
  return (
    <a href={file.url} target="_blank" rel="noreferrer"
      style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px',
        paddingLeft: 12 + depth * 18 + 21,
        borderRadius:8, textDecoration:'none', color:'#1a1a1a',
        transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <FileIcon ext={file.ext} />
      <span style={{ fontSize:13, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {file.name}
      </span>
      <span style={{ fontSize:10, color:'#888780', flexShrink:0 }}>{formatSize(file.size)}</span>
      <IconExternalLink size={12} color="#888780" style={{ flexShrink:0 }} />
    </a>
  )
}

export default function Dokumente() {
  const [tree, setTree]         = useState([])
  const [search, setSearch]     = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    api.get('/docs').then(r => setTree(r.data.tree)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const r = await api.get('/docs/search', { params: { q: search } })
        setResults(r.data)
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const showSearch = search.trim().length > 0

  return (
    <div style={{ padding:14 }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:17, fontWeight:500 }}>Dokumenten-Bibliothek</div>
        <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>Hersteller-Dokumente, Anleitungen und Datenblätter</div>
      </div>

      {/* Suche */}
      <div style={{ position:'relative', marginBottom:14 }}>
        <IconSearch size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#888780' }} />
        <input className="input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Dokument oder Hersteller suchen..." style={{ paddingLeft:34 }} autoFocus />
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><div className="spinner" /></div>}

      {/* Suchergebnisse */}
      {showSearch && (
        <div className="card" style={{ padding:'8px 4px' }}>
          {searching && <div style={{ textAlign:'center', padding:16 }}><div className="spinner" style={{ width:16, height:16 }} /></div>}
          {!searching && results.length === 0 && (
            <div style={{ textAlign:'center', padding:16, color:'#888780', fontSize:13 }}>Keine Dokumente gefunden</div>
          )}
          {!searching && results.map(f => (
            <a key={f.path} href={f.url} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, textDecoration:'none', color:'#1a1a1a' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <FileIcon ext={f.ext} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                <div style={{ fontSize:11, color:'#888780' }}>{f.folder || 'Root'}</div>
              </div>
              <span style={{ fontSize:10, color:'#888780', flexShrink:0 }}>{formatSize(f.size)}</span>
              <IconExternalLink size={12} color="#888780" style={{ flexShrink:0 }} />
            </a>
          ))}
          {!searching && results.length > 0 && (
            <div style={{ fontSize:11, color:'#888780', textAlign:'center', padding:'4px 0' }}>
              {results.length} Treffer
            </div>
          )}
        </div>
      )}

      {/* Verzeichnisbaum */}
      {!showSearch && !loading && (
        <div className="card" style={{ padding:'8px 4px' }}>
          {tree.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#888780' }}>
              <IconBook2 size={40} color="#DDD8D0" style={{ display:'block', margin:'0 auto 12px' }} />
              <div style={{ fontSize:14 }}>Noch keine Dokumente vorhanden</div>
              <div style={{ fontSize:12, marginTop:4 }}>Dateien nach /var/www/beck-docs/ hochladen</div>
            </div>
          ) : (
            tree.map(item => (
              item.type === 'folder'
                ? <FolderNode key={item.path} item={item} depth={0} />
                : <FileRow key={item.path} file={item} depth={0} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
