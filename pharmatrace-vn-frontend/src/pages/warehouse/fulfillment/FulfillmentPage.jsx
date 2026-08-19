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
    { title: 'Order ID',    dataIndex: 'id',         key: 'id',    render: v => <span className="font-mono text-sm font-bold">#{v}</span> },
    { title: 'Order Date',  dataIndex: 'date',        key: 'date',  render: (v, row) => formatDateTime(v || row.ngay_dat_hang) },
    { title: 'Customer', dataIndex: 'customerName', key: 'cust', render: (v, row) => v || row.ho_ten || 'Customer' },
    { title: 'Total Amount', dataIndex: 'total',       key: 'total', render: (v, row) => formatCurrency(v || row.tong_tien) },
    { title: 'Status', dataIndex: 'status',     key: 'status',render: (v, row) => <OrderStatusBadge status={v || row.trang_thai_don} /> },
    {
      title: 'Action', key: 'action',
      render: (_, row) => {
        const st = row.status || row.trang_thai_don
        const isPending = st === 'ChoXacNhan' || st === 'confirmed' || st === 'Processing'
        return isPending ? (
          <AButton type="primary" size="small" icon={<ScanOutlined />} onClick={() => setPackingOrder(row)}>
            Scan QR & Pack
          </AButton>
        ) : <Tag color="green">Packed ✓</Tag>
      },
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <CheckSquareOutlined /> Order Fulfillment & Packing Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">Scan item QRs on medicine packages via camera or barcode scanner to verify order packing</p>
      </div>
      <div className="card p-4">
        <Table
          dataSource={orders}
          columns={cols}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{ emptyText: 'No pending orders awaiting packing' }}
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
