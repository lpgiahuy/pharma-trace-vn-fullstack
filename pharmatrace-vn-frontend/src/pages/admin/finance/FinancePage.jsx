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
      message.error('Lỗi khi tải nhật ký Sổ Quỹ')
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
      message.error('Lỗi khi tải công nợ Phải Thu (AR)')
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
      message.error('Lỗi khi tải công nợ Phải Trả (AP)')
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
        message.success('Lập phiếu Thu/Chi thành công!')
        setIsCashbookModalOpen(false)
        cashbookForm.resetFields()
        fetchStats()
        fetchCashbook()
      } else {
        message.error(res.data?.message || 'Lỗi khi lập phiếu')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi dữ liệu')
    }
  }

  const handlePayAr = async (values) => {
    try {
      const res = await apiClient.post(`/admin/finance/ar/${selectedAr.id}/pay`, values)
      if (res.data?.success) {
        message.success('Ghi nhận thu nợ thành công!')
        setIsArModalOpen(false)
        arForm.resetFields()
        fetchStats()
        fetchAr()
      } else {
        message.error(res.data?.message || 'Lỗi khi ghi nhận thu nợ')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thực hiện')
    }
  }

  const handlePayAp = async (values) => {
    try {
      const res = await apiClient.post(`/admin/finance/ap/${selectedAp.id}/pay`, values)
      if (res.data?.success) {
        message.success('Ghi nhận trả nợ NCC thành công!')
        setIsApModalOpen(false)
        apForm.resetFields()
        fetchStats()
        fetchAp()
      } else {
        message.error(res.data?.message || 'Lỗi khi ghi nhận trả nợ')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thực hiện')
    }
  }

  const renderStatusBadge = (status) => {
    const map = {
      ChuaThanhToan: { color: 'error', text: 'CHƯA THANH TOÁN' },
      ThanhToanMotPhan: { color: 'warning', text: 'THANH TOÁN 1 PHẦN' },
      DaThanhToan: { color: 'success', text: 'ĐÃ THANH TOÁN' },
      DaThanhToanQuaHan: { color: 'purple', text: 'QUÁ HẠN' }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const cashbookColumns = [
    { title: 'Mã Phiếu', dataIndex: 'ma_phieu', key: 'ma_phieu', width: 150, render: (val) => <strong>{val}</strong> },
    { 
      title: 'Loại Phiếu', 
      dataIndex: 'loai_phieu', 
      key: 'loai_phieu', 
      width: 110, 
      render: (val) => val === 'Thu' ? <Tag color="green" icon={<ArrowUpOutlined />}>THU</Tag> : <Tag color="red" icon={<ArrowDownOutlined />}>CHI</Tag> 
    },
    { title: 'Loại Giao Dịch', dataIndex: 'loai_giao_dich', key: 'loai_giao_dich', width: 180, render: (t) => <Tag color="blue">{t}</Tag> },
    { 
      title: 'Số Tiền (₫)', 
      dataIndex: 'so_tien', 
      key: 'so_tien',
      width: 160,
      render: (val, r) => r.loai_phieu === 'Thu' ? 
        <strong className="text-emerald-600">+{Number(val).toLocaleString('vi-VN')} ₫</strong> : 
        <strong className="text-rose-600">-{Number(val).toLocaleString('vi-VN')} ₫</strong>
    },
    { title: 'Đối Tượng', dataIndex: 'doi_tuong_ten', key: 'doi_tuong_ten', width: 220, render: (t) => t || 'N/A' },
    { title: 'Phương Thức', dataIndex: 'phuong_thuc', key: 'phuong_thuc', width: 140 },
    { title: 'Ghi Chú Giải Trình', dataIndex: 'ghi_chu', key: 'ghi_chu', width: 250 },
    { title: 'Thời Gian', dataIndex: 'ngay_giao_dich', key: 'ngay_giao_dich', width: 160, render: (d) => new Date(d).toLocaleString('vi-VN') }
  ]

  const arColumns = [
    { title: 'ID Đơn Hàng', dataIndex: 'don_hang_id', key: 'don_hang_id', width: 120, render: (id) => `#${id}` },
    { title: 'Khách Hàng', dataIndex: 'ten_khach_hang', key: 'ten_khach_hang', width: 200, render: (t, r) => <div><strong>{t}</strong><div className="text-xs text-slate-400">SĐT: {r.so_dien_thoai}</div></div> },
    { title: 'Tổng Tiền Nợ', dataIndex: 'tong_tien_no', key: 'tong_tien_no', width: 150, render: (val) => `${Number(val).toLocaleString('vi-VN')} ₫` },
    { title: 'Đã Thanh Toán', dataIndex: 'da_thanh_toan', key: 'da_thanh_toan', width: 150, render: (val) => <span className="text-emerald-600 font-semibold">{Number(val).toLocaleString('vi-VN')} ₫</span> },
    { title: 'Còn Nợ', dataIndex: 'con_no', key: 'con_no', width: 150, render: (val) => <strong className="text-amber-600">{Number(val).toLocaleString('vi-VN')} ₫</strong> },
    { title: 'Hạn Thanh Toán', dataIndex: 'han_thanh_toan', key: 'han_thanh_toan', width: 160, render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A' },
    { title: 'Trạng Thái', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Hành Động',
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
            Thu Tiền Nợ
          </Button>
        )
      )
    }
  ]

  const apColumns = [
    { title: 'Mã Đơn Nhập PO', dataIndex: 'don_nhap_id', key: 'don_nhap_id', width: 140, render: (id) => id ? `#PO-${id}` : 'N/A' },
    { title: 'Nhà Cung Cấp', dataIndex: 'nha_cung_cap_ten', key: 'nha_cung_cap_ten', width: 240, render: (t) => <strong>{t}</strong> },
    { title: 'Tổng Tiền PO', dataIndex: 'tong_tien_no', key: 'tong_tien_no', width: 150, render: (val) => `${Number(val).toLocaleString('vi-VN')} ₫` },
    { title: 'Đã Trả NCC', dataIndex: 'da_thanh_toan', key: 'da_thanh_toan', width: 150, render: (val) => <span className="text-emerald-600 font-semibold">{Number(val).toLocaleString('vi-VN')} ₫</span> },
    { title: 'Còn Nợ NCC', dataIndex: 'con_no', key: 'con_no', width: 150, render: (val) => <strong className="text-rose-600">{Number(val).toLocaleString('vi-VN')} ₫</strong> },
    { title: 'Hạn Thanh Toán', dataIndex: 'han_thanh_toan', key: 'han_thanh_toan', width: 160, render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A' },
    { title: 'Trạng Thái', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Hành Động',
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
            Trả Tiền NCC
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
            <BankOutlined className="text-emerald-600" /> Tài Chính, Công Nợ & Báo Cáo Kinh Doanh
          </h1>
          <p className="text-sm text-slate-500">Quản lý dòng tiền Sổ quỹ, theo dõi công nợ Phải Thu (AR), Phải Trả (AP) và báo cáo lợi nhuận gộp</p>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCashbookModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
            Lập Phiếu Thu / Chi
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); if (activeTab === 'cashbook') fetchCashbook(); if (activeTab === 'ar') fetchAr(); if (activeTab === 'ap') fetchAp(); }}>
            Tải lại
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Thu Sổ Quỹ" value={stats.tong_thu || 0} valueStyle={{ color: '#16a34a' }} prefix={<ArrowUpOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Chi Sổ Quỹ" value={stats.tong_chi || 0} valueStyle={{ color: '#e11d48' }} prefix={<ArrowDownOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Dòng Tiền Ròng" value={stats.dong_tien_rong || 0} valueStyle={{ color: '#0284c7' }} prefix={<WalletOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Công Nợ Phải Thu (AR)" value={stats.ar?.con_no || 0} valueStyle={{ color: '#d97706' }} prefix={<ClockCircleOutlined />} suffix="₫" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4.8}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Công Nợ Phải Trả (AP)" value={stats.ap?.con_no || 0} valueStyle={{ color: '#a855f7' }} prefix={<BankOutlined />} suffix="₫" />
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
                  <BankOutlined /> Báo Cáo Lợi Nhuận & Dòng Tiền
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card title="Tỷ Lệ Thu Hồi Công Nợ Khách Hàng (AR)" className="rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-4 text-center">
                          <Progress type="circle" percent={stats.ar?.tong_no > 0 ? Math.round((stats.ar.da_thu / stats.ar.tong_no) * 100) : 100} width={140} strokeColor="#16a34a" />
                          <div className="flex justify-between text-sm pt-2">
                            <span>Đã thu: <strong>{Number(stats.ar?.da_thu || 0).toLocaleString('vi-VN')} ₫</strong></span>
                            <span>Còn nợ: <strong className="text-amber-600">{Number(stats.ar?.con_no || 0).toLocaleString('vi-VN')} ₫</strong></span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Tỷ Lệ Thanh Toán Nợ Nhà Cung Cấp (AP)" className="rounded-xl border border-slate-100 shadow-sm">
                        <div className="space-y-4 text-center">
                          <Progress type="circle" percent={stats.ap?.tong_no > 0 ? Math.round((stats.ap.da_tra / stats.ap.tong_no) * 100) : 100} width={140} strokeColor="#2563eb" />
                          <div className="flex justify-between text-sm pt-2">
                            <span>Đã trả: <strong>{Number(stats.ap?.da_tra || 0).toLocaleString('vi-VN')} ₫</strong></span>
                            <span>Còn nợ NCC: <strong className="text-rose-600">{Number(stats.ap?.con_no || 0).toLocaleString('vi-VN')} ₫</strong></span>
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
                  <WalletOutlined /> Sổ Quỹ Thu / Chi
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Loại phiếu:</span>
                      <Select
                        value={cashbookType}
                        onChange={setCashbookType}
                        style={{ width: 140 }}
                        options={[
                          { label: 'Tất cả loại', value: '' },
                          { label: 'Phiếu Thu', value: 'Thu' },
                          { label: 'Phiếu Chi', value: 'Chi' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Tìm theo Mã phiếu, Đối tượng, Ghi chú..."
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
                  <ClockCircleOutlined /> Công Nợ Phải Thu Khách Hàng (AR)
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Trạng thái:</span>
                      <Select
                        value={arStatus}
                        onChange={setArStatus}
                        style={{ width: 170 }}
                        options={[
                          { label: 'Tất cả trạng thái', value: '' },
                          { label: 'Chưa thanh toán', value: 'ChuaThanhToan' },
                          { label: 'Thanh toán 1 phần', value: 'ThanhToanMotPhan' },
                          { label: 'Đã thanh toán', value: 'DaThanhToan' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Tìm theo Tên KH, SĐT..."
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
                  <BankOutlined /> Công Nợ Phải Trả Nhà Cung Cấp (AP)
                </span>
              ),
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <Space wrap>
                      <span className="text-sm font-semibold text-slate-700">Trạng thái:</span>
                      <Select
                        value={apStatus}
                        onChange={setApStatus}
                        style={{ width: 170 }}
                        options={[
                          { label: 'Tất cả trạng thái', value: '' },
                          { label: 'Chưa thanh toán', value: 'ChuaThanhToan' },
                          { label: 'Thanh toán 1 phần', value: 'ThanhToanMotPhan' },
                          { label: 'Đã thanh toán', value: 'DaThanhToan' }
                        ]}
                      />
                    </Space>
                    <Input.Search
                      placeholder="Tìm theo Tên Nhà cung cấp..."
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
        title="Lập Phiếu Thu / Chi Mới Vào Sổ Quỹ"
        open={isCashbookModalOpen}
        onCancel={() => setIsCashbookModalOpen(false)}
        onOk={() => cashbookForm.submit()}
      >
        <Form form={cashbookForm} layout="vertical" onFinish={handleCreateCashbook}>
          <Form.Item name="loai_phieu" label="Loại Phiếu" rules={[{ required: true, message: 'Chọn loại phiếu' }]} initialValue="Thu">
            <Select options={[
              { label: 'Phiếu Thu (Tiền vào)', value: 'Thu' },
              { label: 'Phiếu Chi (Tiền ra)', value: 'Chi' }
            ]} />
          </Form.Item>
          <Form.Item name="loai_giao_dich" label="Loại Giao Dịch" rules={[{ required: true, message: 'Chọn loại giao dịch' }]} initialValue="ThuTienDonHang">
            <Select options={[
              { label: 'Thu tiền đơn hàng', value: 'ThuTienDonHang' },
              { label: 'Thu tiền công nợ khách hàng', value: 'ThuTienCongNoKhach' },
              { label: 'Chi tiền nhập hàng NCC', value: 'ChiTienNhapHangNCC' },
              { label: 'Chi tiền hoàn trả RMA', value: 'ChiTienHoanRMA' },
              { label: 'Chi tiền vận hành / chi phí khác', value: 'ChiTienVanHang' },
              { label: 'Thu / Chi khác', value: 'ThuChiKhac' }
            ]} />
          </Form.Item>
          <Form.Item name="so_tien" label="Số Tiền (₫)" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber placeholder="Ví dụ: 5000000" style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
          </Form.Item>
          <Form.Item name="doi_tuong_loai" label="Loại Đối Tượng" initialValue="KhachHang">
            <Select options={[
              { label: 'Khách Hàng', value: 'KhachHang' },
              { label: 'Nhà Cung Cấp', value: 'NhaCungCap' },
              { label: 'Nhân Viên', value: 'NhanVien' },
              { label: 'Khác', value: 'Khac' }
            ]} />
          </Form.Item>
          <Form.Item name="doi_tuong_ten" label="Tên Đối Tượng / Đơn Vị" rules={[{ required: true, message: 'Nhập tên đối tượng' }]}>
            <Input placeholder="Ví dụ: Nhà thuốc Long Châu / Bệnh viện Vinmec" />
          </Form.Item>
          <Form.Item name="phuong_thuc" label="Phương Thức Thanh Toán" initialValue="ChuyenKhoan">
            <Select options={[
              { label: 'Chuyển Khoản Ngân Hàng', value: 'ChuyenKhoan' },
              { label: 'Tiền Mặt', value: 'TienMat' },
              { label: 'Thẻ ATM / VISA', value: 'TheATM' },
              { label: 'Ví Điện Tử (Momo/ZaloPay)', value: 'ViDienTu' }
            ]} />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi Chú Giải Trình Audit" rules={[{ required: true, message: 'Nhập ghi chú' }]}>
            <Input.TextArea placeholder="Nêu rõ nội dung thu / chi" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Thu Tiền Nợ Khách Hàng (AR) */}
      <Modal
        title={`Ghi Nhận Thu Tiền Nợ - Đơn Hàng #${selectedAr?.don_hang_id || ''}`}
        open={isArModalOpen}
        onCancel={() => setIsArModalOpen(false)}
        onOk={() => arForm.submit()}
      >
        {selectedAr && (
          <Form form={arForm} layout="vertical" onFinish={handlePayAr}>
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-1">
              <div>Khách hàng: <strong>{selectedAr.ten_khach_hang}</strong></div>
              <div>Tổng nợ: <strong>{Number(selectedAr.tong_tien_no).toLocaleString('vi-VN')} ₫</strong></div>
              <div>Đã thanh toán: <span className="text-emerald-600 font-semibold">{Number(selectedAr.da_thanh_toan).toLocaleString('vi-VN')} ₫</span></div>
              <div>Còn nợ: <strong className="text-amber-600">{Number(selectedAr.con_no).toLocaleString('vi-VN')} ₫</strong></div>
            </div>
            <Form.Item name="amount" label="Số Tiền Thu Đợt Này (₫)" rules={[{ required: true, message: 'Nhập số tiền thu' }]} initialValue={selectedAr.con_no}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
            </Form.Item>
            <Form.Item name="note" label="Ghi Chú Thu Nợ">
              <Input.TextArea placeholder="Ví dụ: Thu nợ đợt 2 bằng chuyển khoản ngân hàng" rows={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal Trả Tiền Nợ NCC (AP) */}
      <Modal
        title={`Ghi Nhận Trả Nợ Nhà Cung Cấp - ${selectedAp?.nha_cung_cap_ten || ''}`}
        open={isApModalOpen}
        onCancel={() => setIsApModalOpen(false)}
        onOk={() => apForm.submit()}
      >
        {selectedAp && (
          <Form form={apForm} layout="vertical" onFinish={handlePayAp}>
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-1">
              <div>Nhà cung cấp: <strong>{selectedAp.nha_cung_cap_ten}</strong></div>
              <div>Mã PO: <strong>#{selectedAp.don_nhap_id}</strong></div>
              <div>Tổng nợ PO: <strong>{Number(selectedAp.tong_tien_no).toLocaleString('vi-VN')} ₫</strong></div>
              <div>Còn nợ NCC: <strong className="text-rose-600">{Number(selectedAp.con_no).toLocaleString('vi-VN')} ₫</strong></div>
            </div>
            <Form.Item name="amount" label="Số Tiền Chi Trả Đợt Này (₫)" rules={[{ required: true, message: 'Nhập số tiền chi trả' }]} initialValue={selectedAp.con_no}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
            </Form.Item>
            <Form.Item name="note" label="Ghi Chú Chi Trả">
              <Input.TextArea placeholder="Ví dụ: Thanh toán nợ đợt cuối chuyển khoản Vietcombank" rows={2} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
