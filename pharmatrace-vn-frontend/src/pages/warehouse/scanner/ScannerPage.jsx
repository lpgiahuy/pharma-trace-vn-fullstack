import { useState, useRef, useEffect, useCallback } from 'react'
import { Button as AButton, Card, Descriptions, Tag, Alert } from 'antd'
import { QrcodeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { InlineLoader } from '@/components/ui/Spinner'
import { StockBadge } from '@/components/ui/Badge'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'
import { scanQRFromFile } from '@/utils/scanQRFromFile'

export default function ScannerPage() {
  const [manualCode, setManualCode] = useState('')
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [scanning, setScanning]     = useState(false)
  
  const scannerEl = useRef(null)
  const html5Qr = useRef(null)

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    setScanning(true)
    setError(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      html5Qr.current = new Html5Qrcode('qr-reader-warehouse')
      await html5Qr.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCamera()
          handleScan(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setScanning(false)
      setError('Không thể truy cập camera. Vui lòng cấp quyền hoặc nhập thủ công.')
      toast.error('Mở camera thất bại')
    }
  }

  const stopCamera = useCallback(() => {
    if (html5Qr.current?.isScanning) {
      html5Qr.current.stop().catch(() => {})
    }
    setScanning(false)
  }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const decodedText = await scanQRFromFile(file)
      toast.success('Giải mã ảnh QR thành công!')
      handleScan(decodedText)
    } catch (err) {
      console.error('[QR File Scan Error]', err)
      setError('Không thể tìm thấy mã QR hợp lệ trong ảnh này. Vui lòng chọn ảnh khác.')
      toast.error('Quét ảnh thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (code) => {
    if (!code?.trim()) return
    
    // Parse QR text to handle URLs scanned by camera
    let finalCode = code.trim();
    if (finalCode.startsWith('http://') || finalCode.startsWith('https://')) {
      try {
        const url = new URL(finalCode);
        finalCode = url.searchParams.get('uid') || finalCode;
      } catch (e) {
        // Ignore URL parsing error, fallback to raw code
      }
    }

    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await warehouseService.scanQR(finalCode)
      setResult(data)
      toast.success('Quét mã QR thành công')
    } catch {
      setError('Không tìm thấy hàng tồn kho cho mã QR này.')
      toast.error('Quét mã thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSearch = () => handleScan(manualCode)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <QrcodeOutlined /> Quét mã QR
        </h1>
        <p className="text-slate-500 text-sm mt-1">Quét mã QR sản phẩm để xem thông tin tồn kho</p>
      </div>

      <Card title="Quét bằng camera">
        {scanning ? (
          <div className="rounded-xl overflow-hidden border border-brand-500 bg-black relative mb-4">
            <div id="qr-reader-warehouse" ref={scannerEl} className="w-full h-[300px]" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <AButton type="primary" danger onClick={stopCamera}>
                Dừng camera
              </AButton>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 mb-4">
            <QrcodeOutlined className="text-5xl text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium mb-1">Hướng camera vào mã QR</p>
            <p className="text-xs text-slate-400 mb-4">Cần quyền truy cập camera để quét trực tiếp</p>
            
            <div className="flex gap-3">
              <AButton
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={startCamera}
              >
                Bật camera quét
              </AButton>
              
              <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer text-sm font-medium shadow-sm">
                Tải ảnh QR lên
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}


        {/* Nhập thủ công */}
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="Hoặc nhập mã QR thủ công…"
            className="input flex-1"
          />
          <AButton
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleManualSearch}
          >
            Tra cứu
          </AButton>
        </div>

        {/* Demo */}
        <div className="mt-3 flex gap-2 flex-wrap">
          <p className="text-xs text-slate-400 w-full">Thử quét mẫu:</p>
          {['QR-BATCH-0001', 'QR-BATCH-0002', 'QR-BATCH-0003'].map(code => (
            <AButton key={code} size="small" onClick={() => { setManualCode(code); handleScan(code) }}>
              {code}
            </AButton>
          ))}
        </div>
      </Card>

      {loading && <InlineLoader text="Đang tra cứu…" />}

      {error && <Alert message={error} type="error" showIcon />}

      {result && (
        <Card
          title={<span className="flex items-center gap-2"><QrcodeOutlined className="text-brand-500" /> Kết quả quét</span>}
          extra={<AButton size="small" icon={<ReloadOutlined />} onClick={() => setResult(null)}>Xóa</AButton>}
          className="border-brand-200"
        >
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Sản phẩm">{result.productName}</Descriptions.Item>
            <Descriptions.Item label="Số lô"><span className="font-mono">{result.batchNumber}</span></Descriptions.Item>
            <Descriptions.Item label="Vị trí"><Tag color="blue">{result.location}</Tag></Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              <span className="font-bold">{result.quantity}</span>
              &nbsp;<span className="text-slate-400 text-xs">({result.reserved} đã đặt trước)</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái tồn kho">
              <StockBadge quantity={result.quantity} />
            </Descriptions.Item>
            <Descriptions.Item label="Hạn sử dụng">{formatDate(result.expiryDate)}</Descriptions.Item>
            <Descriptions.Item label="Nhà cung cấp">{result.supplierName}</Descriptions.Item>
            <Descriptions.Item label="Mã QR"><span className="font-mono text-xs">{result.qrCode}</span></Descriptions.Item>
            <Descriptions.Item label="Thời gian quét">{result.scannedAt ? new Date(result.scannedAt).toLocaleString('vi-VN') : 'Vừa xong'}</Descriptions.Item>
          </Descriptions>

          <div className="mt-4 flex gap-2">
            <AButton type="primary" size="small">Xem chi tiết</AButton>
            <AButton size="small">Cập nhật vị trí</AButton>
            <AButton size="small" danger>Gắn cờ kiểm tra</AButton>
          </div>
        </Card>
      )}
    </div>
  )
}
