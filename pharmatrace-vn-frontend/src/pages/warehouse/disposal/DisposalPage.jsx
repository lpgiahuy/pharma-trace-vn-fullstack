import { useState } from 'react'
import { Form, Input, InputNumber, Select, Button as AButton, Card, Alert, Table, Tag } from 'antd'
import { DeleteOutlined, WarningOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

const DISPOSAL_REASONS = [
  { value: 'Expired',                label: 'Expired' },
  { value: 'Damaged packaging',       label: 'Damaged packaging' },
  { value: 'Contaminated / Spoiled',  label: 'Contaminated / Spoiled' },
  { value: 'Recall batch',           label: 'Recall batch' },
  { value: 'Surplus inventory',      label: 'Surplus inventory' },
  { value: 'Quality failed',         label: 'Quality failed' },
]

const DISPOSAL_METHODS = [
  { value: 'Incineration',           label: 'Incineration' },
  { value: 'Secure landfill',        label: 'Secure landfill' },
  { value: 'Chemical neutralization',label: 'Chemical neutralization' },
  { value: 'Return to supplier',     label: 'Return to supplier' },
]

export default function DisposalPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const handleDispose = async (vals) => {
    setLoading(true)
    try {
      const result = await warehouseService.disposeStock(vals)
      setHistory(prev => [{ ...result, ...vals, key: Date.now(), disposedAt: new Date().toISOString() }, ...prev])
      toast.success('Disposal record saved successfully')
      form.resetFields()
    } catch { toast.error('Failed to record disposal') }
    finally { setLoading(false) }
  }

  const cols = [
    { title: 'Product',   dataIndex: 'productName', key: 'product' },
    { title: 'Batch Number',      dataIndex: 'batchNumber',  key: 'batch',  render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Quantity',   dataIndex: 'quantity',     key: 'qty' },
    { title: 'Reason',      dataIndex: 'reason',       key: 'reason', render: v => <Tag color="red">{v}</Tag> },
    { title: 'Disposal Method',dataIndex: 'method',       key: 'method' },
    { title: 'Executed By', dataIndex: 'disposedBy', key: 'by' },
    { title: 'Timestamp',  dataIndex: 'disposedAt',   key: 'time',   render: v => formatDateTime(v) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2"><DeleteOutlined /> Stock Disposal & Write-Off</h1>
        <p className="text-slate-500 text-sm mt-1">Record disposal of expired, damaged, or recalled pharmaceutical items</p>
      </div>

      <Alert
        message="Irreversible Operation"
        description="Ensure authorized managerial approval before proceeding with disposal. All destruction operations are permanently recorded for regulatory audits."
        type="warning"
        showIcon
        icon={<WarningOutlined />}
      />

      <Card title="Record Disposal">
        <Form form={form} layout="vertical" onFinish={handleDispose}>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Form.Item label="Product Name" name="productName" rules={[{ required: true, message: 'Please enter product name' }]}><Input /></Form.Item>
            <Form.Item label="Batch / Lot Number" name="batchNumber" rules={[{ required: true, message: 'Please enter batch number' }]}><Input /></Form.Item>
            <Form.Item label="Disposal Quantity" name="quantity" rules={[{ required: true, message: 'Please enter quantity' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Disposal Reason" name="reason" rules={[{ required: true, message: 'Please select reason' }]}>
              <Select options={DISPOSAL_REASONS} placeholder="Select disposal reason" />
            </Form.Item>
            <Form.Item label="Disposal Method" name="method" rules={[{ required: true, message: 'Please select method' }]}>
              <Select options={DISPOSAL_METHODS} placeholder="Select disposal method" />
            </Form.Item>
            <Form.Item label="Executed By" name="disposedBy" rules={[{ required: true, message: 'Please enter staff name' }]}>
              <Input placeholder="Staff name" />
            </Form.Item>
            <Form.Item label="Notes" name="notes" className="sm:col-span-2">
              <Input.TextArea rows={2} placeholder="Additional details…" />
            </Form.Item>
          </div>
          <AButton type="primary" danger htmlType="submit" loading={loading} icon={<DeleteOutlined />}>Confirm Disposal</AButton>
        </Form>
      </Card>

      {history.length > 0 && (
        <Card title="Disposal History (Current Session)">
          <Table dataSource={history} columns={cols} rowKey="key" pagination={false} size="small" scroll={{ x: 700 }} />
        </Card>
      )}
    </div>
  )
}
