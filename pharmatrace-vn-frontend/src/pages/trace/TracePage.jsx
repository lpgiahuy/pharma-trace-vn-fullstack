import { useState, useEffect, useRef, useCallback } from 'react'
import { Timeline, Alert, Descriptions, Tag, Tooltip } from 'antd'
import {
  QrcodeOutlined, SearchOutlined, ReloadOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
  SafetyOutlined, EnvironmentOutlined, ExperimentOutlined,
  GlobalOutlined, AuditOutlined, StopOutlined,
} from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'
import {
  Shield, ShieldAlert, ShieldX, ShieldCheck,
  Package, Factory, Truck, Store, FlaskConical,
  MapPin, Clock, Eye, AlertTriangle, QrCode,
  ChevronRight, RotateCcw, Trash2, History,
  ScanLine, CheckCircle2, XCircle, Info,
  ArrowLeft, PackageCheck,
} from 'lucide-react'
import { traceService, DEMO_CODES } from '@/services/trace.service'
import { formatDate, formatDateTime, cn } from '@/utils'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { scanQRFromFile } from '@/utils/scanQRFromFile'


// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  authentic: {
    label:       'CHÍNH HÃNG — XÁC THỰC LẦN ĐẦU',
    color:       'text-emerald-700',
    bg:          'bg-emerald-50',
    border:      'border-emerald-300',
    iconBg:      'bg-emerald-100',
    badgeBg:     'bg-emerald-500',
    glowClass:   'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    Icon:        ShieldCheck,
    AntIcon:     CheckCircleOutlined,
    antColor:    'green',
    alertType:   'success',
    message:     'Sản phẩm chính hãng trong chuỗi phân phối PharmaTrace. Kích hoạt bảo mật thành công lần đầu tiên!',
  },
  repeated_authentic: {
    label:       'SẢN PHẨM CHÍNH HÃNG (ĐÃ KÍCH HOẠT TRƯỚC ĐÓ)',
    color:       'text-blue-700',
    bg:          'bg-blue-50',
    border:      'border-blue-300',
    iconBg:      'bg-blue-100',
    badgeBg:     'bg-blue-500',
    glowClass:   'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    Icon:        ShieldCheck,
    AntIcon:     CheckCircleOutlined,
    antColor:    'blue',
    alertType:   'info',
    message:     'Sản phẩm chính hãng đã kích hoạt trước đó. Nếu bạn là người mua sản phẩm này, bạn hoàn toàn có thể yên tâm sử dụng.',
  },
  activated_need_pin: {
    label:       'MÃ VẬN HÀNH (ĐÃ KÍCH HOẠT MÃ PIN TRƯỚC ĐÓ)',
    color:       'text-blue-700',
    bg:          'bg-blue-50',
    border:      'border-blue-300',
    iconBg:      'bg-blue-100',
    badgeBg:     'bg-blue-500',
    glowClass:   'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    Icon:        ShieldCheck,
    AntIcon:     CheckCircleOutlined,
    antColor:    'blue',
    alertType:   'info',
    message:     'Mã vận hành ngoài vỏ hộp hợp lệ. Mã bảo mật của hộp thuốc này đã được kích hoạt trước đó. Bạn có thể nhập mã PIN cào bên dưới để đối soát xác thực.',
  },
  pin_required: {
    label:       'MÃ VẬN HÀNH (CHƯA XÁC THỰC MÃ PIN)',
    color:       'text-amber-700',
    bg:          'bg-amber-50',
    border:      'border-amber-300',
    iconBg:      'bg-amber-100',
    badgeBg:     'bg-amber-500',
    glowClass:   'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    Icon:        ShieldAlert,
    AntIcon:     WarningOutlined,
    antColor:    'warning',
    alertType:   'warning',
    message:     'Mã vận hành ngoài vỏ hộp hợp lệ. Để xác thực chính hãng 100%, vui lòng cào lớp bạc trên tem và quét mã QR hoặc nhập mã PIN bên dưới.',
  },
  invalid_pin: {
    label:       'MÃ PIN KHÔNG CHÍNH XÁC',
    color:       'text-red-800',
    bg:          'bg-red-50',
    border:      'border-red-400',
    iconBg:      'bg-red-100',
    badgeBg:     'bg-red-600',
    glowClass:   'shadow-[0_0_40px_rgba(220,38,38,0.22)]',
    Icon:        ShieldX,
    AntIcon:     CloseCircleOutlined,
    antColor:    'error',
    alertType:   'error',
    message:     'Mã PIN bảo mật không chính xác. Vui lòng kiểm tra lại lớp cào hoặc liên hệ nhà thuốc nếu nghi ngờ tem bị làm giả.',
  },
  warning: {
    label:       'HOẠT ĐỘNG ĐÁNG NGỜ',
    color:       'text-amber-700',
    bg:          'bg-amber-50',
    border:      'border-amber-300',
    iconBg:      'bg-amber-100',
    badgeBg:     'bg-amber-500',
    glowClass:   'shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    Icon:        ShieldAlert,
    AntIcon:     WarningOutlined,
    antColor:    'warning',
    alertType:   'warning',
    message:     'Mã này có dấu hiệu quét bất thường. Vui lòng kiểm tra với dược sĩ trước khi sử dụng.',
  },
  recalled: {
    label:       'LÔ THUỐC BỊ THU HỒI',
    color:       'text-red-700',
    bg:          'bg-red-50',
    border:      'border-red-300',
    iconBg:      'bg-red-100',
    badgeBg:     'bg-red-500',
    glowClass:   'shadow-[0_0_40px_rgba(239,68,68,0.18)]',
    Icon:        ShieldX,
    AntIcon:     StopOutlined,
    antColor:    'error',
    alertType:   'error',
    message:     'KHÔNG ĐƯỢC DÙNG. Lô thuốc này đã có quyết định thu hồi. Vui lòng liên hệ điểm mua để hoàn trả.',
  },
  fake: {
    label:       'CẢNH BÁO NGUY CƠ HÀNG GIẢ',
    color:       'text-red-800',
    bg:          'bg-red-50',
    border:      'border-red-400',
    iconBg:      'bg-red-100',
    badgeBg:     'bg-red-600',
    glowClass:   'shadow-[0_0_40px_rgba(220,38,38,0.22)]',
    Icon:        ShieldX,
    AntIcon:     CloseCircleOutlined,
    antColor:    'error',
    alertType:   'error',
    message:     'CẢNH BÁO: Mã sản phẩm này không thể xác minh hoặc vi phạm giới hạn quét an toàn. Nguy cơ hàng giả, không được sử dụng!',
  },
}

