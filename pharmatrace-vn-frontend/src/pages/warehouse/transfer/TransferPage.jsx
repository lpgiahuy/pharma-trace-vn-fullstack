import { useState, useEffect } from 'react'
import { Form, InputNumber, Select, Button as AButton, Card, Table, Tag, Alert, Modal, Descriptions, Popconfirm } from 'antd'
import { SwapOutlined, EyeOutlined, CheckCircleOutlined, CarOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
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

  useEffect(() => {
    warehouseService.getUnits().then(setUnits).catch(() => { })
    fetchHistory()
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
    const { den_don_vi_id, lo_thuoc_id, so_luong, don_gia, ly_do } = vals
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
      await warehouseService.transferStock({ tu_don_vi_id: sourceUnitId, den_don_vi_id, mang_uid, ly_do, don_gia })
      toast.success(`Đã phát lệnh chuyển ${mang_uid.length} ${selectedBatch?.don_vi_tinh || 'đơn vị'} thuốc (Tổng: ${(so_luong * (don_gia || 0)).toLocaleString('vi-VN')} đ). Đang chờ kho đích xác nhận!`)
      form.resetFields()
      setBatches([])
      setSelectedBatch(null)
      fetchHistory()
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
          <SwapOutlined /> Luân chuyển kho
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tạo lệnh chuyển hàng giữa các kho/nhà thuốc và lưu lịch sử giao dịch vào cơ sở dữ liệu
        </p>
      </div>

      <Card title={`Tạo lệnh chuyển kho (Kho hiện tại: ${user?.ten_don_vi || `Đơn vị #${sourceUnitId}`})`}>
        <Form form={form} layout="vertical" onFinish={handleTransfer}>
          <div className="grid sm:grid-cols-2 gap-x-4">

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
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\s?\(?\$?\)?\s?|,/g, '')}
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
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <div className="text-xs text-slate-500 font-medium">Mã lệnh / Thời gian</div>
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-2 mt-0.5">
                  <span>#{detailRecord.id || 'TRF'}</span>
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
                  className="px-3 py-1 text-xs font-semibold rounded-full"
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
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Dược phẩm & Lô sản xuất</div>
              <div className="text-base font-bold text-slate-900 leading-snug">
                {detailRecord.ten_duoc_pham || detailRecord.productName}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-medium">Số lô:</span>
                <span className="font-mono bg-white px-2.5 py-0.5 rounded border border-blue-200 text-xs font-bold text-blue-800 shadow-sm">
                  {detailRecord.so_lo || detailRecord.batchNumber}
                </span>
              </div>
            </div>

            {/* Origin -> Destination Flow Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                <div className="text-xs text-amber-700 font-semibold mb-1">
                  Từ đơn vị (Gửi)
                </div>
                <div className="text-sm font-semibold text-slate-800 break-words">
                  {detailRecord.ten_tu_kho || detailRecord.fromLocation || `Đơn vị #${detailRecord.tu_don_vi_id}`}
                </div>
              </div>

              <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                <div className="text-xs text-sky-700 font-semibold mb-1">
                  Đến đơn vị (Nhận)
                </div>
                <div className="text-sm font-semibold text-slate-800 break-words">
                  {detailRecord.ten_den_kho || detailRecord.toLocation || `Đơn vị #${detailRecord.den_don_vi_id}`}
                </div>
              </div>
            </div>

            {/* Quantities & Price Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium mb-1">Số lượng chuyển</div>
                <div className="text-base font-bold text-slate-900">
                  {detailRecord.so_luong_hop || detailRecord.quantity || 0} <span className="text-xs font-normal text-slate-500">{detailRecord.don_vi_tinh || 'hộp'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-medium mb-1">Đơn giá chuyển</div>
                <div className="text-base font-bold text-slate-800">
                  {Number(detailRecord.don_gia || 0) ? `${Number(detailRecord.don_gia).toLocaleString('vi-VN')} đ` : '0 đ'}
                </div>
              </div>

              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
                <div className="text-xs text-emerald-700 font-semibold mb-1">Tổng tiền</div>
                <div className="text-base font-extrabold text-emerald-700">
                  {Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0)))
                    ? `${Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0))).toLocaleString('vi-VN')} đ`
                    : '0 đ'}
                </div>
              </div>
            </div>

            {detailRecord.ly_do && (
              <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-semibold not-italic text-slate-700">Lý do chuyển:</span> {detailRecord.ly_do}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
