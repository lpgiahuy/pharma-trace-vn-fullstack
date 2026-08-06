import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button as AButton, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { blogService } from '@/services/analytics.service'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'

export default function AdminBlogPage() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    blogService.getAll().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(fetchData, [])

  const handleDelete = async (id) => {
    try { await blogService.delete(id); toast.success('Đã xóa bài viết'); fetchData() }
    catch { toast.error('Xóa thất bại') }
  }

  const cols = [
    {
      title: 'Tiêu đề', dataIndex: 'title', key: 'title',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <img src={row.coverImage} alt="" className="w-10 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
          <span className="font-medium text-sm text-slate-800">{v}</span>
        </div>
      ),
    },
    { title: 'Danh mục', dataIndex: 'category',    key: 'cat',    render: v => <Tag>{v}</Tag> },
    { title: 'Tác giả',  dataIndex: 'author',      key: 'author', render: v => <span className="text-xs text-slate-500">{v}</span> },
    { title: 'Ngày đăng', dataIndex: 'publishedAt', key: 'date',  render: v => formatDate(v) },
    { title: 'Lượt xem', dataIndex: 'views',       key: 'views',  render: v => v?.toLocaleString() },
    {
      title: '', key: 'actions', width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <AButton size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/blog/${row.id}/edit`)} />
          <Popconfirm title="Xóa bài viết này?" onConfirm={() => handleDelete(row.id)} okText="Xóa" okButtonProps={{ danger: true }}>
            <AButton size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-display font-bold text-slate-900">Bài viết Blog</h1></div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/blog/new')}>Bài viết mới</AButton>
      </div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </div>
    </div>
  )
}
