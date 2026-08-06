import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Select, Tag } from 'antd'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime } from '@/utils'
import { ORDER_STATUS } from '@/constants'

export default function AdminOrdersPage() {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [page, setPage]       = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    orderService.getAll({ page, limit: 20, status }).then(r => { setData(r.data); setTotal(r.total) }).finally(() => setLoading(false))
  }, [page, status])

  const cols = [
    { title: 'Mã đơn hàng', dataIndex: 'id',           key: 'id',     render: v => <span className="font-mono text-sm">{v}</span> },
    { title: 'Ngày đặt',    dataIndex: 'date',          key: 'date',   render: v => formatDateTime(v) },
    { title: 'Trạng thái',  dataIndex: 'status',        key: 'status', render: v => <OrderStatusBadge status={v} /> },
    { title: 'Sản phẩm',   dataIndex: 'items',          key: 'items',  render: v => `${v} món` },
    { title: 'Tổng tiền',  dataIndex: 'total',          key: 'total',  render: v => <strong>{formatCurrency(v)}</strong> },
    { title: 'Thanh toán', dataIndex: 'paymentMethod',  key: 'pay',    render: v => <Tag>{v?.toUpperCase()}</Tag> },
    { title: '', key: 'action', render: (_, row) => <a onClick={() => navigate(`/admin/orders/${row.id}`)} className="text-brand-600 hover:underline text-sm">Xem →</a> },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-xl font-display font-bold text-slate-900">Đơn hàng</h1><p className="text-slate-500 text-sm">{total} đơn hàng</p></div>
      <div className="card p-4">
        <div className="flex gap-3 mb-4 flex-wrap">
          <Select
            value={status || undefined}
            onChange={v => { setStatus(v || ''); setPage(1) }}
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 180 }}
            options={Object.values(ORDER_STATUS).map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          />
        </div>
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          size="middle" scroll={{ x: 700 }}
        />
      </div>
    </div>
  )
}
