import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message } from 'antd'
import { CrownOutlined, UserOutlined, TrophyOutlined, ReloadOutlined, HistoryOutlined, PlusOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function CrmLoyaltyPage() {
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({ tong_khach_hang: 0, thanh_vien_kim_cuong: 0, thanh_vien_bach_kim: 0, thanh_vien_vang: 0, tong_diem_da_cap: 0 })
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterRank, setFilterRank] = useState('')
  const [search, setSearch] = useState('')

  // Modal Adjust Points
  const [isPointModalOpen, setIsPointModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [pointForm] = Form.useForm()

  // Modal Point History
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterRank) params.rank = filterRank
      if (search) params.search = search

      const res = await apiClient.get('/admin/crm-rma/customers', { params })
      if (res.data?.success) setCustomers(res.data.data || [])
    } catch (err) {
      message.error('Lỗi khi tải danh sách Khách hàng CRM')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/crm-rma/stats')
      if (res.data?.success) setStats(res.data.data || {})
    } catch (err) {
      // Silent catch
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [filterRank])

  const handleAdjustPoints = async (values) => {
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        points: values.points,
        type: values.type,
        description: values.description
      }
      const res = await apiClient.post('/admin/crm-rma/adjust-points', payload)
      if (res.data?.success) {
        message.success(`Đã cập nhật điểm thưởng thành công! Cấp hạng mới: ${res.data.data.customer.hang_thanh_vien}`)
        setIsPointModalOpen(false)
        pointForm.resetFields()
        fetchCustomers()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Lỗi khi điều chỉnh điểm')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối máy chủ')
    }
  }

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer)
    setIsHistoryModalOpen(true)
    try {
      setHistoryLoading(true)
      const res = await apiClient.get(`/admin/crm-rma/customers/${customer.id}/points-history`)
      if (res.data?.success) setHistoryList(res.data.data || [])
    } catch (err) {
      message.error('Lỗi khi tải lịch sử điểm')
    } finally {
      setHistoryLoading(false)
    }
  }

  const renderRankBadge = (rank) => {
    const map = {
      'Kim Cương': { color: 'purple', icon: <CrownOutlined /> },
      'Bạch Kim': { color: 'blue', icon: <TrophyOutlined /> },
      'Vàng': { color: 'gold', icon: <TrophyOutlined /> },
      'Bạc': { color: 'default', icon: <UserOutlined /> },
      'Đồng': { color: 'orange', icon: <UserOutlined /> }
    }
    const item = map[rank] || { color: 'default', icon: <UserOutlined /> }
    return <Tag color={item.color} icon={item.icon}>{rank}</Tag>
  }

  const customerColumns = [
    { title: 'Họ và Tên', dataIndex: 'ho_ten', key: 'ho_ten', width: 180, render: (name) => <strong>{name}</strong> },
    { title: 'Số Điện Thoại', dataIndex: 'so_dien_thoai', key: 'so_dien_thoai', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200, render: (e) => e || 'N/A' },
    { title: 'Hạng VIP', dataIndex: 'hang_thanh_vien', key: 'hang_thanh_vien', width: 140, render: (r) => renderRankBadge(r) },
    { 
      title: 'Điểm Khả Dụng', 
      dataIndex: 'diem_tich_luy', 
      key: 'diem_tich_luy',
      width: 140,
      render: (val) => <span className="font-bold text-green-600">+{Number(val).toLocaleString()} điểm</span> 
    },
    { 
      title: 'Điểm Tích Lũy Tổng', 
      dataIndex: 'diem_tich_luy_tong', 
      key: 'diem_tich_luy_tong',
      width: 160,
      render: (val) => <span className="font-bold text-brand-600">{Number(val).toLocaleString()} điểm</span> 
    },
    { 
      title: 'Tổng Chi Tiêu (₫)', 
      dataIndex: 'tong_chi_tieu', 
      key: 'tong_chi_tieu',
      width: 160,
      render: (val) => <span>{Number(val).toLocaleString('vi-VN')} ₫</span> 
    },
    {
      title: 'Hành Động',
      key: 'action',
      width: 220,
      render: (_, r) => (
        <Space size="small">
          <Button 
            size="small" 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setSelectedCustomer(r); setIsPointModalOpen(true); }}
          >
            Thưởng / Trừ Điểm
          </Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(r)}>
            Lịch Sử
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CustomerServiceOutlined className="text-brand-600" /> CRM & Quản Lý Thành Viên VIP
          </h1>
          <p className="text-sm text-slate-500">Phân hạng khách hàng VIP, theo dõi tổng chi tiêu và thưởng điểm thành viên</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchCustomers(); }}>
          Tải lại
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Khách Hàng" value={stats.tong_khach_hang || 0} valueStyle={{ color: '#0284c7' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="VIP Kim Cương / Bạch Kim" value={(stats.thanh_vien_kim_cuong || 0) + (stats.thanh_vien_bach_kim || 0)} valueStyle={{ color: '#a855f7' }} prefix={<CrownOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="VIP Vàng" value={stats.thanh_vien_vang || 0} valueStyle={{ color: '#eab308' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Điểm Đã Cấp" value={Number(stats.tong_diem_da_cap || 0)} valueStyle={{ color: '#16a34a' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">Hạng VIP:</span>
            <Select
              value={filterRank}
              onChange={setFilterRank}
              style={{ width: 150 }}
              options={[
                { label: 'Tất cả hạng', value: '' },
                { label: 'Kim Cương', value: 'Kim Cương' },
                { label: 'Bạch Kim', value: 'Bạch Kim' },
                { label: 'Vàng', value: 'Vàng' },
                { label: 'Bạc', value: 'Bạc' },
                { label: 'Đồng', value: 'Đồng' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Tìm theo Tên, SĐT, Email..."
            onSearch={(val) => { setSearch(val); fetchCustomers(); }}
            style={{ width: 260 }}
            allowClear
          />
        </div>

        <Table
          dataSource={customers}
          columns={customerColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal Thưởng / Trừ Điểm */}
      <Modal
        title={`Thưởng / Điều Chỉnh Điểm - Khách Hàng: ${selectedCustomer?.ho_ten || ''}`}
        open={isPointModalOpen}
        onCancel={() => setIsPointModalOpen(false)}
        onOk={() => pointForm.submit()}
      >
        <Form form={pointForm} layout="vertical" onFinish={handleAdjustPoints}>
          <Form.Item name="points" label="Số Điểm Thưởng (+/-)" rules={[{ required: true, message: 'Nhập số điểm' }]}>
            <InputNumber placeholder="Ví dụ: 1000 (tối đa ±5,000 điểm)" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="Loại Giao Dịch" initialValue="DieuChinhAdmin">
            <Select options={[
              { label: 'Admin Điều Chỉnh', value: 'DieuChinhAdmin' },
              { label: 'Thưởng Hạng Thành Viên', value: 'ThuongRank' },
              { label: 'Tích Điểm Mua Hàng', value: 'TichDiem' },
              { label: 'Trừ Điểm Đổi Trả RMA', value: 'TruDiemRma' }
            ]} />
          </Form.Item>
          <Form.Item name="description" label="Lý Do / Ghi Chú Giải Trình (Bắt Buộc)" rules={[{ required: true, min: 5, message: 'Nhập ít nhất 5 ký tự giải trình' }]}>
            <Input.TextArea placeholder="Ghi rõ lý do giải trình để kiểm toán Audit" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Lịch Sử Điểm */}
      <Modal
        title={`Lịch Sử Điểm Thưởng - ${selectedCustomer?.ho_ten || ''}`}
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={700}
      >
        <Table
          dataSource={historyList}
          rowKey="id"
          loading={historyLoading}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'Ngày Tạo', dataIndex: 'ngay_tao', key: 'ngay_tao', render: (d) => new Date(d).toLocaleString('vi-VN') },
            { title: 'Loại Giao Dịch', dataIndex: 'loai_giao_dich', key: 'loai_giao_dich', render: (t) => <Tag color="blue">{t}</Tag> },
            { 
              title: 'Số Điểm', 
              dataIndex: 'so_diem', 
              key: 'so_diem',
              render: (v) => Number(v) > 0 ? <strong className="text-green-600">+{v}</strong> : <strong className="text-red-500">{v}</strong>
            },
            { title: 'Mô Tả / Ghi Chú', dataIndex: 'mo_ta', key: 'mo_ta' }
          ]}
        />
      </Modal>
    </div>
  )
}
