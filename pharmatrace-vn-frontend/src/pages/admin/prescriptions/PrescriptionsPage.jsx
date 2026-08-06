import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Tag, Image, Tabs, Tooltip } from 'antd'
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { prescriptionAdminService } from '@/services/user.service'
import { Avatar } from '@/components/ui/Avatar'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

const STATUS_META = {
  ChoDuyet: { color: 'orange',  label: 'Chờ duyệt' },
  HopLe:    { color: 'green',   label: 'Đã duyệt' },
  TuChoi:   { color: 'red',     label: 'Từ chối' },
}

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'ChoDuyet', label: 'Chờ duyệt' },
  { key: 'HopLe',    label: 'Đã duyệt' },
  { key: 'TuChoi',   label: 'Từ chối' },
]

export default function PrescriptionsPage() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [imgModal, setImgModal] = useState({ open: false, src: '', name: '' })
  const [updating, setUpdating] = useState(null)

  const fetchData = (status) => {
    setLoading(true)
    prescriptionAdminService.getAll(status)
      .then(rows => setData(Array.isArray(rows) ? rows : []))
      .catch(() => toast.error('Tải danh sách toa thuốc thất bại'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(activeTab) }, [activeTab])

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdating(id)
    try {
      await prescriptionAdminService.updateStatus(id, newStatus)
      setData(prev => prev.map(p => p.id === id ? { ...p, trang_thai_duyet: newStatus } : p))
      toast.success(newStatus === 'HopLe' ? 'Đã duyệt toa thuốc' : 'Đã từ chối toa thuốc')
    } catch {
      toast.error('Cập nhật toa thuốc thất bại')
    } finally {
      setUpdating(null)
    }
  }

  const cols = [
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.ten_khach_hang} size="sm" />
          <div>
            <p className="text-sm font-medium text-slate-800">{row.ten_khach_hang}</p>
            <p className="text-[10px] font-mono text-slate-400">{row.so_dien_thoai}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Bác sĩ',
      key: 'doctor',
      render: (_, row) => (
        <div>
          <p className="text-sm text-slate-700">{row.ten_bac_si || '—'}</p>
          {row.ten_benh_vien && <p className="text-[10px] text-slate-400">{row.ten_benh_vien}</p>}
        </div>
      ),
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'chuan_doan',
      key: 'diagnosis',
      ellipsis: true,
      render: v => v ? <Tooltip title={v}><span>{v}</span></Tooltip> : <span className="text-slate-400">—</span>,
    },
    {
      title: 'Ngày',
      dataIndex: 'ngay_tao',
      key: 'date',
      render: v => <span className="text-xs text-slate-500">{formatDateTime(v)}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai_duyet',
      key: 'status',
      render: v => {
        const meta = STATUS_META[v] || { color: 'default', label: v }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1 items-center">
          <Tooltip title="Xem ảnh toa thuốc">
            <AButton
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setImgModal({ open: true, src: row.hinh_anh_toa, name: row.ten_khach_hang })}
            />
          </Tooltip>
          {row.trang_thai_duyet === 'ChoDuyet' && (
            <>
              <Tooltip title="Duyệt">
                <AButton
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={updating === row.id}
                  onClick={() => handleUpdateStatus(row.id, 'HopLe')}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <AButton
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={updating === row.id}
                  onClick={() => handleUpdateStatus(row.id, 'TuChoi')}
                />
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900">Toa thuốc</h1>
        <p className="text-slate-500 text-sm">Xem xét và duyệt toa thuốc của khách hàng</p>
      </div>

      <div className="card">
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key)}
          items={TABS.map(t => ({ key: t.key, label: t.label }))}
          className="px-4 pt-2"
        />
        <div className="px-4 pb-4">
          <Table
            dataSource={data}
            columns={cols}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 15 }}
            size="middle"
            locale={{ emptyText: 'Không có toa thuốc' }}
          />
        </div>
      </div>

      <Modal
        title={`Toa thuốc — ${imgModal.name}`}
        open={imgModal.open}
        onCancel={() => setImgModal({ open: false, src: '', name: '' })}
        footer={null}
        centered
        width={600}
      >
        <div className="flex justify-center py-4">
          {imgModal.src ? (
            <Image
              src={imgModal.src}
              alt="Prescription"
              className="max-h-[60vh] object-contain rounded-lg"
              style={{ maxHeight: '60vh' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          ) : (
            <p className="text-slate-400">Không có ảnh</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
