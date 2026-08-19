import { useEffect, useState } from 'react'
import { Table, Button as AButton, Modal, Form, Input, InputNumber, Select, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { unitService } from '@/services/user.service'
import toast from 'react-hot-toast'

const UNIT_TYPES = [
  { value: 'NhaMay',        label: 'Manufacturing Plant / Factory' },
  { value: 'NhaPhanPhoi',   label: 'Distribution Center / Warehouse' },
  { value: 'NhaThuoc',      label: 'Retail Pharmacy' },
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
        ten_don_vi:  unit.ten_don_vi || unit.name || '',
        loai_don_vi: unit.loai_don_vi || unit.type || '',
        dia_chi:     unit.dia_chi || unit.address || '',
        toa_do_lat:  unit.toa_do_lat ?? unit.lat ?? null,
        toa_do_lng:  unit.toa_do_lng ?? unit.lng ?? null,
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
      toast.success(editing ? 'Facility updated successfully' : 'Facility created successfully')
      setOpen(false)
      fetchData()
    } catch { toast.error('Failed to save facility') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await unitService.delete(id); toast.success('Facility deleted successfully'); fetchData() }
    catch { toast.error('Failed to delete facility') }
  }

  const cols = [
    {
      title: 'Facility Name',
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
      title: 'Facility Type',
      dataIndex: 'type',
      key: 'type',
      render: v => <Tag color={TYPE_COLORS[v] || 'default'}>{UNIT_TYPES.find(t => t.value === v)?.label || v}</Tag>,
    },
    {
      title: 'GPS Coordinates',
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
        : <span className="text-slate-400 text-xs italic">Not configured</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <div className="flex gap-1">
          <AButton size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
          <Popconfirm title="Delete facility?" onConfirm={() => handleDelete(row.id)} okText="Delete" okButtonProps={{ danger: true }}>
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
          <h1 className="text-xl font-display font-bold text-slate-900">Facilities & Distribution Units</h1>
          <p className="text-slate-500 text-sm">Manage factories, distribution warehouses, and retail pharmacy network</p>
        </div>
        <AButton type="primary" icon={<PlusOutlined />} onClick={() => openModal()} size="large">Add Facility</AButton>
      </div>

      <div className="card p-4">
        <Table dataSource={data} columns={cols} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </div>

      <Modal
        title={editing ? 'Edit Facility' : 'Add New Facility'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item label="Facility Name" name="ten_don_vi" rules={[{ required: true, message: 'Please enter facility name' }]}>
            <Input placeholder="e.g. Hau Giang Pharma Factory" />
          </Form.Item>

          <Form.Item label="Facility Type" name="loai_don_vi" rules={[{ required: true, message: 'Please select type' }]}>
            <Select options={UNIT_TYPES} placeholder="Select facility type" />
          </Form.Item>

          <Form.Item label="Physical Address" name="dia_chi">
            <Input.TextArea rows={2} placeholder="e.g. 288 Bis Nguyen Van Cu, Dist 5, HCMC" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Latitude"
              name="toa_do_lat"
              rules={[{
                validator: (_, v) => (!v || (v >= -90 && v <= 90)) ? Promise.resolve() : Promise.reject('Must be between -90 and 90')
              }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.00001} placeholder="e.g. 10.76269" />
            </Form.Item>
            <Form.Item
              label="Longitude"
              name="toa_do_lng"
              rules={[{
                validator: (_, v) => (!v || (v >= -180 && v <= 180)) ? Promise.resolve() : Promise.reject('Must be between -180 and 180')
              }]}
            >
              <InputNumber style={{ width: '100%' }} step={0.00001} placeholder="e.g. 106.68278" />
            </Form.Item>
          </div>
          <p className="text-xs text-slate-400 -mt-2">GPS coordinates are utilized for nearest pharmacy routing and map tracking.</p>
        </Form>
      </Modal>
    </div>
  )
}
