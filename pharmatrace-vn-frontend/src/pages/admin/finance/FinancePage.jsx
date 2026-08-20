import React, { useState, useEffect } from 'react'
import { Tabs, Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm, Progress } from 'antd'
import { DollarOutlined, BankOutlined, ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, PlusOutlined, WalletOutlined, CheckCircleOutlined, ClockCircleOutlined, SwapOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ tong_thu: 0, tong_chi: 0, dong_tien_rong: 0, ar: { tong_no: 0, da_thu: 0, con_no: 0 }, ap: { tong_no: 0, da_tra: 0, con_no: 0 } })
  const [cashbook, setCashbook] = useState([])
  const [arList, setArList] = useState([])
  const [apList, setApList] = useState([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [cashbookType, setCashbookType] = useState('')
  const [arStatus, setArStatus] = useState('')
  const [apStatus, setApStatus] = useState('')
  const [search, setSearch] = useState('')

  // Modals
  const [isCashbookModalOpen, setIsCashbookModalOpen] = useState(false)
  const [cashbookForm] = Form.useForm()

  const [isArModalOpen, setIsArModalOpen] = useState(false)
  const [selectedAr, setSelectedAr] = useState(null)
  const [arForm] = Form.useForm()

  const [isApModalOpen, setIsApModalOpen] = useState(false)
  const [selectedAp, setSelectedAp] = useState(null)
  const [apForm] = Form.useForm()

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/finance/stats')
      if (res.data?.success) setStats(res.data.data || {})
    } catch (err) {
      // Silent catch
    }
  }

  const fetchCashbook = async () => {
    try {
      setLoading(true)
      const params = {}
      if (cashbookType) params.type = cashbookType
      if (search) params.search = search

      const res = await apiClient.get('/admin/finance/cashbook', { params })
      if (res.data?.success) setCashbook(res.data.data || [])
    } catch (err) {
      message.error('Failed to load Cashbook ledger')
    } finally {
      setLoading(false)
    }
  }

  const fetchAr = async () => {
    try {
      setLoading(true)
      const params = {}
      if (arStatus) params.status = arStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/finance/ar', { params })
      if (res.data?.success) setArList(res.data.data || [])
    } catch (err) {
      message.error('Failed to load Accounts Receivable (AR)')
    } finally {
      setLoading(false)
    }
  }

  const fetchAp = async () => {
    try {
      setLoading(true)
      const params = {}
      if (apStatus) params.status = apStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/finance/ap', { params })
      if (res.data?.success) setApList(res.data.data || [])
    } catch (err) {
      message.error('Failed to load Accounts Payable (AP)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    if (activeTab === 'cashbook') fetchCashbook()
    if (activeTab === 'ar') fetchAr()
    if (activeTab === 'ap') fetchAp()
  }, [activeTab, cashbookType, arStatus, apStatus])

  const handleCreateCashbook = async (values) => {
    try {
      const res = await apiClient.post('/admin/finance/cashbook', values)
      if (res.data?.success) {
        message.success('Cashbook entry created successfully!')
        setIsCashbookModalOpen(false)
        cashbookForm.resetFields()
        fetchStats()
        fetchCashbook()
      } else {
        message.error(res.data?.message || 'Failed to create cashbook entry')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit cashbook entry')
    }
  }

  const handlePayAr = async (values) => {
    try {
      const res = await apiClient.post(`/admin/finance/ar/${selectedAr.id}/pay`, values)
      if (res.data?.success) {
        message.success('Debt collection payment recorded successfully!')
        setIsArModalOpen(false)
        arForm.resetFields()
        fetchStats()
        fetchAr()
      } else {
        message.error(res.data?.message || 'Failed to record payment')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to process payment')
    }
  }

  const handlePayAp = async (values) => {
    try {
      const res = await apiClient.post(`/admin/finance/ap/${selectedAp.id}/pay`, values)
      if (res.data?.success) {
        message.success('Supplier payment recorded successfully!')
        setIsApModalOpen(false)
        apForm.resetFields()
        fetchStats()
        fetchAp()
      } else {
        message.error(res.data?.message || 'Failed to record supplier payment')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to process supplier payment')
    }
  }

  const renderStatusBadge = (status) => {
    const map = {
      ChuaThanhToan: { color: 'error', text: 'UNPAID' },
      ThanhToanMotPhan: { color: 'warning', text: 'PARTIALLY PAID' },
      DaThanhToan: { color: 'success', text: 'PAID' },
      DaThanhToanQuaHan: { color: 'purple', text: 'OVERDUE' }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const cashbookColumns = [
    { title: 'Voucher No.', dataIndex: 'ma_phieu', key: 'ma_phieu', width: 150, render: (val) => <strong>{val}</strong> },
    { 
      title: 'Type', 
      dataIndex: 'loai_phieu', 
      key: 'loai_phieu', 
      width: 110, 
      render: (val) => val === 'Thu' ? <Tag color="green" icon={<ArrowUpOutlined />}>INFLOW</Tag> : <Tag color="red" icon={<ArrowDownOutlined />}>OUTFLOW</Tag> 
    },
    { title: 'Category', dataIndex: 'loai_giao_dich', key: 'loai_giao_dich', width: 180, render: (t) => <Tag color="blue">{t}</Tag> },
    { 
      title: 'Amount (₫)', 
      dataIndex: 'so_tien', 
      key: 'so_tien',
      width: 160,
      render: (val, r) => r.loai_phieu === 'Thu' ? 
        <strong className="text-emerald-600">+{Number(val).toLocaleString()} ₫</strong> : 
        <strong className="text-rose-600">-{Number(val).toLocaleString()} ₫</strong>
    },
    { title: 'Party / Entity', dataIndex: 'doi_tuong_ten', key: 'doi_tuong_ten', width: 220, render: (t) => t || 'N/A' },
    { title: 'Payment Method', dataIndex: 'phuong_thuc', key: 'phuong_thuc', width: 140 },
    { title: 'Audit Memo / Notes', dataIndex: 'ghi_chu', key: 'ghi_chu', width: 250 },
    { title: 'Timestamp', dataIndex: 'ngay_giao_dich', key: 'ngay_giao_dich', width: 160, render: (d) => new Date(d).toLocaleString() }
  ]

  const arColumns = [
    { title: 'Order ID', dataIndex: 'don_hang_id', key: 'don_hang_id', width: 120, render: (id) => `#${id}` },
    { title: 'Customer', dataIndex: 'ten_khach_hang', key: 'ten_khach_hang', width: 200, render: (t, r) => <div><strong>{t}</strong><div className="text-xs text-slate-400">Tel: {r.so_dien_thoai}</div></div> },
    { title: 'Total Receivable', dataIndex: 'tong_tien_no', key: 'tong_tien_no', width: 150, render: (val) => `${Number(val).toLocaleString()} ₫` },
    { title: 'Collected', dataIndex: 'da_thanh_toan', key: 'da_thanh_toan', width: 150, render: (val) => <span className="text-emerald-600 font-semibold">{Number(val).toLocaleString()} ₫</span> },
    { title: 'Balance Due', dataIndex: 'con_no', key: 'con_no', width: 150, render: (val) => <strong className="text-amber-600">{Number(val).toLocaleString()} ₫</strong> },
    { title: 'Payment Due Date', dataIndex: 'han_thanh_toan', key: 'han_thanh_toan', width: 160, render: (d) => d ? new Date(d).toLocaleDateString() : 'N/A' },
    { title: 'Status', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Actions',
      key: 'action',
      width: 140,
      render: (_, r) => (
        r.trang_thai !== 'DaThanhToan' && (
          <Button 
            size="small" 
            type="primary" 
            icon={<DollarOutlined />} 
            onClick={() => { setSelectedAr(r); setIsArModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            Collect Debt
          </Button>
        )
      )
    }
  ]

  const apColumns = [
    { title: 'PO Reference', dataIndex: 'don_nhap_id', key: 'don_nhap_id', width: 140, render: (id) => id ? `#PO-${id}` : 'N/A' },
    { title: 'Supplier', dataIndex: 'nha_cung_cap_ten', key: 'nha_cung_cap_ten', width: 240, render: (t) => <strong>{t}</strong> },
    { title: 'Total PO Payable', dataIndex: 'tong_tien_no', key: 'tong_tien_no', width: 150, render: (val) => `${Number(val).toLocaleString()} ₫` },
    { title: 'Paid to Supplier', dataIndex: 'da_thanh_toan', key: 'da_thanh_toan', width: 150, render: (val) => <span className="text-emerald-600 font-semibold">{Number(val).toLocaleString()} ₫</span> },
    { title: 'Balance Owed', dataIndex: 'con_no', key: 'con_no', width: 150, render: (val) => <strong className="text-rose-600">{Number(val).toLocaleString()} ₫</strong> },
    { title: 'Payment Due Date', dataIndex: 'han_thanh_toan', key: 'han_thanh_toan', width: 160, render: (d) => d ? new Date(d).toLocaleDateString() : 'N/A' },
    { title: 'Status', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Actions',
      key: 'action',
      width: 140,
      render: (_, r) => (
        r.trang_thai !== 'DaThanhToan' && (
          <Button 
            size="small" 
            type="primary" 
            icon={<WalletOutlined />} 
            onClick={() => { setSelectedAp(r); setIsApModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Pay Supplier
          </Button>
        )
      )
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BankOutlined className="text-emerald-600" /> Finance, Debt Management & Cash Flow
          </h1>
          <p className="text-sm text-slate-500">Monitor cashbook ledger inflows/outflows, Accounts Receivable (AR), Accounts Payable (AP), and gross margins</p>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCashbookModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
            Create Inflow / Outflow Voucher
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); if (activeTab === 'cashbook') fetchCashbook(); if (activeTab === 'ar') fetchAr(); if (activeTab === 'ap') fetchAp(); }}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Cash Inflow" value={stats.tong_thu || 0} valueStyle={{ color: '#16a34a' }} prefix={<ArrowUpOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Cash Outflow" value={stats.tong_chi || 0} valueStyle={{ color: '#e11d48' }} prefix={<ArrowDownOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Net Operating Cash Flow" value={stats.dong_tien_rong || 0} valueStyle={{ color: '#0284c7' }} prefix={<WalletOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Accounts Receivable (AR)" value={stats.ar?.con_no || 0} valueStyle={{ color: '#d97706' }} prefix={<ClockCircleOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Accounts Payable (AP)" value={stats.ap?.con_no || 0} valueStyle={{ color: '#a855f7' }} prefix={<BankOutlined />} suffix="₫" />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span className="font-semibold text-slate-700">
                  <BankOutlined /> Profit & Cash Flow Analytics
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card title="Customer Accounts Receivable Recovery Rate (AR)" className="rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-4 text-center">
                          <Progress type="circle" percent={stats.ar?.tong_no > 0 ? Math.round((stats.ar.da_thu / stats.ar.tong_no) * 100) : 100} width={140} strokeColor="#16a34a" />
                          <div className="flex justify-between text-sm pt-2">
                            <span>Collected: <strong>{Number(stats.ar?.da_thu || 0).toLocaleString()} ₫</strong></span>
                            <span>Outstanding: <strong className="text-amber-600">{Number(stats.ar?.con_no || 0).toLocaleString()} ₫</strong></span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Supplier Accounts Payable Settlement Rate (AP)" className="rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-4 text-center">
                          <Progress type="circle" percent={stats.ap?.tong_no > 0 ? Math.round((stats.ap.da_tra / stats.ap.tong_no) * 100) : 100} width={140} strokeColor="#2563eb" />
                          <div className="flex justify-between text-sm pt-2">
                            <span>Settled: <strong>{Number(stats.ap?.da_tra || 0).toLocaleString()} ₫</strong></span>
                            <span>Balance Owed: <strong className="text-rose-600">{Number(stats.ap?.con_no || 0).toLocaleString()} ₫</strong></span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'cashbook',
              label: (
                <span className="font-semibold text-slate-700">
                  <WalletOutlined /> Cashbook Inflow & Outflow Ledger
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Voucher Type:</span>
                      <Select
                        value={cashbookType}
                        onChange={setCashbookType}
                        style={{ width: 150 }}
                        options={[
                          { label: 'All Types', value: '' },
                          { label: 'Inflow (+)', value: 'Thu' },
                          { label: 'Outflow (-)', value: 'Chi' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Search by Voucher No., Entity, Notes..."
                      onSearch={(val) => { setSearch(val); fetchCashbook(); }}
                      style={{ width: 280 }}
                      allowClear
                    />
                  </div>

                  <Table
                    dataSource={cashbook}
                    columns={cashbookColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1300 }}
                  />
                </div>
              )
            },
            {
              key: 'ar',
              label: (
                <span className="font-semibold text-slate-700">
                  <ClockCircleOutlined /> Customer Accounts Receivable (AR)
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Status:</span>
                      <Select
                        value={arStatus}
                        onChange={setArStatus}
                        style={{ width: 170 }}
                        options={[
                          { label: 'All Statuses', value: '' },
                          { label: 'Unpaid', value: 'ChuaThanhToan' },
                          { label: 'Partially Paid', value: 'ThanhToanMotPhan' },
                          { label: 'Fully Paid', value: 'DaThanhToan' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Search by Customer Name, Phone..."
                      onSearch={(val) => { setSearch(val); fetchAr(); }}
                      style={{ width: 260 }}
                      allowClear
                    />
                  </div>

                  <Table
                    dataSource={arList}
                    columns={arColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1200 }}
                  />
                </div>
              )
            },
            {
              key: 'ap',
              label: (
                <span className="font-semibold text-slate-700">
                  <BankOutlined /> Supplier Accounts Payable (AP)
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Status:</span>
                      <Select
                        value={apStatus}
                        onChange={setApStatus}
                        style={{ width: 170 }}
                        options={[
                          { label: 'All Statuses', value: '' },
                          { label: 'Unpaid', value: 'ChuaThanhToan' },
                          { label: 'Partially Paid', value: 'ThanhToanMotPhan' },
                          { label: 'Fully Paid', value: 'DaThanhToan' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Search by Supplier Name..."
                      onSearch={(val) => { setSearch(val); fetchAp(); }}
                      style={{ width: 260 }}
                      allowClear
                    />
                  </div>

                  <Table
                    dataSource={apList}
                    columns={apColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1200 }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Modal Lập Phiếu Thu / Chi Mới */}
      <Modal
        title="Create Cashbook Inflow / Outflow Voucher"
        open={isCashbookModalOpen}
        onCancel={() => setIsCashbookModalOpen(false)}
        onOk={() => cashbookForm.submit()}
      >
        <Form form={cashbookForm} layout="vertical" onFinish={handleCreateCashbook}>
          <Form.Item name="loai_phieu" label="Voucher Type" rules={[{ required: true, message: 'Please select voucher type' }]} initialValue="Thu">
            <Select options={[
              { label: 'Cash Inflow Voucher (+)', value: 'Thu' },
              { label: 'Cash Outflow Voucher (-)', value: 'Chi' }
            ]} />
          </Form.Item>
          <Form.Item name="loai_giao_dich" label="Transaction Category" rules={[{ required: true, message: 'Please select transaction category' }]} initialValue="ThuTienDonHang">
            <Select options={[
              { label: 'Customer Order Payment Inflow', value: 'ThuTienDonHang' },
              { label: 'Customer AR Debt Collection', value: 'ThuTienCongNoKhach' },
              { label: 'Supplier PO Goods Purchase Outflow', value: 'ChiTienNhapHangNCC' },
              { label: 'RMA Customer Refund Outflow', value: 'ChiTienHoanRMA' },
              { label: 'Operational & General Expense Outflow', value: 'ChiTienVanHang' },
              { label: 'Other Inflow / Outflow', value: 'ThuChiKhac' }
            ]} />
          </Form.Item>
          <Form.Item name="so_tien" label="Amount (₫)" rules={[{ required: true, message: 'Please enter amount' }]}>
            <InputNumber placeholder="e.g. 5000000" style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
          </Form.Item>
          <Form.Item name="doi_tuong_loai" label="Entity Type" initialValue="KhachHang">
            <Select options={[
              { label: 'Customer', value: 'KhachHang' },
              { label: 'Supplier Partner', value: 'NhaCungCap' },
              { label: 'Employee / Staff', value: 'NhanVien' },
              { label: 'Other', value: 'Khac' }
            ]} />
          </Form.Item>
          <Form.Item name="doi_tuong_ten" label="Entity / Recipient Name" rules={[{ required: true, message: 'Please enter entity name' }]}>
            <Input placeholder="e.g. Long Chau Pharmacy / Vinmec Hospital" />
          </Form.Item>
          <Form.Item name="phuong_thuc" label="Payment Method" initialValue="ChuyenKhoan">
            <Select options={[
              { label: 'Bank Wire Transfer', value: 'ChuyenKhoan' },
              { label: 'Cash', value: 'TienMat' },
              { label: 'Debit / ATM / VISA Card', value: 'TheATM' },
              { label: 'E-Wallet (Momo / ZaloPay)', value: 'ViDienTu' }
            ]} />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Audit Memo & Description" rules={[{ required: true, message: 'Please enter memo' }]}>
            <Input.TextArea placeholder="Provide detailed operational rationale for transaction…" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Thu Tiền Nợ Khách Hàng (AR) */}
      <Modal
        title={`Record Customer Debt Collection - Order #${selectedAr?.don_hang_id || ''}`}
        open={isArModalOpen}
        onCancel={() => setIsArModalOpen(false)}
        onOk={() => arForm.submit()}
      >
        {selectedAr && (
          <Form form={arForm} layout="vertical" onFinish={handlePayAr}>
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-1">
              <div>Customer: <strong>{selectedAr.ten_khach_hang}</strong></div>
              <div>Total Receivable: <strong>{Number(selectedAr.tong_tien_no).toLocaleString()} ₫</strong></div>
              <div>Collected So Far: <span className="text-emerald-600 font-semibold">{Number(selectedAr.da_thanh_toan).toLocaleString()} ₫</span></div>
              <div>Remaining Balance: <strong className="text-amber-600">{Number(selectedAr.con_no).toLocaleString()} ₫</strong></div>
            </div>
            <Form.Item name="amount" label="Collection Amount This Installment (₫)" rules={[{ required: true, message: 'Please enter amount' }]} initialValue={selectedAr.con_no}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
            </Form.Item>
            <Form.Item name="note" label="Collection Note">
              <Input.TextArea placeholder="e.g. Installment 2 received via bank transfer" rows={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal Trả Tiền Nợ NCC (AP) */}
      <Modal
        title={`Record Supplier AP Payment - ${selectedAp?.nha_cung_cap_ten || ''}`}
        open={isApModalOpen}
        onCancel={() => setIsApModalOpen(false)}
        onOk={() => apForm.submit()}
      >
        {selectedAp && (
          <Form form={apForm} layout="vertical" onFinish={handlePayAp}>
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-1">
              <div>Supplier: <strong>{selectedAp.nha_cung_cap_ten}</strong></div>
              <div>PO Reference: <strong>#{selectedAp.don_nhap_id}</strong></div>
              <div>Total PO Payable: <strong>{Number(selectedAp.tong_tien_no).toLocaleString()} ₫</strong></div>
              <div>Remaining Balance Owed: <strong className="text-rose-600">{Number(selectedAp.con_no).toLocaleString()} ₫</strong></div>
            </div>
            <Form.Item name="amount" label="Payment Amount This Installment (₫)" rules={[{ required: true, message: 'Please enter payment amount' }]} initialValue={selectedAp.con_no}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
            </Form.Item>
            <Form.Item name="note" label="Payment Memo">
              <Input.TextArea placeholder="e.g. Final balance settlement via corporate wire transfer" rows={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
