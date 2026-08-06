import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/utils'
import { Package } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { orderService.getMyOrders().then(r => setOrders(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <PageLoader />
  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title mb-6">My Orders</h1>
      {orders.length === 0
        ? <EmptyState icon={Package} title="No orders yet" description="Start shopping to see your orders here" action={() => {}} actionLabel="Shop Now" />
        : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} to={`/account/orders/${order.id}`} className="card p-4 flex items-center justify-between hover:shadow-elevated transition-shadow gap-4">
                <div>
                  <p className="font-semibold text-slate-800 font-mono">{order.id}</p>
                  <p className="text-sm text-slate-500">{formatDate(order.date)} · {order.itemsCount} item(s)</p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-bold text-brand-600 hidden sm:block">{formatCurrency(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
