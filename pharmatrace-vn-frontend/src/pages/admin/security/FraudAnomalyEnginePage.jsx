import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm, Alert } from 'antd'
import { SafetyCertificateOutlined, AlertOutlined, ThunderboltOutlined, CompassOutlined, CheckCircleOutlined, ReloadOutlined, ExclamationCircleOutlined, AimOutlined, LockOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function FraudAnomalyEnginePage() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({ tong_so_canh_bao: 0, rui_ro_nghiem_trong: 0, bat_thuong_van_toc: 0, bat_thuong_tan_suat: 0, da_xac_nhan_hang_gia: 0 })
  const [loading, setLoading] = useState(false)
  const [filterRisk, setFilterRisk] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterRisk) params.riskLevel = filterRisk
      if (filterType) params.alertType = filterType
      if (filterStatus) params.status = filterStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/fraud-anomalies/alerts', { params })
      if (res.data?.success) setAlerts(res.data.data || [])
    } catch (err) {
      message.error('Lỗi khi tải danh sách Cảnh báo Gian lận')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/fraud-anomalies/stats')
      if (res.data?.success) setStats(res.data.data || {})
    } catch (err) {
      // Silent catch
    }
  }

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [filterRisk, filterType, filterStatus])

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await apiClient.patch(`/admin/fraud-anomalies/alerts/${id}/status`, { status })
      if (res.data?.success) {
        message.success('Cập nhật trạng thái xử lý cảnh báo thành công')
        fetchAlerts()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Lỗi khi cập nhật trạng thái')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối máy chủ')
    }
  }

  const handleRunSimulation = async (values) => {
    try {
      setSimLoading(true)
      const res = await apiClient.post('/admin/fraud-anomalies/scan-simulation', values)
      if (res.data?.success) {
        setSimResult(res.data.data)
        if (res.data.data.anomalyDetected) {
          message.warning('Phát hiện cảnh báo vận tốc / vị trí quét bất thường!')
        } else {
          message.success('Xác thực thành công: Tọa độ hợp lệ')
        }
        fetchAlerts()
        fetchStats()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi chạy simulator Engine')
    } finally {
      setSimLoading(false)
    }
  }

  const renderRiskBadge = (risk) => {
    const map = {
      Critical: { color: 'magenta', text: 'NGHIÊM TRỌNG (CRITICAL)', icon: <AlertOutlined /> },
      High: { color: 'red', text: 'CAO (HIGH)', icon: <ExclamationCircleOutlined /> },
      Medium: { color: 'orange', text: 'TRUNG BÌNH', icon: <CompassOutlined /> },
      Low: { color: 'blue', text: 'THẤP', icon: <CheckCircleOutlined /> }
    }
    const item = map[risk] || { color: 'default', text: risk }
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  const renderStatusBadge = (status) => {
    const map = {
      Moi: { color: 'gold', text: 'MỚI CẢNH BÁO' },
      DangXuLy: { color: 'processing', text: 'ĐANG ĐIỀU TRA' },
      DaKiemChung: { color: 'cyan', text: 'ĐÃ KIỂM CHỨNG' },
      BaoDongGia: { color: 'red', text: 'XÁC NHẬN HÀNG GIẢ' }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const columns = [
    { 
      title: 'Mã Hộp Thuốc (UID)', 
      dataIndex: 'hop_thuoc_uid', 
      key: 'hop_thuoc_uid',
      width: 220,
      render: (uid, r) => (
        <div>
          <strong className="font-mono text-slate-800 break-all">{uid}</strong>
          {r.ten_duoc_pham && <div className="text-xs text-brand-600 font-medium mt-1">{r.ten_duoc_pham} - Số Lô: {r.so_lo_san_xuat || 'N/A'}</div>}
        </div>
      )
    },
    { 
      title: 'Loại Cảnh Báo', 
      dataIndex: 'loai_canh_bao', 
      key: 'loai_canh_bao',
      width: 170,
      render: (type) => (
        type === 'VelocityAnomaly' 
          ? <Tag color="purple" icon={<ThunderboltOutlined />}>Bất Thường Vận Tốc</Tag> 
          : <Tag color="volcano">Bất Thường Tần Suất</Tag>
      )
    },
    { title: 'Mức Độ Rủi Ro', key: 'risk', width: 190, render: (_, r) => renderRiskBadge(r.muc_do_rui_ro) },
    { 
      title: 'Khoảng Cách / Vận Tốc', 
      key: 'velocity',
      width: 180,
      render: (_, r) => (
        <div>
          <div className="text-sm font-semibold text-slate-700">{r.khoang_cach_km ? `${r.khoang_cach_km} km` : '0 km'}</div>
          <div className="text-xs text-red-500 font-mono">{r.van_toc_kmh ? `${Number(r.van_toc_kmh).toLocaleString()} km/h` : 'N/A'} ({r.thoi_gian_chenh_phut || 0} phút)</div>
        </div>
      )
    },
    { 
      title: 'Mô Tả Cảnh Báo Engine', 
      dataIndex: 'mo_ta', 
      key: 'mo_ta',
      width: 320,
      render: (text) => <span className="text-xs text-slate-600 leading-relaxed block">{text}</span> 
    },
    { title: 'Trạng Thái', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Hành Động',
      key: 'action',
      width: 220,
      render: (_, r) => (
        <Space size="small" direction="vertical">
          {r.trang_thai !== 'BaoDongGia' && (
            <Popconfirm
              title="Xác nhận cảnh báo hàng giả?"
              description="Đánh dấu lô/hộp thuốc này là hàng giả để cảnh báo toàn bộ người tiêu dùng."
              onConfirm={() => handleUpdateStatus(r.id, 'BaoDongGia')}
              okText="Báo Động Hàng Giả"
              cancelText="Hủy"
            >
              <Button type="primary" danger size="small" icon={<LockOutlined />}>
                Báo Hàng Giả
              </Button>
            </Popconfirm>
          )}
          <Select
            size="small"
            value={r.trang_thai}
            style={{ width: 140 }}
            onChange={(val) => handleUpdateStatus(r.id, val)}
            options={[
              { label: 'Mới cảnh báo', value: 'Moi' },
              { label: 'Đang điều tra', value: 'DangXuLy' },
              { label: 'Đã kiểm chứng', value: 'DaKiemChung' },
              { label: 'Báo động hàng giả', value: 'BaoDongGia' }
            ]}
          />
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
            <SafetyCertificateOutlined className="text-rose-600" /> Engine Chống Gian Lận QR & Cảnh Báo Hàng Giả
          </h1>
          <p className="text-sm text-slate-500">Phát hiện bất thường vận tốc quét địa lý (Haversine Anomaly) & tần suất nhân bản mã QR</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchAlerts(); fetchStats(); }}>Tải lại</Button>
          <Button type="primary" icon={<AimOutlined />} onClick={() => setIsSimulatorOpen(true)} className="bg-purple-600 hover:bg-purple-500">
            Giả Lập Quét Engine (Simulator)
          </Button>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Vụ Cảnh Báo" value={stats.tong_so_canh_bao || 0} valueStyle={{ color: '#0284c7' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Rủi Ro Nghiêm Trọng (Critical)" value={stats.rui_ro_nghiem_trong || 0} valueStyle={{ color: '#c026d3' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Bất Thường Vận Tốc (Velocity)" value={stats.bat_thuong_van_toc || 0} valueStyle={{ color: '#ea580c' }} prefix={<CompassOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Xác Nhận Hàng Giả / Cloned QR" value={stats.da_xac_nhan_hang_gia || 0} valueStyle={{ color: '#dc2626' }} prefix={<LockOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">Rủi ro:</span>
            <Select
              value={filterRisk}
              onChange={setFilterRisk}
              style={{ width: 150 }}
              options={[
                { label: 'Tất cả rủi ro', value: '' },
                { label: 'Critical (Nghiêm trọng)', value: 'Critical' },
                { label: 'High (Cao)', value: 'High' },
                { label: 'Medium (Trung bình)', value: 'Medium' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Loại cảnh báo:</span>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 170 }}
              options={[
                { label: 'Tất cả loại', value: '' },
                { label: 'Bất thường vận tốc', value: 'VelocityAnomaly' },
                { label: 'Bất thường tần suất', value: 'FrequencyAnomaly' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Trạng thái:</span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 160 }}
              options={[
                { label: 'Tất cả trạng thái', value: '' },
                { label: 'Mới cảnh báo', value: 'Moi' },
                { label: 'Đang điều tra', value: 'DangXuLy' },
                { label: 'Đã kiểm chứng', value: 'DaKiemChung' },
                { label: 'Báo động hàng giả', value: 'BaoDongGia' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Tìm theo UID, Mô tả, Dược phẩm..."
            onSearch={(val) => { setSearch(val); fetchAlerts(); }}
            style={{ width: 260 }}
            allowClear
          />
        </div>

        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* Simulator Modal */}
      <Modal
        title="Bảng Điều Khiển Giả Lập Engine Quét Mã QR"
        open={isSimulatorOpen}
        onCancel={() => { setIsSimulatorOpen(false); setSimResult(null); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRunSimulation}>
          <Form.Item 
            name="hop_thuoc_uid" 
            label="UID Hộp Thuốc (UUID)" 
            initialValue="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
            rules={[{ required: true, message: 'Nhập UID Hộp thuốc' }]}
          >
            <Input placeholder="Ví dụ: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" />
          </Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="lat" label="Vĩ độ (Lat)" initialValue={10.8231} rules={[{ required: true }]}>
                <InputNumber placeholder="10.8231 (TP.HCM)" style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lng" label="Kinh độ (Lng)" initialValue={106.6297} rules={[{ required: true }]}>
                <InputNumber placeholder="106.6297 (TP.HCM)" style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" loading={simLoading} block className="bg-purple-600 hover:bg-purple-500 mb-4">
            Chạy Engine Kiểm Tra Gian Lận
          </Button>
        </Form>

        {simResult && (
          <div className="mt-4 p-4 border rounded-xl bg-slate-50 space-y-3">
            <h3 className="font-bold text-slate-800">Kết quả tính toán Engine:</h3>
            <div className="text-sm"><strong>Khoảng cách tính toán:</strong> {simResult.distance_km} km</div>
            <div className="text-sm"><strong>Thời gian chênh lệch:</strong> {simResult.time_diff_minutes?.toFixed(1)} phút</div>
            <div className="text-sm"><strong>Vận tốc ước tính:</strong> <span className="font-mono text-red-600 font-bold">{simResult.speed_kmh} km/h</span></div>
            
            {simResult.anomalyDetected ? (
              <Alert
                message="PHÁT HIỆN CẢNH BÁO GIAN LẬN VẬN TỐC GEOGRAPHIC VELOCITY!"
                description={simResult.createdAlert?.mo_ta}
                type="error"
                showIcon
              />
            ) : (
              <Alert
                message="XÁC THỰC HỢP LỆ"
                description="Tọa độ quét và thời gian hợp lệ, không có dấu hiệu gian lận."
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
