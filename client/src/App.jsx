import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyAttendance from './pages/MyAttendance'
import AdminAttendance from './pages/AdminAttendance'
import ApplyLeave from './pages/ApplyLeave'
import LeaveManagement from './pages/LeaveManagement'
import HolidayCalendar from './pages/HolidayCalendar'
import Profile from './pages/Profile'
import PerformanceEvaluation from './pages/PerformanceEvaluation'
import DocumentManagement from './pages/DocumentManagement'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/attendance" element={
                <PrivateRoute>
                  <MyAttendance />
                </PrivateRoute>
              } />
              <Route path="/admin/attendance" element={
                <PrivateRoute roles={["admin", "hr"]}>
                  <AdminAttendance />
                </PrivateRoute>
              } />
              <Route path="/leaves/apply" element={
                <PrivateRoute>
                  <ApplyLeave />
                </PrivateRoute>
              } />
              <Route path="/leaves/manage" element={
                <PrivateRoute roles={["admin", "hr"]}>
                  <LeaveManagement />
                </PrivateRoute>
              } />
              <Route path="/holidays" element={
                <PrivateRoute>
                  <HolidayCalendar />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/performance" element={
                <PrivateRoute roles={["admin", "hr"]}>
                  <PerformanceEvaluation />
                </PrivateRoute>
              } />
              <Route path="/documents" element={
                <PrivateRoute roles={["admin", "hr"]}>
                  <DocumentManagement />
                </PrivateRoute>
              } />
            </Routes>
          </Layout>
        } />
      </Routes>
    </AuthProvider>
  )
}


