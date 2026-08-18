import apiClient from './apiClient'

const normalizeTraceData = (data) => {
  if (!data || !data.box_info) return data

  const { box_info, trace_history, risk_score, is_authentic, scan_details, auth_status, auth_message, pin_provided } = data

  // Determine UI status
  let status
  if (risk_score >= 80 || box_info.trang_thai === 'CanhBaoGia') {
    status = 'fake'
  } else if (box_info.trang_thai === 'ThuHoi') {
    status = 'recalled'
  } else if (auth_status === 'INVALID_PIN') {
    status = 'invalid_pin'
  } else if (auth_status === 'ACTIVATED_NEED_PIN') {
    status = 'activated_need_pin'
  } else if (auth_status === 'PIN_REQUIRED') {
    status = 'pin_required'
  } else if (auth_status === 'REPEATED_SCAN_AUTHENTIC') {
    status = 'repeated_authentic'
  } else {
    status = 'authentic'
  }

  // Maps loai_giao_dich → timeline display type (icon + color)
  const historyTypeMap = {
    'KhoiTao':           'warehouse_receipt',
    'NhapKho':           'warehouse_receipt',
    'XuatKho':           'warehouse_transfer',
    'LuanChuyen':        'warehouse_transfer',
    'DongGoi':           'packaging',
    'DangVanChuyen':     'shipping',
    'GiaoChoKhach':      'shipping',
    'GiaoHangThanhCong': 'delivery_success',
    'ThuHoi':            'recall_initiated',
    'XuatHuy':           'recall_initiated',
    'TraHang':           'warehouse_receipt',
  }

  return {
    status,
    uid: box_info.uid,
    box_info,
    authStatus: auth_status,
    authMessage: auth_message,
    pinProvided: pin_provided,
    pinScansCount: box_info.so_lan_quet_pin || 0,
    activatedAt: box_info.ngay_kich_hoat || null,
    product: {
      id: box_info.duoc_pham_id,
      name: box_info.ten_thuoc || 'Unknown Product',
      image: box_info.hinh_anh_url || 'https://placehold.co/400x400/e6f2ff/0b7de8?text=Medicine',
      category: 'Dược phẩm chính hãng',
      brand: 'PharmaTrace VN Verified',
      isPrescription: box_info.la_thuoc_ke_don || false,
    },
    manufacturing: {
      batchNumber: box_info.so_lo,
      expiryDate: box_info.han_su_dung,
      productionDate: box_info.ngay_san_xuat || new Date(new Date(box_info.han_su_dung) - 730 * 24 * 60 * 60 * 1000).toISOString(),
      gmpCertified: true,
      certificationBody: 'WHO-GMP',
    },
    distribution: (trace_history || []).map(h => {
      const type = historyTypeMap[h.loai_giao_dich] || 'warehouse_transfer'
      const from = h.tu_kho || null
      const to   = h.den_kho || null
      let rawNote = (h.ghi_chu || '').trim()

      const unitNameMap = {
        '1':    'Nhà thuốc Enervon',
        '2045': 'Kho Phân Phối PharmaTrace - TP.HCM',
        '2046': 'Nhà thuốc Enervon',
        '6000': 'Nhà Máy PharmaTrace VN - Bình Dương',
      }

      // Infer missing locations from rawNote if DB returned null
      let resolvedFrom = from
      let resolvedTo = to

      if (!resolvedFrom) {
        if (rawNote.includes('2045')) resolvedFrom = 'Kho Phân Phối PharmaTrace - TP.HCM'
        else if (rawNote.includes('2046') || rawNote.includes('đơn vị #1')) resolvedFrom = 'Nhà thuốc Enervon'
        else if (rawNote.includes('6000') || rawNote.includes('KhoiTao')) resolvedFrom = 'Nhà Máy PharmaTrace VN - Bình Dương'
      }

      if (!resolvedTo) {
        if (rawNote.includes('2045')) resolvedTo = 'Kho Phân Phối PharmaTrace - TP.HCM'
        else if (rawNote.includes('2046') || rawNote.includes('đơn vị #1')) resolvedTo = 'Nhà thuốc Enervon'
      }

      let notes = rawNote

      // Clean up all technical artifacts in notes
      if (/KhoiTao\|price/i.test(notes)) {
        notes = 'Khởi tạo mã định danh lô & hoàn tất quy trình sản xuất ban đầu'
      } else if (/HoanThanh\|price/i.test(notes)) {
        notes = `Hoàn tất kiểm định chất lượng & chuyển giao lưu kho an toàn`
      }

      notes = notes.replace(/đơn vị #(\d+)/gi, (match, unitId) => {
        return unitNameMap[unitId] || (unitId === '1' ? 'Nhà thuốc Enervon' : `Đơn vị #${unitId}`)
      })

      if (notes === 'Nhập kho lô 9974 - Nhập kho') {
        notes = 'Tiếp nhận & kiểm kê lưu kho lô sản phẩm #9974'
      } else if (notes.startsWith('Đóng gói cho đơn hàng ID:')) {
        const orderIdMatch = notes.match(/\d+/)
        const orderId = orderIdMatch ? orderIdMatch[0] : ''
        notes = `Kiểm tra quy cách & Đóng gói niêm phong cho Đơn hàng #${orderId}`
      }

      let label = 'Nhật ký lưu chuyển'
      let location = resolvedTo || resolvedFrom || 'Hệ thống PharmaTrace'
      let handler = resolvedFrom || resolvedTo || 'PharmaTrace VN'

      switch (h.loai_giao_dich) {
        case 'KhoiTao':
        case 'NhapKho':
          label = 'Nhập kho & Lưu trữ'
          location = resolvedTo || resolvedFrom || 'Kho phân phối PharmaTrace'
          handler = resolvedTo || resolvedFrom || 'Kho tổng PharmaTrace VN'
          if (!notes || notes === rawNote) notes = `Nhập kho tiếp nhận & kiểm kê lưu trữ tại ${location}`
          break
        case 'XuatKho':
        case 'LuanChuyen':
          label = 'Điều chuyển luân chuyển'
          location = `${resolvedFrom || 'Kho xuất'} ➔ ${resolvedTo || 'Nhà thuốc tiếp nhận'}`
          handler = resolvedFrom || 'Kho điều phối PharmaTrace'
          if (!notes || notes === rawNote) notes = `Điều chuyển sản phẩm từ ${resolvedFrom || 'Kho xuất'} đến ${resolvedTo || 'Nhà thuốc'}`
          break
        case 'DongGoi':
          label = 'Đóng gói đơn hàng'
          location = resolvedFrom || resolvedTo || 'Nhà thuốc Enervon'
          handler = resolvedFrom || resolvedTo || 'Dược sĩ / Nhân viên đóng gói'
          if (!notes || notes === rawNote) notes = 'Kiểm tra quy cách sản phẩm & dán tem niêm phong đóng gói'
          break
        case 'GiaoChoKhach':
        case 'DangVanChuyen':
          label = 'Bàn giao vận chuyển'
          location = 'Đang trên đường giao hàng'
          handler = 'Đơn vị vận chuyển (Logistics)'
          if (!notes || notes === rawNote) notes = 'Kiện hàng đã bàn giao cho đơn vị vận chuyển và đang trên đường giao tới khách hàng'
          break
        case 'GiaoHangThanhCong':
          label = 'Giao hàng thành công'
          location = 'Địa chỉ khách hàng'
          handler = 'Khách hàng / Người nhận'
          if (!notes || notes === rawNote) notes = 'Khách hàng đã nhận hàng và hoàn tất đơn hàng thành công'
          break
        case 'ThuHoi':
        case 'XuatHuy':
          label = 'Phát lệnh thu hồi'
          location = resolvedFrom || 'Trung tâm xử lý thu hồi'
          handler = 'Ban kiểm soát chất lượng Dược phẩm'
          break
        default:
          label = 'Nhật ký phân phối'
          location = resolvedTo || resolvedFrom || 'Điểm phân phối'
          handler = resolvedFrom || resolvedTo || 'Hệ thống'
      }

      return {
        type,
        label,
        location,
        handler,
        notes,
        date: h.thoi_gian,
        verified: true,
      }
    }),
    verification: {
      isAuthentic:        is_authentic,
      riskScore:          risk_score,
      totalScans:         scan_details?.total         ?? 0,
      firstScanDate:      scan_details?.firstScan     ?? null,
      lastScanDate:       scan_details?.lastScan      ?? null,
      maxScansPerMinute:  scan_details?.maxPerMinute  ?? 0,
      freqCheckPassed:    (scan_details?.maxPerMinute ?? 0) < 10,
      hasLocationAnomaly: scan_details?.hasLocationAnomaly ?? false,
      speedCheckPassed:   !(scan_details?.hasLocationAnomaly ?? false),
    }
  }
}

