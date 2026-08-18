import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm } from 'antd'
import { CarOutlined, DollarOutlined, PlusOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ReloadOutlined, FileDoneOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function LogisticsCodPage() {
  const [shipments, setShipments] = useState([])
  const [summary, setSummary] = useState({ tong_so_van_don: 0, don_dang_giao: 0, tong_cod_chua_doi_soat: 0, tong_cod_da_doi_soat: 0 })
  const [loading, setLoading] = useState(false)
  const [filterCarrier, setFilterCarrier] = useState('')
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('')
  const [filterCodStatus, setFilterCodStatus] = useState('')
  const [search, setSearch] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterCarrier) params.carrier = filterCarrier
      if (filterDeliveryStatus) params.deliveryStatus = filterDeliveryStatus
      if (filterCodStatus) params.codStatus = filterCodStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/logistics-cod/shipments', { params })
      if (res.data?.success) setShipments(res.data.data || [])
    } catch (err) {
      message.error('Lỗi khi tải danh sách Vận đơn')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get('/admin/logistics-cod/cod-summary')
      if (res.data?.success) setSummary(res.data.data || {})
    } catch (err) {
      // Silent catch
    }
  }

  useEffect(() => {
    fetchShipments()
    fetchSummary()
  }, [filterCarrier, filterDeliveryStatus, filterCodStatus])

  const handleCreateShipment = async (values) => {
    try {
      const res = await apiClient.post('/admin/logistics-cod/shipments', values)
      if (res.data?.success) {
        message.success('Tạo vận đơn mới thành công!')
        setIsCreateModalOpen(false)
        form.resetFields()
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Lỗi khi tạo vận đơn')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối máy chủ')
    }
  }

  const handleUpdateDeliveryStatus = async (id, status) => {
    try {
      const res = await apiClient.patch(`/admin/logistics-cod/shipments/${id}/status`, { trang_thai_giao: status })
      if (res.data?.success) {
        message.success('Cập nhật trạng thái giao hàng thành công!')
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Lỗi cập nhật trạng thái')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thực hiện yêu cầu')
    }
  }

  const handleReconcileCod = async (id) => {
    try {
      const res = await apiClient.patch(`/admin/logistics-cod/shipments/${id}/reconcile-cod`)
      if (res.data?.success) {
        message.success('Xác nhận ĐỐI SOÁT COD thành công!')
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Lỗi khi đối soát COD')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể thực hiện đối soát')
    }
  }

  const renderDeliveryTag = (status) => {
    const map = {
      ChoLayHang: { color: 'default', text: 'Chờ lấy hàng', icon: <SyncOutlined spin /> },
      DangVanChuyen: { color: 'processing', text: 'Đang vận chuyển', icon: <CarOutlined /> },
      GiaoThanhCong: { color: 'success', text: 'Giao thành công', icon: <CheckCircleOutlined /> },
      GiaoThatBai: { color: 'error', text: 'Giao thất bại', icon: <CloseCircleOutlined /> },
      TraHang: { color: 'warning', text: 'Trả hàng', icon: <ReloadOutlined /> }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  const renderCodTag = (status, deliveryStatus) => {
    if (['GiaoThatBai', 'TraHang'].includes(deliveryStatus)) {
      return <Tag color="default" icon={<CloseCircleOutlined />}>KHÔNG PHÁT SINH COD</Tag>
    }
    if (status === 'DaDoiSoat') {
      return <Tag color="green" icon={<FileDoneOutlined />}>ĐÃ ĐỐI SOÁT COD</Tag>
    }
    return <Tag color="gold" icon={<DollarOutlined />}>CHƯA ĐỐI SOÁT COD</Tag>
  }

  const columns = [
    { title: 'Mã Vận Đơn', dataIndex: 'ma_van_don', key: 'ma_van_don', render: (text) => <strong>{text}</strong> },
    { title: 'ID Đơn Hàng', dataIndex: 'don_hang_id', key: 'don_hang_id', align: 'center', render: (id) => `#${id}` },
    { title: 'Khách Hàng', dataIndex: 'ten_khach_hang', key: 'ten_khach_hang', render: (t, r) => t || r.so_dien_thoai || 'Khách vãng lai' },
    { 
      title: 'Đơn Vị Vận Chuyển', 
      dataIndex: 'don_vi_van_chuyen', 
      key: 'don_vi_van_chuyen',
      render: (v) => <Tag color="blue">{v}</Tag> 
    },
    { 
      title: 'Số Tiền COD', 
      dataIndex: 'tien_cod', 
      key: 'tien_cod', 
      align: 'right',
      render: (val, r) => (['GiaoThatBai', 'TraHang'].includes(r.trang_thai_giao)) ? <span className="text-slate-400 line-through">0 ₫</span> : (Number(val) > 0 ? <strong>{Number(val).toLocaleString('vi-VN')} ₫</strong> : <span className="text-slate-400">0 ₫</span>)
    },
    { title: 'Trạng Thái Giao', key: 'deliveryStatus', render: (_, r) => renderDeliveryTag(r.trang_thai_giao) },
    { title: 'Trạng Thái COD', key: 'codStatus', render: (_, r) => renderCodTag(r.trang_thai_cod, r.trang_thai_giao) },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, r) => (
        <Space size="small">
          {r.trang_thai_giao !== 'GiaoThanhCong' && (
            <Select
              size="small"
              defaultValue={r.trang_thai_giao}
              style={{ width: 140 }}
              onChange={(val) => handleUpdateDeliveryStatus(r.id, val)}
              options={[
                { label: 'Chờ lấy hàng', value: 'ChoLayHang' },
                { label: 'Đang vận chuyển', value: 'DangVanChuyen' },
                { label: 'Giao thành công', value: 'GiaoThanhCong' },
                { label: 'Giao thất bại', value: 'GiaoThatBai' }
              ]}
            />
          )}
          {r.trang_thai_giao === 'GiaoThanhCong' && r.trang_thai_cod === 'ChuaDoiSoat' && Number(r.tien_cod) > 0 && (
            <Popconfirm
              title="Xác nhận Đối Soát Tiền COD?"
              description={`Xác nhận đã nhận đủ ${Number(r.tien_cod).toLocaleString('vi-VN')} ₫ từ đơn vị giao hàng.`}
              onConfirm={() => handleReconcileCod(r.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="primary" size="small" icon={<DollarOutlined />}>Đối Soát COD</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CarOutlined className="text-brand-600" /> Quản Lý Vận Chuyển & Đối Soát Tiền COD
          </h1>
          <p className="text-sm text-slate-500">Giám sát mã vận đơn giao hàng, trạng thái giao vận và đối soát tiền thu hộ COD</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchShipments(); fetchSummary(); }}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Tạo Mã Vận Đơn Mới
          </Button>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Tổng Số Vận Đơn" value={summary.tong_so_van_don || 0} valueStyle={{ color: '#0284c7' }} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Vận Đơn Đang Giao" value={summary.don_dang_giao || 0} valueStyle={{ color: '#d97706' }} prefix={<SyncOutlined spin />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic 
              title="Tổng COD Chờ Đối Soát" 
              value={Number(summary.tong_cod_chua_doi_soat || 0)} 
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#ea580c' }} 
              prefix={<DollarOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic 
              title="Tổng COD Đã Đối Soát" 
              value={Number(summary.tong_cod_da_doi_soat || 0)} 
              precision={0}
              suffix="₫"
              valueStyle={{ color: '#16a34a' }} 
              prefix={<FileDoneOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">Đơn vị:</span>
            <Select
              value={filterCarrier}
              onChange={setFilterCarrier}
              style={{ width: 140 }}
              options={[
                { label: 'Tất cả đơn vị', value: '' },
                { label: 'GHN', value: 'GHN' },
                { label: 'GHTK', value: 'GHTK' },
                { label: 'ViettelPost', value: 'ViettelPost' },
                { label: 'Đội xe nội bộ', value: 'DoiXeNoiBo' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Trạng thái giao:</span>
            <Select
              value={filterDeliveryStatus}
              onChange={setFilterDeliveryStatus}
              style={{ width: 150 }}
              options={[
                { label: 'Tất cả trạng thái', value: '' },
                { label: 'Chờ lấy hàng', value: 'ChoLayHang' },
                { label: 'Đang vận chuyển', value: 'DangVanChuyen' },
                { label: 'Giao thành công', value: 'GiaoThanhCong' },
                { label: 'Giao thất bại', value: 'GiaoThatBai' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">COD:</span>
            <Select
              value={filterCodStatus}
              onChange={setFilterCodStatus}
              style={{ width: 150 }}
              options={[
                { label: 'Tất cả COD', value: '' },
                { label: 'Chưa đối soát', value: 'ChuaDoiSoat' },
                { label: 'Đã đối soát', value: 'DaDoiSoat' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Tìm theo Mã vận đơn, Tên KH, SĐT..."
            onSearch={(val) => { setSearch(val); fetchShipments(); }}
            style={{ width: 250 }}
            allowClear
          />
        </div>

        <Table
          dataSource={shipments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal Tạo Mã Vận Đơn Mới */}
      <Modal
        title="Tạo Mã Vận Đơn Giao Hàng Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateShipment}>
          <Form.Item name="don_hang_id" label="ID Đơn Hàng" rules={[{ required: true, message: 'Nhập ID Đơn hàng' }]}>
            <InputNumber placeholder="Ví dụ: 3" style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="don_vi_van_chuyen" label="Đơn Vị Vận Chuyển" initialValue="DoiXeNoiBo">
            <Select options={[
              { label: 'Đội Xe Nội Bộ', value: 'DoiXeNoiBo' },
              { label: 'Giao Hàng Nhanh (GHN)', value: 'GHN' },
              { label: 'Giao Hàng Tiết Kiệm (GHTK)', value: 'GHTK' },
              { label: 'Viettel Post', value: 'ViettelPost' }
            ]} />
          </Form.Item>
          <Form.Item name="tien_cod" label="Số Tiền Thu Hộ COD (₫)" initialValue={0}>
            <InputNumber placeholder="0" style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
