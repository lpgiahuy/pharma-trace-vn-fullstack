import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Form, Input, Select, Switch, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userService, unitService } from '@/services/user.service'
import { useAuth } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { getRoleMeta } from '@/utils/formatters'
import toast from 'react-hot-toast'

const ROLES = ['SuperAdmin', 'QuanLyCuaHang', 'QuanLyKho', 'NhanVienBanHang']
const ROLE_COLORS = {
  SuperAdmin: 'red',
  QuanLyCuaHang: 'orange',
  QuanLyKho: 'purple',
  NhanVienBanHang: 'blue'
}

export default function StaffPage() {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [units, setUnits] = useState([])
  const [form] = Form.useForm()

  const fetchData = () => {
    setLoading(true)
    userService.getAll().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => {
    fetchData()
    unitService.getAll().then(setUnits).catch(() => { })
  }, [])

  const openModal = (user = null) => {
    setEditing(user)
    if (user) {
      form.setFieldsValue({
        ho_ten: user.ho_ten || user.name || '',
        email: user.email || '',
        vai_tro: user.vai_tro || user.role || 'NhanVienBanHang',
        don_vi_id: user.don_vi_id || null,
        trang_thai: user.trang_thai ?? (user.status === 'active' || user.status === true || user.status === 1)
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
      else await userService.create(payload)

      toast.success(editing ? 'Staff member updated successfully' : 'Staff member created successfully')
      setOpen(false); fetchData()
    } catch { toast.error('Failed to save staff member') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await userService.delete(id); toast.success('Staff member deleted successfully'); fetchData() }
    catch { toast.error('Failed to delete staff member') }
  }

  const cols = [
    {
      title: 'Staff Member',
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
      title: 'System Role',
      dataIndex: 'role',
      key: 'role',
      render: v => {
        const meta = getRoleMeta(v)
        return <Tag color={meta.color || ROLE_COLORS[v] || 'default'} className="rounded-full px-3">{meta.en || meta.label || v}</Tag>
      }
    },
    {
      title: 'Assigned Facility',
      dataIndex: 'don_vi_id',
      key: 'unit',
      render: v => <Tag color="blue">Facility #{v}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const isActive = v === 'active' || v === true || v === 1
        return <Badge status={isActive ? 'success' : 'error'} text={isActive ? 'Active' : 'Disabled'} />
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
              title="Delete staff member?"
              onConfirm={() => handleDelete(row.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <AButton size="small" danger icon={<DeleteOutlined />} disabled={isSelf} title={isSelf ? 'Cannot delete your own account' : ''} />
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
          <h1 className="text-xl font-display font-bold text-slate-900">Staff & Access Permissions</h1>
          <p className="text-slate-500 text-sm">Manage user directory, system authorization, and facility assignments</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Add Staff Member</AButton>
      </div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </div>

      <Modal
        title={editing ? 'Edit Staff Member' : 'Add New Staff Member'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Full Name" name="ho_ten" rules={[{ required: true, message: 'Please enter name' }]}>
              <Input placeholder="e.g. John Doe" />
            </Form.Item>
            <Form.Item label="Email Address" name="email" rules={[{ required: true, type: 'email', message: 'Invalid email address' }]}>
              <Input placeholder="name@pharmatrace.vn" />
            </Form.Item>
          </div>

          {!editing && (
            <Form.Item label="Temporary Password" name="password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="At least 6 characters" />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="System Role" name="vai_tro" rules={[{ required: true }]}>
              <Select options={ROLES.map(r => ({ value: r, label: r }))} />
            </Form.Item>
            <Form.Item label="Assigned Facility" name="don_vi_id" rules={[{ required: true, message: 'Please select facility' }]}>
              <Select placeholder="Select facility" showSearch optionFilterProp="children">
                {units.map(u => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.name} <span className="text-slate-400 text-xs">({u.type})</span>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Active Account Status" name="trang_thai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
