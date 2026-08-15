import { useState, useEffect } from 'react'
import { Table, Button as AButton, Modal, Form, Input, Popconfirm, Space, Grid, InputNumber, Select, Switch, Tag, AutoComplete } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { productService } from '@/services/product.service'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const { useBreakpoint } = Grid

const COMMON_ICONS = [
  { value: 'medication', label: 'Thuốc / Kháng sinh' },
  { value: 'pill', label: 'Thuốc viên / Dược phẩm' },
  { value: 'vaccines', label: 'Vaccine / Tiêm chủng' },
  { value: 'medical_services', label: 'Thiết bị & Y tế' },
  { value: 'health_and_safety', label: 'Chăm sóc sức khỏe' },
  { value: 'sanitizer', label: 'Sát khuẩn / Khử trùng' },
  { value: 'clean_hands', label: 'Vệ sinh cá nhân' },
  { value: 'healing', label: 'Sơ cứu / Băng gạc' },
  { value: 'ecg_heart', label: 'Tim mạch / Huyết áp' },
  { value: 'psychology', label: 'Thần kinh / Bổ não' },
  { value: 'eye', label: 'Chăm sóc mắt' },
  { value: 'dentistry', label: 'Răng hàm mặt' },
  { value: 'child_care', label: 'Mẹ và bé' },
  { value: 'nutrition', label: 'Dinh dưỡng / TPCN' },
  { value: 'fitness_center', label: 'Thể thao / Tăng cường' },
  { value: 'skincare', label: 'Mỹ phẩm / Chăm sóc da' },
  { value: 'category', label: 'Khác / Mặc định' },
]

const buildCategoryTree = (flatList) => {
  const map = {};
  const tree = [];

  flatList.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  flatList.forEach(item => {
    const mappedItem = map[item.id];
    if (item.danh_muc_cha_id) {
      const parent = map[item.danh_muc_cha_id];
      if (parent) {
        parent.children.push(mappedItem);
      } else {
        tree.push(mappedItem);
      }
    } else {
      tree.push(mappedItem);
    }
  });

  const cleanEmptyChildren = (nodes) => {
    nodes.forEach(node => {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        cleanEmptyChildren(node.children);
      }
    });
  };
  cleanEmptyChildren(tree);

  return tree;
};

export default function CategoriesPage() {
  const user = useAuthStore(s => s.user)
  const isSuperAdmin = ['SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'].includes(user?.vai_tro || user?.role)

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
      const data = await productService.getCategoriesAdmin()
      const treeData = buildCategoryTree(data)
      setCats(treeData)
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
        danh_muc_cha_id: cat.danh_muc_cha_id || null,
        hinh_anh_icon: cat.hinh_anh_icon,
        thu_tu_hien_thi: cat.thu_tu_hien_thi,
        trang_thai: cat.trang_thai
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
        trang_thai: vals.trang_thai
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
      const res = await productService.deleteCategory(id)
      if (res?.data?.isSoftDeleted) {
        toast.error(res.message || 'Danh mục đã có sản phẩm thuộc về nên đã được tự động chuyển sang trạng thái Ẩn.')
      } else {
        toast.success(res?.message || 'Đã xóa vĩnh viễn danh mục thành công!')
      }
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa danh mục thất bại')
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
    ...(isSuperAdmin ? [
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
    ] : []),
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">Danh mục</h1>
          <p className="text-slate-500 text-sm">Quản lý nhóm sản phẩm và danh mục</p>
        </div>
        {isSuperAdmin && (
          <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="w-full sm:w-auto">
            Thêm danh mục
          </AButton>
        )}
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
            <Form.Item label="Icon danh mục" name="hinh_anh_icon">
              <AutoComplete
                placeholder="Chọn hoặc gõ tên icon (VD: medication, pill...)"
                allowClear
                filterOption={(inputValue, option) =>
                  (option?.value || '').toLowerCase().includes(inputValue.toLowerCase()) ||
                  (option?.searchValue || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              >
                {COMMON_ICONS.map(item => (
                  <Select.Option key={item.value} value={item.value} searchValue={item.label}>
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="material-symbols-outlined text-primary-600 text-lg flex-shrink-0">{item.value}</span>
                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                      <span className="text-xs text-slate-400 font-mono ml-auto">({item.value})</span>
                    </div>
                  </Select.Option>
                ))}
              </AutoComplete>
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
