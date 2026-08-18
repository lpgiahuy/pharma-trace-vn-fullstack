import { useState, useEffect } from 'react'
import { Form, InputNumber, Select, Button as AButton, Card, Table, Tag, Alert, Modal, Descriptions, Popconfirm } from 'antd'
import { SwapOutlined, EyeOutlined, CheckCircleOutlined, CarOutlined, CloseCircleOutlined, SendOutlined, ShopOutlined, MedicineBoxOutlined, BarcodeOutlined, UnorderedListOutlined, DollarOutlined, DollarCircleOutlined, FileTextOutlined, HistoryOutlined, RocketOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import apiClient from '@/services/apiClient'
import { useAuth } from '@/store/authStore'
import { formatDateTime, formatDate } from '@/utils'
import toast from 'react-hot-toast'

export default function TransferPage() {
  const { user } = useAuth()
  const sourceUnitId = user?.don_vi_id ? Number(user.don_vi_id) : null

  const [form] = Form.useForm()
  const watchQty = Form.useWatch('so_luong', form)
  const watchPrice = Form.useWatch('don_gia', form)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [units, setUnits] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const fetchHistory = async () => {
    if (!sourceUnitId) return
    setLoadingHistory(true)
    try {
      const data = await warehouseService.getTransferHistory({ tu_don_vi_id: sourceUnitId })
      setHistory(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const refreshPOs = () => {
    warehouseService.getPurchaseOrders('supplier')
      .then(res => {
        const list = (res || []).filter(po => {
          if (po.trang_thai !== 'DaDuyet') return false
          if (sourceUnitId && Number(po.nha_cung_cap_id) !== Number(sourceUnitId)) return false
          const total = Number(po.tong_so_luong_dat || 0)
          const received = Number(po.so_luong_da_nhan || 0)
          const inTransit = Number(po.so_luong_dang_giao || 0)
          const remainingToShip = total - received - inTransit
          return remainingToShip > 0
        })
        setPurchaseOrders(list)
      })
      .catch(() => {})
  }

  useEffect(() => {
    warehouseService.getUnits().then(setUnits).catch(() => { })
    fetchHistory()
    refreshPOs()
  }, [sourceUnitId])

  // Load medicines available in the staff's unit when the page mounts
  useEffect(() => {
    if (!sourceUnitId) return
    setLoadingProducts(true)
    warehouseService.getProductsInUnit(sourceUnitId)
      .then(setProducts)
      .catch(() => toast.error('Không thể tải danh sách thuốc'))
      .finally(() => setLoadingProducts(false))
  }, [sourceUnitId])

  const handleProductChange = async (duocPhamId) => {
    form.setFieldsValue({ lo_thuoc_id: undefined, so_luong: undefined })
    setBatches([])
    setSelectedBatch(null)
    if (!duocPhamId) return
    setLoadingBatches(true)
    try {
      const data = await warehouseService.getBatchesInUnit(sourceUnitId, duocPhamId)
      setBatches(data)
    } catch { toast.error('Không thể tải danh sách lô') }
    finally { setLoadingBatches(false) }
  }

  const handleBatchChange = (loThuocId) => {
    const batch = batches.find(b => b.id === loThuocId)
    setSelectedBatch(batch || null)
    form.setFieldsValue({ so_luong: undefined })
  }

  const handleTransfer = async (vals) => {
    const { den_don_vi_id, lo_thuoc_id, so_luong, don_gia, ly_do, po_code } = vals
    if (sourceUnitId === den_don_vi_id) {
      toast.error('Đơn vị nguồn và đích không được trùng nhau')
      return
    }
    setLoading(true)
    try {
      const mang_uid = await warehouseService.getUIDsForTransfer(sourceUnitId, lo_thuoc_id, so_luong)
      if (!mang_uid.length) {
        toast.error('Không tìm thấy hộp thuốc phù hợp để chuyển')
        return
      }
      await warehouseService.transferStock({ tu_don_vi_id: sourceUnitId, den_don_vi_id, mang_uid, ly_do, don_gia, po_code })
      toast.success(`Đã phát lệnh chuyển ${mang_uid.length} ${selectedBatch?.don_vi_tinh || 'đơn vị'} thuốc (Tổng: ${(so_luong * (don_gia || 0)).toLocaleString('vi-VN')} đ). Đang chờ kho đích xác nhận!`)
      form.resetFields()
      setBatches([])
      setSelectedBatch(null)
      fetchHistory()
      refreshPOs()
      warehouseService.getProductsInUnit(sourceUnitId).then(setProducts).catch(() => { })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chuyển kho thất bại')
    }
    finally { setLoading(false) }
  }

  const destUnitOptions = units
    .filter(u => u.id !== sourceUnitId)
    .map(u => ({ value: u.id, label: `${u.ten_don_vi}${u.loai_don_vi ? ` — ${u.loai_don_vi}` : ''}` }))

  const handleCancelTransfer = async (transferId) => {
    try {
      await warehouseService.cancelStockTransfer(transferId)
      toast.success('Hủy lệnh chuyển kho và hoàn hàng về kho gốc thành công!')
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Hủy lệnh chuyển thất bại')
    }
  }

  const cols = [
    { title: 'Sản phẩm', dataIndex: 'ten_duoc_pham', key: 'productName', render: (v, r) => v || r.productName || 'Dược phẩm' },
    { title: 'Số lô', dataIndex: 'so_lo', key: 'batchNumber', render: (v, r) => <span className="font-mono text-xs">{v || r.batchNumber}</span> },
    { title: 'Số lượng', dataIndex: 'so_luong_hop', key: 'quantity', render: (v, r) => `${v || r.quantity || 0} ${r.don_vi_tinh || 'hộp'}` },
    {
      title: 'Đơn giá',
      dataIndex: 'don_gia',
      key: 'price',
      render: (v) => v ? `${Number(v).toLocaleString('vi-VN')} đ` : '0 đ'
    },
    {
      title: 'Tổng tiền',
      key: 'tong_tien',
      render: (_, r) => {
        const val = Number(r.tong_tien || (r.don_gia ? r.don_gia * (r.so_luong_hop || 0) : 0))
        return <span className="font-semibold text-slate-800">{val ? `${val.toLocaleString('vi-VN')} đ` : '0 đ'}</span>
      }
    },
    {
      title: 'Đơn PO',
      dataIndex: 'po_code',
      key: 'po_code',
      render: (v) => v ? <Tag color="purple">{v}</Tag> : <span className="text-slate-400 text-xs">-</span>
    },
    { title: 'Từ đơn vị', dataIndex: 'ten_tu_kho', key: 'fromLocation', render: (v, r) => <Tag color="orange">{v || r.fromLocation || `Đơn vị #${r.tu_don_vi_id}`}</Tag> },
    { title: 'Đến đơn vị', dataIndex: 'ten_den_kho', key: 'toLocation', render: (v, r) => <Tag color="blue">{v || r.toLocation || `Đơn vị #${r.den_don_vi_id}`}</Tag> },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'status',
      render: (st) => {
        if (st === 'DaHuy') {
          return <Tag color="error">Đã hủy (Đã hoàn kho gốc)</Tag>
        }
        if (st === 'DangVanChuyen' || (typeof st === 'string' && st.startsWith('DangVanChuyen')) || st === 'IN_TRANSIT') {
          return <Tag color="processing" icon={<CarOutlined />}>Đang vận chuyển (Chờ nhận)</Tag>
        }
        return <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>
      }
    },
    { title: 'Thời gian', dataIndex: 'thoi_gian', key: 'time', render: (v, r) => formatDateTime(v || r.transferredAt) },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <AButton size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
          Chi tiết
        </AButton>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <SwapOutlined className="text-blue-600" /> Luân chuyển kho
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tạo lệnh chuyển hàng giữa các kho/nhà thuốc và lưu lịch sử giao dịch vào cơ sở dữ liệu
        </p>
      </div>

      <Card title={`Tạo lệnh chuyển kho (Kho hiện tại: ${user?.ten_don_vi || `Đơn vị #${sourceUnitId}`})`}>
        <Form form={form} layout="vertical" onFinish={handleTransfer}>
          <div className="grid sm:grid-cols-2 gap-x-4">

            {/* Direct PO Fulfillment Selector (Optional) */}
            <div className="sm:col-span-2 mb-2">
              <Form.Item 
                label="Theo Phiếu Đặt Hàng PO (Tùy chọn — Tự động điền Đơn vị, Thuốc, Số lượng & Đơn giá)" 
                name="po_code"
              >
                <Select
                  allowClear
                  showSearch
                  placeholder="-- Chọn đơn đặt hàng PO cần chuyển giao (hoặc để trống nếu chuyển tự do) --"
                  optionFilterProp="label"
                  onChange={async (poCode) => {
                    if (!poCode) {
                      return
                    }
                    const po = purchaseOrders.find(p => p.ma_phieu_nhap === poCode)
                    if (!po) return

                    try {
                      const { data } = await apiClient.get(`/admin/procurement/orders/${po.id}`)
                      const poDetail = data?.data || po
                      const firstItem = poDetail.chi_tiet?.[0]
                      const remQty = Math.max(1, (poDetail.tong_so_luong_dat || 0) - (poDetail.so_luong_da_nhan || 0) - (poDetail.so_luong_dang_giao || 0))
                      
                      form.setFieldsValue({
                        den_don_vi_id: poDetail.den_don_vi_id,
                        duoc_pham_id: firstItem?.duoc_pham_id,
                        don_gia: firstItem?.don_gia ? Number(firstItem.don_gia) : undefined,
                        so_luong: remQty,
                        ly_do: `Phân phối theo đơn hàng ${poDetail.ma_phieu_nhap}`
                      })

                      if (firstItem?.duoc_pham_id) {
                        handleProductChange(firstItem.duoc_pham_id)
                      }
                    } catch (err) {
                      console.error('Error fetching PO detail:', err)
                    }
                  }}
                  options={purchaseOrders.map(po => {
                    const total = po.tong_so_luong_dat || 0
                    const received = po.so_luong_da_nhan || 0
                    const inTransit = po.so_luong_dang_giao || 0
                    const remainingToShip = Math.max(0, total - received - inTransit)
                    const destName = po.ten_don_vi_nhan || (units.find(u => u.id === po.den_don_vi_id)?.ten_don_vi) || (po.ten_nguoi_tao ? `Chi nhánh (${po.ten_nguoi_tao})` : 'Chi nhánh nhận')
                    
                    let statusParts = []
                    statusParts.push(`Cần chuyển thêm: ${remainingToShip} hộp`)
                    if (inTransit > 0) {
                      statusParts.push(`${inTransit} hộp đang đi đường`)
                    }
                    if (received > 0) {
                      statusParts.push(`${received} hộp đã nhận`)
                    }

                    return {
                      value: po.ma_phieu_nhap,
                      label: `${po.ma_phieu_nhap} — Nhận: ${destName} — ${statusParts.join(' • ')} (Tổng: ${total} hộp)`
                    }
                  })}
                />
              </Form.Item>
            </div>

            {/* Destination unit */}
            <Form.Item label="Đơn vị đích (Kho/Nhà thuốc nhận)" name="den_don_vi_id" rules={[{ required: true, message: 'Chọn đơn vị nhận' }]}>
              <Select showSearch placeholder="Chọn đơn vị nhận" optionFilterProp="label" options={destUnitOptions} />
            </Form.Item>

            {/* Medicine */}
            <Form.Item label="Thuốc" name="duoc_pham_id" rules={[{ required: true, message: 'Chọn thuốc' }]}>
              <Select
                showSearch
                loading={loadingProducts}
                placeholder={loadingProducts ? 'Đang tải...' : products.length === 0 ? 'Không có thuốc trong kho' : 'Chọn thuốc'}
                optionFilterProp="label"
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.ten_thuoc} (${p.so_hop_trong_kho} ${p.don_vi_tinh || 'hộp'})`,
                }))}
                onChange={handleProductChange}
              />
            </Form.Item>

            {/* Batch number */}
            <Form.Item label="Số lô" name="lo_thuoc_id" rules={[{ required: true, message: 'Chọn số lô' }]}>
              <Select
                loading={loadingBatches}
                placeholder={!form.getFieldValue('duoc_pham_id') ? 'Chọn thuốc trước' : loadingBatches ? 'Đang tải...' : 'Chọn số lô'}
                disabled={batches.length === 0 || loadingBatches}
                options={batches.map(b => {
                  const hsd = b.han_su_dung || b.expiryDate || b.ngay_het_han || b.hsd
                  return {
                    value: b.id,
                    label: `${b.so_lo} — HSD: ${hsd ? formatDate(hsd) : 'Chưa cập nhật'} (${b.so_hop_trong_kho} ${b.don_vi_tinh || 'hộp'})`,
                  }
                })}
                onChange={handleBatchChange}
              />
            </Form.Item>

            {/* Quantity */}
            <Form.Item
              label={selectedBatch ? `Số lượng (${selectedBatch.so_hop_trong_kho} ${selectedBatch.don_vi_tinh || 'hộp'} khả dụng)` : 'Số lượng'}
              name="so_luong"
              rules={[{ required: true, message: 'Nhập số lượng' }]}
            >
              <InputNumber
                min={1}
                max={selectedBatch ? parseInt(selectedBatch.so_hop_trong_kho) : undefined}
                disabled={!selectedBatch}
                style={{ width: '100%' }}
                placeholder={`Nhập số lượng cần chuyển (${selectedBatch?.don_vi_tinh || 'đơn vị'})`}
              />
            </Form.Item>

            {/* Unit Price */}
            <Form.Item
              label={`Đơn giá chuyển kho (VNĐ / ${selectedBatch?.don_vi_tinh || 'đơn vị'} — Tùy chọn)`}
              name="don_gia"
            >
              <InputNumber
                min={0}
                step={1000}
                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                parser={value => value ? value.replace(/\D/g, '') : ''}
                style={{ width: '100%' }}
                placeholder={`Nhập đơn giá cho mỗi ${selectedBatch?.don_vi_tinh || 'đơn vị'} (tùy chọn)`}
              />
            </Form.Item>

            {/* Reason */}
            <Form.Item label="Lý do chuyển kho" name="ly_do">
              <Select
                allowClear
                placeholder="Chọn lý do (tùy chọn)"
                options={[
                  { value: 'Phân phối theo đơn hàng', label: 'Phân phối theo đơn hàng' },
                  { value: 'Cân bằng tồn kho', label: 'Cân bằng tồn kho' },
                  { value: 'Chuyển về kho trung tâm', label: 'Chuyển về kho trung tâm' },
                  { value: 'Hàng sắp hết hạn', label: 'Hàng sắp hết hạn' },
                  { value: 'Yêu cầu từ chi nhánh', label: 'Yêu cầu từ chi nhánh' },
                ]}
              />
            </Form.Item>
          </div>

          {selectedBatch && (
            <Alert
              type="info" showIcon className="mb-4"
              message={`Lô ${selectedBatch.so_lo} — Còn ${selectedBatch.so_hop_trong_kho} ${selectedBatch.don_vi_tinh || 'hộp'} — HSD: ${(selectedBatch.han_su_dung || selectedBatch.expiryDate || selectedBatch.ngay_het_han || selectedBatch.hsd) ? formatDate(selectedBatch.han_su_dung || selectedBatch.expiryDate || selectedBatch.ngay_het_han || selectedBatch.hsd) : 'Chưa cập nhật'}`}
            />
          )}

          {Boolean(watchQty && watchPrice) && (
            <Alert
              type="success" showIcon className="mb-4 font-semibold text-emerald-800"
              message={`Tổng giá trị lô hàng chuyển: ${(watchQty * watchPrice).toLocaleString('vi-VN')} VNĐ (${watchQty} ${selectedBatch?.don_vi_tinh || 'đơn vị'} × ${watchPrice.toLocaleString('vi-VN')} đ/${selectedBatch?.don_vi_tinh || 'đơn vị'})`}
            />
          )}

          <AButton type="primary" htmlType="submit" loading={loading} icon={<SwapOutlined />}>
            Phát lệnh chuyển kho
          </AButton>
        </Form>
      </Card>

      <Card title="Lịch sử chuyển kho">
        <Table dataSource={history} columns={cols} rowKey="id" pagination={{ pageSize: 10 }} loading={loadingHistory} size="small" scroll={{ x: 700 }} />
      </Card>

      {/* Modal Xem Chi Tiết Lịch Sử Chuyển Kho - Enriched with Icons */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <SwapOutlined className="text-blue-600" /> Chi tiết lệnh chuyển kho
          </div>
        }
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={[
          detailRecord && (detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))) && (
            <Popconfirm
              key="cancel-confirm"
              title="Hủy lệnh chuyển kho?"
              description="Toàn bộ số thuốc thuộc lệnh chuyển này sẽ được hoàn trả về kho gốc khả dụng."
              onConfirm={async () => {
                const recId = detailRecord.id
                setDetailRecord(null)
                await handleCancelTransfer(recId)
              }}
              okText="Hủy lệnh"
              cancelText="Quay lại"
              okButtonProps={{ danger: true }}
            >
              <AButton danger icon={<CloseCircleOutlined />}>
                Hủy lệnh chuyển kho
              </AButton>
            </Popconfirm>
          ),
          <AButton key="close" type="primary" onClick={() => setDetailRecord(null)}>
            Đóng
          </AButton>
        ]}
        width={620}
        centered
      >
        {detailRecord && (
          <div className="space-y-4 pt-2">
            {/* Header info & Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                  <FileTextOutlined className="text-blue-500" /> Mã lệnh / Thời gian
                </div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                  <span className="font-mono">#{detailRecord.id || 'TRF'}</span>
                  <span className="text-slate-300">•</span>
                  <span>{formatDateTime(detailRecord.thoi_gian || detailRecord.transferredAt)}</span>
                </div>
              </div>
              <div>
                <Tag
                  color={
                    detailRecord.trang_thai === 'DaHuy'
                      ? 'error'
                      : detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))
                        ? 'processing'
                        : 'success'
                  }
                  className="px-3.5 py-1.5 text-xs font-bold rounded-full border shadow-sm"
                >
                  {detailRecord.trang_thai === 'DaHuy'
                    ? 'Đã hủy'
                    : detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))
                      ? 'Đang vận chuyển (Chờ nhận)'
                      : '✓ Hoàn thành'}
                </Tag>
              </div>
            </div>

            {/* Product & Batch Card */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
                <MedicineBoxOutlined className="text-blue-600" /> Dược phẩm & Lô sản xuất
              </div>
              <div className="text-base font-bold text-slate-900 leading-snug">
                {detailRecord.ten_duoc_pham || detailRecord.productName}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <BarcodeOutlined className="text-purple-600" /> Số lô:
                </span>
                <span className="font-mono bg-white px-2.5 py-0.5 rounded border border-blue-200 text-xs font-bold text-blue-800 shadow-sm">
                  {detailRecord.so_lo || detailRecord.batchNumber}
                </span>
              </div>
            </div>

            {/* Origin -> Destination Flow Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
                <div className="text-xs text-amber-800 font-bold mb-1 flex items-center gap-1.5">
                  <ShopOutlined className="text-amber-600" /> Từ đơn vị (Gửi)
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {detailRecord.ten_tu_kho || detailRecord.fromLocation || `Đơn vị #${detailRecord.tu_don_vi_id}`}
                </div>
              </div>

              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200/80 shadow-sm">
                <div className="text-xs text-sky-800 font-bold mb-1 flex items-center gap-1.5">
                  <ShopOutlined className="text-sky-600" /> Đến đơn vị (Nhận)
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {detailRecord.ten_den_kho || detailRecord.toLocation || `Đơn vị #${detailRecord.den_don_vi_id}`}
                </div>
              </div>
            </div>

            {/* Quantities & Price Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                  <UnorderedListOutlined className="text-slate-500" /> Số lượng
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {detailRecord.so_luong_hop || detailRecord.quantity || 0} <span className="text-xs font-normal text-slate-500">{detailRecord.don_vi_tinh || 'hộp'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                  <DollarOutlined className="text-slate-500" /> Đơn giá
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {Number(detailRecord.don_gia || 0) ? `${Number(detailRecord.don_gia).toLocaleString('vi-VN')} đ` : '0 đ'}
                </div>
              </div>

              <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200/90 text-center shadow-sm">
                <div className="text-xs text-emerald-800 font-bold mb-1 flex items-center justify-center gap-1">
                  <DollarCircleOutlined className="text-emerald-600" /> Tổng tiền
                </div>
                <div className="text-base font-black text-emerald-700">
                  {Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0)))
                    ? `${Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0))).toLocaleString('vi-VN')} đ`
                    : '0 đ'}
                </div>
              </div>
            </div>

            {detailRecord.ly_do && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2 shadow-sm">
                <InfoCircleOutlined className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Lý do chuyển:</span> {detailRecord.ly_do}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
