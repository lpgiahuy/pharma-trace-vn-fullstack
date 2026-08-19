import { useState, useEffect } from 'react'
import { Form, InputNumber, Select, Button as AButton, Card, Table, Tag, Alert, Modal, Descriptions, Popconfirm } from 'antd'
import { SwapOutlined, EyeOutlined, CheckCircleOutlined, CarOutlined, CloseCircleOutlined, SendOutlined, ShopOutlined, MedicineBoxOutlined, BarcodeOutlined, UnorderedListOutlined, DollarOutlined, DollarCircleOutlined, FileTextOutlined, HistoryOutlined, RocketOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import apiClient from '@/services/apiClient'
import { useAuth } from '@/store/authStore'
import { formatDateTime, formatDate } from '@/utils'
import { formatUnitType } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function TransferPage() {
  const { user } = useAuth()
  const sourceUnitId = user?.don_vi_id ? Number(user.don_vi_id) : null

  const [form] = Form.useForm()
  const watchQty = Form.useWatch('so_luong', form)
  const watchPrice = Form.useWatch('don_gia', form)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [units, setUnits] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState([])

  const fetchHistory = async () => {
    if (!sourceUnitId) return
    setLoadingHistory(true)
    try {
      const data = await warehouseService.getTransferHistory({ tu_don_vi_id: sourceUnitId })
      setHistory(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const refreshPOs = () => {
    warehouseService.getPurchaseOrders('supplier')
      .then(res => {
        const list = (res || []).filter(po => {
          if (po.trang_thai !== 'DaDuyet') return false
          if (sourceUnitId && Number(po.nha_cung_cap_id) !== Number(sourceUnitId)) return false
          const total = Number(po.tong_so_luong_dat || 0)
          const received = Number(po.so_luong_da_nhan || 0)
          const inTransit = Number(po.so_luong_dang_giao || 0)
          const remainingToShip = total - received - inTransit
          return remainingToShip > 0
        })
        setPurchaseOrders(list)
      })
      .catch(() => {})
  }

  useEffect(() => {
    warehouseService.getUnits().then(setUnits).catch(() => { })
    fetchHistory()
    refreshPOs()
  }, [sourceUnitId])

  // Load medicines available in the staff's unit when the page mounts
  useEffect(() => {
    if (!sourceUnitId) return
    setLoadingProducts(true)
    warehouseService.getProductsInUnit(sourceUnitId)
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoadingProducts(false))
  }, [sourceUnitId])

  const handleProductChange = async (duocPhamId) => {
    form.setFieldsValue({ lo_thuoc_id: undefined, so_luong: undefined })
    setBatches([])
    setSelectedBatch(null)
    if (!duocPhamId) return
    setLoadingBatches(true)
    try {
      const data = await warehouseService.getBatchesInUnit(sourceUnitId, duocPhamId)
      setBatches(data)
    } catch { toast.error('Failed to load batches') }
    finally { setLoadingBatches(false) }
  }

  const handleBatchChange = (loThuocId) => {
    const batch = batches.find(b => b.id === loThuocId)
    setSelectedBatch(batch || null)
    form.setFieldsValue({ so_luong: undefined })
  }

  const handleTransfer = async (vals) => {
    const { den_don_vi_id, lo_thuoc_id, so_luong, don_gia, ly_do, po_code } = vals
    if (sourceUnitId === den_don_vi_id) {
      toast.error('Source and destination facilities cannot be the same')
      return
    }
    setLoading(true)
    try {
      const mang_uid = await warehouseService.getUIDsForTransfer(sourceUnitId, lo_thuoc_id, so_luong)
      if (!mang_uid.length) {
        toast.error('No eligible item UIDs found for transfer')
        return
      }
      await warehouseService.transferStock({ tu_don_vi_id: sourceUnitId, den_don_vi_id, mang_uid, ly_do, don_gia, po_code })
      toast.success(`Dispatched transfer order for ${mang_uid.length} ${selectedBatch?.don_vi_tinh || 'units'} (Total: ${(so_luong * (don_gia || 0)).toLocaleString()} ₫). Awaiting destination confirmation!`)
      form.resetFields()
      setBatches([])
      setSelectedBatch(null)
      fetchHistory()
      refreshPOs()
      warehouseService.getProductsInUnit(sourceUnitId).then(setProducts).catch(() => { })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Stock transfer failed')
    }
    finally { setLoading(false) }
  }

  const destUnitOptions = units
    .filter(u => u.id !== sourceUnitId)
    .map(u => ({ value: u.id, label: `${u.ten_don_vi}${u.loai_don_vi ? ` (${formatUnitType(u.loai_don_vi)})` : ''}` }))

  const handleCancelTransfer = async (transferId) => {
    try {
      await warehouseService.cancelStockTransfer(transferId)
      toast.success('Transfer order cancelled and stock returned to origin successfully!')
      fetchHistory()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel transfer order')
    }
  }

  const cols = [
    { title: 'Product', dataIndex: 'ten_duoc_pham', key: 'productName', render: (v, r) => v || r.productName || 'Medication' },
    { title: 'Batch Number', dataIndex: 'so_lo', key: 'batchNumber', render: (v, r) => <span className="font-mono text-xs">{v || r.batchNumber}</span> },
    { title: 'Quantity', dataIndex: 'so_luong_hop', key: 'quantity', render: (v, r) => `${v || r.quantity || 0} ${r.don_vi_tinh || 'boxes'}` },
    {
      title: 'Unit Price',
      dataIndex: 'don_gia',
      key: 'price',
      render: (v) => v ? `${Number(v).toLocaleString()} ₫` : '0 ₫'
    },
    {
      title: 'Total Amount',
      key: 'tong_tien',
      render: (_, r) => {
        const val = Number(r.tong_tien || (r.don_gia ? r.don_gia * (r.so_luong_hop || 0) : 0))
        return <span className="font-semibold text-slate-800">{val ? `${val.toLocaleString()} ₫` : '0 ₫'}</span>
      }
    },
    {
      title: 'PO Code',
      dataIndex: 'po_code',
      key: 'po_code',
      render: (v) => v ? <Tag color="purple">{v}</Tag> : <span className="text-slate-400 text-xs">-</span>
    },
    { title: 'From Facility', dataIndex: 'ten_tu_kho', key: 'fromLocation', render: (v, r) => <Tag color="orange">{v || r.fromLocation || `Unit #${r.tu_don_vi_id}`}</Tag> },
    { title: 'To Facility', dataIndex: 'ten_den_kho', key: 'toLocation', render: (v, r) => <Tag color="blue">{v || r.toLocation || `Unit #${r.den_don_vi_id}`}</Tag> },
    {
      title: 'Status',
      dataIndex: 'trang_thai',
      key: 'status',
      render: (st) => {
        if (st === 'DaHuy') {
          return <Tag color="error">Cancelled (Returned to Origin)</Tag>
        }
        if (st === 'DangVanChuyen' || (typeof st === 'string' && st.startsWith('DangVanChuyen')) || st === 'IN_TRANSIT') {
          return <Tag color="processing" icon={<CarOutlined />}>In Transit (Pending Receipt)</Tag>
        }
        return <Tag color="success" icon={<CheckCircleOutlined />}>Completed</Tag>
      }
    },
    { title: 'Time', dataIndex: 'thoi_gian', key: 'time', render: (v, r) => formatDateTime(v || r.transferredAt) },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <AButton size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
          Details
        </AButton>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <SwapOutlined className="text-blue-600" /> Warehouse Stock Transfers
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Create stock transfers between warehouses/pharmacies and monitor audit trails
        </p>
      </div>

      <Card title={`Create Stock Transfer (Current Facility: ${user?.ten_don_vi || `Unit #${sourceUnitId}`})`}>
        <Form form={form} layout="vertical" onFinish={handleTransfer}>
          <div className="grid sm:grid-cols-2 gap-x-4">

            {/* Direct PO Fulfillment Selector (Optional) */}
            <div className="sm:col-span-2 mb-2">
              <Form.Item 
                label="Direct PO Fulfillment (Optional — Auto-fills Destination, Product, Quantity & Price)" 
                name="po_code"
              >
                <Select
                  allowClear
                  showSearch
                  placeholder="-- Select PO order to fulfill (or leave empty for standalone transfer) --"
                  optionFilterProp="label"
                  onChange={async (poCode) => {
                    if (!poCode) {
                      return
                    }
                    const po = purchaseOrders.find(p => p.ma_phieu_nhap === poCode)
                    if (!po) return

                    try {
                      const { data } = await apiClient.get(`/admin/procurement/orders/${po.id}`)
                      const poDetail = data?.data || po
                      const firstItem = poDetail.chi_tiet?.[0]
                      const remQty = Math.max(1, (poDetail.tong_so_luong_dat || 0) - (poDetail.so_luong_da_nhan || 0) - (poDetail.so_luong_dang_giao || 0))
                      
                      form.setFieldsValue({
                        den_don_vi_id: poDetail.den_don_vi_id,
                        duoc_pham_id: firstItem?.duoc_pham_id,
                        don_gia: firstItem?.don_gia ? Number(firstItem.don_gia) : undefined,
                        so_luong: remQty,
                        ly_do: `Order fulfillment for ${poDetail.ma_phieu_nhap}`
                      })

                      if (firstItem?.duoc_pham_id) {
                        handleProductChange(firstItem.duoc_pham_id)
                      }
                    } catch (err) {
                      console.error('Error fetching PO detail:', err)
                    }
                  }}
                  options={purchaseOrders.map(po => {
                    const total = po.tong_so_luong_dat || 0
                    const received = po.so_luong_da_nhan || 0
                    const inTransit = po.so_luong_dang_giao || 0
                    const remainingToShip = Math.max(0, total - received - inTransit)
                    const destName = po.ten_don_vi_nhan || (units.find(u => u.id === po.den_don_vi_id)?.ten_don_vi) || (po.ten_nguoi_tao ? `Branch (${po.ten_nguoi_tao})` : 'Receiving Branch')
                    
                    let statusParts = []
                    statusParts.push(`Remaining: ${remainingToShip} boxes`)
                    if (inTransit > 0) {
                      statusParts.push(`${inTransit} in transit`)
                    }
                    if (received > 0) {
                      statusParts.push(`${received} received`)
                    }

                    return {
                      value: po.ma_phieu_nhap,
                      label: `${po.ma_phieu_nhap} — Destination: ${destName} — ${statusParts.join(' • ')} (Total: ${total} boxes)`
                    }
                  })}
                />
              </Form.Item>
            </div>

            {/* Destination unit */}
            <Form.Item label="Destination Facility (Warehouse / Pharmacy)" name="den_don_vi_id" rules={[{ required: true, message: 'Please select destination unit' }]}>
              <Select showSearch placeholder="Select destination facility" optionFilterProp="label" options={destUnitOptions} />
            </Form.Item>

            {/* Medicine */}
            <Form.Item label="Product / Medication" name="duoc_pham_id" rules={[{ required: true, message: 'Please select product' }]}>
              <Select
                showSearch
                loading={loadingProducts}
                placeholder={loadingProducts ? 'Loading...' : products.length === 0 ? 'No products in warehouse' : 'Select product'}
                optionFilterProp="label"
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.ten_thuoc} (${p.so_hop_trong_kho} ${p.don_vi_tinh || 'boxes'})`,
                }))}
                onChange={handleProductChange}
              />
            </Form.Item>

            {/* Batch number */}
            <Form.Item label="Batch / Lot Number" name="lo_thuoc_id" rules={[{ required: true, message: 'Please select batch' }]}>
              <Select
                loading={loadingBatches}
                placeholder={!form.getFieldValue('duoc_pham_id') ? 'Select product first' : loadingBatches ? 'Loading...' : 'Select batch'}
                disabled={batches.length === 0 || loadingBatches}
                options={batches.map(b => {
                  const hsd = b.han_su_dung || b.expiryDate || b.ngay_het_han || b.hsd
                  return {
                    value: b.id,
                    label: `${b.so_lo} — Exp: ${hsd ? formatDate(hsd) : 'Not set'} (${b.so_hop_trong_kho} ${b.don_vi_tinh || 'boxes'})`,
                  }
                })}
                onChange={handleBatchChange}
              />
            </Form.Item>

            {/* Quantity */}
            <Form.Item
              label={selectedBatch ? `Quantity (${selectedBatch.so_hop_trong_kho} ${selectedBatch.don_vi_tinh || 'boxes'} available)` : 'Quantity'}
              name="so_luong"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber
                min={1}
                max={selectedBatch ? parseInt(selectedBatch.so_hop_trong_kho) : undefined}
                disabled={!selectedBatch}
                style={{ width: '100%' }}
                placeholder={`Enter quantity (${selectedBatch?.don_vi_tinh || 'units'})`}
              />
            </Form.Item>

            {/* Unit Price */}
            <Form.Item
              label={`Transfer Unit Price (VND / ${selectedBatch?.don_vi_tinh || 'unit'} — Optional)`}
              name="don_gia"
            >
              <InputNumber
                min={0}
                step={1000}
                formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                parser={value => value ? value.replace(/\D/g, '') : ''}
                style={{ width: '100%' }}
                placeholder={`Enter unit price per ${selectedBatch?.don_vi_tinh || 'unit'} (optional)`}
              />
            </Form.Item>

            {/* Reason */}
            <Form.Item label="Transfer Reason" name="ly_do">
              <Select
                allowClear
                placeholder="Select reason (optional)"
                options={[
                  { value: 'Order fulfillment', label: 'Order fulfillment' },
                  { value: 'Inventory balancing', label: 'Inventory balancing' },
                  { value: 'Central warehouse return', label: 'Central warehouse return' },
                  { value: 'Expiring stock reallocation', label: 'Expiring stock reallocation' },
                  { value: 'Branch requisition', label: 'Branch requisition' },
                ]}
              />
            </Form.Item>
          </div>

          {selectedBatch && (
            <Alert
              type="info" showIcon className="mb-4"
              message={`Batch ${selectedBatch.so_lo} — Available: ${selectedBatch.so_hop_trong_kho} ${selectedBatch.don_vi_tinh || 'boxes'} — Exp: ${(selectedBatch.han_su_dung || selectedBatch.expiryDate || selectedBatch.ngay_het_han || selectedBatch.hsd) ? formatDate(selectedBatch.han_su_dung || selectedBatch.expiryDate || selectedBatch.ngay_het_han || selectedBatch.hsd) : 'Not set'}`}
            />
          )}

          {Boolean(watchQty && watchPrice) && (
            <Alert
              type="success" showIcon className="mb-4 font-semibold text-emerald-800"
              message={`Total Transfer Valuation: ${(watchQty * watchPrice).toLocaleString()} ₫ (${watchQty} ${selectedBatch?.don_vi_tinh || 'units'} × ${Number(watchPrice).toLocaleString()} ₫/${selectedBatch?.don_vi_tinh || 'unit'})`}
            />
          )}

          <AButton type="primary" htmlType="submit" loading={loading} icon={<SwapOutlined />}>
            Dispatch Stock Transfer
          </AButton>
        </Form>
      </Card>

      <Card title="Transfer History">
        <Table dataSource={history} columns={cols} rowKey="id" pagination={{ pageSize: 10 }} loading={loadingHistory} size="small" scroll={{ x: 700 }} />
      </Card>

      {/* Modal View Transfer Details */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800 text-lg font-bold">
            <SwapOutlined className="text-blue-600" /> Stock Transfer Details
          </div>
        }
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        footer={[
          detailRecord && (detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))) && (
            <Popconfirm
              key="cancel-confirm"
              title="Cancel Transfer Order?"
              description="All items in this transfer will be returned to origin available inventory."
              onConfirm={async () => {
                const recId = detailRecord.id
                setDetailRecord(null)
                await handleCancelTransfer(recId)
              }}
              okText="Cancel Order"
              cancelText="Back"
              okButtonProps={{ danger: true }}
            >
              <AButton danger icon={<CloseCircleOutlined />}>
                Cancel Transfer Order
              </AButton>
            </Popconfirm>
          ),
          <AButton key="close" type="primary" onClick={() => setDetailRecord(null)}>
            Close
          </AButton>
        ]}
        width={620}
        centered
      >
        {detailRecord && (
          <div className="space-y-4 pt-2">
            {/* Header info & Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                  <FileTextOutlined className="text-blue-500" /> Transfer ID / Time
                </div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                  <span className="font-mono">#{detailRecord.id || 'TRF'}</span>
                  <span className="text-slate-300">•</span>
                  <span>{formatDateTime(detailRecord.thoi_gian || detailRecord.transferredAt)}</span>
                </div>
              </div>
              <div>
                <Tag
                  color={
                    detailRecord.trang_thai === 'DaHuy'
                      ? 'error'
                      : detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))
                        ? 'processing'
                        : 'success'
                  }
                  className="px-3.5 py-1.5 text-xs font-bold rounded-full border shadow-sm"
                >
                  {detailRecord.trang_thai === 'DaHuy'
                    ? 'Cancelled'
                    : detailRecord.trang_thai === 'DangVanChuyen' || (typeof detailRecord.trang_thai === 'string' && detailRecord.trang_thai.startsWith('DangVanChuyen'))
                      ? 'In Transit (Pending Receipt)'
                      : '✓ Completed'}
                </Tag>
              </div>
            </div>

            {/* Product & Batch Card */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
                <MedicineBoxOutlined className="text-blue-600" /> Product & Batch Details
              </div>
              <div className="text-base font-bold text-slate-900 leading-snug">
                {detailRecord.ten_duoc_pham || detailRecord.productName}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <BarcodeOutlined className="text-purple-600" /> Batch Number:
                </span>
                <span className="font-mono bg-white px-2.5 py-0.5 rounded border border-blue-200 text-xs font-bold text-blue-800 shadow-sm">
                  {detailRecord.so_lo || detailRecord.batchNumber}
                </span>
              </div>
            </div>

            {/* Origin -> Destination Flow Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-sm">
                <div className="text-xs text-amber-800 font-bold mb-1 flex items-center gap-1.5">
                  <ShopOutlined className="text-amber-600" /> From Facility (Sender)
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {detailRecord.ten_tu_kho || detailRecord.fromLocation || `Unit #${detailRecord.tu_don_vi_id}`}
                </div>
              </div>

              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200/80 shadow-sm">
                <div className="text-xs text-sky-800 font-bold mb-1 flex items-center gap-1.5">
                  <ShopOutlined className="text-sky-600" /> To Facility (Receiver)
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {detailRecord.ten_den_kho || detailRecord.toLocation || `Unit #${detailRecord.den_don_vi_id}`}
                </div>
              </div>
            </div>

            {/* Quantities & Price Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                  <UnorderedListOutlined className="text-slate-500" /> Quantity
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {detailRecord.so_luong_hop || detailRecord.quantity || 0} <span className="text-xs font-normal text-slate-500">{detailRecord.don_vi_tinh || 'boxes'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center justify-center gap-1">
                  <DollarOutlined className="text-slate-500" /> Unit Price
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {Number(detailRecord.don_gia || 0) ? `${Number(detailRecord.don_gia).toLocaleString()} ₫` : '0 ₫'}
                </div>
              </div>

              <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200/90 text-center shadow-sm">
                <div className="text-xs text-emerald-800 font-bold mb-1 flex items-center justify-center gap-1">
                  <DollarCircleOutlined className="text-emerald-600" /> Total Amount
                </div>
                <div className="text-base font-black text-emerald-700">
                  {Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0)))
                    ? `${Number(detailRecord.tong_tien || (Number(detailRecord.don_gia || 0) * Number(detailRecord.so_luong_hop || detailRecord.quantity || 0))).toLocaleString()} ₫`
                    : '0 ₫'}
                </div>
              </div>
            </div>

            {detailRecord.ly_do && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2 shadow-sm">
                <InfoCircleOutlined className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Reason:</span> {detailRecord.ly_do}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
