import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import CoverDesigner from './pages/CoverDesigner.jsx'
import type { ReactNode } from 'react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  return !user ? children : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile/setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
      <Route path="/create" element={<PrivateRoute><CoverDesigner /></PrivateRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
