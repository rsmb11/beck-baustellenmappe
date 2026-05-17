import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout   from './components/Layout'
import Login    from './pages/Login'
import Home     from './pages/Home'
import Projekte from './pages/Projekte'
import Dateien  from './pages/Dateien'
import Doku     from './pages/Doku'
import Berichte from './pages/Berichte'
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
            <Route index             element={<Home />} />
            <Route path="projekte/*" element={<Projekte />} />
            <Route path="dateien"    element={<Dateien />} />
            <Route path="doku"       element={<Doku />} />
            <Route path="berichte"   element={<Berichte />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
