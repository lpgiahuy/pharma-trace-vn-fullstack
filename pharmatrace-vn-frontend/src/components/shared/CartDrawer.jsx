import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui/Button'
import { CartEmpty } from '@/components/ui/EmptyState'

export const CartDrawer = () => {
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore()
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore()

  if (!cartDrawerOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setCartDrawerOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-modal flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <h2 className="font-display font-semibold text-slate-900">Cart ({getItemCount()})</h2>
          </div>
          <button onClick={() => setCartDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <CartEmpty onShop={() => setCartDrawerOpen(false)} />
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-contain bg-slate-50 border border-surface-border p-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">{item.name}</p>
                    <p className="text-sm font-bold text-brand-600 mt-0.5">{formatCurrency(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 border border-surface-border rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-100 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-100 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-surface-border px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(getSubtotal())}</span>
            </div>
            <Link to="/checkout" onClick={() => setCartDrawerOpen(false)}>
              <Button fullWidth size="lg">Proceed to Checkout</Button>
            </Link>
            <Link to="/cart" onClick={() => setCartDrawerOpen(false)}>
              <Button variant="ghost" fullWidth>View Full Cart</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
