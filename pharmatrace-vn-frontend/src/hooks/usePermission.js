import { useAuth } from '@/store/authStore'

export const usePermission = () => {
  const { user, hasRole } = useAuth()
  return {
    can: (roles) => hasRole(roles),
    isAdmin:     hasRole(['admin']),
    isManager:   hasRole(['admin', 'manager']),
    isWarehouse: hasRole(['admin', 'manager', 'warehouse']),
    isStaff:     hasRole(['admin', 'manager', 'pharmacist', 'staff']),
    isCustomer:  hasRole(['customer']),
    role: user?.role,
  }
}
