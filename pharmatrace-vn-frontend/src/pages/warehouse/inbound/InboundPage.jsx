import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, AutoComplete, Button as AButton, Card, Table, Tag, DatePicker, Modal, Spin } from 'antd'
import { InboxOutlined, PrinterOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { productService } from '@/services/product.service'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

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
  const [loadingHistory, setLoadingHistory] = useState(false)

  // QR Code Print Modal States
  const [printModalVisible, setPrintModalVisible] = useState(false)
  const [printBatchNumber, setPrintBatchNumber] = useState('')
  const [printQRs, setPrintQRs] = useState([])
  const [loadingQRs, setLoadingQRs] = useState(false)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await warehouseService.getInventory()
      const normalized = (response.data || []).map(item => ({
        key: item.id || item.key || Date.now() + Math.random(),
        productName: item.productName || 'Unknown',
        batchNumber: item.batchNumber || '',
        quantity: item.quantity || 0,
        qrCode: item.batchNumber || '',
        receivedAt: item.receivedAt || item.createdAt || new Date().toISOString(),
        location: item.location || '',
        batchId: item.id || item.batchId
      }))
      setReceived(normalized)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải lịch sử nhập kho')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    setLoadingProducts(true)
    productService.getAllAdmin()
      .then(res => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))

    warehouseService.getUnits()
      .then(data => setUnits(data))
      .catch(() => {})

    fetchHistory()
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
      toast.success(`Nhập kho thành công — đã sinh ${result.so_luong_da_sinh_qr || vals.so_luong_hop} QR code`)
      form.resetFields()
      setVariants([])
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nhập kho thất bại')
    }
    finally { setLoading(false) }
  }

  const handleOpenPrintModal = async (batchId, batchNumber) => {
    setPrintBatchNumber(batchNumber)
    setPrintModalVisible(true)
    setLoadingQRs(true)
    try {
      const qrs = await warehouseService.getBatchQRs(batchId)
      setPrintQRs(qrs)
    } catch {
      toast.error('Không thể tải danh sách mã QR')
      setPrintModalVisible(false)
    } finally {
      setLoadingQRs(false)
    }
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>In mã QR - Lô ${printBatchNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .grid-print { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; justify-items: center; }
            .qr-card { border: 1px solid #ccc; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-inside: avoid; border-radius: 8px; width: 140px; }
            .qr-text { font-size: 8px; font-family: monospace; margin-top: 5px; word-break: break-all; }
            .qr-batch { font-size: 9px; color: #333; font-weight: bold; margin-top: 2px; }
            @media print {
              .qr-card { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <h2 style="margin-bottom: 20px;">Mã QR xác thực - Lô thuốc: ${printBatchNumber}</h2>
          <div class="grid-print">
            ${printQRs.map(qr => {
              const svgEl = document.getElementById('qr-svg-' + qr.uid)
              const svgHtml = svgEl ? svgEl.outerHTML : ''
              return '<div class="qr-card">' +
                svgHtml +
                '<div class="qr-text">' + qr.uid + '</div>' +
                '<div class="qr-batch">Lô: ' + printBatchNumber + '</div>' +
                '</div>'
            }).join('')}
          </div>
        </body>
      </html>
    `)
    win.document.close()
    
    // Trigger print after window document closes
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }


  const cols = [
    { title: 'Sản phẩm',  dataIndex: 'productName', key: 'product', ellipsis: true },
    { title: 'Số lô',     dataIndex: 'batchNumber', key: 'batch',   render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Số lượng',  dataIndex: 'quantity',    key: 'qty' },
    { title: 'Thời gian', dataIndex: 'receivedAt',  key: 'time',    render: v => v ? formatDateTime(v) : 'Vừa xong' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => record.batchId ? (
        <AButton size="small" type="primary" icon={<PrinterOutlined />} onClick={() => handleOpenPrintModal(record.batchId, record.batchNumber)}>
          In mã QR
        </AButton>
      ) : null
    },
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

      <Card title="Lịch sử nhập kho (Tất cả)">
        <Table 
          dataSource={received} 
          columns={cols} 
          rowKey="key" 
          pagination={{ pageSize: 10 }} 
          size="small" 
          loading={loadingHistory}
        />
      </Card>

      {/* Print QR Modal */}
      <Modal
        title={`Xem danh sách nhãn QR - Lô ${printBatchNumber}`}
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        width={750}
        footer={[
          <AButton key="close" onClick={() => setPrintModalVisible(false)}>
            Đóng
          </AButton>,
          <AButton key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={printQRs.length === 0}>
            In nhãn hàng loạt
          </AButton>,
        ]}
      >
        {loadingQRs ? (
          <div className="py-12 text-center">
            <Spin size="large" tip="Đang tải UIDs từ hệ thống..." />
            <p className="text-slate-400 mt-2 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 border p-3 rounded-lg text-slate-600 text-xs mb-4">
              Hệ thống tự động liên kết mã QR với URL xác thực. Chữ ký số (Signature) được nhúng sẵn để đảm bảo tính xác thực khi quét công khai.
            </div>
            
            {/* Grid of QR Codes */}
            <div id="qr-print-area" className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2 border rounded-lg bg-white">
              {printQRs.map(qr => {
                const traceUrl = `${window.location.origin}/trace?uid=${qr.uid}&sig=${qr.sig}`;
                return (
                  <div key={qr.uid} className="border p-3 flex flex-col items-center justify-center bg-white rounded-lg text-center">
                    <QRCodeSVG id={`qr-svg-${qr.uid}`} value={traceUrl} size={110} level="M" includeMargin={true} />
                    <div className="text-[9px] font-mono mt-1 text-slate-500 truncate w-full">{qr.uid}</div>
                    <div className="text-[10px] font-semibold text-slate-700 mt-0.5">Lô: {printBatchNumber}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

