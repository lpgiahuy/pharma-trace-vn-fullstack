import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { orderService, rmaService } from '@/services/order.service'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RMA_REASONS } from '@/constants'
import { formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

export default function RmaPage() {
  const [submitted, setSubmitted] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [returnItems, setReturnItems] = useState([])

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()
  const orderId = watch('orderId')

  const handleLoadOrder = async () => {
    if (!orderId?.trim()) return
    setLoadingOrder(true)
    try {
      const order = await orderService.getById(orderId.trim())
      setOrderItems(order.items || [])
      setReturnItems((order.items || []).map(item => ({
        duoc_pham_id: item.duoc_pham_id || item.id,
        quy_cach_id:  item.quy_cach_id,
        ten_thuoc:    item.name,
        so_luong_mua: item.quantity,
        so_luong_tra: 0,
        checked:      false,
      })))
      toast.success('Loaded order items')
    } catch {
      toast.error('Order not found or does not belong to you.')
      setOrderItems([])
      setReturnItems([])
    } finally {
      setLoadingOrder(false)
    }
  }

  const toggleItem = (idx) => {
    setReturnItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked, so_luong_tra: !item.checked ? item.so_luong_mua : 0 } : item
    ))
  }

  const setQty = (idx, val) => {
    setReturnItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, so_luong_tra: Math.max(0, Math.min(item.so_luong_mua, Number(val) || 0)) } : item
    ))
  }

  const onSubmit = async (data) => {
    const selectedItems = returnItems.filter(i => i.checked && i.so_luong_tra > 0)
    if (orderItems.length > 0 && selectedItems.length === 0) {
      toast.error('Please select at least one item to return.')
      return
    }
    try {
      const rma = await rmaService.create({
        don_hang_id: data.orderId,
        ly_do_tra:   `[${data.reason}] ${data.description}`,
        chi_tiet:    selectedItems.map(i => ({
          duoc_pham_id: i.duoc_pham_id,
          quy_cach_id:  i.quy_cach_id,
          so_luong:     i.so_luong_tra,
        })),
      })
      setSubmitted(rma)
      toast.success('RMA request submitted!')
      reset()
      setOrderItems([])
      setReturnItems([])
    } catch { toast.error('Failed to submit RMA request.') }
  }

  return (
    <div className="page-container py-8 max-w-2xl animate-fade-in">
      <h1 className="section-title mb-2">Return / Refund Request</h1>
      <p className="text-slate-500 text-sm mb-6">Fill in the form below to initiate a return or refund.</p>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✅ RMA submitted — ID: <strong className="font-mono">{submitted.id}</strong>. Our team will contact you within 24 hours.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Order lookup */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Order ID <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="ORD-001234"
              {...register('orderId', { required: 'Order ID is required' })}
            />
            <button
              type="button"
              onClick={handleLoadOrder}
              disabled={loadingOrder || !orderId?.trim()}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loadingOrder ? 'Loading...' : 'Load Items'}
            </button>
          </div>
          {errors.orderId && <p className="text-xs text-red-500 mt-1">{errors.orderId.message}</p>}
        </div>

        {/* Return items */}
        {orderItems.length > 0 && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Select Items to Return</label>
            <div className="space-y-2 border border-slate-200 rounded-lg overflow-hidden">
              {returnItems.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 transition-colors ${item.checked ? 'bg-brand-50' : 'bg-white'} ${idx < returnItems.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(idx)}
                    className="accent-brand-500 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.ten_thuoc}</p>
                    <p className="text-xs text-slate-500">Purchased: {item.so_luong_mua}</p>
                  </div>
                  {item.checked && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Return qty:</span>
                      <input
                        type="number"
                        min={1}
                        max={item.so_luong_mua}
                        value={item.so_luong_tra}
                        onChange={e => setQty(idx, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Reason <span className="text-red-500">*</span></label>
          <select className="input" {...register('reason', { required: true })}>
            <option value="">Select a reason…</option>
            {RMA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <Textarea
          label="Description"
          placeholder="Describe the issue in detail…"
          required
          error={errors.description?.message}
          {...register('description', { required: 'Please describe the issue' })}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>Submit RMA Request</Button>
      </form>
    </div>
  )
}
