import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import apiClient from '@/services/apiClient'
import { STORAGE_KEYS } from '@/constants'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      voucher: null,
      shippingFee: 30000,

      // ── Local cart mutations ──────────────────────────────────────────────
      addItem: (product, quantity = 1) => {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (!accessToken) {
          toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
          return
        }

        const { items } = get()
        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i) })
        } else {
          set({ items: [...items, { ...product, quantity }] })
        }
        toast.success(`${product.name} đã được thêm vào giỏ hàng`)

        // Sync to server for authenticated users (fire-and-forget)
        if (accessToken) {
          apiClient.post('/cart/add', { 
            duoc_pham_id: product.id, 
            so_luong: quantity,
            quy_cach_id: product.unitId || 1 // Fallback since frontend doesn't strictly track packaging variants yet
          }).catch(() => {})
        }
      },

      removeItem: (productId, unitId) => {
        set(state => ({ items: state.items.filter(i => i.id !== productId || (unitId && i.unitId !== unitId)) }))
        
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (accessToken) {
          apiClient.delete(`/cart/remove/${productId}`, { params: { quy_cach_id: unitId } }).catch(() => {})
        }
      },

      updateQuantity: (productId, quantity, unitId) => {
        if (quantity < 1) { get().removeItem(productId, unitId); return }
        
        set(state => ({ 
          items: state.items.map(i => 
            (i.id === productId && (!unitId || i.unitId === unitId)) ? { ...i, quantity } : i
          ) 
        }))

        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (accessToken) {
          apiClient.put('/cart/update', { 
            duoc_pham_id: productId, 
            so_luong: quantity,
            quy_cach_id: unitId || 1 
          }).catch(() => {})
        }
      },

      clearCart: () => set({ items: [], voucher: null }),

      applyVoucher: (voucher) => {
        set({ voucher })
        toast.success(`Voucher ${voucher.code} applied!`)
      },

      removeVoucher: () => set({ voucher: null }),

      // ── Server cart sync ──────────────────────────────────────────────────
      fetchCart: async () => {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (!accessToken) return

        // Cart API is customer-only — skip for admin/manager/warehouse roles
        const { useAuthStore } = await import('./authStore')
        const user = useAuthStore.getState().user
        if (user && user.role !== 'customer') return

        try {
          const { data } = await apiClient.get('/cart')
          const result = data.data || data
          const items = Array.isArray(result) ? result : (result.items || [])
          
          const mappedItems = items.map(item => ({
            id: item.duoc_pham_id,
            name: item.ten_thuoc,
            price: parseFloat(item.gia_ban),
            quantity: item.so_luong,
            image: item.hinh_anh_url,
            unitId: item.quy_cach_id,
            unitName: item.ten_don_vi
          }))
          
          set({ items: mappedItems })
        } catch (err) {
          console.error('Failed to fetch cart:', err)
        }
      },

      // ── Computed getters ──────────────────────────────────────────────────
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getDiscount: () => {
        const { voucher, getSubtotal } = get()
        if (!voucher) return 0
        if (voucher.type === 'percent') return Math.round(getSubtotal() * voucher.value / 100)
        if (voucher.type === 'fixed')   return voucher.value
        if (voucher.type === 'freeship') return get().shippingFee
        return 0
      },

      getTotal: () => {
        const { getSubtotal, getDiscount, shippingFee, voucher } = get()
        const shippingDiscount = voucher?.type === 'freeship' ? shippingFee : 0
        return getSubtotal() - getDiscount() + shippingFee - shippingDiscount
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'pharma-cart',
      partialize: (state) => ({ items: state.items, voucher: state.voucher }),
    }
  )
)
