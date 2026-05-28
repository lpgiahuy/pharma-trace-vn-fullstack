import { useState, useEffect } from 'react'
import { Form, InputNumber, Select, Button as AButton, Card, Table, Tag, Alert, Modal, Descriptions } from 'antd'
import { SwapOutlined, EyeOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, formatDate } from '@/utils'
import toast from 'react-hot-toast'

export default function TransferPage() {
  const { user } = useAuthStore()
  const sourceUnitId = user?.don_vi_id ? Number(user.don_vi_id) : null

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const [units, setUnits] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)

  useEffect(() => {
    warehouseService.getUnits().then(setUnits).catch(() => {})
  }, [])

  // Load thuốc có trong đơn vị của nhân viên ngay khi vào trang
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
    const { den_don_vi_id, lo_thuoc_id, so_luong, ly_do } = vals
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
      const result = await warehouseService.transferStock({ tu_don_vi_id: sourceUnitId, den_don_vi_id, mang_uid, ly_do })
      const toUnit  = units.find(u => u.id === den_don_vi_id)
      const product = products.find(p => p.id === vals.duoc_pham_id)
      setHistory(prev => [{
        ...result,
        key: Date.now(),
        productName:   product?.ten_thuoc || '',
        batchNumber:   selectedBatch?.so_lo || '',
        quantity:      mang_uid.length,
        fromLocation:  user?.ten_don_vi || `Đơn vị #${sourceUnitId}`,
        toLocation:    toUnit?.ten_don_vi || `Đơn vị #${den_don_vi_id}`,
        status:        'Hoàn thành',
        transferredAt: new Date().toISOString(),
        mang_uid,
      }, ...prev])
      toast.success(`Chuyển kho thành công — ${mang_uid.length} hộp thuốc`)
      form.resetFields()
      setBatches([])
      setSelectedBatch(null)
      // Reload lại danh sách thuốc sau khi chuyển
      warehouseService.getProductsInUnit(sourceUnitId).then(setProducts).catch(() => {})
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chuyển kho thất bại')
    }
    finally { setLoading(false) }
  }

  const destUnitOptions = units
    .filter(u => u.id !== sourceUnitId)
    .map(u => ({ value: u.id, label: `${u.ten_don_vi}${u.loai_don_vi ? ` — ${u.loai_don_vi}` : ''}` }))

  const sourceUnit = units.find(u => u.id === sourceUnitId)

  const cols = [
    { title: 'Sản phẩm',   dataIndex: 'productName',  key: 'product' },
    { title: 'Số lô',      dataIndex: 'batchNumber',   key: 'batch',  render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Số hộp',     dataIndex: 'quantity',      key: 'qty' },
    { title: 'Từ đơn vị',  dataIndex: 'fromLocation',  key: 'from',   render: v => <Tag color="orange">{v}</Tag> },
    { title: 'Đến đơn vị', dataIndex: 'toLocation',    key: 'to',     render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status',        key: 'status', render: v => <Tag color="green">{v}</Tag> },
    { title: 'Thời gian',  dataIndex: 'transferredAt', key: 'time',   render: v => formatDateTime(v) },
    {
      title: 'Thao tác', key: 'action',
      render: (_, record) => (
        <AButton size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
          Chi tiết
        </AButton>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <SwapOutlined /> Chuyển kho
        </h1>
        <p className="text-slate-500 text-sm mt-1">Di chuyển hàng hóa giữa các đơn vị / kho</p>
      </div>

      <Card title="Tạo lệnh chuyển kho mới">
        {/* Thông tin đơn vị nguồn (chỉ đọc) */}
        <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 w-fit">
          <span className="text-slate-500 text-sm">Đơn vị của bạn:</span>
          <Tag color="orange" className="m-0 font-medium">
            {sourceUnit ? `${sourceUnit.ten_don_vi}${sourceUnit.loai_don_vi ? ` — ${sourceUnit.loai_don_vi}` : ''}` : `Đơn vị #${sourceUnitId}`}
          </Tag>
        </div>

        <Form form={form} layout="vertical" onFinish={handleTransfer}>
          <div className="grid sm:grid-cols-2 gap-x-4">

            {/* Đơn vị đích */}
            <Form.Item label="Đơn vị đích" name="den_don_vi_id" rules={[{ required: true, message: 'Chọn đơn vị nhận' }]}>
              <Select showSearch placeholder="Chọn đơn vị nhận" optionFilterProp="label" options={destUnitOptions} />
            </Form.Item>

            {/* Thuốc */}
            <Form.Item label="Thuốc" name="duoc_pham_id" rules={[{ required: true, message: 'Chọn thuốc' }]}>
              <Select
                showSearch
                loading={loadingProducts}
                placeholder={loadingProducts ? 'Đang tải...' : products.length === 0 ? 'Không có thuốc trong kho' : 'Chọn thuốc'}
                optionFilterProp="label"
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.ten_thuoc} (${p.so_hop_trong_kho} hộp)`,
                }))}
                onChange={handleProductChange}
              />
            </Form.Item>

            {/* Số lô */}
            <Form.Item label="Số lô" name="lo_thuoc_id" rules={[{ required: true, message: 'Chọn số lô' }]}>
              <Select
                loading={loadingBatches}
                placeholder={!form.getFieldValue('duoc_pham_id') ? 'Chọn thuốc trước' : loadingBatches ? 'Đang tải...' : 'Chọn số lô'}
                disabled={batches.length === 0 || loadingBatches}
                options={batches.map(b => ({
                  value: b.id,
                  label: `${b.so_lo} — HSD: ${formatDate(b.han_su_dung)} (${b.so_hop_trong_kho} hộp)`,
                }))}
                onChange={handleBatchChange}
              />
            </Form.Item>

            {/* Số lượng */}
            <Form.Item
              label={selectedBatch ? `Số lượng hộp (tối đa ${selectedBatch.so_hop_trong_kho})` : 'Số lượng hộp'}
              name="so_luong"
              rules={[{ required: true, message: 'Nhập số lượng' }]}
            >
              <InputNumber
                min={1}
                max={selectedBatch ? parseInt(selectedBatch.so_hop_trong_kho) : undefined}
                disabled={!selectedBatch}
                style={{ width: '100%' }}
                placeholder="Nhập số hộp cần chuyển"
              />
            </Form.Item>

            {/* Lý do */}
            <Form.Item label="Lý do chuyển kho" name="ly_do">
              <Select
                allowClear
                placeholder="Chọn lý do (tùy chọn)"
                options={[
                  { value: 'Phân phối theo đơn hàng', label: 'Phân phối theo đơn hàng' },
                  { value: 'Cân bằng tồn kho',         label: 'Cân bằng tồn kho' },
                  { value: 'Chuyển về kho trung tâm',  label: 'Chuyển về kho trung tâm' },
                  { value: 'Hàng sắp hết hạn',         label: 'Hàng sắp hết hạn' },
                  { value: 'Yêu cầu từ chi nhánh',     label: 'Yêu cầu từ chi nhánh' },
                ]}
              />
            </Form.Item>
          </div>

          {selectedBatch && (
            <Alert
              type="info" showIcon className="mb-4"
              message={`Lô ${selectedBatch.so_lo} — Còn ${selectedBatch.so_hop_trong_kho} hộp — HSD: ${formatDate(selectedBatch.han_su_dung)}`}
            />
          )}

          <AButton type="primary" htmlType="submit" loading={loading} icon={<SwapOutlined />}>
            Xác nhận chuyển kho
          </AButton>
        </Form>
      </Card>

      {history.length > 0 && (
        <Card title="Lịch sử chuyển kho (phiên này)">
          <Table dataSource={history} columns={cols} rowKey="key" pagination={false} size="small" scroll={{ x: 700 }} />
        </Card>
      )}

      <Modal
        title="Chi tiết lệnh chuyển kho"
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={<AButton onClick={() => setDetailRecord(null)}>Đóng</AButton>}
        width={640}
      >
        {detailRecord && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Sản phẩm" span={2}>{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="Số lô">
                <span className="font-mono">{detailRecord.batchNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Số hộp chuyển">{detailRecord.quantity}</Descriptions.Item>
              <Descriptions.Item label="Từ đơn vị">
                <Tag color="orange">{detailRecord.fromLocation}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Đến đơn vị">
                <Tag color="blue">{detailRecord.toLocation}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="green">{detailRecord.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">{formatDateTime(detailRecord.transferredAt)}</Descriptions.Item>
            </Descriptions>

          </div>
        )}
      </Modal>
    </div>
  )
}
