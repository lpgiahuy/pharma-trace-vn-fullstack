import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Form, Input, InputNumber, Select, Tag, Popconfirm, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { voucherService } from '@/services/analytics.service'
import { formatCurrency, formatDate } from '@/utils'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function VouchersPage() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [form] = Form.useForm()

  const fetchData = () => {
    setLoading(true)
    voucherService.getAll().then(r => setData(r.data)).finally(() => setLoading(false))
  }
  useEffect(fetchData, [])

  const openModal = (v = null) => {
    setEditing(v)
    if (v) {
      form.setFieldsValue({
        ma_code: v.code,
        loai_giam_gia: v.type,
        gia_tri: v.value,
        don_hang_toi_thieu: v.minOrder,
        so_luong_gioi_han: v.usageLimit,
        ngay_bat_dau: v.startDate ? dayjs(v.startDate) : null,
        ngay_ket_thuc: v.endDate ? dayjs(v.endDate) : null,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ loai_giam_gia: 'PhanTram' })
    }
    setOpen(true)
  }

  const handleSave = async (vals) => {
    setSaving(true)
    try {
      const payload = {
        ma_code:            vals.ma_code.toUpperCase(),
        loai_giam_gia:      vals.loai_giam_gia,
        gia_tri:            vals.gia_tri,
        don_hang_toi_thieu: vals.don_hang_toi_thieu || 0,
        ngay_bat_dau:       vals.ngay_bat_dau?.toISOString(),
        ngay_ket_thuc:      vals.ngay_ket_thuc?.toISOString(),
        so_luong_gioi_han:  vals.so_luong_gioi_han || null,
      }

      if (editing) await voucherService.update(editing.id, payload)
      else         await voucherService.create(payload)

      toast.success(editing ? 'Đã cập nhật mã giảm giá' : 'Đã tạo mã giảm giá')
      setOpen(false); fetchData()
    } catch { toast.error('Lưu thất bại') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await voucherService.delete(id); toast.success('Đã xóa mã giảm giá'); fetchData() }
    catch { toast.error('Xóa thất bại') }
  }

  const cols = [
    {
      title: 'Mã giảm giá',
      dataIndex: 'code',
      key: 'code',
      render: v => <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">{v}</span>
    },
    {
      title: 'Loại giảm',
      dataIndex: 'type',
      key: 'type',
      render: v => (
        <Tag color={v === 'PhanTram' ? 'blue' : 'orange'}>
          {v === 'PhanTram' ? 'Phần trăm %' : 'Tiền mặt ₫'}
        </Tag>
      )
    },
    {
      title: 'Giá trị',
      key: 'value',
      render: (_, r) => r.type === 'PhanTram' ? `${r.value}%` : formatCurrency(r.value)
    },
    {
      title: 'Điều kiện',
      dataIndex: 'minOrder',
      key: 'min',
      render: v => v > 0 ? `Tối thiểu ${formatCurrency(v)}` : <span className="text-slate-400 italic">Không yêu cầu</span>
    },
    {
      title: 'Lượt dùng',
      key: 'usage',
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm">{r.usedCount} / {r.usageLimit}</span>
          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${Math.min(100, (r.usedCount / r.usageLimit) * 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? 'HOẠT ĐỘNG' : 'HẾT HẠN'}</Tag>
    },
    {
      title: 'Hiệu lực',
      key: 'validity',
      render: (_, r) => (
        <div className="text-xs text-slate-500">
          <div>{formatDate(r.startDate)}</div>
          <div className="text-slate-300">đến</div>
          <div>{formatDate(r.endDate)}</div>
        </div>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
          <Popconfirm title="Xóa mã giảm giá?" onConfirm={() => handleDelete(row.id)} okText="Xóa" okButtonProps={{ danger: true }}>
            <AButton size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">Mã giảm giá & Khuyến mãi</h1>
          <p className="text-slate-500 text-sm">Quản lý mã giảm giá và chiến dịch marketing</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Tạo mã giảm giá</AButton>
      </div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" scroll={{ x: 800 }} />
      </div>

      <Modal title={editing ? 'Chỉnh sửa mã giảm giá' : 'Mã giảm giá mới'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Lưu" confirmLoading={saving}>
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Mã giảm giá" name="ma_code" rules={[{ required: true, message: 'Vui lòng nhập mã' }]}>
            <Input placeholder="VD: PHARMA50" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Loại" name="loai_giam_gia" rules={[{ required: true }]}>
              <Select options={[
                { value: 'PhanTram', label: 'Phần trăm (%)' },
                { value: 'TienMat',  label: 'Tiền mặt (₫)' },
                { value: 'FreeShip', label: 'Miễn phí vận chuyển' },
              ]} />
            </Form.Item>
            <Form.Item label="Giá trị" name="gia_tri" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Đơn hàng tối thiểu (₫)" name="don_hang_toi_thieu">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Giới hạn lượt dùng" name="so_luong_gioi_han">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Ngày bắt đầu" name="ngay_bat_dau" rules={[{ required: true, message: 'Ngày bắt đầu là bắt buộc' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Ngày kết thúc" name="ngay_ket_thuc" rules={[{ required: true, message: 'Ngày kết thúc là bắt buộc' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
