import React, { useState, useEffect } from 'react'
import { Table, Tabs, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Card, Space, Tooltip, Alert, Progress, Radio } from 'antd'
import { PlusOutlined, ShoppingCartOutlined, ShopOutlined, ReloadOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'
import { warehouseService } from '@/services/warehouse.service'
import { useAuth } from '@/store/authStore'
import { formatUnitType, getUnitTypeMeta } from '@/utils/formatters'

export default function ProcurementPage() {
  const { user: currentUser } = useAuth()
  const currentUserRole = currentUser?.role || currentUser?.vai_tro
  const userUnitId = currentUser?.don_vi_id ? Number(currentUser.don_vi_id) : null
  const canApprovePo = ['SuperAdmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'].includes(currentUserRole)

  const [activeTab, setActiveTab] = useState('1')
  const [poFilter, setPoFilter] = useState('all')
  const [suppliers, setSuppliers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [selectedPo, setSelectedPo] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [formSupplier] = Form.useForm()
  const [formPo] = Form.useForm()

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/admin/procurement/suppliers')
      if (res.data?.success) setSuppliers(res.data.data || [])
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/admin/procurement/orders')
      if (res.data?.success) setOrders(res.data.data || [])
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
  }, [])

  useEffect(() => {
    if (activeTab === '1') fetchOrders()
    else if (activeTab === '2') fetchSuppliers()
  }, [activeTab])

  useEffect(() => {
    if (isPoModalOpen && suppliers.length === 0) {
      fetchSuppliers()
    }
  }, [isPoModalOpen])

  const handleCreateSupplier = async (values) => {
    try {
      const res = await apiClient.post('/admin/procurement/suppliers', values)
      if (res.data?.success) {
        message.success('Supplier created successfully!')
        setIsSupplierModalOpen(false)
        formSupplier.resetFields()
        fetchSuppliers()
      } else {
        message.error(res.data?.message || 'Failed to create supplier')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Cannot connect to server')
    }
  }

  const handleCreatePo = async (values) => {
    try {
      const res = await apiClient.post('/admin/procurement/orders', values)
      if (res.data?.success) {
        message.success('Purchase Order (PO) created successfully!')
        setIsPoModalOpen(false)
        formPo.resetFields()
        fetchOrders()
      } else {
        message.error(res.data?.message || 'Failed to create Purchase Order')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Cannot connect to server')
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const res = await apiClient.get(`/admin/procurement/orders/${id}`)
      if (res.data?.success) {
        setSelectedPo(res.data.data)
        setIsDetailModalOpen(true)
      } else {
        message.error(res.data?.message || 'Failed to get purchase order details')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Cannot connect to server')
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await apiClient.patch(`/admin/procurement/orders/${id}/status`, { trang_thai: newStatus })
      if (res.data?.success) {
        message.success('Status updated successfully!')
        fetchOrders()
        if (selectedPo && selectedPo.id === id) {
          setSelectedPo({ ...selectedPo, trang_thai: newStatus })
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const renderStatusTag = (status) => {
    const statusMap = {
      ChoDuyet: { color: 'gold', text: 'Pending Approval' },
      DaDuyet: { color: 'blue', text: 'Approved' },
      DaNhapKho: { color: 'green', text: 'Stored in Warehouse' },
      DaHuy: { color: 'red', text: 'Cancelled' }
    }
    const st = statusMap[status] || { color: 'default', text: status }
    return <Tag color={st.color}>{st.text}</Tag>
  }

  const orderColumns = [
    { title: 'PO Number', dataIndex: 'ma_phieu_nhap', key: 'ma_phieu_nhap', render: (text) => <strong>{text}</strong> },
    { title: 'Supplier', dataIndex: 'ten_nha_cung_cap', key: 'ten_nha_cung_cap' },
    { title: 'Item Count', dataIndex: 'so_luong_mat_hang', key: 'so_luong_mat_hang', align: 'center' },
    { 
      title: 'Total Amount', 
      dataIndex: 'tong_tien', 
      key: 'tong_tien',
      render: (val) => `${Number(val || 0).toLocaleString()} ₫` 
    },
    {
      title: 'Delivery Progress',
      key: 'delivery_progress',
      align: 'center',
      render: (_, r) => {
        if (r.trang_thai === 'ChoDuyet') {
          return <Tag color="gold">Pending PO Approval</Tag>
        }
        if (r.trang_thai === 'DaHuy') {
          return <Tag color="default">Cancelled</Tag>
        }
        if (r.trang_thai === 'DaNhapKho') {
          return <Tag color="success">Received 100%</Tag>
        }
        if (r.so_luong_da_nhan > 0 || r.so_luong_dang_giao > 0) {
          const total = r.tong_so_luong_dat || 1
          const done = r.so_luong_da_nhan || 0
          const inTransit = r.so_luong_dang_giao || 0
          const percent = Math.min(100, Math.round((done / total) * 100))
          return (
            <div className="w-32 mx-auto">
              <div className="text-[11px] font-medium text-slate-600 mb-0.5">
                {done}/{total} boxes {inTransit > 0 ? `(${inTransit} in transit)` : ''}
              </div>
              <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
            </div>
          )
        }
        return <span className="text-slate-400 text-xs">Awaiting dispatch</span>
      }
    },
    { title: 'Status', dataIndex: 'trang_thai', key: 'trang_thai', render: renderStatusTag },
    { title: 'Created Date', dataIndex: 'created_at', key: 'created_at', render: (val) => new Date(val).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetail(record.id)}>Details</Button>
      )
    }
  ]

  const supplierColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Supplier Name', dataIndex: 'ten_don_vi', key: 'ten_don_vi', render: (text) => <strong>{text}</strong> },
    { 
      title: 'Facility Type', 
      dataIndex: 'loai_don_vi', 
      key: 'loai_don_vi', 
      render: (v) => {
        const meta = getUnitTypeMeta(v, 'en')
        return <Tag color={meta.color}>{meta.en || meta.vi}</Tag>
      } 
    },
    { title: 'Address', dataIndex: 'dia_chi', key: 'dia_chi', render: (text) => text || 'Not updated' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCartOutlined className="text-brand-600" /> Procurement & Supplier Management (PO)
          </h1>
          <p className="text-sm text-slate-500">Manage purchase orders (PO) and pharmaceutical suppliers directory</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={activeTab === '1' ? fetchOrders : fetchSuppliers}>Reload</Button>
          {activeTab === '1' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPoModalOpen(true)}>
              Create Purchase Order (PO)
            </Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSupplierModalOpen(true)}>
              Add Supplier
            </Button>
          )}
        </Space>
      </div>

      <Card className="rounded-xl shadow-sm border border-slate-100">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: (
                <span>
                  <ShoppingCartOutlined /> Purchase Orders (PO)
                </span>
              ),
              children: (
                <Table
                  dataSource={orders}
                  columns={orderColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: '2',
              label: (
                <span>
                  <ShopOutlined /> Supplier Directory
                </span>
              ),
              children: (
                <Table
                  dataSource={suppliers}
                  columns={supplierColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>

      {/* Modal Add Supplier */}
      <Modal
        title="Add New Supplier"
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        onOk={() => formSupplier.submit()}
      >
        <Form form={formSupplier} layout="vertical" onFinish={handleCreateSupplier}>
          <Form.Item name="ten_don_vi" label="Supplier Name" rules={[{ required: true, message: 'Please enter supplier name' }]}>
            <Input placeholder="e.g. DHG Pharmaceutical JSC" />
          </Form.Item>
          <Form.Item name="loai_don_vi" label="Facility Type" initialValue="NhaPhanPhoi">
            <Select options={[
              { label: 'Distributor / Wholesale', value: 'NhaPhanPhoi' },
              { label: 'Manufacturing Factory', value: 'NhaMay' }
            ]} />
          </Form.Item>
          <Form.Item name="dia_chi" label="Address">
            <Input.TextArea rows={2} placeholder="Enter supplier address" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Create PO */}
      <Modal
        title="Create Purchase Order (PO)"
        open={isPoModalOpen}
        onCancel={() => setIsPoModalOpen(false)}
        onOk={() => formPo.submit()}
        width={700}
      >
        <Form form={formPo} layout="vertical" onFinish={handleCreatePo}>
          <Form.Item name="nha_cung_cap_id" label="Supplier" rules={[{ required: true, message: 'Please select a supplier' }]}>
            <Select
              placeholder="Select supplier"
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={suppliers
                .filter(s => !userUnitId || Number(s.id) !== Number(userUnitId))
                .map(s => ({
                  label: `${s.ten_don_vi} (${s.loai_don_vi === 'NhaMay' ? 'Factory' : 'Distributor / Warehouse'})`,
                  value: s.id
                }))}
            />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Notes">
            <Input.TextArea placeholder="Notes regarding this purchase order batch..." rows={2} />
          </Form.Item>

          <Form.List name="items" initialValue={[{ duoc_pham_id: undefined, so_luong: 100, don_gia: 10000 }]}>
            {(fields, { add, remove }) => (
              <>
                <div className="font-semibold text-slate-700 mb-2">Item Details:</div>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'duoc_pham_id']}
                      rules={[{ required: true, message: 'Enter product ID' }]}
                    >
                      <InputNumber placeholder="Product ID (e.g. 991)" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'so_luong']}
                      rules={[{ required: true, message: 'Quantity' }]}
                    >
                      <InputNumber placeholder="Quantity" min={1} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'don_gia']}
                      rules={[{ required: true, message: 'Unit Price' }]}
                    >
                      <InputNumber placeholder="Unit Price (₫)" min={0} style={{ width: 140 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(name)}>
                        Remove
                      </Button>
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Line Item
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal Purchase Order Details */}
      <Modal
        title={`Purchase Order Details: ${selectedPo?.ma_phieu_nhap || ''}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          canApprovePo && selectedPo?.trang_thai === 'ChoDuyet' && (
            <Button key="approve" type="primary" onClick={() => handleUpdateStatus(selectedPo.id, 'DaDuyet')}>
              Approve PO
            </Button>
          ),
          canApprovePo && selectedPo?.trang_thai === 'DaDuyet' && (() => {
            const isInternal = Boolean(selectedPo.is_internal_supplier)
            const totalQty = Number(selectedPo.tong_so_luong_dat || 0)
            const receivedQty = Number(selectedPo.so_luong_da_nhan || 0)
            const isFullyReceived = receivedQty >= totalQty && totalQty > 0
            const isDisabled = isInternal ? !isFullyReceived : false

            let tooltipText = ''
            if (isInternal && !isFullyReceived) {
              if (selectedPo.is_in_transit) {
                tooltipText = `Incomplete receipt (${receivedQty}/${totalQty} boxes). Please click 'Confirm Batch Receipt' for shipments in the table above!`
              } else {
                tooltipText = 'Awaiting origin warehouse to dispatch shipment before stock inbound can be confirmed!'
              }
            }

            return (
              <Tooltip key="inbound-tooltip" title={tooltipText}>
                <Button
                  key="inbound"
                  type="primary"
                  disabled={isDisabled}
                  style={{
                    backgroundColor: isDisabled ? '#d1d5db' : '#10b981',
                    borderColor: isDisabled ? '#d1d5db' : '#10b981',
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => handleUpdateStatus(selectedPo.id, 'DaNhapKho')}
                >
                  Confirm Stock Inbound
                </Button>
              </Tooltip>
            )
          })(),
          canApprovePo && selectedPo?.trang_thai !== 'DaHuy' && selectedPo?.trang_thai !== 'DaNhapKho' && (
            <Button key="cancel" danger onClick={() => handleUpdateStatus(selectedPo.id, 'DaHuy')}>
              Cancel PO
            </Button>
          ),
          !canApprovePo && (
            <span key="no-perm" className="text-xs text-amber-700 font-medium mr-3 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg inline-block">
              ⚠️ Permission: Only Store Managers and SuperAdmins can approve or cancel POs
            </span>
          ),
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
        ]}
        width={750}
      >
        {selectedPo && (
          <div className="space-y-4">
            {selectedPo.is_internal_supplier && !selectedPo.is_in_transit && selectedPo.trang_thai === 'DaDuyet' && Number(selectedPo.so_luong_da_nhan || 0) === 0 && (
              <Alert
                type="warning"
                showIcon
                message="Shipment Pending Dispatch"
                description="This purchase order originates from an internal facility. Origin warehouse must create a stock transfer order (dispatch shipment) before inbound receipt can be confirmed."
                className="rounded-lg font-medium"
              />
            )}

            {selectedPo.is_in_transit && selectedPo.trang_thai === 'DaDuyet' && (
              <Alert
                type="info"
                showIcon
                message="Order Dispatched in Multiple Shipments"
                description="Origin warehouse has dispatched shipments. Review shipment batches below and click 'Confirm Batch Receipt' directly to receive each batch into inventory."
                className="rounded-lg font-medium"
              />
            )}

            {(selectedPo.trang_thai === 'DaNhapKho' || (selectedPo.trang_thai === 'DaDuyet' && Number(selectedPo.so_luong_da_nhan || 0) >= Number(selectedPo.tong_so_luong_dat || 0) && Number(selectedPo.tong_so_luong_dat || 0) > 0)) && (
              <Alert
                type="success"
                showIcon
                message="100% Order Items Received"
                description="All inbound shipment batches have been received and stored in warehouse successfully!"
                className="rounded-lg font-medium"
              />
            )}
            {/* Progress Bar Card */}
            {selectedPo.trang_thai !== 'ChoDuyet' && selectedPo.trang_thai !== 'DaHuy' && (selectedPo.tong_so_luong_dat > 0 || selectedPo.so_luong_da_nhan > 0 || selectedPo.so_luong_dang_giao > 0) && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    Receiving Progress:
                  </span>
                  <span className="text-emerald-700 font-mono text-sm">
                    {selectedPo.trang_thai === 'DaNhapKho'
                      ? `${selectedPo.tong_so_luong_dat || selectedPo.so_luong_da_nhan || 0} / ${selectedPo.tong_so_luong_dat || selectedPo.so_luong_da_nhan || 0} Boxes (100% Received)`
                      : `${selectedPo.so_luong_da_nhan || 0} / ${selectedPo.tong_so_luong_dat || 0} Boxes Received ${selectedPo.so_luong_dang_giao ? `(${selectedPo.so_luong_dang_giao} boxes in transit)` : ''}`}
                  </span>
                </div>
                <Progress 
                  percent={
                    selectedPo.trang_thai === 'DaNhapKho' 
                      ? 100 
                      : Math.min(100, Math.round(((selectedPo.so_luong_da_nhan || 0) / (selectedPo.tong_so_luong_dat || 1)) * 100))
                  } 
                  status={selectedPo.trang_thai === 'DaNhapKho' ? 'success' : 'active'}
                  strokeColor={{ '0%': '#10b981', '100%': '#3b82f6' }}
                />
              </div>
            )}

            {/* Inbound Shipment Batches */}
            {selectedPo.trang_thai !== 'ChoDuyet' && selectedPo.trang_thai !== 'DaHuy' && selectedPo.shipments && selectedPo.shipments.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    Shipment Batches ({selectedPo.shipments.length} batches)
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedPo.shipments.map((ship, idx) => {
                    const isDone = ship.trang_thai === 'HoanThanh' || (typeof ship.trang_thai === 'string' && ship.trang_thai.startsWith('HoanThanh')) || selectedPo.trang_thai === 'DaNhapKho';
                    const isPending = !isDone && (ship.trang_thai === 'DangVanChuyen' || (typeof ship.trang_thai === 'string' && ship.trang_thai.startsWith('DangVanChuyen')));
                    const batchIndex = selectedPo.shipments.length - idx;
                    return (
                      <div key={ship.id || idx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-brand-300 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              Batch #{batchIndex} — {ship.so_luong_hop} Boxes
                            </span>
                            {isPending && <Tag color="processing">In Transit</Tag>}
                            {isDone && <Tag color="success">Stored in Warehouse</Tag>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>Product: <strong>{ship.ten_duoc_pham || 'Medication'}</strong></span>
                            <span>•</span>
                            <span>Batch: <strong>{ship.so_lo || 'N/A'}</strong></span>
                            {Number(ship.don_gia) > 0 && (
                              <>
                                <span>•</span>
                                <span>Unit Price: <strong>{Number(ship.don_gia).toLocaleString()} ₫</strong></span>
                                <span>•</span>
                                <span>Total Value: <strong className="text-emerald-700">{Number(ship.tong_tien || (ship.don_gia * ship.so_luong_hop)).toLocaleString()} ₫</strong></span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(ship.thoi_gian).toLocaleTimeString()} {new Date(ship.thoi_gian).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div>
                          {isPending && (
                            <Button
                              type="primary"
                              size="small"
                              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                              onClick={async () => {
                                try {
                                  await warehouseService.confirmTransferReceipt({
                                    tu_don_vi_id: ship.tu_don_vi_id,
                                    den_don_vi_id: ship.den_don_vi_id,
                                    mang_uid: ship.mang_uid
                                  })
                                  message.success(`Confirmed batch #${batchIndex} (${ship.so_luong_hop} boxes) receipt successfully!`)
                                  
                                  // Refresh detail view
                                  const updatedPoRes = await apiClient.get(`/admin/procurement/orders/${selectedPo.id}`)
                                  const updatedPo = updatedPoRes.data?.data
                                  if (updatedPo) {
                                    // Auto complete PO if all items received
                                    if (Number(updatedPo.so_luong_da_nhan || 0) >= Number(updatedPo.tong_so_luong_dat || 0) && updatedPo.trang_thai === 'DaDuyet') {
                                      await handleUpdateStatus(selectedPo.id, 'DaNhapKho')
                                      const finalPoRes = await apiClient.get(`/admin/procurement/orders/${selectedPo.id}`)
                                      setSelectedPo(finalPoRes.data?.data || { ...updatedPo, trang_thai: 'DaNhapKho' })
                                    } else {
                                      setSelectedPo(updatedPo)
                                    }
                                  }
                                  fetchOrders()
                                } catch (err) {
                                  message.error(err.response?.data?.message || 'Failed to confirm batch receipt')
                                }
                              }}
                            >
                              ✔ Confirm Batch Receipt ({ship.so_luong_hop} Boxes)
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-sm">
              <div><strong>Supplier:</strong> {selectedPo.ten_nha_cung_cap}</div>
              <div><strong>Status:</strong> {renderStatusTag(selectedPo.trang_thai)}</div>
              <div><strong>Total Amount:</strong> {Number(selectedPo.tong_tien).toLocaleString()} ₫</div>
              <div><strong>Created Date:</strong> {new Date(selectedPo.created_at).toLocaleString()}</div>
              <div className="col-span-2"><strong>Notes:</strong> {selectedPo.ghi_chu || 'None'}</div>
            </div>

            <Table
              dataSource={selectedPo.chi_tiet || []}
              columns={[
                { title: 'Product Name', dataIndex: 'ten_thuoc', key: 'ten_thuoc', render: (t, r) => t || `ID: ${r.duoc_pham_id}` },
                { title: 'Quantity', dataIndex: 'so_luong', key: 'so_luong', align: 'center' },
                { title: 'Unit Price', dataIndex: 'don_gia', key: 'don_gia', render: (v) => `${Number(v).toLocaleString()} ₫` },
                { title: 'Total Value', dataIndex: 'thanh_tien', key: 'thanh_tien', render: (v) => <strong>{Number(v).toLocaleString()} ₫</strong> }
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
