import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Table, Button as AButton, Input, Space, Popconfirm, Tag, Grid, message, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { productService } from '@/services/product.service'
import { formatCurrency } from '@/utils'
import { StockBadge } from '@/components/ui/Badge'
import { useAuth } from '@/store/authStore'

const { useBreakpoint } = Grid

export default function AdminProductsPage() {
  const { user } = useAuth()
  const isSuperAdmin = ['SuperAdmin', 'superadmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'].includes(user?.vai_tro || user?.role)

  const [data, setData]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState('newest')
  const [page, setPage]       = useState(1)
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = screens.md === false

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await productService.getAllAdmin({ search, sort })
      setData(res.data); setTotal(res.total)
    } finally { setLoading(false) }
  }
  const loadData = fetchData

  useEffect(() => { fetchData() }, [search, sort])

  const handleDelete = async (id) => {
    try {
      const res = await productService.deleteProduct(id)
      if (res?.data?.isSoftDeleted) {
        message.info(res.message || 'Product has been set to Hidden status to preserve data history.')
      } else {
        message.success(res?.message || 'Product deleted permanently.')
      }
      loadData()
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete product.')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await productService.toggleProductStatus(id)
      message.success('Status updated successfully')
      loadData()
    } catch (err) {
      message.error('Failed to update status')
    }
  }

  const columns = [
    { title: 'Product', dataIndex: 'name', key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <img src={row.image} alt={name} className="w-8 h-8 rounded-md object-contain bg-slate-50 border border-slate-100 p-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-[13px] sm:text-[14px] leading-tight text-slate-800 line-clamp-2 mb-0.5">{name}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{row.brand}</p>
          </div>
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'category',   key: 'category', responsive: ['lg'], width: 130, align: 'center', render: v => <Tag className="text-[11px] px-2 py-0.5">{v}</Tag> },
    { title: 'Price',      dataIndex: 'price',       key: 'price',    width: 100, align: 'right', render: v => <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">{formatCurrency(v)}</span> },
    { title: 'System Stock', dataIndex: 'totalStock',  key: 'stock',    responsive: ['sm'], width: 140, align: 'center', render: (v) => <StockBadge quantity={v} /> },
    { title: 'Batch',       dataIndex: 'batchNumber', key: 'batch',    responsive: ['xl'], width: 90, align: 'center', render: v => <span className="font-mono text-[11px]">{v}</span> },
    ...(isSuperAdmin ? [
      { title: 'Status', dataIndex: 'isActive',  key: 'status',   responsive: ['sm'], width: 90, align: 'center',
        render: (v, row) => (
          <Tag
            color={v ? "success" : "default"}
            className="text-[11px] px-2 py-0.5 cursor-pointer hover:opacity-80"
            onClick={() => handleToggleStatus(row.id)}
          >
            {v ? 'Active' : 'Hidden'}
          </Tag>
        )
      },
      {
        title: 'Actions', key: 'actions', width: 80, align: 'center',
        render: (_, row) => (
          <Space size={4}>
            <AButton size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/products/${row.id}/edit`)} />
            <Popconfirm
              title="Delete permanently?"
              description="This action cannot be undone. Product data will be permanently removed."
              onConfirm={() => handleDelete(row.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <AButton size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ] : []),
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">Products Directory</h1>
          <p className="text-slate-500 text-sm">{total} products</p>
        </div>
        {isSuperAdmin && (
          <Link to="/admin/products/new">
            <AButton type="primary" icon={<PlusOutlined />} className="w-full sm:w-auto">Add Product</AButton>
          </Link>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            placeholder="Search products by name or brand..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full sm:max-w-[320px]"
            allowClear
          />
          <Select
            value={sort}
            onChange={v => { setSort(v); setPage(1) }}
            className="w-full sm:w-[180px]"
            options={[
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' },
              { label: 'Price: Low to High', value: 'price_asc' },
              { label: 'Price: High to Low', value: 'price_desc' },
              { label: 'Name: A-Z', value: 'name_asc' },
              { label: 'Name: Z-A', value: 'name_desc' },
            ]}
          />
        </div>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => screens.md ? `${t} products` : null,
            size: isMobile ? 'small' : 'default'
          }}
          size="middle"
          scroll={{ x: false }}
        />
      </div>
    </div>
  )
}