const CHAIN_ICONS = {
  warehouse_receipt:  { Icon: Package,      color: 'text-brand-500',   bg: 'bg-brand-50',   label: 'Nhập kho lưu trữ'   },
  quality_check:      { Icon: FlaskConical, color: 'text-purple-500',  bg: 'bg-purple-50',  label: 'Kiểm định chất lượng'},
  warehouse_transfer: { Icon: Truck,        color: 'text-cyan-500',    bg: 'bg-cyan-50',    label: 'Điều chuyển kho'    },
  packaging:          { Icon: PackageCheck, color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Đóng gói đơn hàng'  },
  shipping:           { Icon: Truck,        color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Bàn giao vận chuyển'},
  delivery_success:   { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Giao hàng thành công'},
  retail_dispatch:    { Icon: Store,        color: 'text-green-500',   bg: 'bg-green-50',   label: 'Xuất nhà thuốc'     },
  recall_initiated:   { Icon: AlertTriangle,color: 'text-red-500',     bg: 'bg-red-50',     label: 'Phát lệnh thu hồi'  },
}

// ─── Scan history helpers ─────────────────────────────────────────────────────
const HISTORY_KEY = 'pharma_scan_history'
const getScanHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] } }
const pushScanHistory = (entry) => {
  const hist = [entry, ...getScanHistory().filter(h => h.code !== entry.code)].slice(0, 10)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist))
}

