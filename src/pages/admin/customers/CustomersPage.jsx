import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Descriptions, Statistic, Popconfirm } from 'antd'
import { EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { customerService } from '@/services/user.service'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

const TIER_META = {
  'Đồng':     { color: '#92400e', bg: '#fef3c7', border: '#d97706' },
  'Bạc':      { color: '#374151', bg: '#f1f5f9', border: '#94a3b8' },
  'Vàng':     { color: '#713f12', bg: '#fef08a', border: '#ca8a04' },
  'Bạch Kim': { color: '#0369a1', bg: '#e0f2fe', border: '#38bdf8' },
  'Kim Cương':{ color: '#6b21a8', bg: '#f3e8ff', border: '#a855f7' },
}

const TierTag = ({ tier }) => {
  const meta = TIER_META[tier]
  if (!meta) return <span className="text-xs text-slate-400">{tier || '—'}</span>
  return (
    <span style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
      className="text-xs font-semibold px-3 py-0.5 rounded-full inline-block">
      {tier}
    </span>
  )
}

const StatusBadge = ({ active }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
    <span className="text-xs font-medium text-slate-600">{active ? 'Hoạt động' : 'Đã khóa'}</span>
  </div>
)

export default function CustomersPage() {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [detail, setDetail]       = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toggling, setToggling]   = useState(null)

  const fetchData = () => {
    setLoading(true)
    customerService.getAll()
      .then(rows => setData(rows))
      .catch(() => toast.error('Tải danh sách khách hàng thất bại'))
      .finally(() => setLoading(false))
  }
  useEffect(fetchData, [])

  const openDetail = async (row) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const d = await customerService.getById(row.id)
      setDetail(d)
    } catch {
      toast.error('Tải chi tiết khách hàng thất bại')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleToggleLock = async (row) => {
    const action = row.trang_thai ? 'lock' : 'unlock'
    setToggling(row.id)
    try {
      await customerService.setStatus(row.id, action)
      setData(prev => prev.map(c => c.id === row.id ? { ...c, trang_thai: !c.trang_thai } : c))
      toast.success(action === 'lock' ? 'Tài khoản đã bị khóa' : 'Tài khoản đã mở khóa')
    } catch {
      toast.error('Cập nhật trạng thái thất bại')
    } finally {
      setToggling(null)
    }
  }

  const cols = [
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.ho_ten} size="sm" />
          <div>
            <p className="font-medium text-sm text-slate-800">{row.ho_ten}</p>
            <p className="text-[10px] font-mono text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { title: 'Điện thoại', dataIndex: 'so_dien_thoai', key: 'phone', render: v => <span className="font-mono text-xs">{v}</span> },
    {
      title: 'Hạng thẻ',
      dataIndex: 'hang_thanh_vien',
      key: 'tier',
      render: v => <TierTag tier={v} />,
    },
    {
      title: 'Điểm',
      dataIndex: 'diem_tich_luy',
      key: 'points',
      align: 'right',
      render: v => <span className="font-semibold text-brand-600">{(v || 0).toLocaleString()}</span>,
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'ngay_tao',
      key: 'joined',
      render: v => <span className="text-xs text-slate-500">{formatDate(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'status',
      render: v => <StatusBadge active={v} />,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <AButton size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)} title="Xem chi tiết" />
          <Popconfirm
            title={row.trang_thai ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
            description={row.trang_thai ? 'Khách hàng sẽ không thể đăng nhập.' : 'Khách hàng sẽ có thể đăng nhập lại.'}
            onConfirm={() => handleToggleLock(row)}
            okText="Xác nhận"
            okButtonProps={{ danger: row.trang_thai }}
          >
            <AButton
              size="small"
              danger={row.trang_thai}
              type={row.trang_thai ? 'default' : 'primary'}
              icon={row.trang_thai ? <LockOutlined /> : <UnlockOutlined />}
              loading={toggling === row.id}
              title={row.trang_thai ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900">Khách hàng</h1>
        <p className="text-slate-500 text-sm">{data.length} tài khoản đã đăng ký</p>
      </div>

      <div className="card p-4">
        <Table
          dataSource={data}
          columns={cols}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
          locale={{ emptyText: 'Không có khách hàng' }}
        />
      </div>

      <Modal
        title="Chi tiết khách hàng"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<AButton key="close" onClick={() => setDetailOpen(false)}>Đóng</AButton>]}
        centered
        width={520}
      >
        {detailLoading || !detail ? (
          <div className="py-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <Avatar name={detail.ho_ten} size="lg" />
              <div>
                <p className="font-bold text-slate-800 text-base">{detail.ho_ten}</p>
                <p className="text-sm text-slate-500">{detail.email}</p>
                <p className="text-sm text-slate-500">{detail.so_dien_thoai}</p>
              </div>
              <div className="ml-auto self-start"><TierTag tier={detail.hang_thanh_vien} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
              <Statistic title="Tổng đơn hàng" value={detail.thong_ke_don_hang?.tong_don_hang || 0} />
              <Statistic
                title="Tổng chi tiêu"
                value={Number(detail.thong_ke_don_hang?.tong_chi_tieu || 0)}
                formatter={v => formatCurrency(v)}
              />
              <Statistic title="Hoàn thành" value={detail.thong_ke_don_hang?.don_hoan_thanh || 0} valueStyle={{ color: '#10b981' }} />
              <Statistic title="Đã hủy" value={detail.thong_ke_don_hang?.don_da_huy || 0} valueStyle={{ color: '#ef4444' }} />
            </div>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Điểm tích lũy">
                <span className="font-semibold text-brand-600">{(detail.diem_tich_luy || 0).toLocaleString()} điểm</span>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ mặc định">{detail.dia_chi_mac_dinh || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tham gia">{formatDate(detail.ngay_tao)}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <StatusBadge active={detail.trang_thai} />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
