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
      setError('Cannot access camera. Please allow camera permissions or enter UID manually.')
      toast.error('Failed to open camera')
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
      toast.success('Decoded QR image successfully!')
      handleScan(decodedText)
    } catch (err) {
      console.error('[QR File Scan Error]', err)
      setError('No valid QR code found in this image. Please select another image.')
      toast.error('Image scan failed')
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
      toast.success('QR Code scanned successfully')
    } catch {
      setError('No inventory found for this QR code.')
      toast.error('QR scan failed')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSearch = () => handleScan(manualCode)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <QrcodeOutlined /> Warehouse QR Scanner
        </h1>
        <p className="text-slate-500 text-sm mt-1">Scan product QR codes to inspect inventory data & traceability status</p>
      </div>

      <Card title="Camera Scanner">
        {scanning ? (
          <div className="rounded-xl overflow-hidden border border-brand-500 bg-black relative mb-4">
            <div id="qr-reader-warehouse" ref={scannerEl} className="w-full h-[300px]" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <AButton type="primary" danger onClick={stopCamera}>
                Stop Camera
              </AButton>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 mb-4">
            <QrcodeOutlined className="text-5xl text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium mb-1">Point camera at QR code</p>
            <p className="text-xs text-slate-400 mb-4">Camera permissions required for live video scanning</p>
            
            <div className="flex gap-3">
              <AButton
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={startCamera}
              >
                Start Camera Scanner
              </AButton>
              
              <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer text-sm font-medium shadow-sm">
                Upload QR Image
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

        {/* Manual search */}
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="Or enter UID / QR code manually…"
            className="input flex-1"
          />
          <AButton
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleManualSearch}
          >
            Search
          </AButton>
        </div>
      </Card>

      {loading && <InlineLoader text="Looking up inventory…" />}

      {error && <Alert message={error} type="error" showIcon />}

      {result && (
        <Card
          title={<span className="flex items-center gap-2"><QrcodeOutlined className="text-brand-500" /> Scan Result</span>}
          extra={<AButton size="small" icon={<ReloadOutlined />} onClick={() => setResult(null)}>Clear</AButton>}
          className="border-brand-200"
        >
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Product">{result.productName}</Descriptions.Item>
            <Descriptions.Item label="Batch / Lot"><span className="font-mono">{result.batchNumber}</span></Descriptions.Item>
            <Descriptions.Item label="Location"><Tag color="blue">{result.location}</Tag></Descriptions.Item>
            <Descriptions.Item label="Quantity">
              <span className="font-bold">{result.quantity}</span>
              &nbsp;<span className="text-slate-400 text-xs">({result.reserved} reserved)</span>
            </Descriptions.Item>
            <Descriptions.Item label="Stock Status">
              <StockBadge quantity={result.quantity} />
            </Descriptions.Item>
            <Descriptions.Item label="Expiry Date">{formatDate(result.expiryDate)}</Descriptions.Item>
            <Descriptions.Item label="Supplier">{result.supplierName}</Descriptions.Item>
            <Descriptions.Item label="QR Code"><span className="font-mono text-xs">{result.qrCode}</span></Descriptions.Item>
            <Descriptions.Item label="Scanned At">{result.scannedAt ? new Date(result.scannedAt).toLocaleString() : 'Just now'}</Descriptions.Item>
          </Descriptions>

          <div className="mt-4 flex gap-2">
            <AButton type="primary" size="small">View Details</AButton>
            <AButton size="small">Update Location</AButton>
            <AButton size="small" danger>Flag for Inspection</AButton>
          </div>
        </Card>
      )}
    </div>
  )
}
