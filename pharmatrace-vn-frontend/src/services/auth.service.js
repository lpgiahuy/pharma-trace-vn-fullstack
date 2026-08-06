import apiClient from './apiClient'
import { STORAGE_KEYS } from '@/constants'

export const authService = {
  /**
   * Customer login — backend expects { so_dien_thoai, mat_khau }
   * Admin login   — backend expects { email, password } at /admin/auth/login
   */
  async login(credentials) {
    // Determine endpoint and payload based on login type
    if (credentials.loginType === 'admin') {
      const { data } = await apiClient.post('/admin/auth/login', {
        email:    credentials.email,
        password: credentials.password,
      })
      
      // Backend returns { success: true, data: { nhan_vien } } 
      // The JWT token is now handled via HTTP-Only cookies
      const result = data.data || data
      const adminUser = result.nhan_vien || result.user
      
      // Function to map DB role to frontend role
      const mapRole = (dbRole) => {
        if (!dbRole) return 'customer';
        const role = dbRole.toLowerCase();
        if (role === 'superadmin' || role === 'admin') return 'admin';
        if (role === 'quanlykho' || role === 'manager') return 'manager';
        if (role === 'nhanvienbanhang') return 'staff';
        return dbRole; // Fallback
      }

      return {
        accessToken:  result.token || null,
        refreshToken: result.refreshToken || null,
        expiresAt:    result.expiresAt || (Date.now() + 3600000),
        user:         adminUser ? { ...adminUser, role: mapRole(adminUser.vai_tro), name: adminUser.ho_ten || adminUser.name || '' } : null,
      }
    }

    // Customer login — backend returns { success: true, data: { user } }
    const { data } = await apiClient.post('/auth/login', {
      so_dien_thoai: credentials.phone,
      mat_khau:      credentials.password,
    })
    
    const result = data.data || data
    const customerUser = result.user
    
    return {
      accessToken:  result.token || null,
      refreshToken: result.refreshToken || null,
      expiresAt:    result.expiresAt || (Date.now() + 3600000),
      user:         customerUser ? { ...customerUser, role: customerUser.role || 'customer' } : null,
    }
  },

  async register(payload) {
    const { data } = await apiClient.post('/auth/register', {
      ho_ten:        payload.name,
      so_dien_thoai: payload.phone,
      email:         payload.email || undefined,
      mat_khau:      payload.password,
      dia_chi:       payload.address || undefined,
    })
    
    const result = data.data || data
    return {
      accessToken: result.token || null,
      user:        result.user || null
    }
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      await apiClient.post('/auth/logout', { refreshToken })
    } finally {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
      localStorage.removeItem('pharma_token_expiry')
    }
  },

  async getProfile() {
    const { data } = await apiClient.get('/auth/me')
    return data.data || data
  },

  async updateProfile(payload) {
    const { data } = await apiClient.patch('/auth/me', payload)
    return data.data || data
  },

  async getLoyaltyProgress() {
    const { data } = await apiClient.get('/auth/loyalty-progress')
    return data.data || data
  },

  async forgotPassword(email) {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data.data || data
  },

  async resetPassword(payload) {
    const { data } = await apiClient.post('/auth/reset-password', payload)
    return data.data || data
  },

  async changePassword(payload) {
    const { data } = await apiClient.put('/auth/change-password', payload)
    return data.data || data
  },
}