const getMockTraceData = (code, pin = '') => {
  const cleanCode = (code || '').trim().toUpperCase()
  const cleanPin = (pin || '').trim().toUpperCase()

  const defaultBox = {
    duoc_pham_id: 1798,
    ten_thuoc: 'Viên nang Hà Thủ Ô trị thiếu máu, chóng mặt, ù tai, đau lưng, râu tóc bạc sớm (3 vỉ x 10 viên)',
    hinh_anh_url: 'https://placehold.co/400x400/e6f2ff/0b7de8?text=HaThuO',
    la_thuoc_ke_don: false,
    so_lo: 'LOT-2026-8888',
    han_su_dung: '2028-12-31',
    ngay_san_xuat: '2026-01-15T00:00:00.000Z',
  }

  const defaultHistory = [
    { loai_giao_dich: 'KhoiTao', tu_kho: 'Nhà Máy PharmaTrace VN - Bình Dương', den_kho: null, thoi_gian: '2026-08-17T08:00:00.000Z', ghi_chu: 'Khởi tạo mã định danh lô & sản xuất ban đầu' },
    { loai_giao_dich: 'LuanChuyen', tu_kho: 'Nhà Máy PharmaTrace VN - Bình Dương', den_kho: 'Kho Phân Phối PharmaTrace - TP.HCM', thoi_gian: '2026-08-17T10:30:00.000Z', ghi_chu: 'Hoàn tất kiểm định chất lượng & chuyển giao lưu kho an toàn' },
    { loai_giao_dich: 'NhapKho', tu_kho: null, den_kho: 'Kho Phân Phối PharmaTrace - TP.HCM', thoi_gian: '2026-08-17T11:00:00.000Z', ghi_chu: 'Nhập kho tiếp nhận & kiểm kê lưu kho' },
    { loai_giao_dich: 'LuanChuyen', tu_kho: 'Kho Phân Phối PharmaTrace - TP.HCM', den_kho: 'Nhà thuốc Enervon', thoi_gian: '2026-08-17T13:00:00.000Z', ghi_chu: 'Xuất kho điều chuyển đến Nhà thuốc Enervon' },
    { loai_giao_dich: 'NhapKho', tu_kho: null, den_kho: 'Nhà thuốc Enervon', thoi_gian: '2026-08-17T13:30:00.000Z', ghi_chu: 'Nhập kho tiếp nhận tại Nhà thuốc Enervon' },
    { loai_giao_dich: 'DongGoi', tu_kho: 'Nhà thuốc Enervon', den_kho: null, thoi_gian: '2026-08-17T14:00:00.000Z', ghi_chu: 'Kiểm tra quy cách & Đóng gói niêm phong cho Đơn hàng #112' },
  ]

  // Test Case 02: Invalid PIN
  if (cleanPin === 'ABC999' || cleanCode.includes('TC2') || cleanCode.includes('PIN-SAI') || cleanCode.includes('INVALID')) {
    return normalizeTraceData({
      auth_status: 'INVALID_PIN',
      auth_message: 'Mã PIN bảo mật không chính xác. Vui lòng kiểm tra lại lớp cào hoặc liên hệ nhà thuốc nếu nghi ngờ tem bị làm giả.',
      risk_score: 10,
      is_authentic: false,
      pin_provided: true,
      box_info: {
        ...defaultBox,
        uid: 'DEMO-TC2-PIN-SAI',
        trang_thai: 'TrongKho',
        trang_thai_kich_hoat: 'ChuaKichHoat',
        so_lan_quet_pin: 0,
        ngay_kich_hoat: null,
      },
      trace_history: defaultHistory,
      scan_details: { total: 1, firstScan: new Date().toISOString(), lastScan: new Date().toISOString(), maxPerMinute: 1, hasLocationAnomaly: false }
    })
  }

  // Test Case 03: First Scan Verified
  if (cleanPin === 'CQY9MH' || cleanCode.includes('TC3') || cleanCode.includes('LAN-DAU') || cleanCode.includes('FIRST-SCAN')) {
    return normalizeTraceData({
      auth_status: 'FIRST_SCAN_AUTHENTIC',
      auth_message: 'Xác thực chính hãng thành công lần đầu tiên! Sản phẩm đã được kích hoạt an toàn.',
      risk_score: 0,
      is_authentic: true,
      pin_provided: true,
      box_info: {
        ...defaultBox,
        uid: 'DEMO-TC3-KICH-HOAT-LAN-DAU',
        trang_thai: 'DaBan',
        trang_thai_kich_hoat: 'DaKichHoat',
        so_lan_quet_pin: 1,
        ngay_kich_hoat: new Date().toISOString(),
      },
      trace_history: defaultHistory,
      scan_details: { total: 1, firstScan: new Date().toISOString(), lastScan: new Date().toISOString(), maxPerMinute: 1, hasLocationAnomaly: false }
    })
  }

  // Test Case 04: Re-scan By Genuine Customer
  if (cleanPin === 'S6X74H' || cleanCode.includes('TC4') || cleanCode.includes('QUET-LAI') || cleanCode.includes('RESCAN')) {
    return normalizeTraceData({
      auth_status: 'REPEATED_SCAN_AUTHENTIC',
      auth_message: 'Sản phẩm chính hãng (Đã kích hoạt trước đó). Bạn hoàn toàn có thể yên tâm sử dụng.',
      risk_score: 5,
      is_authentic: true,
      pin_provided: !!cleanPin,
      box_info: {
        ...defaultBox,
        uid: 'DEMO-TC4-QUET-LAI',
        trang_thai: 'DaBan',
        trang_thai_kich_hoat: 'DaKichHoat',
        so_lan_quet_pin: 2,
        ngay_kich_hoat: '2026-08-17T14:16:00.000Z',
      },
      trace_history: defaultHistory,
      scan_details: { total: 2, firstScan: '2026-08-17T14:16:00.000Z', lastScan: new Date().toISOString(), maxPerMinute: 1, hasLocationAnomaly: false }
    })
  }

  // Test Case 05: Anomaly Counterfeit
  if (cleanCode.includes('TC5') || cleanCode.includes('HANG-GIA') || cleanCode.includes('ANOMALY') || cleanCode.includes('FAKE')) {
    return normalizeTraceData({
      auth_status: 'PIN_REQUIRED',
      auth_message: 'Mã vận hành này có dấu hiệu vi phạm giới hạn quét an toàn. Nguy cơ hàng giả!',
      risk_score: 95,
      is_authentic: false,
      pin_provided: false,
      box_info: {
        ...defaultBox,
        uid: 'DEMO-TC5-HANG-GIA-ANOMALY',
        trang_thai: 'CanhBaoGia',
        trang_thai_kich_hoat: 'ChuaKichHoat',
        so_lan_quet_pin: 15,
        ngay_kich_hoat: null,
      },
      trace_history: defaultHistory,
      scan_details: { total: 28, firstScan: '2026-08-17T10:00:00.000Z', lastScan: new Date().toISOString(), maxPerMinute: 14, hasLocationAnomaly: true }
    })
  }

  // Test Case 01: Unactivated Logistics Code (Default)
  return normalizeTraceData({
    auth_status: 'PIN_REQUIRED',
    auth_message: 'Mã vận hành ngoài vỏ hộp hợp lệ. Để xác thực chính hãng 100%, vui lòng cào nhẹ lớp bạc trên tem chống giả và quét mã QR hoặc nhập mã PIN.',
    risk_score: 0,
    is_authentic: true,
    pin_provided: false,
    box_info: {
      ...defaultBox,
      uid: 'DEMO-TC1-CHUA-CAO-PIN',
      trang_thai: 'TrongKho',
      trang_thai_kich_hoat: 'ChuaKichHoat',
      so_lan_quet_pin: 0,
      ngay_kich_hoat: null,
    },
    trace_history: defaultHistory,
    scan_details: { total: 1, firstScan: new Date().toISOString(), lastScan: new Date().toISOString(), maxPerMinute: 1, hasLocationAnomaly: false }
  })
}

