import apiClient from './apiClient'
import { buildQueryString } from '@/utils'

const normalizeOrder = (o) => {
  if (!o) return o
  const sourceItems = o.items || o.chi_tiet_thuoc || o.chi_tiet_don_hang || []
  const items = Array.isArray(sourceItems) ? sourceItems.map(i => ({
    ...i,
    name: i.ten_thuoc || i.name,
    price: Number(i.don_gia) || Number(i.price),
    quantity: i.so_luong || i.quantity,
    image: i.hinh_anh_url || i.image,
    unit: i.ten_don_vi || i.unit,
    isPrescription: i.la_thuoc_ke_don || false,
    don_vi_xuat: i.don_vi_xuat || null,
    gia_goc_luc_mua: Number(i.gia_goc_luc_mua) || null,
    phan_tram_giam_luc_mua: Number(i.phan_tram_giam_luc_mua) || 0
  })) : []

  return {
    ...o,
    id: o.ma_don_hang || o.id,
    date: o.ngay_dat || o.ngay_dat_hang || o.createdAt || o.date,
    status: o.trang_thai_don || o.trang_thai || o.status,
    total: Number(o.tong_tien) || o.total || 0,
    itemsCount: o.items_count || items.length || 0,
    items: items,
    address: o.dia_chi_giao_hang || o.dia_chi || o.address || '',
    paymentMethod: o.phuong_thuc_thanh_toan || o.paymentMethod || 'COD',
    paymentStatus: o.trang_thai_thanh_toan || o.paymentStatus,
    customerName: o.ho_ten || o.customerName,
    customerPhone: o.so_dien_thoai || o.customerPhone,
    customerEmail: o.email || o.customerEmail
  }
}

const normalizeRma = (r) => {
  if (!r) return r
  return {
    ...r,
    id: r.id || r.ma_phieu,
    orderId: r.don_hang_id || r.ma_don_hang || r.orderId,
    reason: r.ly_do_tra || r.ly_do || r.reason || '',
    date: r.ngay_yeu_cau || r.ngay_tao || r.createdAt || r.date,
    status: r.trang_thai_duyet || r.trang_thai || r.status,
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

export const orderService = {
  async getAll(params = {}) {
    const { data } = await apiClient.get(`/admin/orders?${buildQueryString(params)}`)
    return normalizeList(data, normalizeOrder)
  },

  async getAdminById(id) {
    const { data } = await apiClient.get(`/admin/orders/${id}`)
    const result = data.data || data
    return normalizeOrder(result)
  },

  async getById(id) {
    const { data } = await apiClient.get(`/orders/${id}`)
    const result = data.data || data
    return normalizeOrder(result)
  },

  async create(payload) {
    const { data } = await apiClient.post('/orders/checkout', {
      dia_chi_giao_hang:      payload.dia_chi_giao_hang || payload.address,
      phuong_thuc_thanh_toan: payload.phuong_thuc_thanh_toan || payload.paymentMethod,
      ghi_chu:                payload.ghi_chu || payload.note || '',
      ma_giam_gia:            payload.ma_giam_gia || payload.voucherCode,
      voucher_id:             payload.voucher_id || payload.voucherId,
      diem_su_dung:           payload.diem_su_dung || payload.points || 0,
      lat:                    payload.lat || null,
      lng:                    payload.lng || null,
      toa_thuoc_id:           payload.toa_thuoc_id || null,
    })
    return data.data || data
  },

  async fulfillOrder(id, uids) {
    const { data } = await apiClient.post(`/admin/orders/${id}/fulfill`, { mang_uid: uids })
    return data.data || data
  },

  async shipOrder(id) {
    const { data } = await apiClient.patch(`/admin/orders/${id}/ship`)
    return data.data || data
  },

  async completeOrder(id) {
    const { data } = await apiClient.patch(`/admin/orders/${id}/complete`)
    return data.data || data
  },

  async cancel(id, reason) {
    const { data } = await apiClient.post(`/orders/${id}/cancel`, { reason })
    return data.data || data
  },

  async getMyOrders(params = {}) {
    const { data } = await apiClient.get(`/orders/my-orders?${buildQueryString(params)}`)
    return normalizeList(data, normalizeOrder)
  },
}

export const rmaService = {
  async create(payload) {
    const { data } = await apiClient.post('/rma/request', payload)
    return data.data || data
  },

  async getAll(params = {}) {
    const { data } = await apiClient.get(`/admin/rma?${buildQueryString(params)}`)
    return normalizeList(data, normalizeRma)
  },

  async getById(id) {
    const { data } = await apiClient.get(`/admin/rma/${id}`)
    const result = data.data || data
    return normalizeRma(result)
  },

  async updateStatus(id, status) {
    const { data } = await apiClient.put(`/admin/rma/${id}/status`, { trang_thai_duyet: status })
    return data.data || data
  },
}
