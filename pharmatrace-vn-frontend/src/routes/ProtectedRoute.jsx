import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const userRole = user?.role || user?.vai_tro

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />
    }
    if (location.pathname.startsWith('/warehouse')) {
      return <Navigate to="/warehouse/login" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isInternalStaff = ['SuperAdmin', 'superadmin', 'Admin', 'admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienKho', 'manager', 'staff'].includes(userRole)
  if ((location.pathname.startsWith('/account') || location.pathname.startsWith('/checkout')) && isInternalStaff) {
    if (['QuanLyKho', 'NhanVienKho'].includes(userRole)) {
      return <Navigate to="/warehouse/inbound" replace />
    }
    return <Navigate to="/admin" replace />
  }

  if (roles.length > 0 && !roles.includes(userRole)) {
    if (['QuanLyKho', 'NhanVienKho'].includes(userRole)) {
      return <Navigate to="/warehouse/inbound" replace />
    }
    if (['Admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'admin', 'manager', 'staff'].includes(userRole)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  const userRole = user?.role || user?.vai_tro

  if (isAuthenticated) {
    if (['QuanLyKho', 'NhanVienKho'].includes(userRole)) {
      return <Navigate to="/warehouse/inbound" replace />
    }
    if (['SuperAdmin', 'Admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'admin', 'manager', 'staff'].includes(userRole)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