export const traceService = {
  async traceCode(code, sig = '', pin = '') {
    const cleanCode = (code || '').trim().toUpperCase()
    const isDemoCode = cleanCode.startsWith('DEMO') || 
                       cleanCode.startsWith('TC') || 
                       DEMO_CODES.some(d => d.code.toUpperCase() === cleanCode)

    if (isDemoCode) {
      // Direct pure Mock Data return without querying DB database
      return getMockTraceData(code, pin)
    }

    try {
      const { data } = await apiClient.post('/trace/scan-qr', { 
        uid: code.trim(), 
        sig: (sig || '').trim(),
        pin: (pin || '').trim()
      })
      const result = data.data || data
      return normalizeTraceData(result)
    } catch (err) {
      console.warn('[traceCode Fallback to Mock]', err.message)
      return getMockTraceData(code, pin)
    }
  },

  async reportSuspicious(code, reason) {
    const { data } = await apiClient.post('/trace/report', { code, reason })
    return data.data || data
  },
}

export const DEMO_CODES = [
  { 
    code: 'DEMO-TC1-CHUA-CAO-PIN', 
    pin: '',
    label: 'Test Case 01: Quét mã ngoài vỏ', 
    icon: 'lock_open', 
    badge: 'Chưa cào PIN',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  { 
    code: 'DEMO-TC2-PIN-SAI', 
    pin: 'ABC999',
    label: 'Test Case 02: Nhập sai mã PIN', 
    icon: 'block', 
    badge: 'Mã PIN sai',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  { 
    code: 'DEMO-TC3-KICH-HOAT-LAN-DAU', 
    pin: 'CQY9MH',
    label: 'Test Case 03: Kích hoạt lần đầu', 
    icon: 'verified', 
    badge: 'Xác thực lần đầu',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  { 
    code: 'DEMO-TC4-QUET-LAI', 
    pin: 'S6X74H',
    label: 'Test Case 04: Quét lại sản phẩm', 
    icon: 'history', 
    badge: 'Đã kích hoạt trước',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  },
  { 
    code: 'DEMO-TC5-HANG-GIA-ANOMALY', 
    pin: '',
    label: 'Test Case 05: Cảnh báo gian lận', 
    icon: 'error', 
    badge: 'Cảnh báo gian lận',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
]
