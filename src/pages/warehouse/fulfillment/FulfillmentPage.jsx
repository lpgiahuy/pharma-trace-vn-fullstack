import { useEffect, useState } from 'react'
import { Table, Button as AButton, Tag } from 'antd'
import { CheckSquareOutlined } from '@ant-design/icons'
import { orderService } from '@/services/order.service'
import { warehouseService } from '@/services/warehouse.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatDateTime, formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

export default function FulfillmentPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [packing, setPacking] = useState({})

  useEffect(() => {
    orderService.getAll({ status: 'confirmed', limit: 50 })
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handlePack = async (orderId) => {
    setPacking(p => ({ ...p, [orderId]: true }))
    try {
      await warehouseService.fulfillOrder(orderId, { status: 'packed' })
      setOrders(o => o.map(x => x.id === orderId ? { ...x, status: 'processing' } : x))
      toast.success(`Đơn hàng #${orderId} đã được đóng gói`)
    } catch { toast.error('Cập nhật đơn hàng thất bại') }
    finally { setPacking(p => ({ ...p, [orderId]: false })) }
  }

  const cols = [
    { title: 'Mã đơn',    dataIndex: 'id',         key: 'id',    render: v => <span className="font-mono text-sm font-bold">{v}</span> },
    { title: 'Ngày đặt',  dataIndex: 'date',        key: 'date',  render: v => formatDateTime(v) },
    { title: 'Số sản phẩm', dataIndex: 'items',     key: 'items', render: v => `${v} sản phẩm` },
    { title: 'Tổng tiền', dataIndex: 'total',       key: 'total', render: v => formatCurrency(v) },
    { title: 'Trạng thái', dataIndex: 'status',     key: 'status',render: v => <OrderStatusBadge status={v} /> },
    { title: 'Địa chỉ',   dataIndex: 'address',     key: 'addr',  ellipsis: true },
    {
      title: 'Thao tác', key: 'action',
      render: (_, row) => row.status === 'confirmed' ? (
        <AButton type="primary" size="small" loading={packing[row.id]} onClick={() => handlePack(row.id)} icon={<CheckSquareOutlined />}>
          Đóng gói
        </AButton>
      ) : <Tag color="green">Đã đóng gói ✓</Tag>,
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <CheckSquareOutlined /> Đóng gói đơn hàng
        </h1>
        <p className="text-slate-500 text-sm mt-1">Đóng gói và chuẩn bị giao hàng cho các đơn đã xác nhận</p>
      </div>
      <div className="card p-4">
        <Table
          dataSource={orders}
          columns={cols}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{ emptyText: 'Không có đơn hàng nào chờ đóng gói' }}
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  )
}
