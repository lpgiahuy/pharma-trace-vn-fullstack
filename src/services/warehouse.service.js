import apiClient from './apiClient'
import { buildQueryString } from '@/utils'

const normalizeInbound = (i) => {
  if (!i) return i
  return {
    ...i,
    id: i.ma_phieu || i.id,
    productName: i.ten_thuoc || i.productName || 'Unknown',
    batchNumber: i.so_lo || i.batchNumber || '',
    quantity: i.so_luong || i.quantity || 0,
    location: i.vi_tri || i.location || '',
    qrCode: i.ma_qr || i.qrCode || '',
    receivedAt: i.ngay_nhap || i.createdAt || i.receivedAt,
  }
}

const normalizeTransfer = (t) => {
  if (!t) return t
  return {
    ...t,
    id: t.ma_phieu || t.id,
    productName: t.san_pham || t.ten_thuoc || t.productName || 'Unknown',
    batchNumber: t.so_lo || t.batchNumber || '',
    quantity: t.so_luong || t.quantity || 0,
    fromLocation: t.tu_kho || t.fromLocation || '',
    toLocation: t.den_kho || t.toLocation || '',
    status: t.trang_thai || t.status || 'pending',
    transferredAt: t.thoi_gian || t.transferredAt || t.date || null,
  }
}

const normalizeDisposal = (d) => {
  if (!d) return d
  return {
    ...d,
    id: d.ma_phieu || d.id,
    productName: d.ten_thuoc || d.productName || 'Unknown',
    batchNumber: d.so_lo || d.batchNumber || '',
    quantity: d.so_luong || d.quantity || 0,
    reason: d.ly_do || d.reason || '',
    method: d.phuong_phap || d.method || '',
    disposedBy: d.nguoi_tieu_huy || d.disposedBy || '',
    disposedAt: d.thoi_gian || d.disposedAt || null,
  }
}

const normalizeRecall = (r) => {
  if (!r) return r
  return {
    ...r,
    id: r.ma_phieu || r.id,
    productName: r.ten_thuoc || r.productName || 'Unknown',
    batchNumber: r.so_lo || r.batchNumber || '',
    reason: r.ly_do || r.reason || '',
    level: r.muc_do || r.level || 'warning',
    status: r.trang_thai || r.status || 'active',
    actionRequired: r.hanh_dong || r.actionRequired || '',
    createdAt: r.ngay_tao || r.createdAt || r.date,
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

export const warehouseService = {
  async getInventory(params = {}) {
    const { data } = await apiClient.get(`/inventory/nhap-kho?${buildQueryString(params)}`)
    return normalizeList(data, normalizeInbound)
  },

  async getInventoryById(id) {
    const { data } = await apiClient.get(`/inventory/nhap-kho/${id}`)
    const result = data.data || data
    return normalizeInbound(result)
  },

  async receiveStock(payload) {
    const { data } = await apiClient.post('/inventory/nhap-kho', payload)
    return data.data || data
  },

  async getUnits() {
    const { data } = await apiClient.get('/logistics/units')
    return data.data || []
  },

  async getProductsInUnit(unitId) {
    const { data } = await apiClient.get(`/logistics/units/${unitId}/products`)
    return data.data || []
  },

  async getBatchesInUnit(unitId, duocPhamId) {
    const { data } = await apiClient.get(`/logistics/units/${unitId}/batches?duoc_pham_id=${duocPhamId}`)
    return data.data || []
  },

  async getUIDsForTransfer(unitId, loThuocId, soLuong) {
    const { data } = await apiClient.get(`/logistics/units/${unitId}/uids?lo_thuoc_id=${loThuocId}&so_luong=${soLuong}`)
    return data.data || []
  },

  async fulfillOrder(orderId, payload) {
    const { data } = await apiClient.post(`/admin/orders/${orderId}/fulfill`, payload)
    return data.data || data
  },

  async transferStock(payload) {
    const { data } = await apiClient.post('/logistics/transfer', payload)
    return data.data || data
  },

  async getTransfers(params = {}) {
    const { data } = await apiClient.get(`/logistics/transfer?${buildQueryString(params)}`)
    return normalizeList(data, normalizeTransfer)
  },

  async disposeStock(payload) {
    const { data } = await apiClient.post('/logistics/dispose', payload)
    return data.data || data
  },

  async getDisposals(params = {}) {
    const { data } = await apiClient.get(`/logistics/dispose?${buildQueryString(params)}`)
    return normalizeList(data, normalizeDisposal)
  },

  async recallBatch(payload) {
    const { data } = await apiClient.post(`/logistics/recall/${payload.loThuocId || payload.batchId}`, payload)
    return data.data || data
  },

  async getRecalls(params = {}) {
    const { data } = await apiClient.get(`/logistics/recall?${buildQueryString(params)}`)
    return normalizeList(data, normalizeRecall)
  },

  async scanQR(qrCode) {
    const { data } = await apiClient.post('/trace/scan-qr', { uid: qrCode })
    return data.data || data
  },

  async getLocations() {
    const { data } = await apiClient.get('/inventory/locations')
    return data.data || data
  },

  async generateQR(inventoryId) {
    const { data } = await apiClient.post(`/inventory/${inventoryId}/generate-qr`)
    return data.data || data
  },
}
