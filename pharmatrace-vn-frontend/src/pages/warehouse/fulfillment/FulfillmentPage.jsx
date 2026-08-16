import { useEffect, useState } from 'react'
import { Table, Button as AButton, Tag } from 'antd'
import { CheckSquareOutlined, ScanOutlined } from '@ant-design/icons'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatDateTime, formatCurrency } from '@/utils'
import { OrderPackingModal } from '@/components/shared/OrderPackingModal'

export default function FulfillmentPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [packingOrder, setPackingOrder] = useState(null)

  const fetchPendingOrders = () => {
    setLoading(true)
    orderService.getAll({ limit: 50 })
      .then(r => setOrders(r.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPendingOrders()
  }, [])

  const handlePackingSuccess = (orderId) => {
    setOrders(o => o.map(x => (x.id === orderId || String(x.id) === String(orderId)) ? { ...x, status: 'DaDongGoi', trang_thai_don: 'DaDongGoi' } : x))
  }

  const cols = [
    { title: 'Mã đơn',    dataIndex: 'id',         key: 'id',    render: v => <span className="font-mono text-sm font-bold">#{v}</span> },
    { title: 'Ngày đặt',  dataIndex: 'date',        key: 'date',  render: (v, row) => formatDateTime(v || row.ngay_dat_hang) },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'cust', render: (v, row) => v || row.ho_ten || 'Khách hàng' },
    { title: 'Tổng tiền', dataIndex: 'total',       key: 'total', render: (v, row) => formatCurrency(v || row.tong_tien) },
    { title: 'Trạng thái', dataIndex: 'status',     key: 'status',render: (v, row) => <OrderStatusBadge status={v || row.trang_thai_don} /> },
    {
      title: 'Thao tác', key: 'action',
      render: (_, row) => {
        const st = row.status || row.trang_thai_don
        const isPending = st === 'ChoXacNhan' || st === 'confirmed' || st === 'Processing'
        return isPending ? (
          <AButton type="primary" size="small" icon={<ScanOutlined />} onClick={() => setPackingOrder(row)}>
            Quét mã & Đóng gói
          </AButton>
        ) : <Tag color="green">Đã đóng gói ✓</Tag>
      },
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <CheckSquareOutlined /> Quyết định & Đóng gói đơn hàng bằng mã QR
        </h1>
        <p className="text-slate-500 text-sm mt-1">Quét mã QR trên từng hộp thuốc bằng Camera hoặc máy quét barcode để xác thực đóng gói đơn hàng</p>
      </div>
      <div className="card p-4">
        <Table
          dataSource={orders}
          columns={cols}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{ emptyText: 'Không có đơn hàng nào cần xử lý đóng gói' }}
          scroll={{ x: 800 }}
        />
      </div>

      {packingOrder && (
        <OrderPackingModal
          open={!!packingOrder}
          onClose={() => setPackingOrder(null)}
          orderId={packingOrder.id}
          orderData={packingOrder}
          onSuccess={handlePackingSuccess}
        />
      )}
    </div>
  )
}
