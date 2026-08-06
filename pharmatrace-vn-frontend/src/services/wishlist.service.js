import apiClient from './apiClient'
import { productService } from './product.service'

export const wishlistService = {
  async getMine() {
    const { data } = await apiClient.get('/wishlist')
    const items = data.data || data
    return (Array.isArray(items) ? items : []).map(i => productService.normalizeProduct({
      ...i,
      id: i.id || i.duoc_pham_id,
      is_favorited: true
    }))
  },

  async toggle(productId) {
    const { data } = await apiClient.post('/wishlist/toggle', { duoc_pham_id: productId })
    return data.data || data
  },

  async add(productId) {
    const { data } = await apiClient.post('/wishlist/add', { duoc_pham_id: productId })
    return data.data || data
  },

  async remove(productId) {
    const { data } = await apiClient.delete(`/wishlist/remove/${productId}`)
    return data.data || data
  }
}
