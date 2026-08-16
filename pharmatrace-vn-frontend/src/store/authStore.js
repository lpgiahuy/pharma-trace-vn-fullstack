import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'
import { STORAGE_KEYS } from '@/constants'
import { getPortalKey, setPortalAuth, clearPortalAuth } from '@/utils/portalAuth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const result = await authService.login(credentials)
          const portal = getPortalKey(window.location.pathname)

          const accessToken = result.accessToken || result.token
          const refreshToken = result.refreshToken || null
          const expiresAt = result.expiresAt || (Date.now() + 3600000)

          setPortalAuth(portal, result.user, accessToken, refreshToken, expiresAt)

          set({
            user: result.user,
            accessToken,
            refreshToken,
            isAuthenticated: !!result.user,
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
        const currentUser = get().user
        const userRole = currentUser?.role || currentUser?.vai_tro
        const pathname = window.location.pathname
        const portal = getPortalKey(pathname)

        let redirectUrl = '/login'
        if (['QuanLyKho', 'NhanVienKho'].includes(userRole) || portal === 'warehouse') {
          redirectUrl = '/warehouse/login'
        } else if (['SuperAdmin', 'superadmin', 'Admin', 'admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'manager', 'staff'].includes(userRole) || portal === 'admin') {
          redirectUrl = '/admin/login'
        }

        try { await authService.logout() } catch {}
        
        clearPortalAuth(portal)

        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        
        if (portal === 'customer') {
          const { useCartStore } = await import('./cartStore')
          useCartStore.getState().clearCart()
          localStorage.removeItem('pharma-cart')
        }
        
        window.location.href = redirectUrl
      },

      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
        if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
        set({ accessToken, refreshToken: refreshToken || get().refreshToken })
      },

      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        const allowed = Array.isArray(roles) ? roles : [roles]
        return allowed.includes(user.role)
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pharma-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
