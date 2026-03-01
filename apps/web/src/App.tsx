import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup.jsx'
import CoverDesigner from './pages/CoverDesigner.jsx'
import PrintView from './pages/PrintView.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import SharedCover from './pages/SharedCover.jsx'
import SavedCovers from './pages/SavedCovers.jsx'
import AdminRoute from './components/AdminRoute'
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
      <Route path="/share/:id" element={<SharedCover />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/covers" element={<PrivateRoute><SavedCovers /></PrivateRoute>} />
      <Route path="/profile/setup" element={<PrivateRoute><ProfileSetup /></PrivateRoute>} />
      <Route path="/create" element={<PrivateRoute><CoverDesigner /></PrivateRoute>} />

      {/* Admin only routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="/print/:id" element={<PrintView />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
