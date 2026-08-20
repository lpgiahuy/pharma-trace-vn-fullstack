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
      message.error('Failed to load CRM customers list')
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
        message.success(`Loyalty points updated successfully! New tier: ${res.data.data.customer.hang_thanh_vien}`)
        setIsPointModalOpen(false)
        pointForm.resetFields()
        fetchCustomers()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Error adjusting loyalty points')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to connect to server')
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
      message.error('Failed to load points history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const renderRankBadge = (rank) => {
    const map = {
      'Kim Cương': { color: 'purple', text: 'Diamond VIP', icon: <CrownOutlined /> },
      'Bạch Kim': { color: 'blue', text: 'Platinum VIP', icon: <TrophyOutlined /> },
      'Vàng': { color: 'gold', text: 'Gold VIP', icon: <TrophyOutlined /> },
      'Bạc': { color: 'default', text: 'Silver Member', icon: <UserOutlined /> },
      'Đồng': { color: 'orange', text: 'Bronze Member', icon: <UserOutlined /> }
    }
    const item = map[rank] || { color: 'default', text: rank, icon: <UserOutlined /> }
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  const customerColumns = [
    { title: 'Customer Name', dataIndex: 'ho_ten', key: 'ho_ten', width: 180, render: (name) => <strong>{name}</strong> },
    { title: 'Phone Number', dataIndex: 'so_dien_thoai', key: 'so_dien_thoai', width: 140 },
    { title: 'Email Address', dataIndex: 'email', key: 'email', width: 200, render: (e) => e || 'N/A' },
    { title: 'VIP Tier', dataIndex: 'hang_thanh_vien', key: 'hang_thanh_vien', width: 140, render: (r) => renderRankBadge(r) },
    { 
      title: 'Available Points', 
      dataIndex: 'diem_tich_luy', 
      key: 'diem_tich_luy',
      width: 140,
      render: (val) => <span className="font-bold text-green-600">+{Number(val).toLocaleString()} pts</span> 
    },
    { 
      title: 'Lifetime Points', 
      dataIndex: 'diem_tich_luy_tong', 
      key: 'diem_tich_luy_tong',
      width: 160,
      render: (val) => <span className="font-bold text-brand-600">{Number(val).toLocaleString()} pts</span> 
    },
    { 
      title: 'Lifetime Spending (₫)', 
      dataIndex: 'tong_chi_tieu', 
      key: 'tong_chi_tieu',
      width: 160,
      render: (val) => <span>{Number(val).toLocaleString()} ₫</span> 
    },
    {
      title: 'Actions',
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
            Adjust Points
          </Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(r)}>
            History
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
            <CustomerServiceOutlined className="text-brand-600" /> CRM & VIP Customer Loyalty Management
          </h1>
          <p className="text-sm text-slate-500">Segment customer tiers, track cumulative spend, and manage loyalty reward points</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchCustomers(); }}>
          Refresh
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Customers" value={stats.tong_khach_hang || 0} valueStyle={{ color: '#0284c7' }} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Diamond / Platinum VIPs" value={(stats.thanh_vien_kim_cuong || 0) + (stats.thanh_vien_bach_kim || 0)} valueStyle={{ color: '#a855f7' }} prefix={<CrownOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Gold Tier Members" value={stats.thanh_vien_vang || 0} valueStyle={{ color: '#eab308' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Loyalty Points Issued" value={Number(stats.tong_diem_da_cap || 0)} valueStyle={{ color: '#16a34a' }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">VIP Tier:</span>
            <Select
              value={filterRank}
              onChange={setFilterRank}
              style={{ width: 160 }}
              options={[
                { label: 'All Tiers', value: '' },
                { label: 'Diamond', value: 'Kim Cương' },
                { label: 'Platinum', value: 'Bạch Kim' },
                { label: 'Gold', value: 'Vàng' },
                { label: 'Silver', value: 'Bạc' },
                { label: 'Bronze', value: 'Đồng' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Search by Name, Phone, Email..."
            onSearch={(val) => { setSearch(val); fetchCustomers(); }}
            style={{ width: 280 }}
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
        title={`Adjust Loyalty Points — Customer: ${selectedCustomer?.ho_ten || ''}`}
        open={isPointModalOpen}
        onCancel={() => setIsPointModalOpen(false)}
        onOk={() => pointForm.submit()}
      >
        <Form form={pointForm} layout="vertical" onFinish={handleAdjustPoints}>
          <Form.Item name="points" label="Points Adjustment (+/-)" rules={[{ required: true, message: 'Please enter points' }]}>
            <InputNumber placeholder="e.g. 1000 (max ±5,000 pts)" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="Transaction Type" initialValue="DieuChinhAdmin">
            <Select options={[
              { label: 'Administrative Adjustment', value: 'DieuChinhAdmin' },
              { label: 'Membership Tier Reward', value: 'ThuongRank' },
              { label: 'Purchase Point Accrual', value: 'TichDiem' },
              { label: 'RMA Return Point Deduction', value: 'TruDiemRma' }
            ]} />
          </Form.Item>
          <Form.Item name="description" label="Audit Reason & Notes (Required)" rules={[{ required: true, min: 5, message: 'Please enter at least 5 characters justification' }]}>
            <Input.TextArea placeholder="Provide detailed operational rationale for audit trail…" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Lịch Sử Điểm */}
      <Modal
        title={`Points Transaction History — ${selectedCustomer?.ho_ten || ''}`}
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
            { title: 'Date & Time', dataIndex: 'ngay_tao', key: 'ngay_tao', render: (d) => new Date(d).toLocaleString() },
            { title: 'Transaction Type', dataIndex: 'loai_giao_dich', key: 'loai_giao_dich', render: (t) => <Tag color="blue">{t}</Tag> },
            { 
              title: 'Points Change', 
              dataIndex: 'so_diem', 
              key: 'so_diem',
              render: (v) => Number(v) > 0 ? <strong className="text-green-600">+{v}</strong> : <strong className="text-red-500">{v}</strong>
            },
            { title: 'Audit Description / Notes', dataIndex: 'mo_ta', key: 'mo_ta' }
          ]}
        />
      </Modal>
    </div>
  )
}
