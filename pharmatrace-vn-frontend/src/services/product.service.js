import apiClient from './apiClient'
import { buildQueryString } from '@/utils'

/**
 * Normalize a product from the backend's Vietnamese field names
 * to the English field names the UI components expect.
 *
 * Backend: { id, ten_thuoc, gia_ban, hinh_anh_url, mo_ta_ngan, la_thuoc_ke_don, don_vi_ban }
 * UI:      { id, name, price, image, description, isPrescription, unit, brand, rating, ... }
 */
const normalizeProduct = (p) => {
  if (!p) return p

  let basePrice = Number(p.gia_ban) || p.price || 0
  let originalPrice = p.gia_goc ? Number(p.gia_goc) : (p.originalPrice ? Number(p.originalPrice) : null)
  let baseUnit = p.don_vi_ban || p.unit || ''
  let discountPercent = p.phan_tram_giam ? Number(p.phan_tram_giam) : (p.discountPercent || p.discount || 0)

  if (p.quy_cach_dong_goi && Array.isArray(p.quy_cach_dong_goi) && p.quy_cach_dong_goi.length > 0) {
    const baseVariant = p.quy_cach_dong_goi.find(q => q.la_don_vi_co_ban) || p.quy_cach_dong_goi[0]
    basePrice = Number(baseVariant.gia_ban) || basePrice
    originalPrice = baseVariant.gia_goc ? Number(baseVariant.gia_goc) : originalPrice
    discountPercent = baseVariant.phan_tram_giam ? Number(baseVariant.phan_tram_giam) : discountPercent
    baseUnit = baseVariant.ten_don_vi || baseUnit
  }

  if (originalPrice && originalPrice > basePrice && (!discountPercent || discountPercent === 0)) {
    discountPercent = Math.max(0, Math.round(((originalPrice - basePrice) / originalPrice) * 100))
  }

  let chi_tiet = p.chi_tiet_thuoc || {}
  if (typeof chi_tiet === 'string') {
    try { chi_tiet = JSON.parse(chi_tiet) } catch(e) {}
  }

  const specifications = { ...(p.specifications || {}) }
  if (p.so_dang_ky) specifications['Registration'] = p.so_dang_ky
  if (chi_tiet?.ingredients?.length) {
    specifications['Ingredients'] = chi_tiet.ingredients.join(', ')
  }

  return {
    // Keep all original fields so nothing breaks
    ...p,
    // Map Vietnamese → English for the UI
    id:             p.id,
    name:           p.ten_thuoc       || p.name        || 'Unknown Product',
    price:          basePrice,
    originalPrice:  (originalPrice && originalPrice > basePrice) ? originalPrice : null,
    discount:       discountPercent,
    discountPercent: discountPercent,
    image:          p.hinh_anh_url    || p.hinh_anh    || p.image || 'https://placehold.co/400x400/e6f2ff/0b7de8?text=No+Image',
    description:    p.mo_ta_ngan      || p.mo_ta       || p.description || '',
    isPrescription: p.la_thuoc_ke_don ?? p.isPrescription ?? false,
    unit:           baseUnit,
    brand:          p.thuong_hieu     || p.nha_san_xuat || p.brand || p.don_vi_ban || '',
    category:       p.ten_danh_muc    || p.danh_muc    || p.category || '',
    categoryId:     p.danh_muc_id     || p.categoryId  || null,
    slug:           chi_tiet?.slug    || p.slug        || `product-${p.id}`,
    inStock:        (p.total_stock !== undefined) ? Number(p.total_stock) > 0 : (p.con_hang ?? p.inStock ?? true),
    totalStock:     p.total_stock !== undefined ? Number(p.total_stock) : null,
    rating:         p.diem_danh_gia   ?? p.diemDanhGia ?? chi_tiet?.score ?? p.danh_gia_tb     ?? p.rating      ?? 0,
    reviewCount:    p.so_danh_gia     ?? p.soDanhGia   ?? p.reviewCount  ?? 0,
    soldCount:      p.so_luong_da_ban ?? p.soLuongDaBan ?? p.da_ban       ?? p.sold ?? p.soldCount ?? 0,
    isFavorited:    p.is_favorited    ?? false,
    batchNumber:    p.so_lo           || p.batchNumber  || 'N/A',
    expiryDate:     p.ngay_het_han    || p.expiryDate   || null,
    chi_tiet_thuoc: chi_tiet,
    isActive:       p.trang_thai      ?? true,
    specifications,
    // Packaging variants for unit switcher on detail page
    packagingVariants: (p.quy_cach_dong_goi && Array.isArray(p.quy_cach_dong_goi) && p.quy_cach_dong_goi.length > 0)
      ? p.quy_cach_dong_goi.map(q => ({
          id:    q.quy_cach_id || q.id,
          label: q.ten_don_vi  || q.label,
          price: Number(q.gia_ban) || 0,
          originalPrice: q.gia_goc ? Number(q.gia_goc) : null,
          discountPercent: q.phan_tram_giam ? Number(q.phan_tram_giam) : 0,
          isBase: q.la_don_vi_co_ban ?? false,
        }))
      : null,
  }
}

