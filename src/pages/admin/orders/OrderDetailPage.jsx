import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Select, Button as AButton, Descriptions, Timeline, Tag, Modal, Form, Typography } from 'antd'
import { ArrowLeftOutlined, ScanOutlined, FullscreenExitOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { formatCurrency, formatDateTime } from '@/utils'
import { ORDER_STATUS } from '@/constants'
import toast from 'react-hot-toast'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fulfillOpen, setFulfillOpen] = useState(false)
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfillForm] = Form.useForm()

  useEffect(() => {
    orderService.getAdminById(id).then(setOrder).finally(() => setLoading(false))
  }, [id])

  const handleShip = async () => {
    setUpdating(true)
    try {
      await orderService.shipOrder(id)
      setOrder(o => ({ ...o, status: ORDER_STATUS.DangGiao }))
      toast.success('Đơn hàng đang được giao')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể bắt đầu giao hàng')
    } finally {
      setUpdating(false)
    }
  }

  const handleComplete = async () => {
    setUpdating(true)
    try {
      await orderService.completeOrder(id)
      setOrder(o => ({ ...o, status: ORDER_STATUS.HoanThanh, paymentStatus: 'DaThanhToan' }))
      toast.success('Đơn hàng hoàn thành!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể hoàn tất đơn hàng')
    } finally {
      setUpdating(false)
    }
  }

  const handleFulfill = async (vals) => {
    if (!vals.uids || vals.uids.length === 0) return toast.error('Vui lòng quét ít nhất một UID')
    setFulfilling(true)
    try {
      await orderService.fulfillOrder(id, vals.uids)
      toast.success('Đã đóng gói đơn hàng thành công!')
      setFulfillOpen(false)
      setOrder(o => ({ ...o, status: ORDER_STATUS.DaDongGoi }))
    } catch (e) { toast.error(e.response?.data?.message || 'Không thể đóng gói đơn hàng') }
    finally { setFulfilling(false) }
  }

  if (loading) return <PageLoader />
  if (!order)  return <div className="text-slate-500 py-16 text-center">Không tìm thấy đơn hàng.</div>

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AButton icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')}>Quay lại</AButton>
          <h1 className="text-xl font-display font-bold text-slate-900">Đơn hàng <span className="font-mono">{order.id}</span></h1>
        </div>
        {(order.status === 'ChoXacNhan' || order.status === 'DaDongGoi') && (
          <AButton type="primary" icon={<ScanOutlined />} onClick={() => setFulfillOpen(true)}>
            Đóng gói & Quét mã
          </AButton>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <EnvironmentOutlined className="text-brand-600" />
          Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Họ và tên</p>
              <p className="text-sm font-semibold text-slate-900">{order.customerName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1 flex items-center gap-1">
                <PhoneOutlined className="text-sm" /> Điện thoại
              </p>
              {order.customerPhone ? (
                <a href={`tel:${order.customerPhone}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 break-words">
                  {order.customerPhone}
                </a>
              ) : (
                <p className="text-sm text-slate-500">N/A</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1 flex items-center gap-1">
                <MailOutlined className="text-sm" /> Email
              </p>
              {order.customerEmail ? (
                <a href={`mailto:${order.customerEmail}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 break-words">
                  {order.customerEmail}
                </a>
              ) : (
                <p className="text-sm text-slate-500">N/A</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Địa chỉ giao hàng</p>
              <p className="text-sm text-slate-700 break-words">{order.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1 flex items-center gap-1">
                <DollarOutlined className="text-sm" /> Phương thức thanh toán
              </p>
              <p className="text-sm font-semibold text-slate-900">{order.paymentMethod?.toUpperCase() || 'COD'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase mb-1">Trạng thái thanh toán</p>
              <Tag color={order.paymentStatus === 'DaThanhToan' ? 'green' : 'orange'} className="text-xs">
                {order.paymentStatus === 'DaThanhToan' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">{formatDateTime(order.date)}</p>
            <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === ORDER_STATUS.DaDongGoi && (
              <AButton type="primary" className="bg-blue-600" loading={updating} onClick={handleShip}>
                Bắt đầu giao hàng
              </AButton>
            )}
            {order.status === ORDER_STATUS.DangGiao && (
              <AButton type="primary" className="bg-green-600" loading={updating} onClick={handleComplete}>
                Xác nhận hoàn thành
              </AButton>
            )}
          </div>
        </div>

        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Tổng tiền"><strong>{formatCurrency(order.total)}</strong></Descriptions.Item>
          <Descriptions.Item label="Số lượng sản phẩm"><strong>{order.itemsCount}</strong></Descriptions.Item>
        </Descriptions>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Chi tiết đơn hàng</h3>
        <div className="space-y-4">
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex gap-4 pb-4 border-b border-surface-border last:border-0 last:pb-0">
              <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">💊</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <p className="font-bold text-slate-900 text-sm break-words">{item.name}</p>
                  {item.isPrescription && (
                    <Tag color="orange" className="text-[10px] mt-1">Rx - Thuốc kê đơn</Tag>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 mb-2">
                  <div>
                    <span className="text-slate-500">Quy cách:</span>
                    <p className="font-medium text-slate-800">{item.unit || item.don_vi_ban || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Số lượng:</span>
                    <p className="font-medium text-slate-800">{item.quantity}</p>
                  </div>
                  {item.don_vi_xuat && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Kho xuất:</span>
                      <p className="font-medium text-slate-800">{item.don_vi_xuat}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-500">Đơn giá:</span>
                  <span className="text-sm font-mono text-slate-700">{formatCurrency(item.price)}</span>
                  {item.gia_goc_luc_mua && item.gia_goc_luc_mua > item.price && (
                    <span className="text-xs line-through text-slate-400">{formatCurrency(item.gia_goc_luc_mua)}</span>
                  )}
                </div>
              </div>

              <div className="text-right flex flex-col justify-center">
                <span className="text-xs text-slate-500 block mb-1">Thành tiền</span>
                <span className="text-lg font-bold text-brand-600">{formatCurrency(item.price * item.quantity)}</span>
                {item.phan_tram_giam_luc_mua > 0 && (
                  <span className="text-[10px] text-emerald-600 mt-1">-{item.phan_tram_giam_luc_mua}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title={<><ScanOutlined className="mr-2 text-brand-600"/> Đóng gói đơn hàng #{order.id}</>}
        open={fulfillOpen}
        onCancel={() => setFulfillOpen(false)}
        onOk={() => fulfillForm.submit()}
        confirmLoading={fulfilling}
        okText="Xác nhận & Đóng gói"
        destroyOnClose
      >
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
          Quét mã QR/Barcode trên hộp thuốc đang đóng gói cho đơn hàng này.
          Dùng máy quét mã vạch hoặc nhập thủ công rồi nhấn Enter cho mỗi UID.
        </div>
        <Form form={fulfillForm} layout="vertical" onFinish={handleFulfill}>
          <Form.Item label="Mã UID sản phẩm đã quét" name="uids" rules={[{ required: true, message: 'Vui lòng cung cấp ít nhất một UID' }]}>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Quét mã vạch tại đây..."
              open={false}
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
