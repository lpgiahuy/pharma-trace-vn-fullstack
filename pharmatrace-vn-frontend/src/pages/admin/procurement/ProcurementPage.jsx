import React, { useState, useEffect } from 'react'
import { Table, Tabs, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Card, Space, Tooltip, Alert, Progress, Radio } from 'antd'
import { PlusOutlined, ShoppingCartOutlined, ShopOutlined, ReloadOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'
import { warehouseService } from '@/services/warehouse.service'
import { useAuth } from '@/store/authStore'

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
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách nhà cung cấp')
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
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách phiếu nhập')
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
        message.success('Tạo nhà cung cấp thành công!')
        setIsSupplierModalOpen(false)
        formSupplier.resetFields()
        fetchSuppliers()
      } else {
        message.error(res.data?.message || 'Lỗi khi tạo nhà cung cấp')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối đến máy chủ')
    }
  }

  const handleCreatePo = async (values) => {
    try {
      const res = await apiClient.post('/admin/procurement/orders', values)
      if (res.data?.success) {
        message.success('Tạo phiếu đặt hàng PO thành công!')
        setIsPoModalOpen(false)
        formPo.resetFields()
        fetchOrders()
      } else {
        message.error(res.data?.message || 'Lỗi khi tạo phiếu đặt hàng PO')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối đến máy chủ')
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const res = await apiClient.get(`/admin/procurement/orders/${id}`)
      if (res.data?.success) {
        setSelectedPo(res.data.data)
        setIsDetailModalOpen(true)
      } else {
        message.error(res.data?.message || 'Lỗi khi lấy chi tiết đơn hàng')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể kết nối đến máy chủ')
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await apiClient.patch(`/admin/procurement/orders/${id}/status`, { trang_thai: newStatus })
      if (res.data?.success) {
        message.success('Cập nhật trạng thái thành công!')
        fetchOrders()
        if (selectedPo && selectedPo.id === id) {
          setSelectedPo({ ...selectedPo, trang_thai: newStatus })
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
    }
  }

  const renderStatusTag = (status) => {
    const statusMap = {
      ChoDuyet: { color: 'gold', text: 'Chờ duyệt' },
      DaDuyet: { color: 'blue', text: 'Đã duyệt' },
      DaNhapKho: { color: 'green', text: 'Đã nhập kho' },
      DaHuy: { color: 'red', text: 'Đã hủy' }
    }
    const st = statusMap[status] || { color: 'default', text: status }
    return <Tag color={st.color}>{st.text}</Tag>
  }

  const orderColumns = [
    { title: 'Mã Phiếu', dataIndex: 'ma_phieu_nhap', key: 'ma_phieu_nhap', render: (text) => <strong>{text}</strong> },
    { title: 'Nhà Cung Cấp', dataIndex: 'ten_nha_cung_cap', key: 'ten_nha_cung_cap' },
    { title: 'Số Mặt Hàng', dataIndex: 'so_luong_mat_hang', key: 'so_luong_mat_hang', align: 'center' },
    { 
      title: 'Tổng Tiền', 
      dataIndex: 'tong_tien', 
      key: 'tong_tien',
      render: (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫` 
    },
    {
      title: 'Tiến Độ Giao',
      key: 'delivery_progress',
      align: 'center',
      render: (_, r) => {
        if (r.trang_thai === 'ChoDuyet') {
          return <Tag color="gold">Chờ duyệt PO</Tag>
        }
        if (r.trang_thai === 'DaHuy') {
          return <Tag color="default">Đã hủy</Tag>
        }
        if (r.trang_thai === 'DaNhapKho') {
          return <Tag color="success">Đã nhận 100%</Tag>
        }
        if (r.so_luong_da_nhan > 0 || r.so_luong_dang_giao > 0) {
          const total = r.tong_so_luong_dat || 1
          const done = r.so_luong_da_nhan || 0
          const inTransit = r.so_luong_dang_giao || 0
          const percent = Math.min(100, Math.round((done / total) * 100))
          return (
            <div className="w-32 mx-auto">
              <div className="text-[11px] font-medium text-slate-600 mb-0.5">
                {done}/{total} hộp {inTransit > 0 ? `(${inTransit} đang đi)` : ''}
              </div>
              <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
            </div>
          )
        }
        return <span className="text-slate-400 text-xs">Chờ phát hàng</span>
      }
    },
    { title: 'Trạng Thái', dataIndex: 'trang_thai', key: 'trang_thai', render: renderStatusTag },
    { title: 'Ngày Tạo', dataIndex: 'created_at', key: 'created_at', render: (val) => new Date(val).toLocaleDateString('vi-VN') },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetail(record.id)}>Chi tiết</Button>
      )
    }
  ]

  const supplierColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên Nhà Cung Cấp', dataIndex: 'ten_don_vi', key: 'ten_don_vi', render: (text) => <strong>{text}</strong> },
    { title: 'Loại', dataIndex: 'loai_don_vi', key: 'loai_don_vi', render: (v) => <Tag color="cyan">{v}</Tag> },
    { title: 'Địa Chỉ', dataIndex: 'dia_chi', key: 'dia_chi', render: (text) => text || 'Chưa cập nhật' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCartOutlined className="text-brand-600" /> Quản Lý Mua Hàng & Nhà Cung Cấp (PO)
          </h1>
          <p className="text-sm text-slate-500">Quản lý các Đơn mua hàng PO và danh mục Nhà cung cấp dược phẩm</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={activeTab === '1' ? fetchOrders : fetchSuppliers}>Tải lại</Button>
          {activeTab === '1' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPoModalOpen(true)}>
              Tạo Phiếu Nhập PO
            </Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSupplierModalOpen(true)}>
              Thêm Nhà Cung Cấp
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
                  <ShoppingCartOutlined /> Phiếu Nhập Hàng (PO)
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
                  <ShopOutlined /> Danh Sách Nhà Cung Cấp
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

      {/* Modal Thêm Nhà Cung Cấp */}
      <Modal
        title="Thêm Nhà Cung Cấp Mới"
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        onOk={() => formSupplier.submit()}
      >
        <Form form={formSupplier} layout="vertical" onFinish={handleCreateSupplier}>
          <Form.Item name="ten_don_vi" label="Tên Nhà Cung Cấp" rules={[{ required: true, message: 'Nhập tên NCC' }]}>
            <Input placeholder="Ví dụ: Công ty Dược phẩm Hậu Giang" />
          </Form.Item>
          <Form.Item name="loai_don_vi" label="Loại Đơn Vị" initialValue="NhaPhanPhoi">
            <Select options={[
              { label: 'Nhà Phân Phối', value: 'NhaPhanPhoi' },
              { label: 'Nhà Máy Sản Xuất', value: 'NhaMay' }
            ]} />
          </Form.Item>
          <Form.Item name="dia_chi" label="Địa Chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ nhà cung cấp" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Tạo Phiếu Nhập PO */}
      <Modal
        title="Tạo Phiếu Nhập Hàng (PO)"
        open={isPoModalOpen}
        onCancel={() => setIsPoModalOpen(false)}
        onOk={() => formPo.submit()}
        width={700}
      >
        <Form form={formPo} layout="vertical" onFinish={handleCreatePo}>
          <Form.Item name="nha_cung_cap_id" label="Nhà Cung Cấp" rules={[{ required: true, message: 'Chọn Nhà cung cấp' }]}>
            <Select
              placeholder="Chọn nhà cung cấp"
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={suppliers
                .filter(s => !userUnitId || Number(s.id) !== Number(userUnitId))
                .map(s => ({
                  label: `${s.ten_don_vi} (${s.loai_don_vi === 'NhaMay' ? 'Nhà Máy' : 'Kho / NPP'})`,
                  value: s.id
                }))}
            />
          </Form.Item>
          <Form.Item name="ghi_chu" label="Ghi Chú">
            <Input.TextArea placeholder="Ghi chú về lô hàng nhập..." rows={2} />
          </Form.Item>

          <Form.List name="items" initialValue={[{ duoc_pham_id: undefined, so_luong: 100, don_gia: 10000 }]}>
            {(fields, { add, remove }) => (
              <>
                <div className="font-semibold text-slate-700 mb-2">Chi Tiết Mặt Hàng:</div>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'duoc_pham_id']}
                      rules={[{ required: true, message: 'Nhập ID sản phẩm' }]}
                    >
                      <InputNumber placeholder="ID Dược Phẩm (VD: 991)" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'so_luong']}
                      rules={[{ required: true, message: 'Số lượng' }]}
                    >
                      <InputNumber placeholder="Số lượng" min={1} style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'don_gia']}
                      rules={[{ required: true, message: 'Đơn giá' }]}
                    >
                      <InputNumber placeholder="Đơn giá (₫)" min={0} style={{ width: 140 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(name)}>
                        Xóa
                      </Button>
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Thêm Mặt Hàng
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* Modal Chi Tiết Phiếu Nhập */}
      <Modal
        title={`Chi Tiết Phiếu Nhập: ${selectedPo?.ma_phieu_nhap || ''}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          canApprovePo && selectedPo?.trang_thai === 'ChoDuyet' && (
            <Button key="approve" type="primary" onClick={() => handleUpdateStatus(selectedPo.id, 'DaDuyet')}>
              Duyệt Phiếu
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
                tooltipText = `Chưa nhận đủ hàng (${receivedQty}/${totalQty} hộp). Vui lòng bấm 'Xác Nhận Nhận Đợt Này' cho các đợt vận chuyển ở bảng bên trên!`
              } else {
                tooltipText = 'Đang chờ Kho xuất phát lệnh vận chuyển hàng đi mới được xác nhận nhập kho!'
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
                  Xác Nhận Nhập Kho
                </Button>
              </Tooltip>
            )
          })(),
          canApprovePo && selectedPo?.trang_thai !== 'DaHuy' && selectedPo?.trang_thai !== 'DaNhapKho' && (
            <Button key="cancel" danger onClick={() => handleUpdateStatus(selectedPo.id, 'DaHuy')}>
              Hủy Phiếu
            </Button>
          ),
          !canApprovePo && (
            <span key="no-perm" className="text-xs text-amber-700 font-medium mr-3 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg inline-block">
              ⚠️ Quyền hạn: Chỉ Quản Lý Cửa Hàng / SuperAdmin mới được duyệt hoặc hủy phiếu PO
            </span>
          ),
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>
        ]}
        width={750}
      >
        {selectedPo && (
          <div className="space-y-4">
            {selectedPo.is_internal_supplier && !selectedPo.is_in_transit && selectedPo.trang_thai === 'DaDuyet' && Number(selectedPo.so_luong_da_nhan || 0) === 0 && (
              <Alert
                type="warning"
                showIcon
                message="Hàng chưa được phát lệnh vận chuyển"
                description="Phiếu nhập hàng này đến từ đơn vị nội bộ. Bạn cần chờ Kho gửi tạo Lệnh Chuyển Kho (phát lệnh vận chuyển) trước khi có thể bấm Xác Nhận Nhập Kho."
                className="rounded-lg font-medium"
              />
            )}

            {selectedPo.is_in_transit && selectedPo.trang_thai === 'DaDuyet' && (
              <Alert
                type="info"
                showIcon
                message="Đơn hàng đang được vận chuyển theo từng đợt"
                description="Kho xuất đã phát lệnh giao hàng. Bạn có thể kiểm tra danh sách từng đợt giao và bấm 'Xác Nhận Nhận Đợt Này' trực tiếp ở bảng bên dưới để nhập kho từng đợt."
                className="rounded-lg font-medium"
              />
            )}

            {(selectedPo.trang_thai === 'DaNhapKho' || (selectedPo.trang_thai === 'DaDuyet' && Number(selectedPo.so_luong_da_nhan || 0) >= Number(selectedPo.tong_so_luong_dat || 0) && Number(selectedPo.tong_so_luong_dat || 0) > 0)) && (
              <Alert
                type="success"
                showIcon
                message="Đã nhận đủ 100% số lượng của đơn hàng"
                description="Toàn bộ các đợt vận chuyển đã được tiếp nhận và lưu kho thành công!"
                className="rounded-lg font-medium"
              />
            )}
            {/* Progress Bar Card */}
            {selectedPo.trang_thai !== 'ChoDuyet' && selectedPo.trang_thai !== 'DaHuy' && (selectedPo.tong_so_luong_dat > 0 || selectedPo.so_luong_da_nhan > 0 || selectedPo.so_luong_dang_giao > 0) && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                    Tiến Độ Nhận Hàng:
                  </span>
                  <span className="text-emerald-700 font-mono text-sm">
                    {selectedPo.trang_thai === 'DaNhapKho'
                      ? `${selectedPo.tong_so_luong_dat || selectedPo.so_luong_da_nhan || 0} / ${selectedPo.tong_so_luong_dat || selectedPo.so_luong_da_nhan || 0} Hộp (Đã nhận 100%)`
                      : `${selectedPo.so_luong_da_nhan || 0} / ${selectedPo.tong_so_luong_dat || 0} Hộp Đã Nhận ${selectedPo.so_luong_dang_giao ? `(${selectedPo.so_luong_dang_giao} hộp đang vận chuyển)` : ''}`}
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

            {/* Danh Sách Các Đợt Vận Chuyển */}
            {selectedPo.trang_thai !== 'ChoDuyet' && selectedPo.trang_thai !== 'DaHuy' && selectedPo.shipments && selectedPo.shipments.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    Các Đợt Vận Chuyển ({selectedPo.shipments.length} đợt)
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
                              Đợt #{batchIndex} — {ship.so_luong_hop} Hộp
                            </span>
                            {isPending && <Tag color="processing">Đang vận chuyển</Tag>}
                            {isDone && <Tag color="success">Đã nhận kho</Tag>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>Sản phẩm: <strong>{ship.ten_duoc_pham || 'Dược phẩm'}</strong></span>
                            <span>•</span>
                            <span>Lô: <strong>{ship.so_lo || 'N/A'}</strong></span>
                            {Number(ship.don_gia) > 0 && (
                              <>
                                <span>•</span>
                                <span>Đơn giá: <strong>{Number(ship.don_gia).toLocaleString('vi-VN')} ₫</strong></span>
                                <span>•</span>
                                <span>Thành tiền: <strong className="text-emerald-700">{Number(ship.tong_tien || (ship.don_gia * ship.so_luong_hop)).toLocaleString('vi-VN')} ₫</strong></span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(ship.thoi_gian).toLocaleTimeString('vi-VN')} {new Date(ship.thoi_gian).toLocaleDateString('vi-VN')}</span>
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
                                  message.success(`Đã xác nhận nhận đợt ${batchIndex} (${ship.so_luong_hop} hộp) thành công!`)
                                  
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
                                  message.error(err.response?.data?.message || 'Xác nhận đợt nhập hàng thất bại')
                                }
                              }}
                            >
                              ✔ Xác Nhận Nhận Đợt Này ({ship.so_luong_hop} Hộp)
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
              <div><strong>Nhà cung cấp:</strong> {selectedPo.ten_nha_cung_cap}</div>
              <div><strong>Trạng thái:</strong> {renderStatusTag(selectedPo.trang_thai)}</div>
              <div><strong>Tổng tiền:</strong> {Number(selectedPo.tong_tien).toLocaleString('vi-VN')} ₫</div>
              <div><strong>Ngày tạo:</strong> {new Date(selectedPo.created_at).toLocaleString('vi-VN')}</div>
              <div className="col-span-2"><strong>Ghi chú:</strong> {selectedPo.ghi_chu || 'Không có'}</div>
            </div>

            <Table
              dataSource={selectedPo.chi_tiet || []}
              columns={[
                { title: 'Tên Dược Phẩm', dataIndex: 'ten_thuoc', key: 'ten_thuoc', render: (t, r) => t || `ID: ${r.duoc_pham_id}` },
                { title: 'Số Lượng', dataIndex: 'so_luong', key: 'so_luong', align: 'center' },
                { title: 'Đơn Giá', dataIndex: 'don_gia', key: 'don_gia', render: (v) => `${Number(v).toLocaleString('vi-VN')} ₫` },
                { title: 'Thành Tiền', dataIndex: 'thanh_tien', key: 'thanh_tien', render: (v) => <strong>{Number(v).toLocaleString('vi-VN')} ₫</strong> }
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
