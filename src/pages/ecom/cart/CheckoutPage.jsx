import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { orderService } from '@/services/order.service'
import { voucherService } from '@/services/voucher.service'
import { userService } from '@/services/user.service'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils'
import { GiftOutlined, TagOutlined, FileTextOutlined } from '@ant-design/icons'
import { Alert } from 'antd'
import toast from 'react-hot-toast'

const PAYMENT_OPTIONS = [
  { value: 'cod',     label: '💵 Cash on Delivery' },
  { value: 'vnpay',   label: '🏦 VNPay' },
  { value: 'momo',    label: '💜 MoMo Wallet' },
  { value: 'banking', label: '🏧 Bank Transfer' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotal, getSubtotal, getDiscount, shippingFee, voucher, applyVoucher, removeVoucher, clearCart, fetchCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const [payMethod, setPayMethod] = useState('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedPrescription, setSelectedPrescription] = useState(null)

  const hasPrescriptionItem = items.some(item => item.isPrescription)

  useEffect(() => {
    fetchCart()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thanh toán')
      navigate('/login', { state: { from: { pathname: '/checkout' } } })
    }
  }, [isAuthenticated, navigate, fetchCart])

  useEffect(() => {
    if (hasPrescriptionItem) {
      userService.getMyPrescriptions()
        .then(list => setPrescriptions(list.filter(rx => rx.trang_thai_duyet === 'HopLe' && !rx.don_hang_id)))
        .catch(() => {})
    }
  }, [hasPrescriptionItem])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name:    user?.ho_ten    || user?.name    || '',
      phone:   user?.so_dien_thoai || user?.phone || '',
      address: user?.dia_chi_mac_dinh || user?.address || '',
      district: '',
      city: 'Ho Chi Minh City',
      note: '',
    },
  })

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi')
      return
    }
    setApplyingVoucher(true)
    try {
      const result = await voucherService.applyVoucher(voucherCode, getSubtotal())
      applyVoucher({ code: result.ma_code, type: 'fixed', value: result.so_tien_giam })
      setVoucherCode('')
      toast.success(`Áp dụng mã ${result.ma_code} thành công!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã khuyến mãi không hợp lệ')
    } finally {
      setApplyingVoucher(false)
    }
  }

  const availablePoints = user?.diem_tich_luy || 0
  const pointsValue = pointsToUse * 100

  const onSubmit = async (formData) => {
    if (hasPrescriptionItem && !selectedPrescription) {
      toast.error('Giỏ hàng có thuốc kê đơn. Vui lòng chọn toa thuốc hợp lệ.')
      return
    }
    try {
      const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}`
      const order = await orderService.create({
        dia_chi_giao_hang:      fullAddress,
        phuong_thuc_thanh_toan: payMethod.toUpperCase(),
        ghi_chu:                formData.note,
        voucher_id:             voucher?.id,
        ma_giam_gia:            voucher?.code,
        diem_su_dung:           pointsToUse || 0,
        toa_thuoc_id:           selectedPrescription || null,
      })
      clearCart()
      toast.success('Đặt hàng thành công!')
      navigate(`/order-success/${order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-800 mb-4">Delivery Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" required error={errors.name?.message} {...register('name', { required: true })} />
                <Input label="Phone Number" required error={errors.phone?.message} {...register('phone', { required: true })} />
                <Input label="Street Address" className="sm:col-span-2" required error={errors.address?.message} {...register('address', { required: true })} />
                <Input label="District" required error={errors.district?.message} {...register('district', { required: true })} />
                <Input label="City" required {...register('city')} />
                <Input label="Order Note (optional)" className="sm:col-span-2" placeholder="Special delivery instructions..." {...register('note')} />
              </div>
            </div>

            {/* Prescription — hiện chỉ khi có thuốc kê đơn */}
            {hasPrescriptionItem && (
              <div className="card p-6 border-amber-200 bg-amber-50">
                <h2 className="font-display font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <FileTextOutlined /> Prescription Required (Toa thuốc)
                </h2>
                <Alert
                  type="warning"
                  showIcon
                  message="Your cart contains prescription-only medicine. Select an approved prescription to proceed."
                  className="mb-4"
                />
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    No approved prescriptions found.{' '}
                    <a href="/account/prescriptions" className="underline font-medium" target="_blank" rel="noreferrer">
                      Upload a prescription
                    </a>{' '}
                    and wait for admin approval before checking out.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prescriptions.map(rx => (
                      <label key={rx.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPrescription === rx.id ? 'border-amber-500 bg-amber-100' : 'border-amber-200 hover:border-amber-400'}`}>
                        <input
                          type="radio"
                          name="prescription"
                          value={rx.id}
                          checked={selectedPrescription === rx.id}
                          onChange={() => setSelectedPrescription(rx.id)}
                          className="accent-amber-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900">
                            {rx.ten_bac_si ? `Dr. ${rx.ten_bac_si}` : `Prescription #${rx.id}`}
                          </p>
                          <p className="text-xs text-amber-700">
                            {rx.ten_benh_vien || ''}{rx.chuan_doan ? ` — ${rx.chuan_doan}` : ''}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Voucher Code */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TagOutlined /> Voucher Code
              </h2>
              {voucher ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-green-900">Applied: {voucher.code}</p>
                    <p className="text-xs text-green-700">Save {formatCurrency(getDiscount())}</p>
                  </div>
                  <button type="button" onClick={() => removeVoucher()} className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Enter voucher code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} className="flex-1" />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={applyingVoucher || !voucherCode.trim()}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                  >
                    {applyingVoucher ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* Loyalty Points */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <GiftOutlined /> Loyalty Points
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">Available Points</p>
                  <p className="text-2xl font-bold text-amber-700">{availablePoints.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 mt-1">= {formatCurrency(availablePoints * 100)}</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Use Points (1 point = 100₫)</label>
                  <input
                    type="number"
                    min="0"
                    max={availablePoints}
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(Math.max(0, Math.min(availablePoints, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-2 border border-surface-border rounded-lg focus:outline-none focus:border-brand-500"
                    placeholder="Enter points to use"
                  />
                  {pointsToUse > 0 && <p className="text-sm text-brand-600">Saving: {formatCurrency(pointsValue)}</p>}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-800 mb-4">Payment Method</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPayMethod(opt.value)}
                    className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${payMethod === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-border text-slate-700 hover:border-brand-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-6 h-fit space-y-4">
            <h2 className="font-display font-semibold text-slate-800">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg bg-slate-50 border border-surface-border object-contain p-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-slate-500">x{item.quantity} · {formatCurrency(item.price)}</p>
                    {item.isPrescription && <span className="text-xs text-amber-600 font-medium">Rx Required</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span></div>
              <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{formatCurrency(shippingFee)}</span></div>
              {getDiscount() > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Voucher</span><span>-{formatCurrency(getDiscount())}</span></div>}
              {pointsToUse > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Loyalty Points</span><span>-{formatCurrency(pointsValue)}</span></div>}
            </div>
            <div className="divider" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-brand-600">{formatCurrency(getTotal() - pointsValue)}</span>
            </div>
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Place Order</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
