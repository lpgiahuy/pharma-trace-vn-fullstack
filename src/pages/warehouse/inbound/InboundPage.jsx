import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Button as AButton, Card, Table, Tag, DatePicker } from 'antd'
import { InboxOutlined, QrcodeOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { productService } from '@/services/product.service'
import { QRCodeSVG } from 'qrcode.react'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

export default function InboundPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [received, setReceived] = useState([])
  const [lastQR, setLastQR] = useState(null)
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    setLoadingProducts(true)
    productService.getAllAdmin({ limit: 200 })
      .then(res => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  const handleProductChange = (productId) => {
    form.setFieldValue('quy_cach_id', undefined)
    const product = products.find(p => p.id === productId)
    setVariants(product?.packagingVariants || [])
  }

  const handleReceive = async (vals) => {
    setLoading(true)
    try {
      const payload = {
        duoc_pham_id:  vals.duoc_pham_id,
        quy_cach_id:   vals.quy_cach_id,
        so_lo:         vals.so_lo,
        so_luong:      vals.so_luong,
        ngay_san_xuat: vals.ngay_san_xuat?.format('YYYY-MM-DD'),
        han_su_dung:   vals.han_su_dung?.format('YYYY-MM-DD'),
        vi_tri:        vals.vi_tri,
        nha_cung_cap:  vals.nha_cung_cap || '',
        gia_nhap:      vals.gia_nhap || 0,
      }
      const result = await warehouseService.receiveStock(payload)
      setReceived(prev => [{ ...result, key: Date.now() }, ...prev])
      setLastQR(result.qrCode)
      toast.success(`Stock received — QR: ${result.qrCode}`)
      form.resetFields()
      setVariants([])
    } catch { toast.error('Failed to receive stock') }
    finally { setLoading(false) }
  }

  const cols = [
    { title: 'Product',    dataIndex: 'productName', key: 'product', ellipsis: true },
    { title: 'Batch',      dataIndex: 'batchNumber', key: 'batch',   render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Qty',        dataIndex: 'quantity',    key: 'qty' },
    { title: 'Location',   dataIndex: 'location',    key: 'loc' },
    { title: 'QR Code',    dataIndex: 'qrCode',      key: 'qr',      render: v => <Tag icon={<QrcodeOutlined />} color="blue">{v}</Tag> },
    { title: 'Received',   dataIndex: 'receivedAt',  key: 'time',    render: v => v ? formatDateTime(v) : 'Just now' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <InboxOutlined /> Inventory Inbound
        </h1>
        <p className="text-slate-500 text-sm mt-1">Receive new stock and generate QR / UID codes</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Receive New Stock">
            <Form form={form} layout="vertical" onFinish={handleReceive}>
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Form.Item label="Product (Thuốc)" name="duoc_pham_id" rules={[{ required: true, message: 'Select a product' }]} className="sm:col-span-2">
                  <Select
                    showSearch
                    loading={loadingProducts}
                    placeholder="Search and select product"
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

                <Form.Item label="Packaging Variant (Quy cách)" name="quy_cach_id" rules={[{ required: true, message: 'Select packaging variant' }]}>
                  <Select placeholder="Select variant" disabled={variants.length === 0}>
                    {variants.map(v => (
                      <Select.Option key={v.id} value={v.id}>{v.label}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Batch Number (Số lô)" name="so_lo" rules={[{ required: true }]}>
                  <Input placeholder="BATCH-0001" />
                </Form.Item>

                <Form.Item label="Quantity (Số lượng)" name="so_luong" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="Manufacture Date (Ngày sản xuất)" name="ngay_san_xuat" rules={[{ required: true, message: 'Manufacture date required' }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item label="Expiry Date (Hạn sử dụng)" name="han_su_dung" rules={[{ required: true, message: 'Expiry date required' }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item label="Warehouse Location" name="vi_tri" rules={[{ required: true }]}>
                  <Select placeholder="Select location">
                    {['A1-01','A1-02','A2-01','A2-02','B1-01','B1-02','B2-01','C1-01'].map(l => (
                      <Select.Option key={l} value={l}>{l}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="Supplier (Nhà cung cấp)" name="nha_cung_cap">
                  <Input placeholder="Supplier name" />
                </Form.Item>

                <Form.Item label="Unit Cost (Giá nhập ₫)" name="gia_nhap" className="sm:col-span-2">
                  <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </div>
              <AButton type="primary" htmlType="submit" loading={loading} icon={<InboxOutlined />} size="large">
                Receive & Generate QR
              </AButton>
            </Form>
          </Card>
        </div>

        {lastQR && (
          <Card title="Generated QR Code" className="text-center">
            <QRCodeSVG value={lastQR} size={180} className="mx-auto mb-3" />
            <p className="font-mono text-sm text-brand-600 font-bold">{lastQR}</p>
            <p className="text-xs text-slate-500 mt-1">Print and attach to stock</p>
            <AButton size="small" className="mt-3" onClick={() => window.print()}>Print QR</AButton>
          </Card>
        )}
      </div>

      {received.length > 0 && (
        <Card title="Recent Receipts (this session)">
          <Table dataSource={received} columns={cols} rowKey="key" pagination={false} size="small" />
        </Card>
      )}
    </div>
  )
}
