import { useState, useEffect } from 'react'
import { Table, Button as AButton, Modal, Form, Input, Popconfirm, Space, Grid, InputNumber, Select, Switch, Tag, AutoComplete } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { productService } from '@/services/product.service'
import toast from 'react-hot-toast'
import { useAuth } from '@/store/authStore'

const { useBreakpoint } = Grid

const COMMON_ICONS = [
  { value: 'medication', label: 'Medication / Antibiotics' },
  { value: 'pill', label: 'Pills / Pharmaceuticals' },
  { value: 'vaccines', label: 'Vaccines / Immunization' },
  { value: 'medical_services', label: 'Medical Devices & Services' },
  { value: 'health_and_safety', label: 'Health & Safety' },
  { value: 'sanitizer', label: 'Antiseptics & Sanitizers' },
  { value: 'clean_hands', label: 'Personal Hygiene' },
  { value: 'healing', label: 'First Aid & Bandages' },
  { value: 'ecg_heart', label: 'Cardiology & Blood Pressure' },
  { value: 'psychology', label: 'Neurology & Brain Health' },
  { value: 'eye', label: 'Eye Care' },
  { value: 'dentistry', label: 'Dental & Oral Health' },
  { value: 'child_care', label: 'Mom & Baby' },
  { value: 'nutrition', label: 'Nutrition & Supplements' },
  { value: 'fitness_center', label: 'Fitness & Vitality' },
  { value: 'skincare', label: 'Dermatology & Skincare' },
  { value: 'category', label: 'Other / Default' },
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
  const { user } = useAuth()
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

      toast.success(editing ? 'Category updated successfully' : 'Category created successfully')
      setOpen(false)
      fetchCategories()
    } catch {
      toast.error(editing ? 'Failed to update category' : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await productService.deleteCategory(id)
      if (res?.data?.isSoftDeleted) {
        toast.error(res.message || 'Category contains active products and was hidden instead.')
      } else {
        toast.success(res?.message || 'Category deleted permanently!')
      }
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category')
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v, row) => (
        <div>
          <span className="font-medium text-slate-700">{v}</span>
          {row.danh_muc_cha_id && (
            <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Sub-category</div>
          )}
        </div>
      )
    },
    {
      title: 'Order',
      dataIndex: 'thu_tu_hien_thi',
      key: 'order',
      width: 80,
      align: 'center',
      render: v => <Tag>{v}</Tag>
    },
    ...(isSuperAdmin ? [
      {
        title: 'Status',
        dataIndex: 'trang_thai',
        key: 'status',
        width: 120,
        render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'ACTIVE' : 'HIDDEN'}</Tag>
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_, row) => (
          <Space size="small">
            <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
            <Popconfirm title="Delete category?" onConfirm={() => handleDelete(row.id || row._id)} okText="Delete" okButtonProps={{ danger: true }}>
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
          <h1 className="text-xl font-display font-bold text-slate-900">Product Categories</h1>
          <p className="text-slate-500 text-sm">Manage product groups and taxonomy hierarchy</p>
        </div>
        {isSuperAdmin && (
          <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} className="w-full sm:w-auto">
            Add Category
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
        title={editing ? 'Edit Category' : 'New Category'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Category Name" name="ten_danh_muc" rules={[{ required: true, message: 'Please enter category name' }]}>
            <Input placeholder="e.g. Antibiotics" />
          </Form.Item>

          <Form.Item label="Parent Category" name="danh_muc_cha_id">
            <Select placeholder="Select parent category (optional)" allowClear>
              {cats.filter(c => !c.danh_muc_cha_id && (!editing || (c.id !== editing.id))).map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Category Icon" name="hinh_anh_icon">
              <AutoComplete
                placeholder="Select or type icon name (e.g. medication, pill...)"
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
            <Form.Item label="Display Order" name="thu_tu_hien_thi">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="Active Status" name="trang_thai" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
