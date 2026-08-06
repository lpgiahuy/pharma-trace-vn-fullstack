import apiClient from './apiClient'
import { buildQueryString } from '@/utils'

const normalizeUser = (u) => {
  if (!u) return u
  return {
    ...u,
    id: u.id || u._id || u.ma_nhan_vien,
    name: u.ho_ten || u.name || '',
    phone: u.so_dien_thoai || u.phone || '',
    email: u.email || '',
    role: u.vai_tro || u.role || 'staff',
    status: u.trang_thai !== undefined ? u.trang_thai : (u.status ?? 'active'),
    createdAt: u.ngay_tao || u.createdAt || u.created_at,
  }
}

const normalizeList = (data, normalizer) => {
  const result = data.data || data
  if (result.items && Array.isArray(result.items)) {
    return {
      data: result.items.map(normalizer),
      total: result.total_items || result.items.length,
      page: result.current_page || 1,
      limit: result.limit_per_page || 20,
    }
  }
  if (Array.isArray(result)) return { data: result.map(normalizer), total: result.length }
  const items = result.data || []
  return { data: (Array.isArray(items) ? items : []).map(normalizer), total: items.length }
}

export const userService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get(`/admin/staff?${buildQueryString(params)}`)
    return normalizeList(data, normalizeUser)
  },

  async getById(id) {
    const { data } = await apiClient.get(`/admin/staff/${id}`)
    const result = data.data || data
    return normalizeUser(result)
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/staff/add', payload)
    return data.data || data
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/staff/${id}`, payload)
    return data.data || data
  },

  async delete(id) {
    const { data } = await apiClient.delete(`/admin/staff/${id}`)
    return data.data || data
  },

  async updateProfile(payload) {
    const { data } = await apiClient.put('/auth/me', payload)
    return data.data || data
  },

  async uploadAvatar(formData) {
    const { data } = await apiClient.post('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data || data
  },

  async getAddresses() {
    const { data } = await apiClient.get('/auth/me/addresses')
    return data.data || data
  },

  async addAddress(payload) {
    const { data } = await apiClient.post('/auth/me/addresses', payload)
    return data.data || data
  },

  async deleteAddress(id) {
    const { data } = await apiClient.delete(`/auth/me/addresses/${id}`)
    return data.data || data
  },

  async uploadPrescription(formData) {
    const { data } = await apiClient.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data || data
  },

  async getPrescriptions() {
    const { data } = await apiClient.get('/admin/prescriptions')
    return data.data || data
  },

  async getMyPrescriptions() {
    const { data } = await apiClient.get('/prescriptions/my')
    const result = data.data || data
    return Array.isArray(result) ? result : (result.items || [])
  },

  async getWishlist() {
    const { data } = await apiClient.get('/wishlist')
    return data.data || data
  },

  async toggleWishlist(productId) {
    const { data } = await apiClient.post('/wishlist/add', { productId })
    return data.data || data
  },

  async removeFromWishlist(productId) {
    const { data } = await apiClient.delete(`/wishlist/remove/${productId}`)
    return data.data || data
  },

  async getRoles() {
    const { data } = await apiClient.get('/admin/staff/roles')
    return data.data || data
  },
}

export const customerService = {
  async getAll() {
    const { data } = await apiClient.get('/admin/customers')
    return data.data || data
  },

  async getById(id) {
    const { data } = await apiClient.get(`/admin/customers/${id}`)
    return data.data || data
  },

  async setStatus(id, action) {
    const { data } = await apiClient.patch(`/admin/customers/${id}/status`, { action })
    return data.data || data
  },
}

export const unitService = {
  async getAll() {
    const { data } = await apiClient.get('/logistics/units')
    const result = data.data || data
    const items = Array.isArray(result) ? result : (result.items || result.data || [])
    return items.map(u => ({
      ...u,
      id: u.id,
      name: u.ten_don_vi || u.name || '',
      type: u.loai_don_vi || u.type || '',
      address: u.dia_chi || u.address || '',
      lat: u.toa_do_lat ?? null,
      lng: u.toa_do_lng ?? null,
    }))
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/units/add', {
      ten_don_vi:   payload.ten_don_vi,
      loai_don_vi:  payload.loai_don_vi,
      dia_chi:      payload.dia_chi || '',
      toa_do_lat:   payload.toa_do_lat ?? null,
      toa_do_lng:   payload.toa_do_lng ?? null,
    })
    return data.data || data
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/units/${id}`, {
      ten_don_vi:   payload.ten_don_vi,
      loai_don_vi:  payload.loai_don_vi,
      dia_chi:      payload.dia_chi || '',
      toa_do_lat:   payload.toa_do_lat ?? null,
      toa_do_lng:   payload.toa_do_lng ?? null,
    })
    return data.data || data
  },

  async delete(id) {
    const { data } = await apiClient.delete(`/admin/units/${id}`)
    return data.data || data
  },
}

export const prescriptionAdminService = {
  async getAll(status) {
    const url = status ? `/admin/prescriptions?status=${status}` : '/admin/prescriptions'
    const { data } = await apiClient.get(url)
    return data.data || data
  },

  async updateStatus(id, trang_thai_duyet) {
    const { data } = await apiClient.put(`/admin/prescriptions/${id}/status`, { trang_thai_duyet })
    return data.data || data
  },
}
