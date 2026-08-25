import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Modal, Button as AButton, Tag, Progress, Input, Tabs, Space, Alert, Tooltip } from 'antd'
import { ScanOutlined, CameraOutlined, UploadOutlined, ThunderboltOutlined, CheckCircleOutlined, DeleteOutlined, BarcodeOutlined } from '@ant-design/icons'
import { orderService } from '@/services/order.service'
import { scanQRFromFile } from '@/utils/scanQRFromFile'
import toast from 'react-hot-toast'

export function OrderPackingModal({ open, onClose, orderId, orderData, onSuccess }) {
  const [order, setOrder] = useState(orderData || null)
  const [loading, setLoading] = useState(false)
  const [availableData, setAvailableData] = useState([])
  const [scannedUIDs, setScannedUIDs] = useState([])
  const [manualInput, setManualInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const [cameraScanning, setCameraScanning] = useState(false)

  const html5QrRef = useRef(null)

  const loadDetails = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const [ordRes, availRes] = await Promise.all([
        orderData ? Promise.resolve(orderData) : orderService.getAdminById(orderId),
        orderService.getAvailableUIDs(orderId).catch(() => [])
      ])
      setOrder(ordRes)
      setAvailableData(availRes)
    } catch (err) {
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [orderId, orderData])

  useEffect(() => {
    if (open) {
      setScannedUIDs([])
      setManualInput('')
      loadDetails()
    } else {
      stopCamera()
    }
  }, [open, loadDetails])

  const stopCamera = useCallback(() => {
    if (html5QrRef.current?.isScanning) {
      html5QrRef.current.stop().catch(() => {})
    }
    setCameraScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const addUID = (code) => {
    if (!code) return
    let cleanCode = code.trim()

    // Extract UID from URL if QR text is a traceability link
    if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
      try {
        const url = new URL(cleanCode)
        cleanCode = url.searchParams.get('uid') || cleanCode
      } catch (e) {
        // Fallback
      }
    }

    if (!cleanCode) return

    // Basic UUID validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(cleanCode) && cleanCode.length < 8) {
      toast.error(`INVALID QR: Code (${cleanCode}) is not a valid box UID!`, { duration: 3000 })
      return
    }

    setScannedUIDs(prev => {
      if (prev.includes(cleanCode)) {
        toast.error(`UID ${cleanCode.slice(0, 8)}... has already been scanned!`)
        return prev
      }
      toast.success(`✓ Verified medicine box: ${cleanCode.slice(0, 8)}...`)
      return [...prev, cleanCode]
    })
  }

  const removeUID = (uid) => {
    setScannedUIDs(prev => prev.filter(x => x !== uid))
  }

  const handleManualAdd = (e) => {
    e?.preventDefault()
    if (!manualInput.trim()) return
    const parts = manualInput.split(/[\s,]+/).filter(Boolean)
    parts.forEach(p => addUID(p))
    setManualInput('')
  }

  const startCamera = async () => {
    setCameraScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      html5QrRef.current = new Html5Qrcode('packing-qr-reader')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          addUID(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setCameraScanning(false)
      toast.error('Cannot access camera. Please allow camera permissions or enter UID manually.')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await scanQRFromFile(file)
      addUID(text)
    } catch (err) {
      toast.error('Cannot decode QR code from image file')
    }
  }

  const handleAutoFillUIDs = () => {
    const allAvailable = []
    availableData.forEach(item => {
      const needed = item.so_luong_yeu_cau
      const uids = (item.available_uids || []).slice(0, needed)
      allAvailable.push(...uids)
    })

    if (allAvailable.length === 0) {
      toast.error('No available UIDs found in warehouse inventory')
      return
    }

    setScannedUIDs(allAvailable)
    toast.success(`Auto-selected ${allAvailable.length} available UIDs from inventory!`)
  }

  // Calculate items summary
  const items = order?.chi_tiet_thuoc || order?.items || []
  const totalRequired = items.reduce((sum, i) => sum + (i.so_luong || i.quantity || 1), 0)
  const currentCount = scannedUIDs.length
  const percent = totalRequired > 0 ? Math.min(Math.round((currentCount / totalRequired) * 100), 100) : 0

  const handleFulfillSubmit = async () => {
    if (scannedUIDs.length === 0) {
      return toast.error('Please scan or enter at least 1 medicine package UID')
    }
    setSubmitting(true)
    try {
      await orderService.fulfillOrder(orderId || order.id, scannedUIDs)
      toast.success(`Order #${orderId || order.id} packed successfully!`)
      onSuccess?.(orderId || order.id)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Packing failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <ScanOutlined className="text-brand-600 text-lg" />
          Order Packing & QR Verification — Order #{orderId || order?.id}
        </div>
      }
      open={open}
      onCancel={() => { stopCamera(); onClose() }}
      footer={[
        <AButton key="cancel" onClick={() => { stopCamera(); onClose() }}>
          Cancel
        </AButton>,
        <AButton
          key="submit"
          type="primary"
          loading={submitting}
          disabled={scannedUIDs.length === 0}
          icon={<CheckCircleOutlined />}
          onClick={handleFulfillSubmit}
        >
          Confirm & Complete Packing ({scannedUIDs.length}/{totalRequired})
        </AButton>
      ]}
      width={720}
      destroyOnClose
    >
      <div className="space-y-4 my-2">
        {/* Progress & Overview */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
              <span>PACKING PROGRESS</span>
              <span className="font-mono text-brand-600">{currentCount} / {totalRequired} Packages</span>
            </div>
            <Progress percent={percent} status={percent === 100 ? 'success' : 'active'} strokeColor={{ '0%': '#3B82F6', '100%': '#10B981' }} />
          </div>

          <AButton
            type="dashed"
            icon={<ThunderboltOutlined className="text-amber-500" />}
            onClick={handleAutoFillUIDs}
            className="w-full sm:w-auto font-bold border-amber-300 hover:border-amber-400 text-slate-700"
          >
            ⚡ Auto-Select Stock UIDs
          </AButton>
        </div>

        {/* Product Items Required */}
        {items.length > 0 && (
          <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Order Line Items</span>
              <span>Quantity</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800">{it.ten_thuoc || it.name}</span>
                    <span className="text-slate-400 ml-2">({it.ten_don_vi || it.unit || 'Box'})</span>
                  </div>
                  <Tag color="blue" className="font-bold font-mono">
                    x{it.so_luong || it.quantity}
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Methods Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k)
            if (k !== 'camera') stopCamera()
          }}
          items={[
            {
              key: 'manual',
              label: <span><BarcodeOutlined /> Barcode Scanner / Manual Input</span>,
              children: (
                <div className="space-y-3 pt-2">
                  <form onSubmit={handleManualAdd} className="flex gap-2">
                    <Input
                      placeholder="Scan barcode or paste UID here..."
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      autoFocus
                    />
                    <AButton type="primary" onClick={handleManualAdd}>Add UID</AButton>
                  </form>
                  <p className="text-xs text-slate-400 italic">
                    * You can use handheld USB / Bluetooth barcode scanners to scan codes directly into this input field.
                  </p>
                </div>
              )
            },
            {
              key: 'camera',
              label: <span><CameraOutlined /> Live Camera Scan</span>,
              children: (
                <div className="space-y-3 pt-2 text-center">
                  {!cameraScanning ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center gap-3">
                      <CameraOutlined className="text-4xl text-slate-400" />
                      <p className="text-sm font-medium text-slate-600">Use device webcam or camera to scan QR codes on medicine boxes</p>
                      <AButton type="primary" icon={<CameraOutlined />} onClick={startCamera}>
                        Start Camera Scanner
                      </AButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div id="packing-qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-brand-500 shadow-md" />
                      <AButton danger onClick={stopCamera}>Stop Camera</AButton>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'file',
              label: <span><UploadOutlined /> Upload QR Image</span>,
              children: (
                <div className="pt-2">
                  <label className="border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer text-center">
                    <UploadOutlined className="text-3xl text-brand-600 mb-2" />
                    <span className="text-sm font-bold text-slate-700">Upload image file containing QR</span>
                    <span className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )
            }
          ]}
        />

        {/* Scanned UIDs list */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Scanned Item UIDs ({scannedUIDs.length})
            </span>
            {scannedUIDs.length > 0 && (
              <AButton size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setScannedUIDs([])}>
                Clear All
              </AButton>
            )}
          </div>

          {scannedUIDs.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 italic">
              No UIDs scanned yet. Please use one of the tools above to scan packages.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-100 rounded-xl">
              {scannedUIDs.map((uid, idx) => (
                <Tag
                  key={uid}
                  closable
                  onClose={() => removeUID(uid)}
                  color="blue"
                  className="font-mono text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5 font-bold"
                >
                  <span>#{idx + 1}</span>
                  <span className="truncate max-w-[180px]">{uid}</span>
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
