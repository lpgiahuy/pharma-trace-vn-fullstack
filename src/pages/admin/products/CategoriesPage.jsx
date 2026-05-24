import { useState, useEffect } from 'react'
import { Table, Button as AButton, Modal, Form, Input, Popconfirm, Space, Grid, InputNumber, Select, Switch, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { productService } from '@/services/product.service'
import toast from 'react-hot-toast'

const { useBreakpoint } = Grid

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const screens = useBreakpoint()
  const isMobile = screens.md === false

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const data = await productService.getCategories()
      setCats(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openModal = (cat = null) => {
    setEditing(cat)
    if (cat) {
      form.setFieldsValue({
        ten_danh_muc: cat.name || cat.ten_danh_muc,
        danh_muc_cha_id: cat.danh_muc_cha_id,
        hinh_anh_icon: cat.hinh_anh_icon,
        thu_tu_hien_thi: cat.thu_tu_hien_thi,
        trang_thai: cat.trang_thai ?? true
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ trang_thai: true, thu_tu_hien_thi: 0 })
    }
    setOpen(true)
  }

  const handleSave = async (vals) => {
    setSaving(true)
    try {
      const payload = {
        ten_danh_muc: vals.ten_danh_muc,
        danh_muc_cha_id: vals.danh_muc_cha_id || null,
        hinh_anh_icon: vals.hinh_anh_icon || '',
        thu_tu_hien_thi: vals.thu_tu_hien_thi || 0,
        trang_thai: vals.trang_thai ?? true
      }

      if (editing) await productService.updateCategory(editing.id || editing._id, payload)
      else         await productService.createCategory(payload)

      toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục')
      setOpen(false)
      fetchCategories()
    } catch {
      toast.error(editing ? 'Cập nhật danh mục thất bại' : 'Tạo danh mục thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await productService.deleteCategory(id)
      toast.success('Đã xóa danh mục')
      fetchCategories()
    } catch {
      toast.error('Xóa danh mục thất bại')
    }
  }

  const cols = [
    {
      title: 'Icon',
      dataIndex: 'hinh_anh_icon',
      key: 'icon',
      width: 60,
      render: v => <span className="material-symbols-outlined text-[20px] text-slate-400">{v || 'category'}</span>
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (v, row) => (
        <div>
          <span className="font-medium text-slate-700">{v}</span>
          {row.danh_muc_cha_id && (
            <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Danh mục con</div>
          )}
        </div>
      )
    },
    {
      title: 'Thứ tự',
      dataIndex: 'thu_tu_hien_thi',
      key: 'order',
      width: 80,
      align: 'center',
      render: v => <Tag>{v}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'status',
      width: 120,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'HOẠT ĐỘNG' : 'ẨN'}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <Space size="small">
          <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
          <Popconfirm title="Xóa danh mục?" onConfirm={() => handleDelete(row.id || row._id)} okText="Xóa" okButtonProps={{ danger: true }}>
            <AButton size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">Danh mục</h1>
          <p className="text-slate-500 text-sm">Quản lý nhóm sản phẩm và danh mục</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="w-full sm:w-auto">
          Thêm danh mục
        </AButton>
      </div>

      <div className="card p-4">
        <Table
          dataSource={cats}
          columns={cols}
          rowKey={row => row.id || row._id}
          pagination={{ pageSize: 10 }}
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      <Modal
        title={editing ? 'Chỉnh sửa danh mục' : 'Danh mục mới'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Tên danh mục" name="ten_danh_muc" rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}>
            <Input placeholder="VD: Kháng sinh" />
          </Form.Item>

          <Form.Item label="Danh mục cha" name="danh_muc_cha_id">
            <Select placeholder="Chọn danh mục cha (tùy chọn)" allowClear>
              {cats.filter(c => !c.danh_muc_cha_id && (!editing || (c.id !== editing.id))).map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Tên icon" name="hinh_anh_icon">
              <Input placeholder="VD: medication" prefix={<span className="material-symbols-outlined text-[16px]">search</span>} />
            </Form.Item>
            <Form.Item label="Thứ tự hiển thị" name="thu_tu_hien_thi">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="Hoạt động" name="trang_thai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
