import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function OrderSuccessPage() {
  const { id } = useParams()
  return (
    <div className="page-container py-20 flex flex-col items-center text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">Order Placed!</h1>
      <p className="text-slate-500 mb-2">Thank you for your order. We'll process it right away.</p>
      <p className="text-sm font-mono bg-slate-100 px-4 py-2 rounded-lg text-slate-700 mb-8">Order ID: {id}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/account/orders">
          <Button variant="secondary" leftIcon={<Package className="w-4 h-4" />}>Track Order</Button>
        </Link>
        <Link to="/products">
          <Button rightIcon={<ArrowRight className="w-4 h-4" />}>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}
