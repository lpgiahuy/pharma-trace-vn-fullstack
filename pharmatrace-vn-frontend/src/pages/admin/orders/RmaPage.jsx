import { useEffect, useState } from 'react'
import { Table, Select, Tag, Button as AButton, Modal, Tooltip, Descriptions } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { rmaService } from '@/services/order.service'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS = { ChoDuyet: 'orange', DaDuyet: 'blue', TuChoi: 'red', DaHoanTien: 'green' }

export default function AdminRmaPage() {
  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRma, setSelectedRma] = useState(null)

  useEffect(() => {
    setLoading(true)
    rmaService.getAll({ page }).then(r => { setData(r.data); setTotal(r.total) }).finally(() => setLoading(false))
  }, [page])

  const updateStatus = async (id, status) => {
    try {
      await rmaService.updateStatus(id, status)
      setData(d => d.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Đã cập nhật trạng thái RMA')
    } catch { toast.error('Cập nhật thất bại') }
  }

  const cols = [
    { title: 'Mã RMA',      dataIndex: 'id',      key: 'id',     render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Đơn hàng',    dataIndex: 'orderId', key: 'order',  render: v => <a href={`/admin/orders/${v}`} target="_blank" className="text-brand-600 hover:underline">{v}</a> },
    { title: 'Lý do',       dataIndex: 'reason',  key: 'reason', ellipsis: true, render: v => <Tooltip title={v} placement="topLeft"><span>{v}</span></Tooltip> },
    { title: 'Ngày',        dataIndex: 'date',    key: 'date',   render: v => formatDateTime(v) },
    { title: 'Trạng thái',  dataIndex: 'status',  key: 'status', render: v => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag> },
    {
      title: 'Thao tác', key: 'actions', width: 200,
      render: (_, row) => (
        <div className="flex gap-1 items-center">
          <AButton size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRma(row); setDetailOpen(true); }} title="Xem chi tiết" />
          {row.status === 'ChoDuyet' && (
            <>
              <AButton size="small" type="primary" onClick={() => updateStatus(row.id, 'DaDuyet')}>Duyệt</AButton>
              <AButton size="small" danger onClick={() => updateStatus(row.id, 'TuChoi')}>Từ chối</AButton>
            </>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-xl font-display font-bold text-slate-900">Yêu cầu trả hàng (RMA)</h1><p className="text-slate-500 text-sm">{total} yêu cầu</p></div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          locale={{ emptyText: 'Không có yêu cầu trả hàng' }}
          size="middle"
        />
      </div>

      <Modal
        title="Chi tiết yêu cầu trả hàng"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<AButton key="close" onClick={() => setDetailOpen(false)}>Đóng</AButton>]}
      >
        {selectedRma && (
          <Descriptions bordered column={1} className="mt-4">
            <Descriptions.Item label="Mã RMA">{selectedRma.id}</Descriptions.Item>
            <Descriptions.Item label="Mã đơn hàng">
               <a href={`/admin/orders/${selectedRma.orderId}`} target="_blank" className="font-mono text-brand-600 hover:underline">#{selectedRma.orderId}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày">{formatDateTime(selectedRma.date)}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={STATUS_COLORS[selectedRma.status] || 'default'}>{selectedRma.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Lý do">
               <div className="whitespace-pre-wrap">{selectedRma.reason}</div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