export const productService = {
  async getAll(params = {}) {
    try {
      const page = Number(params.page) || 1
      const limit = Number(params.limit) || 20

      const { data } = await apiClient.get(`/products?${buildQueryString(params)}`)
      const result = data.data || data

      let items = []
      let totalItemsCount = 0

      // Extract array of items
      if (result.items && Array.isArray(result.items)) {
        items = result.items
        totalItemsCount = result.total_items ?? result.total ?? undefined
      } else if (Array.isArray(result)) {
        items = result
      } else {
        const potentialItems = result.data || result.products || []
        items = Array.isArray(potentialItems) ? potentialItems : []
        totalItemsCount = result.total ?? result.count ?? undefined
      }

      // If backend doesn't return total_items, we use a fake total to allow next page
      // e.g. if we get `limit` items back, there's likely a next page.
      if (totalItemsCount === undefined) {
        if (items.length === limit) {
          totalItemsCount = page * limit + 1 // Add 1 to ensure Pagination shows "Next" button
        } else {
          totalItemsCount = (page - 1) * limit + items.length
        }
      }

      return {
        data: items.map(normalizeProduct),
        total: totalItemsCount,
        page: result.current_page || page,
        limit: result.limit_per_page || limit,
      }
    } catch (error) {
      console.error('[productService.getAll]', error.response?.data || error.message)
      return { data: [], total: 0, page: params.page || 1, limit: params.limit || 20 }
    }
  },

  async getAllAdmin(params = {}) {
    try {
      const { data } = await apiClient.get(`/admin/products?${buildQueryString(params)}`)
      const items = data.data || []
      
      return {
        data: items.map(normalizeProduct),
        total: items.length,
      }
    } catch (error) {
      console.error('[productService.getAllAdmin]', error.response?.data || error.message)
      return { data: [], total: 0 }
    }
  },

  async getById(id) {
    const { data } = await apiClient.get(`/products/${id}`)
    const result = data.data || data
    return normalizeProduct(result)
  },

  async getAdminById(id) {
    const { data } = await apiClient.get(`/admin/products/${id}`)
    return data.data || data
  },

  async create(payload) {
    const { data } = await apiClient.post('/admin/products', payload)
    return data.data || data
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/admin/products/${id}`, payload)
    return data.data || data
  },

  async toggleProductStatus(id) {
    try {
      const { data } = await apiClient.patch(`/admin/products/${id}/status`)
      return data.success
    } catch (error) {
      console.error('[ProductService toggleStatus]', error)
      throw error
    }
  },

  async deleteProduct(id) {
    const { data } = await apiClient.delete(`/admin/products/${id}`)
    return data
  },

  async uploadImage(id, formData) {
    const { data } = await apiClient.post(`/admin/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data || data
  },

  async getFeatured(limit = 8) {
    try {
      const { data } = await apiClient.get(`/products?${buildQueryString({ limit, sort: 'newest' })}`)
      const result = data.data || data

      // Backend returns { items: [...] }
      if (result.items && Array.isArray(result.items)) {
        return result.items.map(normalizeProduct)
      }
      if (Array.isArray(result)) {
        return result.map(normalizeProduct)
      }
      const items = result.data || result.products || []
      return (Array.isArray(items) ? items : []).map(normalizeProduct)
    } catch (error) {
      console.error('[productService.getFeatured]', error.response?.data || error.message)
      return []
    }
  },

  async getCategories() {
    try {
      const { data } = await apiClient.get('/products/categories')
      const result = data.data || data
      const cats = Array.isArray(result) ? result : (result.items || result.data || [])
      return cats.map(c => ({
        ...c,
        id: c.id,
        name: c.ten_danh_muc || c.name,
      }))
    } catch (error) {
      console.error('[productService.getCategories]', error.response?.data || error.message)
      return []
    }
  },

  async getCategoriesAdmin() {
    try {
      const { data } = await apiClient.get('/admin/categories')
      const result = data.data || data
      const cats = Array.isArray(result) ? result : (result.items || result.data || [])
      return cats.map(c => ({
        ...c,
        id: c.id,
        name: c.ten_danh_muc || c.name,
      }))
    } catch (error) {
      console.error('[productService.getCategoriesAdmin]', error.response?.data || error.message)
      return []
    }
  },

  async getBrands() {
    try {
      const { data } = await apiClient.get('/products/brands')
      return data.data || []
    } catch (error) {
      console.error('[productService.getBrands]', error.response?.data || error.message)
      return []
    }
  },

  async createCategory(payload) {
    const { data } = await apiClient.post('/admin/categories', payload)
    return data.data || data
  },

  async updateCategory(id, payload) {
    const { data } = await apiClient.put(`/admin/categories/${id}`, payload)
    return data.data || data
  },

  async deleteCategory(id) {
    const { data } = await apiClient.delete(`/admin/categories/${id}`)
    return data
  },

  async getReviews(productId, params = {}) {
    try {
      const { data } = await apiClient.get(`/reviews/product/${productId}?${buildQueryString(params)}`)
      return data.data || data
    } catch (error) {
      console.error('[productService.getReviews]', error.response?.data || error.message)
      return { data: [], total: 0 }
    }
  },

  async addReview(productId, payload) {
    const { data } = await apiClient.post('/reviews/add', { ...payload, productId })
    return data.data || data
  },

  async getNearestPharmacy(productId, lat, lng) {
    try {
      if (!lat || !lng) {
        console.warn('[productService.getNearestPharmacy] Missing coordinates')
        return null
      }
      const { data } = await apiClient.get(`/products/${productId}/nearest-pharmacies?lat=${lat}&lng=${lng}`)
      return data.data || null
    } catch (error) {
      console.warn('[productService.getNearestPharmacy]', error.response?.data?.message || error.message)
      return null
    }
  },

  normalizeProduct
}
