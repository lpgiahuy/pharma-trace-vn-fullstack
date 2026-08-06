import { useState } from 'react'
import { Form, Input, Select, Button as AButton, Card, Alert, Steps, Tag } from 'antd'
import { AlertOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import toast from 'react-hot-toast'

const RECALL_REASONS = [
  { value: 'Nhiễm khuẩn',               label: 'Nhiễm khuẩn' },
  { value: 'Nhãn sai',                   label: 'Nhãn sai' },
  { value: 'Không đạt hàm lượng',        label: 'Không đạt hàm lượng' },
  { value: 'Lỗi bao bì',                 label: 'Lỗi bao bì' },
  { value: 'Phản ứng có hại',            label: 'Phản ứng có hại' },
  { value: 'Quyết định cơ quan quản lý', label: 'Quyết định cơ quan quản lý' },
]

export default function RecallPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  const handleRecall = async (vals) => {
    setLoading(true)
    try {
      const res = await warehouseService.recallBatch(vals)
      setResult(res)
      setCurrentStep(2)
      toast.success(`Thu hồi đã khởi động — ${res.affectedUnits} đơn vị bị ảnh hưởng`)
    } catch { toast.error('Khởi động thu hồi thất bại') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <AlertOutlined className="text-red-500" /> Thu hồi lô thuốc
        </h1>
        <p className="text-slate-500 text-sm mt-1">Khởi động thu hồi khẩn cấp theo số lô</p>
      </div>

      <Alert
        message="Hành động khẩn cấp — Quy trình thu hồi"
        description="Khởi động thu hồi sẽ cách ly ngay lập tức tất cả đơn vị thuộc lô chỉ định, thông báo cho nhân viên liên quan và tạo hồ sơ kiểm toán. Hành động này không thể hoàn tác."
        type="error"
        showIcon
      />

      <Steps current={currentStep} size="small" className="mb-4" items={[
        { title: 'Nhập thông tin' },
        { title: 'Xác nhận thu hồi' },
        { title: 'Thu hồi đang hiệu lực' },
      ]} />

      {currentStep < 2 ? (
        <Card title="Thông tin thu hồi">
          <Form form={form} layout="vertical" onFinish={handleRecall}>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Form.Item label="Tên sản phẩm" name="productName" rules={[{ required: true, message: 'Nhập tên sản phẩm' }]}><Input /></Form.Item>
              <Form.Item label="Số lô" name="batchNumber" rules={[{ required: true, message: 'Nhập số lô' }]}>
                <Input placeholder="BATCH-0001" />
              </Form.Item>
              <Form.Item label="Lý do thu hồi" name="reason" rules={[{ required: true, message: 'Chọn lý do' }]}>
                <Select options={RECALL_REASONS} placeholder="Chọn lý do" />
              </Form.Item>
              <Form.Item label="Mức độ nghiêm trọng" name="severity" rules={[{ required: true, message: 'Chọn mức độ' }]}>
                <Select options={[
                  { value: 'Class I',   label: '🔴 Hạng I — Nguy cơ sức khỏe nghiêm trọng' },
                  { value: 'Class II',  label: '🟠 Hạng II — Nguy cơ sức khỏe tạm thời' },
                  { value: 'Class III', label: '🟡 Hạng III — Ít có khả năng gây hại' },
                ]} />
              </Form.Item>
              <Form.Item label="Người khởi động" name="initiatedBy" rules={[{ required: true, message: 'Nhập tên người thực hiện' }]}>
                <Input placeholder="Tên của bạn" />
              </Form.Item>
              <Form.Item label="Số văn bản cơ quan quản lý" name="regulatoryRef">
                <Input placeholder="Quyết định Bộ Y tế / mã hồ sơ (nếu có)" />
              </Form.Item>
              <Form.Item label="Mô tả chi tiết" name="description" className="sm:col-span-2">
                <Input.TextArea rows={3} placeholder="Mô tả chi tiết lý do thu hồi…" />
              </Form.Item>
            </div>
            <AButton
              type="primary" danger htmlType="submit" loading={loading}
              icon={<AlertOutlined />} size="large"
              onClick={() => setCurrentStep(1)}
            >
              Khởi động thu hồi lô thuốc
            </AButton>
          </Form>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertOutlined className="text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-red-700 mb-2">Thu hồi đang hiệu lực</h2>
            <p className="text-red-600 mb-1">Mã thu hồi: <strong className="font-mono">{result?.id}</strong></p>
            <p className="text-red-600 mb-4">Đơn vị bị ảnh hưởng: <strong>{result?.affectedUnits}</strong></p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Tag color="red">Trạng thái: {result?.status}</Tag>
              <Tag color="orange">Số lô: {form.getFieldValue('batchNumber')}</Tag>
            </div>
            <p className="text-xs text-red-400 mt-4">Tất cả nhân viên liên quan đã được thông báo. Lệnh cách ly đang có hiệu lực.</p>
            <AButton className="mt-4" onClick={() => { setResult(null); setCurrentStep(0); form.resetFields() }}>
              Khởi động thu hồi khác
            </AButton>
          </div>
        </Card>
      )}
    </div>
  )
}
