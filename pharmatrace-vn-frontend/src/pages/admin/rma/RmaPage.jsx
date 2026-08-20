import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Modal, Select, Input, Space, Row, Col, Statistic, message, Popconfirm, Descriptions } from 'antd'
import { HistoryOutlined, DollarOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'

export default function RmaPage() {
  const [rmas, setRmas] = useState([])
  const [stats, setStats] = useState({ rma_cho_duyet: 0 })
  const [loading, setLoading] = useState(false)
  const [filterRmaStatus, setFilterRmaStatus] = useState('')
  const [search, setSearch] = useState('')

  // Modal RMA Detail
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false)
  const [rmaDetail, setRmaDetail] = useState(null)
  const [rmaLoading, setRmaLoading] = useState(false)

  const fetchRmas = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterRmaStatus) params.status = filterRmaStatus
      if (search) params.search = search

      const res = await apiClient.get('/admin/crm-rma/rma-requests', { params })
      if (res.data?.success) setRmas(res.data.data || [])
    } catch (err) {
      message.error('Failed to load RMA return requests')
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
    fetchRmas()
    fetchStats()
  }, [filterRmaStatus])

  const handleViewRmaDetail = async (rma) => {
    setIsRmaModalOpen(true)
    try {
      setRmaLoading(true)
      const res = await apiClient.get(`/admin/crm-rma/rma-requests/${rma.id}`)
      if (res.data?.success) setRmaDetail(res.data.data)
    } catch (err) {
      message.error('Failed to load RMA details')
    } finally {
      setRmaLoading(false)
    }
  }

  const handleUpdateRmaStatus = async (id, status) => {
    try {
      const res = await apiClient.patch(`/admin/crm-rma/rma-requests/${id}/status`, { status })
      if (res.data?.success) {
        message.success('RMA request status updated successfully!')
        fetchRmas()
        fetchStats()
        if (isRmaModalOpen && rmaDetail?.id === id) {
          handleViewRmaDetail({ id })
        }
      } else {
        message.error(res.data?.message || 'Error updating status')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to process request')
    }
  }

  const renderRmaStatusBadge = (status) => {
    const map = {
      ChoDuyet: { color: 'gold', text: 'PENDING REVIEW' },
      DaDuyet: { color: 'processing', text: 'RETURN APPROVED' },
      DaHoanTien: { color: 'green', text: 'REFUNDED' },
      TuChoi: { color: 'error', text: 'REJECTED' }
    }
    const item = map[status] || { color: 'default', text: status }
    return <Tag color={item.color}>{item.text}</Tag>
  }

  const rmaColumns = [
    { title: 'RMA Voucher', dataIndex: 'id', key: 'id', width: 120, render: (id) => `#RMA-${id}` },
    { title: 'Order ID', dataIndex: 'don_hang_id', key: 'don_hang_id', width: 120, render: (id) => `#${id}` },
    { title: 'Customer', dataIndex: 'ten_khach_hang', key: 'ten_khach_hang', width: 180, render: (t, r) => t || r.so_dien_thoai },
    { title: 'Return Reason', dataIndex: 'ly_do_tra', key: 'ly_do_tra', width: 280 },
    { 
      title: 'Order Value (₫)', 
      dataIndex: 'tong_tien_don_hang', 
      key: 'tong_tien_don_hang',
      width: 160,
      render: (val) => Number(val) > 0 ? `${Number(val).toLocaleString()} ₫` : 'N/A' 
    },
    { title: 'RMA Status', key: 'status', width: 160, render: (_, r) => renderRmaStatusBadge(r.trang_thai_duyet) },
    {
      title: 'Order Refund',
      key: 'refund',
      width: 170,
      render: (_, r) => (
        <div>
          {r.trang_thai_duyet === 'DaDuyet' && (
            <Popconfirm title="Confirm customer refund processing?" onConfirm={() => handleUpdateRmaStatus(r.id, 'DaHoanTien')}>
              <Button size="small" type="primary" icon={<DollarOutlined className="text-white" />} className="bg-emerald-600 hover:bg-emerald-500">
                Process Refund
              </Button>
            </Popconfirm>
          )}
          {r.trang_thai_duyet === 'DaHoanTien' && (
            <Tag color="green" icon={<CheckCircleOutlined />}>REFUNDED</Tag>
          )}
          {(r.trang_thai_duyet === 'ChoDuyet' || r.trang_thai_duyet === 'TuChoi') && (
            <span className="text-slate-400 text-xs">-</span>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 130,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewRmaDetail(r)} type="primary" ghost>
          Details
        </Button>
      )
    }
  ]

  const totalCount = rmas.length
  const pendingCount = rmas.filter(r => r.trang_thai_duyet === 'ChoDuyet').length
  const approvedCount = rmas.filter(r => r.trang_thai_duyet === 'DaDuyet').length
  const refundedCount = rmas.filter(r => r.trang_thai_duyet === 'DaHoanTien').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HistoryOutlined className="text-orange-600" /> Return Merchandise Authorization (RMA)
          </h1>
          <p className="text-sm text-slate-500">Receive, inspect return defect claims, and approve customer refunds</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchRmas(); }}>
          Refresh
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Total RMA Requests" value={totalCount} valueStyle={{ color: '#0284c7' }} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Pending Review" value={pendingCount} valueStyle={{ color: '#d97706' }} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Return Approved" value={approvedCount} valueStyle={{ color: '#2563eb' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <Statistic title="Refunds Completed" value={refundedCount} valueStyle={{ color: '#16a34a' }} prefix={<DollarOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Table & Filters */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <Space wrap>
            <span className="text-sm font-semibold text-slate-700">Approval Status:</span>
            <Select
              value={filterRmaStatus}
              onChange={setFilterRmaStatus}
              style={{ width: 180 }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Pending Review', value: 'ChoDuyet' },
                { label: 'Return Approved', value: 'DaDuyet' },
                { label: 'Refunded', value: 'DaHoanTien' },
                { label: 'Rejected', value: 'TuChoi' }
              ]}
            />
          </Space>
          <Input.Search
            placeholder="Search by Reason, Customer, Phone..."
            onSearch={(val) => { setSearch(val); fetchRmas(); }}
            style={{ width: 280 }}
            allowClear
          />
        </div>

        <Table
          dataSource={rmas}
          columns={rmaColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal Chi Tiết Phiếu Trả Hàng RMA & Phê Duyệt */}
      <Modal
        title={`RMA Return Request Details & Approval — #RMA-${rmaDetail?.id || ''}`}
        open={isRmaModalOpen}
        onCancel={() => { setIsRmaModalOpen(false); setRmaDetail(null); }}
        width={850}
        footer={
          rmaDetail && rmaDetail.trang_thai_duyet === 'ChoDuyet' ? (
            <div className="flex justify-end gap-2">
              <Popconfirm title="Reject this RMA return request?" onConfirm={() => handleUpdateRmaStatus(rmaDetail.id, 'TuChoi')}>
                <Button danger icon={<CloseCircleOutlined />}>Reject Request</Button>
              </Popconfirm>
              <Popconfirm title="Confirm approval of return request?" onConfirm={() => handleUpdateRmaStatus(rmaDetail.id, 'DaDuyet')}>
                <Button type="primary" icon={<CheckCircleOutlined />} className="bg-blue-600 hover:bg-blue-500">
                  Approve Return
                </Button>
              </Popconfirm>
            </div>
          ) : rmaDetail && rmaDetail.trang_thai_duyet === 'DaDuyet' ? (
            <div className="flex justify-end">
              <Popconfirm title="Confirm refund payout for this order?" onConfirm={() => handleUpdateRmaStatus(rmaDetail.id, 'DaHoanTien')}>
                <Button type="primary" icon={<DollarOutlined className="text-white" />} className="bg-emerald-600 hover:bg-emerald-500">
                  Confirm Refund Payout
                </Button>
              </Popconfirm>
            </div>
          ) : null
        }
      >
        {rmaDetail && (
          <div className="space-y-4">
            <Descriptions title="Return Voucher Summary" bordered column={2} size="small">
              <Descriptions.Item label="RMA Number"><strong>#RMA-{rmaDetail.id}</strong></Descriptions.Item>
              <Descriptions.Item label="Order ID"><strong>#{rmaDetail.don_hang_id}</strong></Descriptions.Item>
              <Descriptions.Item label="Customer">{rmaDetail.ten_khach_hang}</Descriptions.Item>
              <Descriptions.Item label="Phone Number">{rmaDetail.so_dien_thoai}</Descriptions.Item>
              <Descriptions.Item label="Requested At">{new Date(rmaDetail.ngay_yeu_cau).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status">{renderRmaStatusBadge(rmaDetail.trang_thai_duyet)}</Descriptions.Item>
              <Descriptions.Item label="Return Reason" span={2}>
                <span className="text-red-600 font-medium">{rmaDetail.ly_do_tra}</span>
              </Descriptions.Item>
            </Descriptions>

            <h3 className="font-bold text-slate-800 text-base mt-4">Registered Return Product Items</h3>
            <Table
              dataSource={rmaDetail.items || []}
              rowKey="id"
              loading={rmaLoading}
              pagination={false}
              columns={[
                { title: 'Product / Drug Name', dataIndex: 'ten_duoc_pham', key: 'ten_duoc_pham', render: (t, r) => <div><strong>{t || r.ten_thuong_mai}</strong><div className="text-xs text-slate-400">Code: {r.ma_duoc_pham || 'N/A'}</div></div> },
                { title: 'Return Qty', dataIndex: 'so_luong', key: 'so_luong', render: (v) => <span className="font-bold text-blue-600">{v}</span> },
                { title: 'Unit Price (₫)', dataIndex: 'gia_ban', key: 'gia_ban', render: (v) => `${Number(v || 0).toLocaleString()} ₫` },
                { title: 'Refund Subtotal (₫)', dataIndex: 'thanh_tien', key: 'thanh_tien', render: (v) => <strong className="text-rose-600">{Number(v || 0).toLocaleString()} ₫</strong> }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
