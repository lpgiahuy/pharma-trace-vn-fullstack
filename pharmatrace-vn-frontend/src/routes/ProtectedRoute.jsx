import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const userRole = user?.role || user?.vai_tro

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !roles.includes(userRole)) {
    if (userRole === 'QuanLyKho') {
      return <Navigate to="/warehouse/inbound" replace />
    }
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  const userRole = user?.role || user?.vai_tro

  if (isAuthenticated) {
    if (userRole === 'QuanLyKho') {
      return <Navigate to="/warehouse/inbound" replace />
    }
    if (['SuperAdmin', 'Admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'admin', 'manager', 'staff'].includes(userRole)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
