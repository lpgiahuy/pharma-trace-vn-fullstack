import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, DatePicker, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm } from 'antd'
import { CalendarOutlined, AlertOutlined, PlusOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function LotBatchMonitorPage() {
  const [lots, setLots] = useState([])
  const [stats, setStats] = useState({ tong_so_lo: 0, lo_can_date: 0, lo_het_han: 0, lo_thu_hoi: 0 })
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchLots = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/lots', { params })
      if (res.data?.success) setLots(res.data.data || [])
    } catch (err) {
      message.error('Lỗi khi tải danh sách Lô sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/lots/stats')
      if (res.data?.success) setStats(res.data.data || {})
    } catch (err) {
      // Silent error
    }
  }

  useEffect(() => {
    fetchLots()
    fetchStats()
  }, [filterStatus])

  const handleCreateLot = async (values) => {
    try {
      const payload = {
        duoc_pham_id: values.duoc_pham_id,
        so_lo: values.so_lo,
        ngay_san_xuat: values.ngay_san_xuat.format('YYYY-MM-DD'),
        han_su_dung: values.han_su_dung.format('YYYY-MM-DD')
      }
      const res = await apiClient.post('/admin/lots', payload)
      if (res.data?.success) {
        message.success('Tạo lô sản phẩm thành công!')
        setIsCreateModalOpen(false)
        form.resetFields()
        fetchLots()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Lỗi khi tạo lô sản phẩm')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể tạo lô sản phẩm')
    }
  }

  const handleRecallLot = async (id) => {
    try {
      const res = await apiClient.patch(`/admin/lots/${id}/recall`)
      if (res.data?.success) {
        message.success('Đã kích hoạt lệnh THU HỒI SẢN PHẨM cho Lô này!')
        fetchLots()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Lỗi thu hồi lô sản phẩm')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thực hiện lệnh thu hồi')
    }
  }

  const renderStatusTag = (status, days) => {
    switch (status) {
      case 'ThuHoi':
        return <Tag color="volcano" icon={<ExclamationCircleOutlined />}>ĐÃ THU HỒI</Tag>
      case 'HetHan':
        return <Tag color="red" icon={<CloseCircleOutlined />}>HẾT HẠN ({Math.abs(days)} ngày trước)</Tag>
      case 'CanDate':
        return <Tag color="warning" icon={<AlertOutlined />}>CẬN DATE (Còn {days} ngày)</Tag>
      default:
        return <Tag color="green" icon={<CheckCircleOutlined />}>HỢP LỆ (Còn {days} ngày)</Tag>
    }
  }

  const columns = [
    { title: 'Số Lô', dataIndex: 'so_lo', key: 'so_lo', render: (text) => <strong>{text}</strong> },
    { title: 'Tên Dược Phẩm', dataIndex: 'ten_thuoc', key: 'ten_thuoc', render: (t, r) => t || `ID: ${r.duoc_pham_id}` },
    { title: 'Ngày Sản Xuất', dataIndex: 'ngay_san_xuat', key: 'ngay_san_xuat', render: (d) => new Date(d).toLocaleDateString('vi-VN') },
    { title: 'Hạn Sử Dụng', dataIndex: 'han_su_dung', key: 'han_su_dung', render: (d) => new Date(d).toLocaleDateString('vi-VN') },
    { 
      title: 'Cảnh Báo HSD / FEFO', 
      key: 'status', 
      render: (_, r) => renderStatusTag(r.trang_thai_hsd, r.ngay_con_han) 
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, r) => (
        r.trang_thai_hsd !== 'ThuHoi' ? (
          <Popconfirm
            title="Kích hoạt THU HỒI SẢN PHẨM?"
            description="Lệnh thu hồi sẽ chuyển trạng thái Lô sang THU HỒI và cảnh báo toàn bộ các gói thuốc thuộc Lô này."
            onConfirm={() => handleRecallLot(r.id)}
            okText="Xác nhận Thu Hồi"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" type="primary">Thu Hồi Lô</Button>
          </Popconfirm>
        ) : (
          <span className="text-xs text-slate-400 font-semibold">Đã khóa lô</span>
        )
      )
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarOutlined className="text-brand-600" /> Quản Lý Lô Sản Phẩm & Cảnh Báo FEFO
          </h1>
          <p className="text-sm text-slate-500">Giám sát hạn sử dụng (First Expired, First Out) và Thu hồi sản phẩm (Product Recall)</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchLots(); fetchStats(); }}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Tạo Lô Sản Phẩm Mới
          </Button>
        </Space>
      </div>

      {/* Stats Overview */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Số Lô Sản Phẩm" value={stats.tong_so_lo || 0} valueStyle={{ color: '#0284c7' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Lô Cận Date (<= 60 ngày)" value={stats.lo_can_date || 0} valueStyle={{ color: '#d97706' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Lô Đã Hết Hạn" value={stats.lo_het_han || 0} valueStyle={{ color: '#dc2626' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Lô Đã Kích Hoạt Thu Hồi" value={stats.lo_thu_hoi || 0} valueStyle={{ color: '#ea580c' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Space>
            <span className="text-sm font-semibold text-slate-700">Lọc Trạng Thái:</span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 180 }}
              options={[
                { label: 'Tất cả Lô', value: '' },
                { label: 'Hợp lệ', value: 'HopLe' },
                { label: 'Cận Date (<= 60d)', value: 'CanDate' },
                { label: 'Hết hạn', value: 'HetHan' },
                { label: 'Đã Thu Hồi', value: 'ThuHoi' }
              ]}
            />
            <Input.Search
              placeholder="Tìm theo Số lô hoặc Tên thuốc..."
              onSearch={(val) => { setSearch(val); fetchLots(); }}
              style={{ width: 260 }}
              allowClear
            />
          </Space>
        </div>

        <Table
          dataSource={lots}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Tạo Lô Mới */}
      <Modal
        title="Tạo Lô Sản Phẩm Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateLot}>
          <Form.Item name="duoc_pham_id" label="ID Dược Phẩm" rules={[{ required: true, message: 'Nhập ID Dược phẩm' }]}>
            <InputNumber placeholder="Nhập ID (VD: 991)" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="so_lo" label="Số Lô (Batch No.)" rules={[{ required: true, message: 'Nhập Số Lô' }]}>
            <Input placeholder="Ví dụ: BATCH-2026-LOT10" />
          </Form.Item>
          <Form.Item name="ngay_san_xuat" label="Ngày Sản Xuất" rules={[{ required: true, message: 'Chọn Ngày sản xuất' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
          <Form.Item name="han_su_dung" label="Hạn Sử Dụng (EXP)" rules={[{ required: true, message: 'Chọn Hạn sử dụng' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
