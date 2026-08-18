import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, AutoComplete, Button as AButton, Card, Table, Tag, DatePicker, Modal, Spin, Tabs, Popconfirm } from 'antd'
import { InboxOutlined, PrinterOutlined, CheckCircleOutlined, CarOutlined, SafetyCertificateOutlined, FileTextOutlined, HistoryOutlined, CloseCircleOutlined, EyeOutlined, ShopOutlined, MedicineBoxOutlined, DollarOutlined, DollarCircleOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { productService } from '@/services/product.service'
import { formatDateTime } from '@/utils'
import { useAuth } from '@/store/authStore'
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
  const { user } = useAuth()
  const [form] = Form.useForm()
  const watchQty = Form.useWatch('so_luong_hop', form)
  const watchPrice = Form.useWatch('don_gia', form)
  const [activeTab, setActiveTab] = useState('shipments')
  const [loading, setLoading] = useState(false)
  const [received, setReceived] = useState([])
  const [shipments, setShipments] = useState([])
  const [completedInbounds, setCompletedInbounds] = useState([])
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [units, setUnits] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingShipments, setLoadingShipments] = useState(false)

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
        unitName: item.unitName || item.don_vi_tinh || 'hộp',
        qrCode: item.batchNumber || '',
        receivedAt: item.receivedAt || item.createdAt || new Date().toISOString(),
        location: item.location || '',
        batchId: item.id || item.batchId,
        transferredOutAt: item.transferredOutAt,
        isTransferredOut: (item.quantity === 0 && Boolean(item.transferredOutAt)),
        isReceivedViaTransfer: Boolean(item.isReceivedViaTransfer)
      }))
      setReceived(normalized)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải lịch sử nhập kho')
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchShipments = async () => {
    setLoadingShipments(true)
    try {
      const unitId = user?.don_vi_id ? Number(user.don_vi_id) : null
      const [pos, pendingTransfers, incomingTransfers, initialInbounds] = await Promise.all([
        warehouseService.getPurchaseOrders('inbound').catch(() => []),
        warehouseService.getPendingIncomingTransfers().catch(() => []),
        unitId ? warehouseService.getTransferHistory({ den_don_vi_id: unitId }).catch(() => []) : Promise.resolve([]),
        unitId ? warehouseService.getInitialInbounds({ don_vi_id: unitId }).catch(() => []) : Promise.resolve([])
      ])

      // 1. Pending Transfers
      const normalizedPendingTransfers = (pendingTransfers || []).map(t => {
        const qty = Number(t.so_luong_hop || 0)
        const donGia = Number(t.don_gia || 0)
        const total = Number(t.tong_tien || (donGia * qty))
        const unitName = t.don_vi_tinh || 'hộp'
        return {
          id: t.id,
          ma_phieu_nhap: `TRF-${t.id || Date.now()}`,
          ten_nha_cung_cap: t.ten_tu_kho || `Đơn vị #${t.tu_don_vi_id}`,
          so_luong_mat_hang: `${t.ten_duoc_pham} (${qty} ${unitName})`,
          don_gia: donGia,
          tong_tien: total,
          don_vi_tinh: unitName,
          trang_thai: t.trang_thai || 'DangVanChuyen',
          created_at: t.thoi_gian,
          isTransfer: true,
          tu_don_vi_id: t.tu_don_vi_id,
          den_don_vi_id: t.den_don_vi_id,
          mang_uid: t.mang_uid
        }
      })

      // 2. Completed & Cancelled Transfers (Lịch sử nhận kho)
      const normalizedCompletedTransfers = (incomingTransfers || [])
        .filter(t => t.trang_thai === 'HoanThanh' || t.trang_thai === 'DaHuy' || !t.trang_thai?.startsWith('DangVanChuyen'))
        .map(t => {
          const qty = Number(t.so_luong_hop || 0)
          const donGia = Number(t.don_gia || 0)
          const total = Number(t.tong_tien || (donGia * qty))
          const isCancelled = t.trang_thai === 'DaHuy' || (typeof t.trang_thai === 'string' && t.trang_thai.startsWith('DaHuy'))
          const unitName = t.don_vi_tinh || 'hộp'
          return {
            id: t.id,
            ma_phieu_nhap: `TRF-${t.id}`,
            ten_nha_cung_cap: t.ten_tu_kho || `Đơn vị #${t.tu_don_vi_id}`,
            so_luong_mat_hang: `${t.ten_duoc_pham} (${qty} ${unitName})`,
            don_gia: donGia,
            tong_tien: total,
            don_vi_tinh: unitName,
            trang_thai: isCancelled ? 'DaHuy' : 'HoanThanh',
            created_at: t.thoi_gian,
            isTransfer: true,
            tu_don_vi_id: t.tu_don_vi_id,
            den_don_vi_id: t.den_don_vi_id,
            mang_uid: t.mang_uid
          }
        })

      // 3. Initial Inbound Declarations (Khai báo nhập kho lô mới trực tiếp tại kho này)
      const normalizedInitialInbounds = (initialInbounds || []).map(init => {
        const qty = Number(init.so_luong_hop || 0)
        const donGia = Number(init.don_gia || 0)
        const total = Number(init.tong_tien || (donGia * qty))
        const unitName = init.don_vi_tinh || 'hộp'
        return {
          id: `INIT-${init.id}`,
          ma_phieu_nhap: `NK-${init.so_lo}`,
          ten_nha_cung_cap: init.ten_nha_cung_cap || 'Khai báo nhập lô mới',
          so_luong_mat_hang: `${init.ten_duoc_pham} (${qty} ${unitName})`,
          don_gia: donGia,
          tong_tien: total,
          don_vi_tinh: unitName,
          trang_thai: 'HoanThanh',
          created_at: init.thoi_gian,
          isTransfer: false,
          batchId: init.lo_thuoc_id,
          batchNumber: init.so_lo
        }
      })

      // Separate POs into pending and completed
      const pendingPOs = (pos || []).filter(p => p.trang_thai !== 'DaDuyet' && p.trang_thai !== 'HoanThanh')
      const completedPOs = (pos || []).filter(p => p.trang_thai === 'DaDuyet' || p.trang_thai === 'HoanThanh')

      setShipments([...pendingPOs, ...normalizedPendingTransfers])
      setCompletedInbounds([...completedPOs, ...normalizedCompletedTransfers, ...normalizedInitialInbounds])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingShipments(false)
    }
  }

  useEffect(() => {
    setLoadingProducts(true)
    productService.getAllAdmin()
      .then(res => setProducts(res.data || []))
      .catch(() => { })
      .finally(() => setLoadingProducts(false))

    warehouseService.getUnits()
      .then(data => setUnits(data))
      .catch(() => { })

    fetchHistory()
    fetchShipments()
  }, [])

  useEffect(() => {
    if (user?.don_vi_id) {
      form.setFieldValue('don_vi_id', Number(user.don_vi_id))
    }
  }, [user, form])

  const handleProductChange = async (productId) => {
    form.setFieldValue('quy_cach_id', undefined)
    setVariants([])
    if (!productId) return
    setLoadingVariants(true)
    try {
      const product = await productService.getById(productId)
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
        duoc_pham_id: vals.duoc_pham_id,
        don_vi_id: vals.don_vi_id,
        so_lo: vals.so_lo,
        so_luong_hop: vals.so_luong_hop,
        don_gia: vals.don_gia || 0,
        ngay_sx: vals.ngay_sx?.format('YYYY-MM-DD'),
        hsd: vals.hsd?.format('YYYY-MM-DD'),
        nha_cung_cap: vals.nha_cung_cap || '',
      }
      const result = await warehouseService.receiveStock(payload)
      toast.success(`Nhập kho thành công — đã sinh ${result.so_luong_da_sinh_qr || vals.so_luong_hop} QR code`)
      form.resetFields()
      if (user?.don_vi_id) {
        form.setFieldValue('don_vi_id', Number(user.don_vi_id))
      }
      setVariants([])
      await fetchHistory()
      await fetchShipments()
      setActiveTab('inbound_history')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Nhập kho thất bại')
    }
    finally { setLoading(false) }
  }

  const handleConfirmReceipt = async (orderId, targetStatus) => {
    try {
      await warehouseService.updatePurchaseOrderStatus(orderId, targetStatus)
      if (targetStatus === 'DaNhanHang') {
        toast.success('Đã xác nhận nhận hàng tại cầu tải Kho!')
      } else if (targetStatus === 'DaDuyet') {
        toast.success('Đã xác nhận nhập kho khả dụng thành công!')
      }
      fetchShipments()
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const handleConfirmTransferReceipt = async (record) => {
    try {
      await warehouseService.confirmTransferReceipt({
        tu_don_vi_id: record.tu_don_vi_id,
        den_don_vi_id: record.den_don_vi_id,
        mang_uid: record.mang_uid
      })
      toast.success('Đã xác nhận nhận hàng chuyển kho và cộng tồn kho thành công!')
      fetchShipments()
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xác nhận thất bại')
    }
  }

  const handleRejectTransferReceipt = async (record) => {
    try {
      await warehouseService.cancelStockTransfer(record.id, record.mang_uid)
      toast.success('Đã từ chối nhận chuyến hàng! Thuốc đã được tự động hoàn trả về Kho gửi khả dụng.')
      await fetchShipments()
      await fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Từ chối chuyến hàng thất bại')
    }
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
          <title>In nhãn tem kép Dual-Code PharmaTrace - Lô ${printBatchNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .grid-print { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; justify-items: center; }
            .dual-label-card { border: 1.5px dashed #000; padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center; border-radius: 8px; width: 340px; page-break-inside: avoid; }
            .label-col { display: flex; flex-direction: column; align-items: center; text-align: center; }
            .label-badge { font-size: 8px; font-weight: bold; padding: 2px 4px; border-radius: 4px; margin-bottom: 4px; }
            .badge-logistics { background: #e0f2fe; color: #0369a1; }
            .badge-security { background: #fef3c7; color: #b45309; }
            .qr-text { font-size: 7.5px; font-family: monospace; margin-top: 4px; word-break: break-all; }
            .pin-scratch-box { font-size: 9px; font-weight: bold; background: #e2e8f0; border: 1px solid #94a3b8; padding: 2px 6px; border-radius: 4px; margin-top: 3px; font-family: monospace; }
            @media print {
              .dual-label-card { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <h2 style="margin-bottom: 5px;">Mẫu In Tem Nhãn Kép (Dual-Code Architecture) PharmaTrace</h2>
          <p style="margin-bottom: 15px; font-size: 12px; color: #666;">Lô Thuốc: ${printBatchNumber} — (Barcode Vận Hành + Tem Phủ Cào Chống Giả)</p>
          <div class="grid-print">
            ${printQRs.map(qr => {
              const svgLogistics = document.getElementById('qr-svg-logistics-' + qr.uid)?.outerHTML || ''
              const svgSecurity = document.getElementById('qr-svg-security-' + qr.uid)?.outerHTML || ''
              return `
                <div class="dual-label-card">
                  <div class="label-col" style="border-right: 1px dashed #ccc; padding-right: 8px;">
                    <span class="label-badge badge-logistics">1. MÃ VẬN HÀNH</span>
                    ${svgLogistics}
                    <div class="qr-text">${qr.uid}</div>
                  </div>
                  <div class="label-col">
                    <span class="label-badge badge-security">2. TEM PHỦ CÀO</span>
                    ${svgSecurity}
                    <div class="pin-scratch-box">PIN: ${qr.secret_pin || '••••••'}</div>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </body>
      </html>
    `)
    win.document.close()

    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }

  const shipmentCols = [
    { title: 'Mã phiếu', dataIndex: 'ma_phieu_nhap', key: 'ma_phieu', render: v => <span className="font-mono font-bold text-brand-700">{v}</span> },
    { title: 'Nhà cung cấp / Kho gửi', dataIndex: 'ten_nha_cung_cap', key: 'ncc' },
    { title: 'Số mặt hàng', dataIndex: 'so_luong_mat_hang', key: 'so_luong', render: v => (typeof v === 'number' ? `${v} mặt hàng` : v) },
    { title: 'Tổng tiền', dataIndex: 'tong_tien', key: 'tong_tien', render: v => `${Number(v || 0).toLocaleString('vi-VN')} đ` },
    {
      title: 'Trạng thái chuyển hàng',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (st) => {
        if (st === 'DangVanChuyen' || st === 'IN_TRANSIT') return <Tag color="blue" icon={<CarOutlined />}>Đang vận chuyển</Tag>
        if (st === 'DaNhanHang' || st === 'RECEIVED') return <Tag color="gold" icon={<CheckCircleOutlined />}>Đã nhận tại kho</Tag>
        return <Tag color="green" icon={<CheckCircleOutlined />}>Đã hoàn tất lưu kho</Tag>
      }
    },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: v => v ? formatDateTime(v) : '-' },
    {
      title: 'Hành động kho WMS',
      key: 'action',
      render: (_, record) => {
        const st = record.trang_thai
        const isTransfer = record.isTransfer || record.ma_phieu_nhap?.startsWith('TRF-')
        if (st === 'DangVanChuyen' || st === 'IN_TRANSIT' || st === 'ChoDuyet') {
          return (
            <AButton
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedShipment(record)}
            >
              Chi tiết
            </AButton>
          )
        }
        if (isTransfer) {
          return <Tag color="blue" icon={<SafetyCertificateOutlined />}>Đã có QR từ Nhà máy</Tag>
        }
        if (st === 'DaNhanHang' || st === 'RECEIVED') {
          return (
            <div className="flex gap-2">
              <AButton
                size="small"
                type="default"
                icon={<PrinterOutlined />}
                onClick={() => handleOpenPrintModal(record.id, record.ma_phieu_nhap)}
              >
                In Tem phụ QR
              </AButton>
              <AButton
                size="small"
                type="primary"
                style={{ backgroundColor: '#16a34a' }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirmReceipt(record.id, 'DaDuyet')}
              >
                Hoàn Tất Lưu Kho
              </AButton>
            </div>
          )
        }
        return <Tag color="default">Đã lưu kho</Tag>
      }
    }
  ]

  const inboundHistoryCols = [
    { title: 'Mã phiếu', dataIndex: 'ma_phieu_nhap', key: 'ma_phieu', render: v => <span className="font-mono font-bold text-brand-700">{v}</span> },
    { title: 'Nguồn hàng / Kho gửi', dataIndex: 'ten_nha_cung_cap', key: 'ncc' },
    { title: 'Sản phẩm & Số lượng', dataIndex: 'so_luong_mat_hang', key: 'so_luong' },
    { title: 'Đơn giá nhập', dataIndex: 'don_gia', key: 'don_gia', render: v => `${Number(v || 0).toLocaleString('vi-VN')} đ` },
    { title: 'Tổng tiền', dataIndex: 'tong_tien', key: 'tong_tien', render: v => <span className="font-semibold text-emerald-600">{Number(v || 0).toLocaleString('vi-VN')} đ</span> },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (st) => {
        if (st === 'DaHuy') {
          return <Tag color="error" icon={<CloseCircleOutlined />}>Đã hủy (Đã hoàn kho gốc)</Tag>
        }
        return <Tag color="green" icon={<CheckCircleOutlined />}>Đã hoàn tất lưu kho</Tag>
      }
    },
    { title: 'Thời gian nhập', dataIndex: 'created_at', key: 'created_at', render: v => v ? formatDateTime(v) : '-' }
  ]

  const historyCols = [
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'product', ellipsis: true },
    { title: 'Số lô', dataIndex: 'batchNumber', key: 'batch', render: v => <span className="font-mono text-xs">{v}</span> },
    {
      title: 'Số lượng tồn kho',
      dataIndex: 'quantity',
      key: 'qty',
      render: (v, record) => {
        if (record.isTransferredOut || v === 0) {
          return <Tag color="volcano">Đã chuyển kho (Giữ lịch sử 180 ngày)</Tag>
        }
        return <span className="font-semibold text-slate-800">{v} {record.unitName || record.don_vi_tinh || 'hộp'}</span>
      }
    },
    { title: 'Thời gian', dataIndex: 'receivedAt', key: 'time', render: v => v ? formatDateTime(v) : 'Vừa xong' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (record.isTransferredOut) {
          return <Tag color="default">Đã xuất luân chuyển kho</Tag>
        }
        if (record.isReceivedViaTransfer) {
          return <Tag color="blue" icon={<SafetyCertificateOutlined />}>Đã có QR từ Nhà máy</Tag>
        }
        return record.batchId ? (
          <AButton size="small" type="primary" icon={<PrinterOutlined />} onClick={() => handleOpenPrintModal(record.batchId, record.batchNumber)}>
            In mã QR
          </AButton>
        ) : null
      }
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <InboxOutlined /> Quản Lý Nhập Kho & Tem Truy Xuất QR (WMS)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Theo dõi trạng thái vận chuyển từ Nhà máy / NCC, xác nhận nhận hàng và dán tem QR bảo chứng PharmaTrace
        </p>
      </div>

      {/* Guidance Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3 items-start">
          <SafetyCertificateOutlined className="text-2xl text-amber-600 mt-1" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Chế độ Nhập kho & Bảo chứng Tem QR Truy Xuất (Hybrid QR)</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              • <strong>Thuốc Nội bộ / Nhà máy liên kết:</strong> Đã in sẵn QR từ chuyền sản xuất - Quét mã Thùng/Kiện để xác nhận.<br />
              • <strong>Thuốc Bên Thứ 3 (Sanofi, DHG, Pfizer...):</strong> Nhận hàng - WMS tự sinh UID - Bấm <strong>"In Tem phụ QR"</strong> để dán tem PharmaTrace lên hộp.
            </p>
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'shipments',
            label: <span><CarOutlined /> Chuyến Hàng Đang Vận Chuyển / Chờ Nhận</span>,
            children: (
              <Card title="Danh sách Phiếu/Lô hàng đang vận chuyển đến kho">
                <Table
                  dataSource={shipments}
                  columns={shipmentCols}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  size="small"
                  loading={loadingShipments}
                />
              </Card>
            )
          },
          {
            key: 'inbound_history',
            label: <span><HistoryOutlined /> Lịch Sử Nhập Kho</span>,
            children: (
              <Card title="Lịch sử các đợt nhập kho đã hoàn tất (Chuyển kho & NCC)">
                <Table
                  dataSource={completedInbounds}
                  columns={inboundHistoryCols}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  size="small"
                  loading={loadingShipments}
                />
              </Card>
            )
          },
          {
            key: 'manual',
            label: <span><FileTextOutlined /> Nhập Lô Mới & In Tem QR</span>,
            children: (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card title="Khai báo & Nhận lô hàng mới">
                    <Form form={form} layout="vertical" onFinish={handleReceive}>
                      <div className="grid sm:grid-cols-2 gap-x-4">
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

                        <Form.Item label="Số lô" name="so_lo" rules={[{ required: true, message: 'Nhập số lô' }]}>
                          <Input placeholder="BATCH-0001" />
                        </Form.Item>

                        <Form.Item label="Số lượng hộp" name="so_luong_hop" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                          <InputNumber min={1} max={50000} style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item label="Ngày sản xuất" name="ngay_sx" rules={[{ required: true, message: 'Nhập ngày sản xuất' }]}>
                          <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                        </Form.Item>

                        <Form.Item label="Hạn sử dụng" name="hsd" rules={[{ required: true, message: 'Nhập hạn sử dụng' }]}>
                          <DatePicker style={{ width: '100%' }} placeholder="YYYY-MM-DD" />
                        </Form.Item>

                        <Form.Item
                          label="Đơn giá nhập / Giá xuất xưởng (VNĐ)"
                          name="don_gia"
                          rules={[
                            { required: true, message: 'Vui lòng nhập đơn giá nhập kho' },
                            { type: 'number', min: 1, message: 'Đơn giá phải lớn hơn 0' }
                          ]}
                        >
                          <InputNumber
                            min={1}
                            step={1000}
                            placeholder="Ví dụ: 4000"
                            style={{ width: '100%' }}
                            formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                            parser={value => value ? value.replace(/\D/g, '') : ''}
                          />
                        </Form.Item>

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

                      {Boolean(watchQty && watchPrice && watchQty > 0 && watchPrice > 0) && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-emerald-800 font-medium">Tổng giá trị lô hàng nhập kho:</span>
                          <span className="text-base font-bold text-emerald-700">
                            {(Number(watchQty) * Number(watchPrice)).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      )}

                      <AButton type="primary" htmlType="submit" loading={loading} icon={<InboxOutlined />} size="large">
                        Tạo Lô & Sinh Mã QR Tem Phụ
                      </AButton>
                    </Form>
                  </Card>
                </div>
              </div>
            )
          },
          {
            key: 'history',
            label: <span><InboxOutlined /> Lịch Sử Lưu Kho (Tất Cả)</span>,
            children: (
              <Card title="Lịch sử lưu kho khả dụng">
                <Table
                  dataSource={received}
                  columns={historyCols}
                  rowKey="key"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  loading={loadingHistory}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Print QR Modal */}
      <Modal
        title={`In nhãn tem kép (Dual-Code) PharmaTrace - Lô ${printBatchNumber}`}
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        width={850}
        footer={[
          <AButton key="close" onClick={() => setPrintModalVisible(false)}>
            Đóng
          </AButton>,
          <AButton key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={printQRs.length === 0}>
            In dải tem kép Dual-Code hàng loạt
          </AButton>,
        ]}
      >
        {loadingQRs ? (
          <div className="py-12 text-center">
            <Spin size="large" tip="Đang tải danh dải mã UIDs tem nhãn..." />
            <p className="text-slate-400 mt-2 text-sm">Vui lòng đợi trong giây lát</p>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 text-xs mb-4 flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-600 text-base shrink-0">verified_user</span>
              <div>
                <strong>Cơ chế Tem Kép (Dual-Code Security):</strong>
                <ul className="list-disc ml-4 mt-1 space-y-0.5 text-blue-800">
                  <li><strong>Mã Vận Hành (Trái):</strong> Quét nhanh ngoài vỏ hộp khi Nhập/Xuất/Đóng gói không cần cào lớp bạc.</li>
                  <li><strong>Tem Chống Giả (Phải):</strong> Phủ bạc bảo mật chứa URL kèm mã PIN bí mật dành riêng cho Khách hàng cuối cào và xác thực.</li>
                </ul>
              </div>
            </div>

            <div id="qr-print-area" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto p-2 border rounded-lg bg-slate-50">
              {printQRs.map(qr => {
                const logisticsUrl = qr.uid;
                const securityUrl = `${window.location.origin}/trace?uid=${qr.uid}&pin=${qr.secret_pin}`;
                return (
                  <div key={qr.uid} className="border border-slate-300 bg-white p-3 rounded-xl shadow-sm grid grid-cols-2 gap-3 items-center">
                    {/* Left: Logistics Code */}
                    <div className="flex flex-col items-center justify-center text-center border-r border-dashed border-slate-200 pr-2">
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mb-1">1. VẬN HÀNH</span>
                      <QRCodeSVG id={`qr-svg-logistics-${qr.uid}`} value={logisticsUrl} size={90} level="M" includeMargin={true} />
                      <div className="text-[9px] font-mono mt-1 text-slate-500 truncate w-full">{qr.uid}</div>
                    </div>

                    {/* Right: Consumer Scratch-off QR */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mb-1">2. TEM PHỦ CÀO</span>
                      <QRCodeSVG id={`qr-svg-security-${qr.uid}`} value={securityUrl} size={90} level="M" includeMargin={true} />
                      <div className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-300 text-slate-700 px-2 py-0.5 rounded mt-1">
                        PIN: {qr.secret_pin || '••••••'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Chi Tiết Chuyến Hàng Đang Vận Chuyển */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <CarOutlined className="text-blue-600" /> Chi tiết chuyến hàng nhập kho
          </div>
        }
        open={!!selectedShipment}
        onCancel={() => setSelectedShipment(null)}
        footer={[
          selectedShipment && (
            <AButton
              key="confirm"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={async () => {
                const rec = selectedShipment
                setSelectedShipment(null)
                if (rec.isTransfer) {
                  await handleConfirmTransferReceipt(rec)
                } else {
                  await handleConfirmReceipt(rec.id, 'DaNhanHang')
                }
              }}
            >
              Xác Nhận Đã Nhận Hàng
            </AButton>
          ),
          selectedShipment && selectedShipment.isTransfer && (
            <Popconfirm
              key="reject-confirm"
              title="Từ chối / Hủy nhận chuyến hàng?"
              description="Toàn bộ số thuốc thuộc chuyến hàng này sẽ được tự động hoàn trả về Kho gửi khả dụng."
              onConfirm={async () => {
                const rec = selectedShipment
                setSelectedShipment(null)
                await handleRejectTransferReceipt(rec)
              }}
              okText="Từ chối / Hủy"
              cancelText="Quay lại"
              okButtonProps={{ danger: true }}
            >
              <AButton key="reject" danger icon={<CloseCircleOutlined />}>
                Từ Chối / Hủy
              </AButton>
            </Popconfirm>
          ),
          <AButton key="close" onClick={() => setSelectedShipment(null)}>Đóng</AButton>
        ]}
        width={650}
        centered
      >
        {selectedShipment && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                  <FileTextOutlined className="text-blue-500" /> Mã phiếu / Thời gian tạo
                </div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                  <span className="font-mono">{selectedShipment.ma_phieu_nhap}</span>
                  <span className="text-slate-300">•</span>
                  <span>{selectedShipment.created_at ? formatDateTime(selectedShipment.created_at) : '-'}</span>
                </div>
              </div>
              <div>
                <Tag color="processing" icon={<CarOutlined />} className="px-3.5 py-1.5 text-xs font-bold rounded-full border border-blue-200 shadow-sm">
                  Đang vận chuyển (Chờ nhận)
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
                <div className="text-xs text-amber-800 font-bold mb-1 flex items-center gap-1.5">
                  <ShopOutlined className="text-amber-600" /> Nguồn hàng / Kho gửi
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">{selectedShipment.ten_nha_cung_cap}</div>
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 shadow-sm">
                <div className="text-xs text-blue-800 font-bold mb-1 flex items-center gap-1.5">
                  <MedicineBoxOutlined className="text-blue-600" /> Sản phẩm & Số lượng
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">{selectedShipment.so_luong_mat_hang}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                  <DollarOutlined className="text-slate-500" /> Đơn giá nhập
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {selectedShipment.don_gia ? `${Number(selectedShipment.don_gia).toLocaleString('vi-VN')} đ` : '0 đ'}
                </div>
              </div>

              <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200/90 text-center shadow-sm">
                <div className="text-xs text-emerald-800 font-bold mb-1 flex items-center justify-center gap-1">
                  <DollarCircleOutlined className="text-emerald-600" /> Tổng tiền
                </div>
                <div className="text-lg font-black text-emerald-700">
                  {selectedShipment.tong_tien ? `${Number(selectedShipment.tong_tien).toLocaleString('vi-VN')} đ` : '0 đ'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
