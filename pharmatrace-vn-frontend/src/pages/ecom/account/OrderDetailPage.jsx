import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { formatCurrency, formatDateTime } from '@/utils'
import { ChevronLeft } from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { orderService.getById(id).then(setOrder).finally(() => setLoading(false)) }, [id])
  if (loading) return <PageLoader />
  if (!order) return <div className="page-container py-8 text-slate-500">Order not found.</div>
  return (
    <div className="page-container py-8 max-w-2xl animate-fade-in">
      <Link to="/account/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6"><ChevronLeft className="w-4 h-4" /> Back to Orders</Link>
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-slate-900 text-xl font-mono">{order.id}</h1>
            <p className="text-sm text-slate-500 mt-1">{formatDateTime(order.date)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="divider" />
        <div className="space-y-3">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">💊</span>
                )}
              </div>
              <div className="flex-1"><p className="font-medium text-slate-800">{item.name}</p><p className="text-slate-500">x{item.quantity}</p></div>
              <span className="font-semibold text-slate-700">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="divider" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-brand-600">{formatCurrency(order.total)}</span>
        </div>
      </div>
      <div className="card p-4 text-sm">
        <p className="font-semibold text-slate-700 mb-2">Delivery Address</p>
        <p className="text-slate-500">{order.address}</p>
        <p className="text-slate-500 mt-1">Payment: <span className="capitalize font-medium text-slate-700">{order.paymentMethod}</span></p>
      </div>
    </div>
  )
}
