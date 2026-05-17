import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout        from './components/Layout'
import Login         from './pages/Login'
import Home          from './pages/Home'
import Projekte      from './pages/Projekte'
import Dateien       from './pages/Dateien'
import Doku          from './pages/Doku'
import Berichte      from './pages/Berichte'
import Benutzer      from './pages/Benutzer'
import Zugangscodes  from './pages/Zugangscodes'
import Wiki          from './pages/Wiki'
import Einstellungen from './pages/Einstellungen'
import './index.css'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index               element={<Home />} />
            <Route path="projekte/*"   element={<Projekte />} />
            <Route path="dateien"      element={<Dateien />} />
            <Route path="doku"         element={<Doku />} />
            <Route path="wiki"         element={<Wiki />} />
            <Route path="berichte"     element={<Berichte />} />
            <Route path="zugangscodes" element={<Zugangscodes />} />
            <Route path="benutzer"     element={<Benutzer />} />
            <Route path="einstellungen" element={<Einstellungen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
