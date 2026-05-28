import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Form, Input, Select, Switch, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userService, unitService } from '@/services/user.service'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const ROLES = ['SuperAdmin', 'QuanLyKho', 'NhanVienBanHang']
const ROLE_COLORS = {
  SuperAdmin: 'red',
  QuanLyKho: 'purple',
  NhanVienBanHang: 'blue'
}

export default function StaffPage() {
  const { user: currentUser } = useAuthStore()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [units, setUnits]     = useState([])
  const [form] = Form.useForm()

  const fetchData = () => {
    setLoading(true)
    userService.getAll().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => {
    fetchData()
    unitService.getAll().then(setUnits).catch(() => {})
  }, [])

  const openModal = (user = null) => {
    setEditing(user)
    if (user) {
      form.setFieldsValue({
        ho_ten: user.name,
        email: user.email,
        vai_tro: user.role,
        don_vi_id: user.don_vi_id,
        trang_thai: user.status === 'active' || user.status === true || user.status === 1
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ trang_thai: true, vai_tro: 'NhanVienBanHang' })
    }
    setOpen(true)
  }

  const handleSave = async (vals) => {
    setSaving(true)
    try {
      const payload = {
        ho_ten: vals.ho_ten,
        email: vals.email,
        vai_tro: vals.vai_tro,
        don_vi_id: vals.don_vi_id,
        trang_thai: vals.trang_thai,
        password: vals.password
      }

      if (editing) await userService.update(editing.id, payload)
      else         await userService.create(payload)

      toast.success(editing ? 'Đã cập nhật nhân viên' : 'Đã tạo nhân viên')
      setOpen(false); fetchData()
    } catch { toast.error('Lưu thất bại') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await userService.delete(id); toast.success('Đã xóa nhân viên'); fetchData() }
    catch { toast.error('Xóa thất bại') }
  }

  const cols = [
    {
      title: 'Nhân viên',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-sm text-slate-800">{row.name}</p>
            <p className="text-[10px] font-mono text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: v => <Tag color={ROLE_COLORS[v] || 'default'} className="rounded-full px-3">{v}</Tag>
    },
    {
      title: 'Đơn vị',
      dataIndex: 'don_vi_id',
      key: 'unit',
      render: v => <Tag color="blue">Đơn vị #{v}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const isActive = v === 'active' || v === true || v === 1
        return <Badge status={isActive ? 'success' : 'error'} text={isActive ? 'Hoạt động' : 'Vô hiệu hóa'} />
      }
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, row) => {
        const isSelf = row.id === currentUser?.id
        return (
          <div className="flex gap-1">
            <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
            <Popconfirm
              title="Xóa nhân viên?"
              onConfirm={() => handleDelete(row.id)}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <AButton size="small" danger icon={<DeleteOutlined />} disabled={isSelf} title={isSelf ? 'Không thể xóa tài khoản của chính mình' : ''} />
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  const Badge = ({ status, text }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="text-xs font-medium text-slate-600">{text}</span>
    </div>
  )

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">Nhân viên & Phân quyền</h1>
          <p className="text-slate-500 text-sm">Quản lý người dùng và phân quyền hệ thống</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Thêm nhân viên</AButton>
      </div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </div>

      <Modal
        title={editing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Họ và tên" name="ho_ten" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
              <Input placeholder="VD: Nguyễn Văn A" />
            </Form.Item>
            <Form.Item label="Địa chỉ email" name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input placeholder="name@pharmatrace.vn" />
            </Form.Item>
          </div>

          {!editing && (
            <Form.Item label="Mật khẩu tạm thời" name="password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="Tối thiểu 6 ký tự" />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Vai trò hệ thống" name="vai_tro" rules={[{ required: true }]}>
              <Select options={ROLES.map(r => ({ value: r, label: r }))} />
            </Form.Item>
            <Form.Item label="Đơn vị phụ trách" name="don_vi_id" rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}>
              <Select placeholder="Chọn đơn vị" showSearch optionFilterProp="children">
                {units.map(u => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.name} <span className="text-slate-400 text-xs">({u.type})</span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Tài khoản hoạt động" name="trang_thai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
