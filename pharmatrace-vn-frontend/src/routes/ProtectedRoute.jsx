import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    if (user?.role === 'QuanLyKho') {
      return <Navigate to="/warehouse/inbound" replace />
    }
    if (['SuperAdmin', 'Admin', 'NhanVienBanHang', 'admin', 'manager', 'staff'].includes(user?.role)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
