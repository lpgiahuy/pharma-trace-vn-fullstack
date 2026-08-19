import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm, Alert } from 'antd'
import { SafetyCertificateOutlined, AlertOutlined, ThunderboltOutlined, CompassOutlined, CheckCircleOutlined, ReloadOutlined, ExclamationCircleOutlined, AimOutlined, LockOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'
import { useTranslation } from 'react-i18next'

export default function FraudAnomalyEnginePage() {
  const { t } = useTranslation()
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
      message.error('Failed to load fraud security alerts')
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
        message.success('Alert resolution status updated successfully')
        fetchAlerts()
        fetchStats()
      } else {
        message.error(res.data?.message || 'Error updating status')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to connect to server')
    }
  }

  const handleRunSimulation = async (values) => {
    try {
      setSimLoading(true)
      const res = await apiClient.post('/admin/fraud-anomalies/scan-simulation', values)
      if (res.data?.success) {
        setSimResult(res.data.data)
        if (res.data.data.anomalyDetected) {
          message.warning('Impossible velocity / geographic anomaly detected!')
        } else {
          message.success('Verification passed: coordinates are authentic and physically plausible')
        }
        fetchAlerts()
        fetchStats()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to execute engine simulation')
    } finally {
      setSimLoading(false)
    }
  }

  const renderRiskBadge = (risk) => {
    const map = {
      Critical: { color: 'magenta', text: 'CRITICAL RISK', icon: <AlertOutlined /> },
      High: { color: 'red', text: 'HIGH RISK', icon: <ExclamationCircleOutlined /> },
      Medium: { color: 'orange', text: 'MEDIUM RISK', icon: <CompassOutlined /> },
      Low: { color: 'blue', text: 'LOW RISK', icon: <CheckCircleOutlined /> }
    }
    const item = map[risk] || { color: 'default', text: risk }
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  const renderStatusBadge = (status) => {
    const map = {
      Moi: { color: 'gold', text: 'New Alert' },
      DangXuLy: { color: 'processing', text: 'Investigating' },
      DaKiemChung: { color: 'cyan', text: 'Verified Authentic' },
      BaoDongGia: { color: 'red', text: 'Confirmed Counterfeit' }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const columns = [
    { 
      title: 'Item UID / Batch Details', 
      dataIndex: 'hop_thuoc_uid', 
      key: 'hop_thuoc_uid',
      width: 220,
      render: (uid, r) => (
        <div>
          <strong className="font-mono text-slate-800 break-all">{uid}</strong>
          {r.ten_duoc_pham && <div className="text-xs text-brand-600 font-medium mt-1">{r.ten_duoc_pham} - Batch: {r.so_lo_san_xuat || 'N/A'}</div>}
        </div>
      )
    },
    { 
      title: 'Anomaly Type', 
      dataIndex: 'loai_canh_bao', 
      key: 'loai_canh_bao',
      width: 170,
      render: (type) => (
        type === 'VelocityAnomaly' 
          ? <Tag color="purple" icon={<ThunderboltOutlined />}>Velocity Anomaly</Tag> 
          : <Tag color="volcano">Frequency Anomaly</Tag>
      )
    },
    { title: 'Risk Level', key: 'risk', width: 190, render: (_, r) => renderRiskBadge(r.muc_do_rui_ro) },
    { 
      title: 'Geographic Velocity', 
      key: 'velocity',
      width: 180,
      render: (_, r) => (
        <div>
          <div className="text-sm font-semibold text-slate-700">{r.khoang_cach_km ? `${r.khoang_cach_km} km` : '0 km'}</div>
          <div className="text-xs text-red-500 font-mono">{r.van_toc_kmh ? `${Number(r.van_toc_kmh).toLocaleString()} km/h` : 'N/A'} ({r.thoi_gian_chenh_phut || 0} min)</div>
        </div>
      )
    },
    { 
      title: 'Heuristic Description', 
      dataIndex: 'mo_ta', 
      key: 'mo_ta',
      width: 320,
      render: (text) => <span className="text-xs text-slate-600 leading-relaxed block">{text}</span> 
    },
    { title: 'Status', key: 'status', width: 160, render: (_, r) => renderStatusBadge(r.trang_thai) },
    {
      title: 'Actions',
      key: 'action',
      width: 220,
      render: (_, r) => (
        <Space size="small" direction="vertical">
          {r.trang_thai !== 'BaoDongGia' && (
            <Popconfirm
              title="Flag as Confirmed Counterfeit?"
              description="This permanently flags this serial QR UID as counterfeit across all verification portals."
              onConfirm={() => handleUpdateStatus(r.id, 'BaoDongGia')}
              okText="Flag Counterfeit"
              cancelText="Cancel"
            >
              <Button type="primary" danger size="small" icon={<LockOutlined />}>
                Flag Counterfeit
              </Button>
            </Popconfirm>
          )}
          <Select
            size="small"
            value={r.trang_thai}
            style={{ width: 150 }}
            onChange={(val) => handleUpdateStatus(r.id, val)}
            options={[
              { label: 'New Alert', value: 'Moi' },
              { label: 'Investigating', value: 'DangXuLy' },
              { label: 'Verified Authentic', value: 'DaKiemChung' },
              { label: 'Confirmed Counterfeit', value: 'BaoDongGia' }
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
            <SafetyCertificateOutlined className="text-rose-600" /> Fraud Detection & Anomaly Security Engine
          </h1>
          <p className="text-sm text-slate-500">Real-time anti-counterfeit heuristics, impossibility velocity scanner, and clone detection</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchAlerts(); fetchStats(); }}>Refresh</Button>
          <Button type="primary" icon={<AimOutlined />} onClick={() => setIsSimulatorOpen(true)} className="bg-purple-600 hover:bg-purple-500">
            Attack Simulator Console
          </Button>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Security Alerts" value={stats.tong_so_canh_bao || 0} valueStyle={{ color: '#0284c7' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Critical Risk Incidents" value={stats.rui_ro_nghiem_trong || 0} valueStyle={{ color: '#c026d3' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Velocity Anomalies" value={stats.bat_thuong_van_toc || 0} valueStyle={{ color: '#ea580c' }} prefix={<CompassOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Confirmed Counterfeits" value={stats.da_xac_nhan_hang_gia || 0} valueStyle={{ color: '#dc2626' }} prefix={<LockOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">Risk Level:</span>
            <Select
              value={filterRisk}
              onChange={setFilterRisk}
              style={{ width: 150 }}
              options={[
                { label: 'All Risks', value: '' },
                { label: 'Critical Risk', value: 'Critical' },
                { label: 'High Risk', value: 'High' },
                { label: 'Medium Risk', value: 'Medium' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Alert Type:</span>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 170 }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Velocity Anomaly', value: 'VelocityAnomaly' },
                { label: 'Frequency Anomaly', value: 'FrequencyAnomaly' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Status:</span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 170 }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'New Alert', value: 'Moi' },
                { label: 'Investigating', value: 'DangXuLy' },
                { label: 'Verified Authentic', value: 'DaKiemChung' },
                { label: 'Confirmed Counterfeit', value: 'BaoDongGia' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Search by UID, Drug Name, Batch..."
            onSearch={(val) => { setSearch(val); fetchAlerts(); }}
            style={{ width: 280 }}
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
        title="QR Geographic Anomaly & Velocity Engine Simulator"
        open={isSimulatorOpen}
        onCancel={() => { setIsSimulatorOpen(false); setSimResult(null); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRunSimulation}>
          <Form.Item 
            name="hop_thuoc_uid" 
            label="Package UID (UUID)" 
            initialValue="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
            rules={[{ required: true, message: 'Please enter package UID' }]}
          >
            <Input placeholder="e.g. a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" />
          </Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="lat" label="Latitude (Lat)" initialValue={10.8231} rules={[{ required: true }]}>
                <InputNumber placeholder="10.8231 (HCMC)" style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lng" label="Longitude (Lng)" initialValue={106.6297} rules={[{ required: true }]}>
                <InputNumber placeholder="106.6297 (HCMC)" style={{ width: '100%' }} precision={6} />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" loading={simLoading} block className="bg-purple-600 hover:bg-purple-500 mb-4">
            Execute Fraud Detection Engine
          </Button>
        </Form>

        {simResult && (
          <div className="mt-4 p-4 border rounded-xl bg-slate-50 space-y-3">
            <h3 className="font-bold text-slate-800">Engine Mathematical Computation:</h3>
            <div className="text-sm"><strong>Computed Distance:</strong> {simResult.distance_km} km</div>
            <div className="text-sm"><strong>Elapsed Time Delta:</strong> {simResult.time_diff_minutes?.toFixed(1)} minutes</div>
            <div className="text-sm"><strong>Estimated Physical Speed:</strong> <span className="font-mono text-red-600 font-bold">{simResult.speed_kmh} km/h</span></div>
            
            {simResult.anomalyDetected ? (
              <Alert
                message="IMPOSSIBLE GEOGRAPHIC VELOCITY ANOMALY TRIGGERED!"
                description={simResult.createdAlert?.mo_ta}
                type="error"
                showIcon
              />
            ) : (
              <Alert
                message="PHYSICALLY AUTHENTIC & VALID"
                description="Scan coordinates and timestamp progression are authentic and physically plausible."
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
