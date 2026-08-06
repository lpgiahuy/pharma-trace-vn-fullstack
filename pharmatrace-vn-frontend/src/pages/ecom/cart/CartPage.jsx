import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { voucherService } from '@/services/analytics.service'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CartEmpty } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getDiscount, getTotal,
          shippingFee, voucher, applyVoucher, removeVoucher } = useCartStore()
  const [voucherCode, setVoucherCode] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setApplying(true)
    try {
      const { voucherService: vs } = await import('@/services/analytics.service')
      const v = await vs.validate(voucherCode.trim(), getSubtotal())
      applyVoucher(v)
    } catch (err) {
      toast.error(err.message || 'Invalid voucher')
    } finally {
      setApplying(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-16">
        <CartEmpty onShop={() => {}} />
        <div className="text-center mt-4">
          <Link to="/products"><Button size="lg">Browse Products</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-contain bg-slate-50 border border-surface-border p-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.id}`} className="font-semibold text-slate-800 hover:text-brand-600 line-clamp-2 leading-snug">{item.name}</Link>
                <p className="text-xs text-slate-400 mt-0.5">{item.brand}</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 border border-surface-border rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.unitId)} className="p-2 hover:bg-slate-100"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.unitId)} className="p-2 hover:bg-slate-100"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-brand-600">{formatCurrency(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id, item.unitId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Voucher */}
          <div className="card p-4">
            <p className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-brand-500" /> Voucher Code</p>
            {voucher ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-green-700">{voucher.code}</p>
                  <p className="text-xs text-green-600">Saved {formatCurrency(getDiscount())}</p>
                </div>
                <button onClick={removeVoucher} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Enter code" value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} className="text-sm" />
                <Button variant="secondary" onClick={handleApplyVoucher} loading={applying} size="sm">Apply</Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="card p-4 space-y-3">
            <p className="font-semibold text-slate-800">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span></div>
              <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{formatCurrency(shippingFee)}</span></div>
              {getDiscount() > 0 && (
                <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-{formatCurrency(getDiscount())}</span></div>
              )}
            </div>
            <div className="divider" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(getTotal())}</span>
            </div>
            <Link to="/checkout">
              <Button fullWidth size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>Proceed to Checkout</Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" fullWidth>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
