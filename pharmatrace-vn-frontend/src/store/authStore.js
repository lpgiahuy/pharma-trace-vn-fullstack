import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/auth.service'
import { STORAGE_KEYS } from '@/constants'

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

          // Store tokens — backend may return `token` instead of `accessToken`
          const accessToken = result.accessToken || result.token
          const refreshToken = result.refreshToken || null
          const expiresAt = result.expiresAt || (Date.now() + 3600000)

          if (accessToken) {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
          }
          if (refreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
          }
          localStorage.setItem('pharma_token_expiry', expiresAt)

          set({
            user: result.user,
            accessToken,
            refreshToken,
            isAuthenticated: !!result.user, // When using cookies, we rely on user profile presence
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
        try { await authService.logout() } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem('pharma_token_expiry')
        
        // Clear cart state and persistence
        const { useCartStore } = await import('./cartStore')
        useCartStore.getState().clearCart()
        localStorage.removeItem('pharma-cart')
        
        window.location.reload()
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
