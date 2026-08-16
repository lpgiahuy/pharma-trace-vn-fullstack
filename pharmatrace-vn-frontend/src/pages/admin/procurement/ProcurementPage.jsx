import React, { useState, useEffect } from 'react'
import { Table, Tabs, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Card, Space, Tooltip, Alert } from 'antd'
import { PlusOutlined, ShoppingCartOutlined, ShopOutlined, ReloadOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'
import { useAuthStore } from '@/store/authStore'

export default function ProcurementPage() {
  const { user: currentUser } = useAuthStore()
  const currentUserRole = currentUser?.role || currentUser?.vai_tro
  const canApprovePo = ['SuperAdmin', 'Admin', 'admin', 'QuanLyCuaHang', 'QuanLyKho'].includes(currentUserRole)

  const [activeTab, setActiveTab] = useState('1')
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
      const payload = {
        nha_cung_cap_id: values.nha_cung_cap_id,
        ghi_chu: values.ghi_chu,
        items: values.items || []
      }
      const res = await apiClient.post('/admin/procurement/orders', payload)
      if (res.data?.success) {
        message.success('Tạo phiếu nhập thành công!')
        setIsPoModalOpen(false)
        formPo.resetFields()
        fetchOrders()
      } else {
        message.error(res.data?.message || 'Lỗi tạo phiếu nhập')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể gửi yêu cầu')
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const res = await apiClient.get(`/admin/procurement/orders/${id}`)
      if (res.data?.success) {
        setSelectedPo(res.data.data)
        setIsDetailModalOpen(true)
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi tải chi tiết đơn hàng')
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
              options={suppliers.map(s => ({ label: s.ten_don_vi, value: s.id }))}
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
          canApprovePo && selectedPo?.trang_thai === 'DaDuyet' && (
            <Tooltip
              key="inbound-tooltip"
              title={
                selectedPo.is_internal_supplier && !selectedPo.is_in_transit
                  ? 'Đang chờ Kho xuất phát lệnh vận chuyển hàng đi mới được xác nhận nhập kho!'
                  : ''
              }
            >
              <Button
                key="inbound"
                type="primary"
                disabled={selectedPo.is_internal_supplier && !selectedPo.is_in_transit}
                style={{
                  backgroundColor: selectedPo.is_internal_supplier && !selectedPo.is_in_transit ? '#d1d5db' : '#10b981',
                  borderColor: selectedPo.is_internal_supplier && !selectedPo.is_in_transit ? '#d1d5db' : '#10b981'
                }}
                onClick={() => handleUpdateStatus(selectedPo.id, 'DaNhapKho')}
              >
                Xác Nhận Nhập Kho
              </Button>
            </Tooltip>
          ),
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
            {selectedPo.is_internal_supplier && !selectedPo.is_in_transit && selectedPo.trang_thai === 'DaDuyet' && (
              <Alert
                type="warning"
                showIcon
                message="Hàng chưa được phát lệnh vận chuyển"
                description="Phiếu nhập hàng này đến từ đơn vị nội bộ. Bạn cần chờ Kho gửi tạo Lệnh Chuyển Kho (phát lệnh vận chuyển) trước khi có thể bấm Xác Nhận Nhập Kho."
                className="rounded-lg font-medium"
              />
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
