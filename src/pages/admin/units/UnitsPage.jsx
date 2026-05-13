import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Form, Input, InputNumber, Select, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { unitService } from '@/services/user.service'
import toast from 'react-hot-toast'

const UNIT_TYPES = [
  { value: 'NhaMay',        label: 'Nhà Máy' },
  { value: 'NhaPhanPhoi',   label: 'Nhà Phân Phối' },
  { value: 'NhaThuoc',      label: 'Nhà Thuốc' },
]

const TYPE_COLORS = {
  NhaMay:      'purple',
  NhaPhanPhoi: 'blue',
  NhaThuoc:    'green',
}

export default function UnitsPage() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const fetchData = () => {
    setLoading(true)
    unitService.getAll().then(setData).finally(() => setLoading(false))
  }
  useEffect(fetchData, [])

  const openModal = (unit = null) => {
    setEditing(unit)
    if (unit) {
      form.setFieldsValue({
        ten_don_vi:  unit.name,
        loai_don_vi: unit.type,
        dia_chi:     unit.address,
        toa_do_lat:  unit.lat,
        toa_do_lng:  unit.lng,
      })
    } else {
      form.resetFields()
    }
    setOpen(true)
  }

  const handleSave = async (vals) => {
    setSaving(true)
    try {
      if (editing) await unitService.update(editing.id, vals)
      else         await unitService.create(vals)
      toast.success(editing ? 'Đã cập nhật đơn vị' : 'Đã tạo đơn vị')
      setOpen(false)
      fetchData()
    } catch { toast.error('Lưu thất bại') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await unitService.delete(id); toast.success('Đã xóa đơn vị'); fetchData() }
    catch { toast.error('Xóa thất bại') }
  }

  const cols = [
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      key: 'name',
      render: (v, row) => (
        <div>
          <p className="font-medium text-slate-800">{v}</p>
          {row.address && <p className="text-xs text-slate-400">{row.address}</p>}
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: v => <Tag color={TYPE_COLORS[v] || 'default'}>{UNIT_TYPES.find(t => t.value === v)?.label || v}</Tag>,
    },
    {
      title: 'Tọa độ',
      key: 'coords',
      render: (_, row) => row.lat && row.lng
        ? (
          <a
            href={`https://maps.google.com/?q=${row.lat},${row.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-600 flex items-center gap-1 hover:underline"
          >
            <EnvironmentOutlined />
            {Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)}
          </a>
        )
        : <span className="text-slate-400 text-xs italic">Chưa thiết lập</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
          <Popconfirm title="Xóa đơn vị?" onConfirm={() => handleDelete(row.id)} okText="Xóa" okButtonProps={{ danger: true }}>
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
          <h1 className="text-xl font-display font-bold text-slate-900">Đơn vị & Địa điểm</h1>
          <p className="text-slate-500 text-sm">Quản lý nhà máy, nhà phân phối và nhà thuốc</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Thêm đơn vị</AButton>
      </div>

      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </div>

      <Modal
        title={editing ? 'Chỉnh sửa đơn vị' : 'Đơn vị mới'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Tên đơn vị" name="ten_don_vi" rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}>
            <Input placeholder="VD: Nhà máy Dược Hậu Giang" />
          </Form.Item>

          <Form.Item label="Loại đơn vị" name="loai_don_vi" rules={[{ required: true, message: 'Vui lòng chọn loại' }]}>
            <Select options={UNIT_TYPES} placeholder="Chọn loại đơn vị" />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="dia_chi">
            <Input.TextArea rows={2} placeholder="VD: 288 Bis Nguyễn Văn Cừ, Quận 5, TP.HCM" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Vĩ độ"
              name="toa_do_lat"
              rules={[{
                validator: (_, v) => (!v || (v >= -90 && v <= 90)) ? Promise.resolve() : Promise.reject('Phải trong khoảng -90 đến 90')
              }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.00001} placeholder="VD: 10.76269" />
            </Form.Item>
            <Form.Item
              label="Kinh độ"
              name="toa_do_lng"
              rules={[{
                validator: (_, v) => (!v || (v >= -180 && v <= 180)) ? Promise.resolve() : Promise.reject('Phải trong khoảng -180 đến 180')
              }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.00001} placeholder="VD: 106.68278" />
            </Form.Item>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Tọa độ GPS bắt buộc cho tính năng tìm nhà thuốc gần nhất.</p>
        </Form>
      </Modal>
    </div>
  )
}
