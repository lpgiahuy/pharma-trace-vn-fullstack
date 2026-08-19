import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Descriptions, Statistic, Popconfirm } from 'antd'
import { EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { customerService } from '@/services/user.service'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate, formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

const TIER_META = {
  'Đồng':     { label: 'Bronze', color: '#92400e', bg: '#fef3c7', border: '#d97706' },
  'Bạc':      { label: 'Silver', color: '#374151', bg: '#f1f5f9', border: '#94a3b8' },
  'Vàng':     { label: 'Gold', color: '#713f12', bg: '#fef08a', border: '#ca8a04' },
  'Bạch Kim': { label: 'Platinum', color: '#0369a1', bg: '#e0f2fe', border: '#38bdf8' },
  'Kim Cương':{ label: 'Diamond', color: '#6b21a8', bg: '#f3e8ff', border: '#a855f7' },
}

const TierTag = ({ tier }) => {
  const meta = TIER_META[tier]
  if (!meta) return <span className="text-xs text-slate-400">{tier || '—'}</span>
  return (
    <span style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
      className="text-xs font-semibold px-3 py-0.5 rounded-full inline-block">
      {meta.label || tier}
    </span>
  )
}

const StatusBadge = ({ active }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
    <span className="text-xs font-medium text-slate-600">{active ? 'Active' : 'Locked'}</span>
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
      .catch(() => toast.error('Failed to load customers list'))
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
      toast.error('Failed to load customer details')
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
      toast.success(action === 'lock' ? 'Customer account locked successfully' : 'Customer account unlocked successfully')
    } catch {
      toast.error('Failed to update account status')
    } finally {
      setToggling(null)
    }
  }

  const cols = [
    {
      title: 'Customer',
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
    { title: 'Phone Number', dataIndex: 'so_dien_thoai', key: 'phone', render: v => <span className="font-mono text-xs">{v}</span> },
    {
      title: 'Tier',
      dataIndex: 'hang_thanh_vien',
      key: 'tier',
      render: v => <TierTag tier={v} />,
    },
    {
      title: 'Points',
      dataIndex: 'diem_tich_luy',
      key: 'points',
      align: 'right',
      render: v => <span className="font-semibold text-brand-600">{(v || 0).toLocaleString()}</span>,
    },
    {
      title: 'Joined Date',
      dataIndex: 'ngay_tao',
      key: 'joined',
      render: v => <span className="text-xs text-slate-500">{formatDate(v)}</span>,
    },
    {
      title: 'Status',
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
          <AButton size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)} title="View details" />
          <Popconfirm
            title={row.trang_thai ? 'Lock this customer account?' : 'Unlock this customer account?'}
            description={row.trang_thai ? 'Customer will no longer be able to log in.' : 'Customer will regain access to their account.'}
            onConfirm={() => handleToggleLock(row)}
            okText="Confirm"
            okButtonProps={{ danger: row.trang_thai }}
          >
            <AButton
              size="small"
              danger={row.trang_thai}
              type={row.trang_thai ? 'default' : 'primary'}
              icon={row.trang_thai ? <LockOutlined /> : <UnlockOutlined />}
              loading={toggling === row.id}
              title={row.trang_thai ? 'Lock account' : 'Unlock account'}
            />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900">Customer Directory</h1>
        <p className="text-slate-500 text-sm">{data.length} registered accounts</p>
      </div>

      <div className="card p-4">
        <Table
          dataSource={data}
          columns={cols}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
          locale={{ emptyText: 'No customers found' }}
        />
      </div>

      <Modal
        title="Customer Profile & Statistics"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<AButton key="close" onClick={() => setDetailOpen(false)}>Close</AButton>]}
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
              <Statistic title="Total Orders" value={detail.thong_ke_don_hang?.tong_don_hang || 0} />
              <Statistic
                title="Total Spend"
                value={Number(detail.thong_ke_don_hang?.tong_chi_tieu || 0)}
                formatter={v => formatCurrency(v)}
              />
              <Statistic title="Completed Orders" value={detail.thong_ke_don_hang?.don_hoan_thanh || 0} valueStyle={{ color: '#10b981' }} />
              <Statistic title="Cancelled Orders" value={detail.thong_ke_don_hang?.don_da_huy || 0} valueStyle={{ color: '#ef4444' }} />
            </div>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Loyalty Points">
                <span className="font-semibold text-brand-600">{(detail.diem_tich_luy || 0).toLocaleString()} pts</span>
              </Descriptions.Item>
              <Descriptions.Item label="Default Address">{detail.dia_chi_mac_dinh || '—'}</Descriptions.Item>
              <Descriptions.Item label="Member Since">{formatDate(detail.ngay_tao)}</Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <StatusBadge active={detail.trang_thai} />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}
