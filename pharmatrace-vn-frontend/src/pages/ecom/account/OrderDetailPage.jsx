import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { PageLoader, Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDateTime } from '@/utils'
import { ChevronLeft, CheckCircle2, ShieldCheck, CornerDownLeft } from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const fetchDetail = () => {
    setLoading(true)
    orderService.getById(id).then(setOrder).finally(() => setLoading(false))
  }

  useEffect(() => { fetchDetail() }, [id])

  const handleConfirmReceipt = async () => {
    if (!window.confirm('Are you sure you have inspected and received all items in this shipment? This will complete the order.')) return
    setConfirming(true)
    try {
      await orderService.confirmReceipt(order.id)
      toast.success('🎉 Package receipt confirmed! Order completed successfully.')
      fetchDetail()
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while confirming delivery receipt.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <PageLoader />
  if (!order) return <div className="page-container py-8 text-slate-500">Order not found.</div>

  const isShippedOrDelivered = ['DangGiao', 'ChoGiaoHang', 'DangChuanBi', 'GiaoHangThanhCong'].includes(order.status)
  const isCompleted = order.status === 'HoanThanh' || order.status === 'DaThanhToan'

  return (
    <div className="page-container py-8 max-w-2xl animate-fade-in">
      <Link to="/account/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Shopee-style Confirm Receipt Banner */}
      {isShippedOrDelivered && !isCompleted && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Out for delivery / Package received?</p>
              <p className="text-xs text-slate-600">Please carefully inspect products & authenticity seals before confirming receipt.</p>
            </div>
          </div>
          <button
            onClick={handleConfirmReceipt}
            disabled={confirming}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {confirming ? <Spinner size="sm" className="text-white" /> : <ShieldCheck className="w-5 h-5" />}
            Confirm Order Received
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>This order has been completed. Thank you for choosing PharmaTrace!</span>
        </div>
      )}

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
