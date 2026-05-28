import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, AutoComplete, Button as AButton, Card, Table, Tag, DatePicker } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { productService } from '@/services/product.service'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

const SUPPLIERS = [
  'Dược Hậu Giang (DHG Pharma)',
  'Traphaco',
  'Pymepharco',
  'Imexpharm',
  'OPC Pharmaceutical',
  'Bidiphar',
  'Mekophar',
  'Vidipha',
  'Stada Vietnam',
  'Abbott Vietnam',
  'Sanofi Vietnam',
  'Pfizer Vietnam',
  'Novartis Vietnam',
  'GlaxoSmithKline (GSK) Vietnam',
  'Daiichi Sankyo Vietnam',
  'Roche Vietnam',
  'AstraZeneca Vietnam',
  'Bayer Vietnam',
].map(s => ({ value: s }))

export default function InboundPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [received, setReceived] = useState([])
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [units, setUnits] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)

  useEffect(() => {
    setLoadingProducts(true)
    productService.getAllAdmin()
      .then(res => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))

    warehouseService.getUnits()
      .then(data => setUnits(data))
      .catch(() => {})
  }, [])

  const handleProductChange = async (productId) => {
    form.setFieldValue('quy_cach_id', undefined)
    setVariants([])
    if (!productId) return
    setLoadingVariants(true)
    try {
      const product = await productService.getById(productId)
      // API /products/:id returns `variants` [{id, unit, price, ...}]
      const raw = product?.variants || product?.packagingVariants || []
      setVariants(raw.map(v => ({ id: v.id, label: v.unit || v.label || v.ten_don_vi || `#${v.id}` })))
    } catch {
      toast.error('Không thể tải quy cách đóng gói')
    } finally {
      setLoadingVariants(false)
    }
  }

  const handleReceive = async (vals) => {
    setLoading(true)
    try {
      const payload = {
        duoc_pham_id:  vals.duoc_pham_id,
        don_vi_id:     vals.don_vi_id,
        so_lo:         vals.so_lo,
        so_luong_hop:  vals.so_luong_hop,
        ngay_sx:       vals.ngay_sx?.format('YYYY-MM-DD'),
        hsd:           vals.hsd?.format('YYYY-MM-DD'),
        nha_cung_cap:  vals.nha_cung_cap || '',
      }
      const result = await warehouseService.receiveStock(payload)
      const loThuoc = result.lo_thuoc_moi || result
      const product = products.find(p => p.id === vals.duoc_pham_id)
      const unit = units.find(u => u.id === vals.don_vi_id)
      const soLoValue = loThuoc.so_lo || vals.so_lo
      const historyEntry = {
        key: Date.now(),
        productName: product?.name || `Thuốc #${vals.duoc_pham_id}`,
        batchNumber: soLoValue,
        quantity: result.so_luong_da_sinh_qr || vals.so_luong_hop,
        qrCode: soLoValue,
        receivedAt: new Date().toISOString(),
        location: unit?.ten_don_vi || '',
      }
      setReceived(prev => [historyEntry, ...prev])
      toast.success(`Nhập kho thành công — đã sinh ${result.so_luong_da_sinh_qr || vals.so_luong_hop} QR code`)
      form.resetFields()
      setVariants([])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nhập kho thất bại')
    }
    finally { setLoading(false) }
  }

  const cols = [
    { title: 'Sản phẩm',  dataIndex: 'productName', key: 'product', ellipsis: true },
    { title: 'Số lô',     dataIndex: 'batchNumber', key: 'batch',   render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Số lượng',  dataIndex: 'quantity',    key: 'qty' },
    { title: 'Thời gian', dataIndex: 'receivedAt',  key: 'time',    render: v => v ? formatDateTime(v) : 'Vừa xong' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <InboxOutlined /> Nhập kho
        </h1>
        <p className="text-slate-500 text-sm mt-1">Nhận hàng mới và sinh mã QR / UID cho từng hộp thuốc</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Nhận hàng mới">
            <Form form={form} layout="vertical" onFinish={handleReceive}>
              <div className="grid sm:grid-cols-2 gap-x-4">

                {/* Product */}
                <Form.Item label="Thuốc" name="duoc_pham_id" rules={[{ required: true, message: 'Chọn sản phẩm' }]} className="sm:col-span-2">
                  <Select
                    showSearch
                    loading={loadingProducts}
                    placeholder="Tìm và chọn sản phẩm"
                    optionFilterProp="children"
                    onChange={handleProductChange}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {products.map(p => (
                      <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Packaging Variant — optional, for reference */}
                <Form.Item label="Quy cách đóng gói" name="quy_cach_id">
                  <Select
                    placeholder={loadingVariants ? 'Đang tải...' : variants.length === 0 ? 'Chọn sản phẩm trước' : 'Chọn quy cách (tùy chọn)'}
                    loading={loadingVariants}
                    disabled={variants.length === 0 || loadingVariants}
                    allowClear
                  >
                    {variants.map(v => (
                      <Select.Option key={v.id} value={v.id}>{v.label}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Batch Number */}
                <Form.Item label="Số lô" name="so_lo" rules={[{ required: true, message: 'Nhập số lô' }]}>
                  <Input placeholder="BATCH-0001" />
                </Form.Item>

                {/* Quantity */}
                <Form.Item label="Số lượng hộp" name="so_luong_hop" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                  <InputNumber min={1} max={50000} style={{ width: '100%' }} />
                </Form.Item>

                {/* Manufacture Date */}
                <Form.Item label="Ngày sản xuất" name="ngay_sx" rules={[{ required: true, message: 'Nhập ngày sản xuất' }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                </Form.Item>

                {/* Expiry Date */}
                <Form.Item label="Hạn sử dụng" name="hsd" rules={[{ required: true, message: 'Nhập hạn sử dụng' }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                </Form.Item>

                {/* Warehouse Unit — from API */}
                <Form.Item label="Đơn vị nhập kho" name="don_vi_id" rules={[{ required: true, message: 'Chọn đơn vị' }]}>
                  <Select
                    showSearch
                    placeholder="Chọn đơn vị / chi nhánh"
                    optionFilterProp="label"
                    options={units.map(u => ({
                      value: u.id,
                      label: `${u.ten_don_vi}${u.loai_don_vi ? ` — ${u.loai_don_vi}` : ''}`,
                    }))}
                  />
                </Form.Item>

                {/* Supplier */}
                <Form.Item label="Nhà cung cấp" name="nha_cung_cap">
                  <AutoComplete
                    placeholder="Chọn hoặc nhập tên nhà cung cấp"
                    allowClear
                    filterOption={(input, option) =>
                      (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={SUPPLIERS}
                  />
                </Form.Item>
              </div>

              <AButton type="primary" htmlType="submit" loading={loading} icon={<InboxOutlined />} size="large">
                Tạo lô thuốc mới
              </AButton>
            </Form>
          </Card>
        </div>

      </div>

      {received.length > 0 && (
        <Card title="Lô hàng vừa nhập (phiên này)">
          <Table dataSource={received} columns={cols} rowKey="key" pagination={false} size="small" />
        </Card>
      )}
    </div>
  )
}
