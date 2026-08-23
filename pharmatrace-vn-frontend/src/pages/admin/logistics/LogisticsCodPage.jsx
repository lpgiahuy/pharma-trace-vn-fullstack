import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, Row, Col, Statistic, message, Popconfirm, Alert } from 'antd'
import { CarOutlined, DollarOutlined, PlusOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ReloadOutlined, FileDoneOutlined, DeleteOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons'
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
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null)
  const [loadingOrderInfo, setLoadingOrderInfo] = useState(false)
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
      message.error('Failed to load shipments list')
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

  const fetchOrderInfo = async (orderId) => {
    if (!orderId) {
      setSelectedOrderInfo(null)
      form.setFieldsValue({ tien_cod: 0 })
      return
    }
    try {
      setLoadingOrderInfo(true)
      const res = await apiClient.get(`/admin/logistics-cod/order-info/${orderId}`)
      if (res.data?.success && res.data.data) {
        const order = res.data.data
        setSelectedOrderInfo(order)
        const autoCod = order.phuong_thuc_thanh_toan === 'COD' ? Number(order.tong_tien) : 0
        form.setFieldsValue({ tien_cod: autoCod })
        message.success(`Đã tự động lấy số tiền đơn #${orderId}: ${autoCod.toLocaleString()} ₫`)
      } else {
        setSelectedOrderInfo(null)
        message.warning(`Không tìm thấy đơn hàng #${orderId}`)
      }
    } catch (err) {
      setSelectedOrderInfo(null)
      message.error(err.response?.data?.message || `Không tìm thấy thông tin đơn hàng #${orderId}`)
    } finally {
      setLoadingOrderInfo(false)
    }
  }

  const handleValuesChange = (changedValues) => {
    if ('don_hang_id' in changedValues) {
      const val = changedValues.don_hang_id
      if (val) {
        fetchOrderInfo(val)
      } else {
        setSelectedOrderInfo(null)
        form.setFieldsValue({ tien_cod: 0 })
      }
    }
  }

  const handleCreateShipment = async (values) => {
    try {
      const res = await apiClient.post('/admin/logistics-cod/shipments', values)
      if (res.data?.success) {
        message.success('Tạo vận đơn thành công!')
        setIsCreateModalOpen(false)
        setSelectedOrderInfo(null)
        form.resetFields()
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Lỗi khi tạo vận đơn')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối đến máy chủ')
    }
  }

  const handleDeleteShipment = async (id) => {
    try {
      const res = await apiClient.delete(`/admin/logistics-cod/shipments/${id}`)
      if (res.data?.success) {
        message.success('Đã xóa vận đơn thành công!')
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Không thể xóa vận đơn')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xóa vận đơn')
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
        message.error(res.data?.message || 'Error updating status')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to process request')
    }
  }

  const handleReconcileCod = async (id) => {
    try {
      const res = await apiClient.patch(`/admin/logistics-cod/shipments/${id}/reconcile-cod`)
      if (res.data?.success) {
        message.success('Đối soát tiền COD thành công!')
        fetchShipments()
        fetchSummary()
      } else {
        message.error(res.data?.message || 'Error reconciling COD')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to perform COD reconciliation')
    }
  }

  const renderDeliveryTag = (status) => {
    const map = {
      ChoLayHang: { color: 'default', text: 'Awaiting Pickup', icon: <SyncOutlined spin /> },
      DangVanChuyen: { color: 'processing', text: 'In Transit', icon: <CarOutlined /> },
      GiaoThanhCong: { color: 'success', text: 'Delivered', icon: <CheckCircleOutlined /> },
      GiaoThatBai: { color: 'error', text: 'Delivery Failed', icon: <CloseCircleOutlined /> },
      TraHang: { color: 'warning', text: 'Returned to Sender', icon: <ReloadOutlined /> }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color} icon={item.icon}>{item.text}</Tag>
  }

  const renderCodTag = (status, deliveryStatus) => {
    if (['GiaoThatBai', 'TraHang'].includes(deliveryStatus)) {
      return <Tag color="default" icon={<CloseCircleOutlined />}>NO COD APPLICABLE</Tag>
    }
    if (status === 'DaDoiSoat') {
      return <Tag color="green" icon={<FileDoneOutlined />}>COD RECONCILED</Tag>
    }
    return <Tag color="gold" icon={<DollarOutlined />}>PENDING COD RECONCILIATION</Tag>
  }

  const columns = [
    { title: 'Waybill Tracking No.', dataIndex: 'ma_van_don', key: 'ma_van_don', render: (text) => <strong>{text}</strong> },
    { title: 'Order ID', dataIndex: 'don_hang_id', key: 'don_hang_id', align: 'center', render: (id) => `#${id}` },
    { title: 'Customer', dataIndex: 'ten_khach_hang', key: 'ten_khach_hang', render: (t, r) => t || r.so_dien_thoai || 'Guest Customer' },
    { 
      title: 'Carrier Partner', 
      dataIndex: 'don_vi_van_chuyen', 
      key: 'don_vi_van_chuyen',
      render: (v) => <Tag color="blue">{v === 'DoiXeNoiBo' ? 'Internal Fleet' : v}</Tag> 
    },
    { 
      title: 'COD Amount', 
      dataIndex: 'tien_cod', 
      key: 'tien_cod', 
      align: 'right',
      render: (val, r) => (['GiaoThatBai', 'TraHang'].includes(r.trang_thai_giao)) ? <span className="text-slate-400 line-through">0 ₫</span> : (Number(val) > 0 ? <strong>{Number(val).toLocaleString()} ₫</strong> : <span className="text-slate-400">0 ₫</span>)
    },
    { title: 'Delivery Status', key: 'deliveryStatus', render: (_, r) => renderDeliveryTag(r.trang_thai_giao) },
    { title: 'COD Status', key: 'codStatus', render: (_, r) => renderCodTag(r.trang_thai_cod, r.trang_thai_giao) },
    {
      title: 'Actions',
      key: 'action',
      render: (_, r) => (
        <Space size="small">
          {r.trang_thai_giao !== 'GiaoThanhCong' && (
            <Select
              size="small"
              defaultValue={r.trang_thai_giao}
              style={{ width: 150 }}
              onChange={(val) => handleUpdateDeliveryStatus(r.id, val)}
              options={[
                { label: 'Awaiting Pickup', value: 'ChoLayHang' },
                { label: 'In Transit', value: 'DangVanChuyen' },
                { label: 'Delivered', value: 'GiaoThanhCong' },
                { label: 'Delivery Failed', value: 'GiaoThatBai' }
              ]}
            />
          )}
          {r.trang_thai_giao === 'GiaoThanhCong' && r.trang_thai_cod === 'ChuaDoiSoat' && Number(r.tien_cod) > 0 && (
            <Popconfirm
              title="Confirm COD Collection Reconciliation?"
              description={`Confirm receipt of ${Number(r.tien_cod).toLocaleString()} ₫ from carrier partner.`}
              onConfirm={() => handleReconcileCod(r.id)}
              okText="Confirm"
              cancelText="Cancel"
            >
              <Button type="primary" size="small" icon={<DollarOutlined />}>Reconcile COD</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa vận đơn?"
            description="Bạn có chắc chắn muốn xóa vận đơn này không?"
            onConfirm={() => handleDeleteShipment(r.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
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
            <CarOutlined className="text-brand-600" /> Logistics Carrier & COD Reconciliation
          </h1>
          <p className="text-sm text-slate-500">Monitor tracking waybills, last-mile delivery progress, and cash-on-delivery (COD) settlement</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchShipments(); fetchSummary(); }}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedOrderInfo(null); form.resetFields(); setIsCreateModalOpen(true); }}>
            Create New Waybill
          </Button>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total Shipments" value={summary.tong_so_van_don || 0} valueStyle={{ color: '#0284c7' }} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Active In-Transit Shipments" value={summary.don_dang_giao || 0} valueStyle={{ color: '#d97706' }} prefix={<SyncOutlined spin />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic 
              title="Pending COD to Reconcile" 
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
              title="Reconciled COD Collected" 
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
            <span className="text-sm font-semibold text-slate-700">Carrier:</span>
            <Select
              value={filterCarrier}
              onChange={setFilterCarrier}
              style={{ width: 150 }}
              options={[
                { label: 'All Carriers', value: '' },
                { label: 'GHN Express', value: 'GHN' },
                { label: 'GHTK Express', value: 'GHTK' },
                { label: 'ViettelPost', value: 'ViettelPost' },
                { label: 'Internal Fleet', value: 'DoiXeNoiBo' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">Delivery Status:</span>
            <Select
              value={filterDeliveryStatus}
              onChange={setFilterDeliveryStatus}
              style={{ width: 160 }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Awaiting Pickup', value: 'ChoLayHang' },
                { label: 'In Transit', value: 'DangVanChuyen' },
                { label: 'Delivered', value: 'GiaoThanhCong' },
                { label: 'Delivery Failed', value: 'GiaoThatBai' }
              ]}
            />
            <span className="text-sm font-semibold text-slate-700">COD Status:</span>
            <Select
              value={filterCodStatus}
              onChange={setFilterCodStatus}
              style={{ width: 160 }}
              options={[
                { label: 'All COD Status', value: '' },
                { label: 'Pending Settlement', value: 'ChuaDoiSoat' },
                { label: 'Reconciled', value: 'DaDoiSoat' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Search by Tracking No., Customer, Phone..."
            onSearch={(val) => { setSearch(val); fetchShipments(); }}
            style={{ width: 280 }}
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
        title="Create New Shipping Waybill"
        open={isCreateModalOpen}
        onCancel={() => { setIsCreateModalOpen(false); setSelectedOrderInfo(null); }}
        onOk={() => form.submit()}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleCreateShipment}
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="don_hang_id" label="Order ID" rules={[{ required: true, message: 'Please enter Order ID' }]}>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber 
                placeholder="e.g. 176" 
                style={{ width: 'calc(100% - 100px)' }} 
                min={1} 
                onBlur={() => {
                  const val = form.getFieldValue('don_hang_id')
                  if (val) fetchOrderInfo(val)
                }}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                loading={loadingOrderInfo}
                onClick={() => fetchOrderInfo(form.getFieldValue('don_hang_id'))}
              >
                Check
              </Button>
            </Space.Compact>
          </Form.Item>

          {selectedOrderInfo && (
            <Alert
              className="mb-4"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message={`Đơn #${selectedOrderInfo.id} - ${selectedOrderInfo.ten_khach_hang || 'Khách hàng'}`}
              description={
                <div>
                  <p className="m-0 font-medium">Tổng tiền: <span className="text-blue-600">{Number(selectedOrderInfo.tong_tien).toLocaleString()} ₫</span></p>
                  <p className="m-0 text-slate-500">Hình thức thanh toán: <strong>{selectedOrderInfo.phuong_thuc_thanh_toan}</strong> ({selectedOrderInfo.phuong_thuc_thanh_toan === 'COD' ? 'Tự động nhập tiền COD' : 'Đã thanh toán online - COD = 0₫'})</p>
                </div>
              }
            />
          )}

          <Form.Item name="don_vi_van_chuyen" label="Carrier Partner" initialValue="DoiXeNoiBo">
            <Select options={[
              { label: 'Internal Delivery Fleet', value: 'DoiXeNoiBo' },
              { label: 'Giao Hàng Nhanh (GHN)', value: 'GHN' },
              { label: 'Giao Hàng Tiết Kiệm (GHTK)', value: 'GHTK' },
              { label: 'Viettel Post', value: 'ViettelPost' }
            ]} />
          </Form.Item>
          <Form.Item name="tien_cod" label="COD Cash-on-Delivery Amount (₫)" initialValue={0}>
            <InputNumber placeholder="0" style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
