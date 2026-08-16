import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'
import { STORAGE_KEYS } from '@/constants'
import { getPortalKey, getPortalUser, getPortalToken, setPortalAuth, clearPortalAuth } from '@/utils/portalAuth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      customerSession: null,
      adminSession: null,
      warehouseSession: null,
      isLoading: false,
      error: null,

      // Portal-aware dynamic getters
      getUser: () => {
        if (typeof window === 'undefined') return null
        const portal = getPortalKey(window.location.pathname)
        return get()[`${portal}Session`]?.user || getPortalUser(portal) || null
      },
      getAccessToken: () => {
        if (typeof window === 'undefined') return null
        const portal = getPortalKey(window.location.pathname)
        return get()[`${portal}Session`]?.accessToken || getPortalToken(portal) || null
      },
      getIsAuthenticated: () => {
        if (typeof window === 'undefined') return false
        const portal = getPortalKey(window.location.pathname)
        const u = get()[`${portal}Session`]?.user || getPortalUser(portal)
        const t = get()[`${portal}Session`]?.accessToken || getPortalToken(portal)
        return !!u && !!t
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const result = await authService.login(credentials)
          const portal = getPortalKey(window.location.pathname)

          const accessToken = result.accessToken || result.token
          const refreshToken = result.refreshToken || null
          const expiresAt = result.expiresAt || (Date.now() + 3600000)

          setPortalAuth(portal, result.user, accessToken, refreshToken, expiresAt)

          const sessionKey = `${portal}Session`
          const sessionData = { user: result.user, accessToken, refreshToken }

          set({
            [sessionKey]: sessionData,
            isLoading: false,
          })
          return result
        } catch (err) {
          const message = err.response?.data?.message || err.message || 'Login failed'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        const portal = getPortalKey(window.location.pathname)
        const sessionKey = `${portal}Session`
        const currentUser = get()[sessionKey]?.user || getPortalUser(portal)
        const userRole = currentUser?.role || currentUser?.vai_tro

        let redirectUrl = '/login'
        if (['QuanLyKho', 'NhanVienKho'].includes(userRole) || portal === 'warehouse') {
          redirectUrl = '/warehouse/login'
        } else if (['SuperAdmin', 'superadmin', 'Admin', 'admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'manager', 'staff'].includes(userRole) || portal === 'admin') {
          redirectUrl = '/admin/login'
        }

        try { await authService.logout() } catch {}
        
        clearPortalAuth(portal)

        set({
          [sessionKey]: null,
        })
        
        if (portal === 'customer') {
          const { useCartStore } = await import('./cartStore')
          useCartStore.getState().clearCart()
          localStorage.removeItem('pharma-cart')
        }
        
        window.location.href = redirectUrl
      },

      updateUser: (updates) => {
        const portal = getPortalKey(window.location.pathname)
        const sessionKey = `${portal}Session`
        const currentSession = get()[sessionKey] || {}
        const updatedUser = { ...currentSession.user, ...updates }
        setPortalAuth(portal, updatedUser)
        set({
          [sessionKey]: { ...currentSession, user: updatedUser },
        })
      },

      hasRole: (roles) => {
        const portal = getPortalKey(window.location.pathname)
        const user = get()[`${portal}Session`]?.user || getPortalUser(portal)
        if (!user) return false
        const allowed = Array.isArray(roles) ? roles : [roles]
        return allowed.includes(user.role || user.vai_tro)
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pharma-auth',
      partialize: (state) => ({
        customerSession: state.customerSession,
        adminSession: state.adminSession,
        warehouseSession: state.warehouseSession,
      }),
    }
  )
)

export const useAuth = () => {
  const store = useAuthStore()
  const portal = typeof window !== 'undefined' ? getPortalKey(window.location.pathname) : 'customer'
  const session = store[`${portal}Session`] || null
  const user = session?.user || getPortalUser(portal) || null
  const accessToken = session?.accessToken || getPortalToken(portal) || null
  const isAuthenticated = !!user && !!accessToken

  return {
    ...store,
    user,
    accessToken,
    isAuthenticated,
  }
}