const parseQRText = (text) => {
  try {
    const trimmed = (text || '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const uid = url.searchParams.get('uid') || '';
      const sig = url.searchParams.get('sig') || '';
      const pin = url.searchParams.get('pin') || '';
      return { uid, sig, pin };
    }
  } catch (e) {
    // Ignore URL parse error, fallback to raw text
  }
  return { uid: text, sig: '', pin: '' };
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function TracePage() {
  const [inputCode,     setInputCode]     = useState('')
  const [pinInput,      setPinInput]      = useState('')
  const [pinLoading,    setPinLoading]    = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [result,        setResult]        = useState(null)
  const [error,         setError]         = useState(null)
  const [scanHistory,   setScanHistory]   = useState([])
  const [showHistory,   setShowHistory]   = useState(false)
  const [scanning,      setScanning]      = useState(false)
  const [reported,      setReported]      = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const inputRef  = useRef(null)
  const scannerEl = useRef(null)
  const resultsRef = useRef(null)
  const html5Qr   = useRef(null)

  const location = useLocation()

  useEffect(() => {
    setScanHistory(getScanHistory())
    
    // Check for UID in navigation state (passed from HomePage)
    const stateUid = location.state?.uid
    const openScanner = location.state?.openScanner
    if (stateUid) {
      setInputCode(stateUid)
      handleTrace(stateUid)
      window.history.replaceState({}, document.title)
    } else if (openScanner) {
      startCamera()
      window.history.replaceState({}, document.title)
    } else {
      // Check for UID, sig, and pin in URL query parameters
      const params = new URLSearchParams(location.search)
      const urlUid = params.get('uid')
      const urlSig = params.get('sig')
      const urlPin = params.get('pin')
      if (urlUid) {
        setInputCode(urlUid)
        if (urlPin) setPinInput(urlPin)
        handleTrace(urlUid, urlSig, urlPin)
        window.history.replaceState({}, document.title, location.pathname)
      }
    }

    return () => stopCamera()
  }, [location.state, location.search])

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  // ── Camera QR Scanner ─────────────────────────────────────────────────────
  const startCamera = async () => {
    setScanning(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      html5Qr.current = new Html5Qrcode('qr-reader')
      await html5Qr.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCamera()
          handleTrace(decodedText)
        },
        () => {}
      )
    } catch (err) {
      setScanning(false)
      setError('Không thể mở camera. Vui lòng cấp quyền hoặc nhập thủ công.')
    }
  }

  const stopCamera = useCallback(() => {
    if (html5Qr.current?.isScanning) {
      html5Qr.current.stop().catch(() => {})
    }
    setScanning(false)
  }, [])

  // ── File upload QR scanner (for testing) ──────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)
    setReported(false)

    try {
      const decodedText = await scanQRFromFile(file)
      toast.success('Giải mã ảnh QR thành công!')
      handleTrace(decodedText)
    } catch (err) {
      console.error('[QR File Scan Error]', err)
      setError({ type: 'invalid', msg: 'Không thể tìm thấy mã QR hợp lệ trong ảnh này. Vui lòng chọn ảnh khác.' })
      toast.error('Quét ảnh thất bại')
    } finally {
      setLoading(false)
    }
  }

  // ── Trace lookup ──────────────────────────────────────────────────────────
  const handleTrace = async (code = inputCode, explicitSig = '', explicitPin = '') => {
    const trimmed = (code || '').trim()
    const { uid, sig, pin } = parseQRText(trimmed)
    if (!uid) { inputRef.current?.focus(); return }

    setLoading(true)
    setResult(null)
    setError(null)
    setReported(false)
    setActiveSection('overview')

    try {
      const finalSig = explicitSig || sig
      const finalPin = explicitPin || pin || pinInput
      const data = await traceService.traceCode(uid, finalSig, finalPin)
      setResult(data)
      pushScanHistory({ code: uid, status: data.status, product: data.product?.name, scannedAt: new Date().toISOString() })
      setScanHistory(getScanHistory())
    } catch (err) {
      console.error('[Trace Error]', err)
      const errorMsg = err.response?.data?.message || err.message
      if (err.response?.status === 404 || errorMsg === 'CODE_NOT_FOUND') {
        setError({ type: 'not_found', code: uid })
      } else if (err.response?.status === 400 || errorMsg?.includes('chữ ký') || errorMsg?.includes('signature') || errorMsg === 'INVALID_CODE') {
        setError({ type: 'invalid', code: uid, msg: errorMsg })
      } else {
        setError({ type: 'network', msg: errorMsg })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPin = async (overridePin = null) => {
    const targetPin = (overridePin || pinInput).trim()
    if (!targetPin) return toast.error('Vui lòng nhập mã PIN cào')
    
    const targetUid = (result?.uid || result?.box_info?.uid || inputCode || '').trim()
    if (!targetUid) {
      return toast.error('Vui lòng nhập hoặc quét mã UID vỏ hộp thuốc trước')
    }

    setPinLoading(true)
    try {
      const data = await traceService.traceCode(targetUid, '', targetPin)
      setResult(data)
      if (data.status === 'authentic') {
        toast.success('🎉 Xác thực chính hãng thành công lần đầu tiên!')
      } else if (data.status === 'repeated_authentic') {
        toast.success('✓ Sản phẩm chính hãng (Đã kích hoạt trước đó)!')
      } else if (data.status === 'invalid_pin') {
        toast.error('🔴 Mã PIN không chính xác! Vui lòng kiểm tra lại lớp cào.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác thực PIN thất bại')
    } finally {
      setPinLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null); setError(null); setInputCode(''); setPinInput(''); setReported(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleHistorySelect = (code) => {
    setInputCode(code); setShowHistory(false)
    handleTrace(code)
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setScanHistory([])
  }

  // ─────────────────────────────────────────────────────────────────────────
  const cfg = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.authentic : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-sans">
      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(11,125,232,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(11,125,232,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative page-container py-10">
          <div className="flex justify-between items-center mb-8">
            <Link 
              to="/" 
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-widest">
              <ScanLine className="w-3.5 h-3.5" />
              Pharmaceutical Traceability
            </div>
            
            <div className="w-20 hidden sm:block" /> {/* Spacer */}
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 text-white leading-tight">
              Verify Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Medicine's Journey</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
              Scan or enter a QR code to trace your product's complete supply chain — from factory to your hands.
            </p>

            {/* ── Search box ────────────────────────────────────────────── */}
            <div className="max-w-xl mx-auto">
              <div className="relative flex gap-2 p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
                <div className="relative flex-1">
                  <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTrace()}
                    onFocus={() => scanHistory.length && setShowHistory(true)}
                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                    placeholder="QR code or UID (e.g. QR-BATCH-0001)"
                    className={cn("w-full pl-11 py-3.5 bg-transparent text-white placeholder:text-slate-500 text-sm rounded-xl focus:outline-none", inputCode ? 'pr-9' : 'pr-4')}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {inputCode && (
                    <button onClick={() => setInputCode('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* History dropdown */}
                  {showHistory && scanHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-modal">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                        <span className="text-xs text-slate-500 flex items-center gap-1"><History className="w-3 h-3" /> Recent Scans</span>
                        <button onClick={clearHistory} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>
                      </div>
                      {scanHistory.map((h, i) => (
                        <button key={i} onMouseDown={() => handleHistorySelect(h.code)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
                          <div className={cn('w-2 h-2 rounded-full shrink-0', {
                            'bg-emerald-400': h.status === 'authentic',
                            'bg-amber-400':   h.status === 'warning',
                            'bg-red-400':     h.status === 'recalled' || h.status === 'fake',
                          })} />
                          <span className="text-sm font-mono text-slate-300">{h.code}</span>
                          <span className="text-xs text-slate-500 ml-auto">{h.product || '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={scanning ? stopCamera : startCamera}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5',
                    scanning
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-white/8 text-slate-300 border border-white/10 hover:bg-white/15'
                  )}
                  title={scanning ? 'Stop camera' : 'Scan with camera'}
                >
                  <QrcodeOutlined />
                  <span className="hidden sm:inline">{scanning ? 'Stop' : 'Scan'}</span>
                </button>

                <button
                  onClick={() => handleTrace()}
                  disabled={loading || !inputCode.trim()}
                  className="shrink-0 px-5 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  {loading ? <Spinner size="sm" className="text-white" /> : <SearchOutlined />}
                  <span className="hidden sm:inline">Trace</span>
                </button>
              </div>

              {/* Image upload scanning option */}
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-500">Hoặc: </span>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[14px]">upload_file</span>
                  Tải ảnh QR lên để quét
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Demo Test Cases */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-medium text-slate-300 mb-3.5 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <FlaskConical className="w-3.5 h-3.5 text-brand-400" />
                  Kịch bản thử nghiệm quy trình truy xuất (Test Cases)
                </p>

                <div className="space-y-3 max-w-4xl mx-auto">
                  {/* Row 1: 3 Test Cases */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {DEMO_CODES.slice(0, 3).map((d, idx) => (
                      <button
                        key={idx}
                        onClick={() => { 
                          setInputCode(d.code)
                          setPinInput(d.pin || '')
                          handleTrace(d.code, '', d.pin || '') 
                        }}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-brand-400 hover:bg-slate-800/90 transition-all text-left group flex flex-col justify-between shadow-sm min-h-[90px]"
                      >
                        <div className="flex items-center mb-2">
                          <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 leading-none", d.badgeClass)}>
                            <span className="material-symbols-outlined text-[13px]">{d.icon}</span>
                            {d.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 group-hover:text-brand-300 transition-colors leading-snug">
                          {d.label}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Row 2: 2 Test Cases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
                    {DEMO_CODES.slice(3, 5).map((d, idx) => (
                      <button
                        key={idx + 3}
                        onClick={() => { 
                          setInputCode(d.code)
                          setPinInput(d.pin || '')
                          handleTrace(d.code, '', d.pin || '') 
                        }}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-brand-400 hover:bg-slate-800/90 transition-all text-left group flex flex-col justify-between shadow-sm min-h-[90px]"
                      >
                        <div className="flex items-center mb-2">
                          <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 leading-none", d.badgeClass)}>
                            <span className="material-symbols-outlined text-[13px]">{d.icon}</span>
                            {d.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 group-hover:text-brand-300 transition-colors leading-snug">
                          {d.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Camera viewer */}
              {scanning && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-brand-500/40 bg-black relative">
                  <div id="qr-reader" ref={scannerEl} className="w-full" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-brand-400 rounded-xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-lg" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-400/60 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 py-2">Align QR code within the frame</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="page-container pb-20 max-w-4xl">

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-10 space-y-4 animate-pulse">
            <div className="h-32 bg-white/5 rounded-2xl" />
            <div className="h-64 bg-white/5 rounded-2xl" />
            <div className="h-48 bg-white/5 rounded-2xl" />
            <div className="text-center text-slate-500 text-sm mt-4 flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-brand-400" />
              Đang truy vấn hệ thống dữ liệu xác thực...
            </div>
          </div>
        )}

        {/* Error states */}
        {!loading && error && <ErrorPanel error={error} onRetry={handleReset} />}

        {/* Result */}
        {!loading && result && cfg && (
          <div ref={resultsRef} className="mt-8 space-y-5 animate-fade-in scroll-mt-10">

            {/* ── Status banner ─────────────────────────────────────── */}
            <StatusBanner result={result} cfg={cfg} onReset={handleReset} reported={reported} onReport={() => setReported(true)} />

            {/* ── Dual-Code Scratch PIN Verification Panel ────────────── */}
            <ScratchPinCard
              result={result}
              pinInput={pinInput}
              setPinInput={setPinInput}
              onVerifyPin={handleVerifyPin}
              loading={pinLoading}
            />

            {/* ── Recalled alert ────────────────────────────────────── */}
            {result.status === 'recalled' && result.recallInfo && (
              <RecallAlert recall={result.recallInfo} />
            )}

            {/* ── Section tabs ──────────────────────────────────────── */}
            {result.status !== 'fake' && (
              <>
                <SectionTabs active={activeSection} onChange={setActiveSection} hasImport={!!result.importation} />

                <div className="animate-fade-in">
                  {activeSection === 'overview'  && <OverviewSection    result={result} cfg={cfg} />}
                  {activeSection === 'chain'     && <SupplyChainSection result={result} />}
                  {activeSection === 'verify'    && <VerificationSection result={result} cfg={cfg} />}
                  {activeSection === 'compliance'&& <ComplianceSection  result={result} />}
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="text-center py-20 text-slate-600">
            <ScanLine className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Enter a code above to begin tracing</p>
          </div>
        )}
      </div>

      {/* Scan animation keyframe (injected inline) */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-50%); opacity: 0; }
          20%, 80%  { opacity: 1; }
          50%       { transform: translateY(50%); }
        }
      `}</style>
    </div>
  )
}

// ─── StatusBanner ─────────────────────────────────────────────────────────────
function StatusBanner({ result, cfg, onReset, reported, onReport }) {
  const { Icon } = cfg
  return (
    <div className={cn('rounded-2xl border p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center', cfg.bg, cfg.border, cfg.glowClass)}>
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', cfg.iconBg)}>
        <Icon className={cn('w-7 h-7', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-xs font-bold uppercase tracking-widest mb-1', cfg.color)}>{cfg.label}</div>
        <h2 className="text-lg font-display font-bold text-slate-900 line-clamp-1">{result.product?.name || 'Unknown Product'}</h2>
        <p className="text-sm text-slate-600 mt-0.5">{cfg.message}</p>
        {result.status === 'fake' && (
          <p className="text-xs text-red-700 mt-1 bg-red-100 rounded-lg px-2 py-1 font-medium">
            {!result.verification?.freqCheckPassed
              ? 'Phát hiện quét tần suất cao bất thường (≥10 lần/phút).'
              : 'Phát hiện di chuyển bất khả thi giữa các lần quét (>1000 km/h).'}
          </p>
        )}
        {result.status === 'warning' && (
          <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded-lg px-2 py-1">
            Sản phẩm được đánh dấu nghi ngờ trong hệ thống.
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {(result.status === 'fake' || result.status === 'warning') && !reported && (
          <button onClick={onReport} className="px-3 py-2 text-xs rounded-xl bg-red-100 text-red-600 hover:bg-red-200 font-medium flex items-center gap-1 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" /> Report
          </button>
        )}
        {reported && <span className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-500 font-medium">Reported ✓</span>}
        <button onClick={onReset} className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium flex items-center gap-1 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> New Scan
        </button>
      </div>
    </div>
  )
}

// ─── RecallAlert ──────────────────────────────────────────────────────────────
function RecallAlert({ recall }) {
  return (
    <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <StopOutlined className="text-red-500 text-xl" />
        </div>
        <div>
          <p className="font-bold text-red-800 text-base">Recall Notice — {recall.severity}</p>
          <p className="text-xs text-red-500 font-mono">Ref: {recall.regulatoryRef} · ID: {recall.recallId}</p>
        </div>
        <Tag color="error" className="ml-auto shrink-0">{recall.status}</Tag>
      </div>
      <Descriptions size="small" column={2} className="mb-3">
        <Descriptions.Item label="Reason"         span={2}>{recall.reason}</Descriptions.Item>
        <Descriptions.Item label="Recall Date">  {formatDate(recall.recallDate)}</Descriptions.Item>
        <Descriptions.Item label="Affected Units">{recall.affectedUnits?.toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Recovered">    {recall.recoveredUnits?.toLocaleString()}</Descriptions.Item>
      </Descriptions>
      <div className="bg-red-100 rounded-xl px-4 py-3 text-sm font-semibold text-red-800 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">warning</span> {recall.instruction}
      </div>
    </div>
  )
}

// ─── SectionTabs ─────────────────────────────────────────────────────────────
function SectionTabs({ active, onChange, hasImport }) {
  const TABS = [
    { id: 'overview',   label: 'Product Info',    Icon: Package },
    { id: 'chain',      label: 'Supply Chain',    Icon: Truck },
    { id: 'verify',     label: 'Verification',    Icon: Shield },
    { id: 'compliance', label: 'Compliance',      Icon: CheckCircle2 },
  ]
  return (
    <div className="flex gap-1 p-1 bg-white/5 backdrop-blur border border-white/8 rounded-2xl overflow-x-auto no-scrollbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
            active === id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── OverviewSection ──────────────────────────────────────────────────────────
function OverviewSection({ result }) {
  const { product, manufacturing, importation } = result
  return (
    <div className="space-y-4">
      {/* Product card */}
      <div className="card p-5 flex gap-5">
        {product?.image && (
          <img src={product.image} alt={product.name} className="w-24 h-24 rounded-xl object-contain bg-slate-50 border border-surface-border p-2 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <Tag color="blue">{product?.category}</Tag>
            <Tag>{product?.brand}</Tag>
            {product?.sku && <Tag className="font-mono text-xs">{product.sku}</Tag>}
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900">{product?.name}</h3>
          {product?.description && <p className="text-sm text-slate-500 mt-1">{product.description}</p>}
          {product?.registrationNumber && (
            <p className="text-xs text-slate-400 mt-2 font-mono">MOH Reg: {product.registrationNumber}</p>
          )}
        </div>
      </div>

      {/* Manufacturing */}
      <InfoCard title="Manufacturing" Icon={Factory} iconColor="text-purple-500" iconBg="bg-purple-50">
        <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Manufacturer">{manufacturing?.manufacturer}</Descriptions.Item>
          <Descriptions.Item label="Country">{manufacturing?.country}</Descriptions.Item>
          <Descriptions.Item label="Facility">{manufacturing?.facility}</Descriptions.Item>
          <Descriptions.Item label="GMP Certified">
            {manufacturing?.gmpCertified
              ? <Tag color="green">✓ {manufacturing.certificationBody}</Tag>
              : <Tag color="red">Not Certified</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Production Date">{formatDate(manufacturing?.productionDate)}</Descriptions.Item>
          <Descriptions.Item label="Expiry Date">
            <ExpiryTag date={manufacturing?.expiryDate} />
          </Descriptions.Item>
          <Descriptions.Item label="Batch Number"><span className="font-mono">{manufacturing?.batchNumber}</span></Descriptions.Item>
          <Descriptions.Item label="Lot Number"><span className="font-mono">{manufacturing?.lotNumber}</span></Descriptions.Item>
        </Descriptions>
      </InfoCard>

      {/* Importation */}
      {importation && (
        <InfoCard title="Import & Customs" Icon={GlobalOutlined} iconColor="text-cyan-500" iconBg="bg-cyan-50" antIcon>
          <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Importer">{importation.importer}</Descriptions.Item>
            <Descriptions.Item label="Import Date">{formatDate(importation.importDate)}</Descriptions.Item>
            <Descriptions.Item label="License No"><span className="font-mono">{importation.importLicense}</span></Descriptions.Item>
            <Descriptions.Item label="Port of Entry">{importation.portOfEntry}</Descriptions.Item>
            <Descriptions.Item label="Customs"><Tag color={importation.customsClearance === 'CLEARED' ? 'green' : 'orange'}>{importation.customsClearance}</Tag></Descriptions.Item>
            <Descriptions.Item label="Inspection"><Tag color={importation.inspectionResult === 'PASSED' ? 'green' : 'red'}>{importation.inspectionResult}</Tag></Descriptions.Item>
          </Descriptions>
        </InfoCard>
      )}
    </div>
  )
}

// ─── SupplyChainSection ───────────────────────────────────────────────────────
function SupplyChainSection({ result }) {
  const { distribution } = result
  if (!distribution?.length) return <EmptySection message="Chưa có dữ liệu hành trình phân phối." />

  const timelineItems = distribution.map((step, i) => {
    const cfg = CHAIN_ICONS[step.type] || CHAIN_ICONS.warehouse_receipt
    const { Icon } = cfg
    const isRecall = step.type === 'recall_initiated'
    const isSuccess = step.type === 'delivery_success'

    return {
      dot: (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border-2 shadow-sm', 
          isRecall ? 'bg-red-50 border-red-300' : 
          isSuccess ? 'bg-emerald-50 border-emerald-400' :
          `${cfg.bg} border-transparent`
        )}>
          <Icon className={cn('w-4 h-4', 
            isRecall ? 'text-red-500' : 
            isSuccess ? 'text-emerald-600' : 
            cfg.color
          )} />
        </div>
      ),
      color: isRecall ? 'red' : isSuccess ? 'green' : 'blue',
      children: (
        <div className={cn('mb-3 p-4 rounded-xl border transition-all shadow-sm', 
          isRecall ? 'bg-red-50/70 border-red-200' : 
          isSuccess ? 'bg-emerald-50/50 border-emerald-200' :
          'bg-white border-slate-200 hover:border-brand-300'
        )}>
          {/* Header Row: Category Title + Date/Time on Left, Tag on Right */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={cn('text-xs font-bold uppercase tracking-wider shrink-0', 
                isRecall ? 'text-red-600' : 
                isSuccess ? 'text-emerald-700' :
                'text-brand-600'
              )}>
                {step.label || cfg.label}
              </span>
              <span className="text-xs text-slate-400 font-mono shrink-0">
                {formatDateTime(step.date)}
              </span>
            </div>

            {step.verified && (
              <Tag color="green" className="text-[11px] font-medium m-0 py-0 px-2 leading-5 border-emerald-300 rounded-md shrink-0 ml-auto">
                Đã xác thực ✓
              </Tag>
            )}
          </div>

          {/* Location Row */}
          <p className="font-semibold text-sm text-slate-800 mb-1 leading-snug">{step.location}</p>
          {step.coordinates && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mb-1 font-mono">
              <MapPin className="w-3 h-3" /> {step.coordinates.lat.toFixed(4)}, {step.coordinates.lng.toFixed(4)}
            </p>
          )}
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.notes}</p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span><strong className="text-slate-700 font-medium">Đơn vị thực hiện:</strong> {step.handler}</span>
          </div>
        </div>
      ),
    }
  })

  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Truck className="w-5 h-5 text-brand-500" /> Hành Trình Chuỗi Cung Ứng & Phân Phối
        <span className="ml-auto text-xs text-slate-400 font-normal">{distribution.length} mốc lưu chuyển</span>
      </h3>
      <Timeline items={timelineItems} />
    </div>
  )
}

// ─── VerificationSection ──────────────────────────────────────────────────────
function VerificationSection({ result, cfg }) {
  const { verification } = result
  const { Icon } = cfg

  const allPassed = verification?.freqCheckPassed && verification?.speedCheckPassed

  const checks = [
    {
      id:        'freq',
      Icon:      Eye,
      label:     'Kiểm tra tần suất quét',
      detail:    `Tối đa ${verification?.maxScansPerMinute ?? 0} lần/phút trong 24h qua · Ngưỡng phát hiện giả: ≥ 10 lần/phút`,
      passed:    verification?.freqCheckPassed ?? true,
      passLabel: 'Bình thường',
      failLabel: 'Bất thường — quét quá nhanh',
    },
    {
      id:        'speed',
      Icon:      MapPin,
      label:     'Kiểm tra vận tốc di chuyển',
      detail:    'Vận tốc giữa hai lần quét có tọa độ · Ngưỡng phát hiện giả: > 1000 km/h',
      passed:    verification?.speedCheckPassed ?? true,
      passLabel: 'Không bất thường',
      failLabel: 'Phát hiện di chuyển bất khả thi',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Overall status badge */}
      <div className={cn('rounded-2xl p-6 border text-center', cfg.bg, cfg.border, cfg.glowClass)}>
        <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4', cfg.iconBg)}>
          <Icon className={cn('w-10 h-10', cfg.color)} />
        </div>
        <p className={cn('text-2xl font-display font-bold', cfg.color)}>{cfg.label}</p>
        <p className="text-slate-600 text-sm mt-2">{cfg.message}</p>
      </div>

      {/* SQL fraud detection checks */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-500" />
          Kết quả kiểm tra chống hàng giả
          <Tag color={allPassed ? 'green' : 'red'} className="ml-auto">
            {allPassed ? '✓ Không phát hiện gian lận' : '✗ Phát hiện dấu hiệu giả mạo'}
          </Tag>
        </h3>
        <div className="space-y-3">
          {checks.map(({ id, Icon: CheckIcon, label, detail, passed, passLabel, failLabel }) => (
            <div key={id} className={cn(
              'flex items-center gap-4 p-4 rounded-xl border',
              passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', passed ? 'bg-green-100' : 'bg-red-100')}>
                <CheckIcon className={cn('w-4.5 h-4.5', passed ? 'text-green-600' : 'text-red-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
              </div>
              <Tag color={passed ? 'green' : 'red'} className="shrink-0 font-semibold">
                {passed ? passLabel : failLabel}
              </Tag>
            </div>
          ))}
        </div>
      </div>

      {/* Scan history stats */}
      <InfoCard title="Lịch sử quét" Icon={Eye} iconColor="text-indigo-500" iconBg="bg-indigo-50">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-slate-900">{verification?.totalScans ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Tổng lần quét</p>
          </div>
          <div className="text-center border-x border-surface-border">
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {verification?.firstScanDate ? formatDateTime(verification.firstScanDate) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Lần đầu quét</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {verification?.lastScanDate ? formatDateTime(verification.lastScanDate) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Lần gần nhất</p>
          </div>
        </div>

        {/* Frequency bar — shows actual maxPerMinute vs threshold 10 */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Tần suất quét cao nhất (24h qua)</span>
            <span className={cn('font-mono font-bold', (verification?.maxScansPerMinute ?? 0) >= 10 ? 'text-red-500' : 'text-green-600')}>
              {verification?.maxScansPerMinute ?? 0} lần/phút
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700',
                (verification?.maxScansPerMinute ?? 0) >= 10 ? 'bg-red-500' : 'bg-brand-500'
              )}
              style={{ width: `${Math.min(100, ((verification?.maxScansPerMinute ?? 0) / 10) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>0</span>
            <span className="text-red-400 font-medium">Giới hạn: 10 lần/phút</span>
          </div>
        </div>
      </InfoCard>
    </div>
  )
}

// ─── ComplianceSection ────────────────────────────────────────────────────────
function ComplianceSection({ result }) {
  const { compliance, manufacturing } = result
  const items = [
    { label: 'MOH Approved',          value: compliance?.mohApproved,        icon: 'account_balance' },
    { label: 'GDP Compliant',          value: compliance?.gdpCompliant,       icon: 'assignment' },
    { label: 'Cold Chain Maintained', value: compliance?.coldChainMaintained, icon: 'ac_unit' },
    { label: 'GMP Certified',         value: manufacturing?.gmpCertified,    icon: 'factory' },
  ]
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="font-display font-semibold text-slate-900 mb-5 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-brand-500" /> Regulatory Compliance
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(({ label, value, icon }) => (
            <div key={label} className={cn(
              'flex items-center gap-3 p-4 rounded-xl border',
              value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <div>
                <p className="font-semibold text-sm text-slate-800">{label}</p>
                <p className={cn('text-xs font-bold', value ? 'text-green-600' : 'text-red-600')}>
                  {value ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {compliance?.temperatureLog && (
          <div className={cn('mt-4 p-3 rounded-xl text-sm flex items-center gap-2', compliance.coldChainMaintained ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700')}>
            <span className="material-symbols-outlined text-[18px]">thermostat</span> {compliance.temperatureLog}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ErrorPanel ───────────────────────────────────────────────────────────────
function ErrorPanel({ error, onRetry }) {
  const configs = {
    not_found: { icon: 'search', title: 'Code Not Found',     color: 'border-amber-300 bg-amber-50', textColor: 'text-amber-800', msg: `"${error.code}" was not found in our registry. The product may not be registered with PharmaTrace VN.` },
    invalid:   { icon: 'error', title: 'Invalid Code Format', color: 'border-red-300 bg-red-50',    textColor: 'text-red-800',   msg: 'This does not appear to be a valid PharmaTrace VN QR or UID code. Please check the code and try again.' },
    network:   { icon: 'sensors', title: 'Connection Error',   color: 'border-slate-300 bg-slate-50', textColor: 'text-slate-800', msg: 'Unable to reach the verification server. Please check your connection and try again.' },
  }
  const cfg = configs[error.type] || configs.network
  return (
    <div className={cn('mt-10 rounded-2xl border-2 p-8 text-center max-w-lg mx-auto', cfg.color)}>
      <div className="mb-4">
        <span className="material-symbols-outlined text-[64px]">{cfg.icon}</span>
      </div>
      <h2 className={cn('text-xl font-display font-bold mb-2', cfg.textColor)}>{cfg.title}</h2>
      <p className="text-slate-600 text-sm mb-6">{cfg.msg}</p>
      <button onClick={onRetry} className="btn-secondary">
        <RotateCcw className="w-4 h-4" /> Try Again
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoCard({ title, Icon, iconColor, iconBg, children, antIcon }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          {antIcon
            ? <Icon className={cn('text-base', iconColor)} />
            : <Icon className={cn('w-4 h-4', iconColor)} />
          }
        </div>
        {title}
      </h3>
      {children}
    </div>
  )
}

function ExpiryTag({ date }) {
  if (!date) return <span>—</span>
  const daysLeft = Math.floor((new Date(date) - new Date()) / 86400000)
  const color = daysLeft < 0 ? 'red' : daysLeft < 90 ? 'orange' : 'green'
  const label = daysLeft < 0 ? 'HẾT HẠN' : `${formatDate(date)} (còn ${daysLeft} ngày)`
  return <Tag color={color}>{label}</Tag>
}

// ─── Dual-Code Scratch PIN Verification Card ─────────────────────────────────
function ScratchPinCard({ result, pinInput, setPinInput, onVerifyPin, loading }) {
  const isActivated = !!result.activatedAt || (result.pinScansCount && result.pinScansCount > 0) || result.status === 'activated_need_pin' || result.status === 'repeated_authentic' || result.status === 'authentic'
  const isPinNeeded = !isActivated && (result.status === 'pin_required' || result.status === 'invalid_pin' || result.authStatus === 'PIN_REQUIRED')
  const isAuthenticFirst = result.status === 'authentic' && (result.authStatus === 'FIRST_SCAN_AUTHENTIC' || result.pinScansCount === 1)
  const isRepeated = result.status === 'repeated_authentic' || (result.pinScansCount > 1)

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-white text-base">
            Xác thực Tem Chống Giả Phủ Cào (Dual-Code Security)
          </h3>
        </div>
        {result.activatedAt && (
          <span className="text-xs text-slate-400 font-mono">
            Kích hoạt: {formatDateTime(result.activatedAt)}
          </span>
        )}
      </div>

      {isPinNeeded && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-800 to-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-sm font-semibold text-amber-300 flex items-center justify-center md:justify-start gap-1.5">
              <span className="material-symbols-outlined text-amber-400 text-lg">lock_open</span>
              Cào lớp bạc và nhập mã PIN để xác thực 100% chính hãng
            </p>
            <p className="text-xs text-slate-400">
              Mã Barcode trên vỏ hộp đã được kiểm chứng xuất xứ. Hãy cào nhẹ lớp nhũ bạc trên tem nắp hộp và nhập mã PIN gồm 6 ký tự để nhận diện chính hãng.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onVerifyPin() }} className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <input
              type="text"
              maxLength={10}
              placeholder="MÃ PIN (VD: 9K3N8A)"
              value={pinInput}
              onChange={e => setPinInput(e.target.value.toUpperCase())}
              className="px-4 py-2 bg-black/50 border border-amber-400/50 text-amber-300 font-mono font-bold tracking-wider rounded-xl text-sm focus:outline-none focus:border-amber-400 text-center uppercase w-full md:w-52 placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !pinInput.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-sm transition-all shrink-0 flex items-center gap-1.5"
            >
              {loading ? <Spinner size="sm" className="text-slate-950" /> : 'Xác thực'}
            </button>
          </form>
        </div>
      )}

      {isActivated && !isAuthenticFirst && (
        <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-4 flex items-center gap-3 text-blue-300">
          <Info className="w-6 h-6 text-blue-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm text-blue-200">Sản phẩm chính hãng (Đã kích hoạt bảo mật)</p>
            <p className="text-blue-400/80 mt-0.5">
              Mã bảo mật phủ cào của hộp thuốc này đã được xác thực & kích hoạt lần đầu vào lúc {formatDateTime(result.activatedAt)}. 
              Sản phẩm hoàn toàn chính hãng, bạn có thể an tâm sử dụng.
            </p>
          </div>
        </div>
      )}

      {isAuthenticFirst && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3 text-emerald-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm text-emerald-200">Xác thực chính hãng lần đầu tiên thành công!</p>
            <p className="text-emerald-400/80 mt-0.5">Sản phẩm vừa được kích hoạt bảo mật lần đầu tiên vào lúc {formatDateTime(result.activatedAt || new Date())}. Bạn có thể an tâm sử dụng sản phẩm.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptySection({ message }) {
  return <div className="card p-10 text-center text-slate-400 text-sm">{message}</div>
}
