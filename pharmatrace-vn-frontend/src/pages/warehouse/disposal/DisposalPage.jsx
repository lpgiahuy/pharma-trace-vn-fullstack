import { useState } from 'react'
import { Form, Input, InputNumber, Select, Button as AButton, Card, Alert, Table, Tag } from 'antd'
import { DeleteOutlined, WarningOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import { formatDateTime } from '@/utils'
import toast from 'react-hot-toast'

const DISPOSAL_REASONS = [
  { value: 'Hết hạn sử dụng',     label: 'Hết hạn sử dụng' },
  { value: 'Hư hỏng',             label: 'Hư hỏng' },
  { value: 'Nhiễm khuẩn',         label: 'Nhiễm khuẩn' },
  { value: 'Thu hồi',             label: 'Thu hồi' },
  { value: 'Tồn kho dư thừa',     label: 'Tồn kho dư thừa' },
  { value: 'Không đạt chất lượng', label: 'Không đạt chất lượng' },
]

const DISPOSAL_METHODS = [
  { value: 'Đốt tiêu hủy',              label: 'Đốt tiêu hủy' },
  { value: 'Chôn lấp',                  label: 'Chôn lấp' },
  { value: 'Trung hòa hóa học',         label: 'Trung hòa hóa học' },
  { value: 'Trả lại nhà cung cấp',      label: 'Trả lại nhà cung cấp' },
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
      toast.success('Đã ghi nhận tiêu hủy thành công')
      form.resetFields()
    } catch { toast.error('Ghi nhận tiêu hủy thất bại') }
    finally { setLoading(false) }
  }

  const cols = [
    { title: 'Sản phẩm',   dataIndex: 'productName', key: 'product' },
    { title: 'Số lô',      dataIndex: 'batchNumber',  key: 'batch',  render: v => <span className="font-mono text-xs">{v}</span> },
    { title: 'Số lượng',   dataIndex: 'quantity',     key: 'qty' },
    { title: 'Lý do',      dataIndex: 'reason',       key: 'reason', render: v => <Tag color="red">{v}</Tag> },
    { title: 'Phương pháp',dataIndex: 'method',       key: 'method' },
    { title: 'Người thực hiện', dataIndex: 'disposedBy', key: 'by' },
    { title: 'Thời gian',  dataIndex: 'disposedAt',   key: 'time',   render: v => formatDateTime(v) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2"><DeleteOutlined /> Tiêu hủy hàng hóa</h1>
        <p className="text-slate-500 text-sm mt-1">Ghi nhận tiêu hủy hàng hết hạn, hư hỏng hoặc bị thu hồi</p>
      </div>

      <Alert
        message="Thao tác không thể hoàn tác"
        description="Đảm bảo đã được cấp trên phê duyệt trước khi tiêu hủy. Mọi lần tiêu hủy đều được ghi lại để kiểm toán."
        type="warning"
        showIcon
        icon={<WarningOutlined />}
      />

      <Card title="Ghi nhận tiêu hủy">
        <Form form={form} layout="vertical" onFinish={handleDispose}>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Form.Item label="Tên sản phẩm" name="productName" rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}><Input /></Form.Item>
            <Form.Item label="Số lô" name="batchNumber" rules={[{ required: true, message: 'Nhập số lô' }]}><Input /></Form.Item>
            <Form.Item label="Số lượng tiêu hủy" name="quantity" rules={[{ required: true, message: 'Nhập số lượng' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Lý do" name="reason" rules={[{ required: true, message: 'Chọn lý do' }]}>
              <Select options={DISPOSAL_REASONS} placeholder="Chọn lý do tiêu hủy" />
            </Form.Item>
            <Form.Item label="Phương pháp tiêu hủy" name="method" rules={[{ required: true, message: 'Chọn phương pháp' }]}>
              <Select options={DISPOSAL_METHODS} placeholder="Chọn phương pháp" />
            </Form.Item>
            <Form.Item label="Người thực hiện" name="disposedBy" rules={[{ required: true, message: 'Nhập tên người thực hiện' }]}>
              <Input placeholder="Tên nhân viên" />
            </Form.Item>
            <Form.Item label="Ghi chú" name="notes" className="sm:col-span-2">
              <Input.TextArea rows={2} placeholder="Ghi chú thêm…" />
            </Form.Item>
          </div>
          <AButton type="primary" danger htmlType="submit" loading={loading} icon={<DeleteOutlined />}>Xác nhận tiêu hủy</AButton>
        </Form>
      </Card>

      {history.length > 0 && (
        <Card title="Lịch sử tiêu hủy (phiên này)">
          <Table dataSource={history} columns={cols} rowKey="key" pagination={false} size="small" scroll={{ x: 700 }} />
        </Card>
      )}
    </div>
  )
}
