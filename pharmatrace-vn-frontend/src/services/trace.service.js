import apiClient from './apiClient'

const normalizeTraceData = (data) => {
  if (!data || !data.box_info) return data

  const { box_info, trace_history, risk_score, is_authentic, scan_details } = data

  // Determine status — SQL fn_check_qr_risk_score returns only 0 or 100.
  // risk_score=100 means fraud was detected (high scan freq OR impossible movement speed).
  // Priority: fake > recalled > warning > authentic
  let status
  if (risk_score >= 80) {
    status = 'fake'
  } else if (box_info.trang_thai === 'ThuHoi') {
    status = 'recalled'
  } else if (box_info.trang_thai === 'CanhBaoGia' || !is_authentic) {
    status = 'warning'
  } else {
    status = 'authentic'
  }

  // Maps loai_giao_dich → timeline display type (icon + color)
  const historyTypeMap = {
    'KhoiTao':           'warehouse_receipt',
    'NhapKho':           'warehouse_receipt',
    'XuatKho':           'warehouse_transfer',
    'DongGoi':           'warehouse_transfer',
    'GiaoChoKhach':      'retail_dispatch',
    'GiaoHangThanhCong': 'retail_dispatch',
    'ThuHoi':            'recall_initiated',
    'XuatHuy':           'recall_initiated',
    'TraHang':           'warehouse_receipt',
  }

  return {
    status,
    product: {
      name: box_info.ten_thuoc || 'Unknown Product',
      image: 'https://placehold.co/400x400/e6f2ff/0b7de8?text=Medicine',
      category: 'Pharmaceutical',
      brand: 'PharmaTrace VN Verified',
    },
    manufacturing: {
      batchNumber: box_info.so_lo,
      expiryDate: box_info.han_su_dung,
      manufacturer: 'PharmaTrace VN Certified Partner',
      productionDate: new Date(new Date(box_info.han_su_dung) - 730 * 24 * 60 * 60 * 1000).toISOString(),
      gmpCertified: true,
      certificationBody: 'WHO-GMP',
    },
    distribution: (trace_history || []).map(h => {
      const isToCustomer  = ['GiaoChoKhach', 'GiaoHangThanhCong'].includes(h.loai_giao_dich)
      const isTransferOut = ['XuatKho', 'DongGoi'].includes(h.loai_giao_dich)
      const isReceiveIn   = ['NhapKho', 'TraHang'].includes(h.loai_giao_dich)
      const from = h.tu_kho || null
      const to   = isToCustomer ? 'Khách hàng' : (h.den_kho || null)

      // XuatKho/DongGoi: heading = source (actor doing the transfer out)
      // NhapKho/TraHang: heading = destination (receiver)
      // Others: destination if available, else source
      const location = isToCustomer    ? 'Khách hàng' :
                       isTransferOut   ? (from || to || 'Điểm phân phối') :
                       (to || from || 'Điểm phân phối')

      // NhapKho/TraHang: handler = receiver (to); all others: handler = sender (from)
      const handler = isReceiveIn ? (to || from || 'Hệ thống') : (from || 'Hệ thống')

      // Use ghi_chu from DB if available, otherwise fall back to from→to
      const parts = []
      if (from) parts.push(`từ ${from}`)
      if (to)   parts.push(`đến ${to}`)
      const fallbackNote = parts.length ? parts.join(', ') : null

      return {
        type:     historyTypeMap[h.loai_giao_dich] || 'warehouse_transfer',
        location,
        date:     h.thoi_gian,
        verified: true,
        notes:    h.ghi_chu || fallbackNote || '',
        handler,
      }
    }),
    verification: {
      isAuthentic:        is_authentic,
      riskScore:          risk_score,
      // All-time scan stats
      totalScans:         scan_details?.total         ?? 0,
      firstScanDate:      scan_details?.firstScan     ?? null,
      lastScanDate:       scan_details?.lastScan      ?? null,
      // SQL check #1 — scan frequency (>=10/minute in last 24h → fraud)
      maxScansPerMinute:  scan_details?.maxPerMinute  ?? 0,
      freqCheckPassed:    (scan_details?.maxPerMinute ?? 0) < 10,
      // SQL check #2 — movement speed (>1000 km/h → fraud)
      hasLocationAnomaly: scan_details?.hasLocationAnomaly ?? false,
      speedCheckPassed:   !(scan_details?.hasLocationAnomaly ?? false),
    }
  }
}

export const traceService = {
  async traceCode(code) {
    // Backend uses POST /trace/scan-qr with { uid } body
    const { data } = await apiClient.post('/trace/scan-qr', { uid: code.trim() })
    const result = data.data || data
    return normalizeTraceData(result)
  },

  async reportSuspicious(code, reason) {
    const { data } = await apiClient.post('/trace/report', { code, reason })
    return data.data || data
  },
}

export const DEMO_CODES = [
  { code: 'QR-BATCH-0001', label: 'Authentic product',   icon: 'verified', color: 'green'  },
  { code: 'QR-BATCH-0002', label: 'Suspicious activity', icon: 'warning',  color: 'orange' },
  { code: 'QR-BATCH-0003', label: 'Recalled batch',       icon: 'emergency_home', color: 'red'    },
  { code: 'FAKE-001',      label: 'Counterfeit product',  icon: 'error',    color: 'red'    },
]
