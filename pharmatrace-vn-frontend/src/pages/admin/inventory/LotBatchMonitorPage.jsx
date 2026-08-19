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
      message.error('Failed to load batch lots list')
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
        message.success('Batch lot created successfully!')
        setIsCreateModalOpen(false)
        form.resetFields()
        fetchLots()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Error creating batch lot')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create batch lot')
    }
  }

  const handleRecallLot = async (id) => {
    try {
      const res = await apiClient.patch(`/admin/lots/${id}/recall`)
      if (res.data?.success) {
        message.success('PRODUCT RECALL ORDER activated for this Batch!')
        fetchLots()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Error recalling batch')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to execute recall order')
    }
  }

  const renderStatusTag = (status, days) => {
    switch (status) {
      case 'ThuHoi':
        return <Tag color="volcano" icon={<ExclamationCircleOutlined />}>RECALLED</Tag>
      case 'HetHan':
        return <Tag color="red" icon={<CloseCircleOutlined />}>EXPIRED ({Math.abs(days)}d ago)</Tag>
      case 'CanDate':
        return <Tag color="warning" icon={<AlertOutlined />}>NEAR EXPIRY ({days}d remaining)</Tag>
      default:
        return <Tag color="green" icon={<CheckCircleOutlined />}>VALID ({days}d remaining)</Tag>
    }
  }

  const columns = [
    { title: 'Batch Number', dataIndex: 'so_lo', key: 'so_lo', render: (text) => <strong>{text}</strong> },
    { title: 'Product Name', dataIndex: 'ten_thuoc', key: 'ten_thuoc', render: (t, r) => t || `ID: ${r.duoc_pham_id}` },
    { title: 'Mfg Date', dataIndex: 'ngay_san_xuat', key: 'ngay_san_xuat', render: (d) => new Date(d).toLocaleDateString() },
    { title: 'Exp Date', dataIndex: 'han_su_dung', key: 'han_su_dung', render: (d) => new Date(d).toLocaleDateString() },
    { 
      title: 'Expiry Status / FEFO', 
      key: 'status', 
      render: (_, r) => renderStatusTag(r.trang_thai_hsd, r.ngay_con_han) 
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, r) => (
        r.trang_thai_hsd !== 'ThuHoi' ? (
          <Popconfirm
            title="Activate PRODUCT RECALL?"
            description="Recall order will change batch status to RECALLED and alert all downstream distributed packages."
            onConfirm={() => handleRecallLot(r.id)}
            okText="Confirm Recall"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" type="primary">Recall Batch</Button>
          </Popconfirm>
        ) : (
          <span className="text-xs text-slate-400 font-semibold">Locked / Recalled</span>
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
            <CalendarOutlined className="text-brand-600" /> Lot & Batch Expiration Monitor (FEFO)
          </h1>
          <p className="text-sm text-slate-500">Monitor First Expired, First Out (FEFO) lifecycle rules and emergency batch recalls</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchLots(); fetchStats(); }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Create New Batch Lot
          </Button>
        </Space>
      </div>

      {/* Stats Overview */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Product Lots" value={stats.tong_so_lo || 0} valueStyle={{ color: '#0284c7' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Near Expiry Lots (<= 60 days)" value={stats.lo_can_date || 0} valueStyle={{ color: '#d97706' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Expired Lots" value={stats.lo_het_han || 0} valueStyle={{ color: '#dc2626' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Active Recalled Lots" value={stats.lo_thu_hoi || 0} valueStyle={{ color: '#ea580c' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Space>
            <span className="text-sm font-semibold text-slate-700">Filter Status:</span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 180 }}
              options={[
                { label: 'All Lots', value: '' },
                { label: 'Valid / In Date', value: 'HopLe' },
                { label: 'Near Expiry (<= 60d)', value: 'CanDate' },
                { label: 'Expired', value: 'HetHan' },
                { label: 'Recalled', value: 'ThuHoi' }
              ]}
            />
            <Input.Search
              placeholder="Search by lot number or medication..."
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
        title="Create New Batch Lot"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateLot}>
          <Form.Item name="duoc_pham_id" label="Product ID" rules={[{ required: true, message: 'Please enter Product ID' }]}>
            <InputNumber placeholder="Enter product ID (e.g. 991)" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="so_lo" label="Batch / Lot Number" rules={[{ required: true, message: 'Please enter Batch Number' }]}>
            <Input placeholder="e.g. BATCH-2026-LOT10" />
          </Form.Item>
          <Form.Item name="ngay_san_xuat" label="Manufacturing Date (MFG)" rules={[{ required: true, message: 'Please select Manufacturing Date' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Select date" />
          </Form.Item>
          <Form.Item name="han_su_dung" label="Expiration Date (EXP)" rules={[{ required: true, message: 'Please select Expiration Date' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Select date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
