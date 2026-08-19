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
        ma_code:            v.ma_code || v.code || '',
        loai_giam_gia:      v.loai_giam_gia || v.type || 'PhanTram',
        gia_tri:            v.gia_tri !== undefined ? v.gia_tri : v.value,
        don_hang_toi_thieu: v.don_hang_toi_thieu !== undefined ? v.don_hang_toi_thieu : v.minOrder,
        so_luong_gioi_han:  v.so_luong_gioi_han !== undefined ? v.so_luong_gioi_han : v.usageLimit,
        ngay_bat_dau:       (v.ngay_bat_dau || v.startDate) ? dayjs(v.ngay_bat_dau || v.startDate) : null,
        ngay_ket_thuc:      (v.ngay_ket_thuc || v.endDate) ? dayjs(v.ngay_ket_thuc || v.endDate) : null,
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

      toast.success(editing ? 'Voucher coupon updated successfully' : 'Voucher coupon created successfully')
      setOpen(false); fetchData()
    } catch { toast.error('Failed to save voucher') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await voucherService.delete(id); toast.success('Voucher deleted successfully'); fetchData() }
    catch { toast.error('Failed to delete voucher') }
  }

  const cols = [
    {
      title: 'Coupon Code',
      dataIndex: 'code',
      key: 'code',
      render: v => <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">{v}</span>
    },
    {
      title: 'Discount Type',
      dataIndex: 'type',
      key: 'type',
      render: v => (
        <Tag color={v === 'PhanTram' ? 'blue' : 'orange'}>
          {v === 'PhanTram' ? 'Percentage %' : 'Fixed Amount ₫'}
        </Tag>
      )
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, r) => r.type === 'PhanTram' ? `${r.value}%` : formatCurrency(r.value)
    },
    {
      title: 'Conditions',
      dataIndex: 'minOrder',
      key: 'min',
      render: v => v > 0 ? `Min spend ${formatCurrency(v)}` : <span className="text-slate-400 italic">No minimum</span>
    },
    {
      title: 'Usage Count',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? 'ACTIVE' : 'EXPIRED'}</Tag>
    },
    {
      title: 'Validity Period',
      key: 'validity',
      render: (_, r) => (
        <div className="text-xs text-slate-500">
          <div>{formatDate(r.startDate)}</div>
          <div className="text-slate-300">to</div>
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
          <Popconfirm title="Delete this discount voucher?" onConfirm={() => handleDelete(row.id)} okText="Delete" okButtonProps={{ danger: true }}>
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
          <h1 className="text-xl font-display font-bold text-slate-900">Vouchers & Promotional Discounts</h1>
          <p className="text-slate-500 text-sm">Manage promotional discount codes and customer marketing campaigns</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Create Voucher</AButton>
      </div>
      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" scroll={{ x: 800 }} />
      </div>

      <Modal title={editing ? 'Edit Voucher Code' : 'Create New Voucher'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} okText="Save" confirmLoading={saving}>
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Coupon Code" name="ma_code" rules={[{ required: true, message: 'Please enter voucher code' }]}>
            <Input placeholder="e.g. PHARMA50" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Discount Type" name="loai_giam_gia" rules={[{ required: true }]}>
              <Select options={[
                { value: 'PhanTram', label: 'Percentage (%)' },
                { value: 'TienMat',  label: 'Fixed Cash Amount (₫)' },
                { value: 'FreeShip', label: 'Free Shipping' },
              ]} />
            </Form.Item>
            <Form.Item label="Discount Value" name="gia_tri" rules={[{ required: true, message: 'Please enter value' }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Minimum Order Spend (₫)" name="don_hang_toi_thieu">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Usage Limit" name="so_luong_gioi_han">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Start Date" name="ngay_bat_dau" rules={[{ required: true, message: 'Start date is required' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="End Date" name="ngay_ket_thuc" rules={[{ required: true, message: 'End date is required' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
