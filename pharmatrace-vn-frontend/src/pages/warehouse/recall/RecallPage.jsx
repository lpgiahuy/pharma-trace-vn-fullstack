import { useState } from 'react'
import { Form, Input, Select, Button as AButton, Card, Alert, Steps, Tag } from 'antd'
import { AlertOutlined } from '@ant-design/icons'
import { warehouseService } from '@/services/warehouse.service'
import toast from 'react-hot-toast'

const RECALL_REASONS = [
  { value: 'Bacterial contamination',   label: 'Bacterial contamination' },
  { value: 'Mislabeled packaging',       label: 'Mislabeled packaging' },
  { value: 'Sub-potent active ingredient', label: 'Sub-potent active ingredient' },
  { value: 'Packaging defect',           label: 'Packaging defect' },
  { value: 'Adverse drug reaction (ADR)', label: 'Adverse drug reaction (ADR)' },
  { value: 'Regulatory recall mandate', label: 'Regulatory recall mandate' },
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
      toast.success(`Batch recall initiated — ${res.affectedUnits} units quarantined`)
    } catch { toast.error('Failed to initiate batch recall') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <AlertOutlined className="text-red-500" /> Medication Batch Recall Protocol
        </h1>
        <p className="text-slate-500 text-sm mt-1">Initiate emergency recall and inventory quarantine by lot/batch number</p>
      </div>

      <Alert
        message="Emergency Action — Batch Recall Procedure"
        description="Initiating a recall immediately quarantines all medicine packages belonging to the specified batch, alerts connected staff, and records an immutable audit log. This action cannot be reversed."
        type="error"
        showIcon
      />

      <Steps current={currentStep} size="small" className="mb-4" items={[
        { title: 'Fill Recall Form' },
        { title: 'Confirm Quarantine' },
        { title: 'Recall In Effect' },
      ]} />

      {currentStep < 2 ? (
        <Card title="Recall Details">
          <Form form={form} layout="vertical" onFinish={handleRecall}>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Form.Item label="Product Name" name="productName" rules={[{ required: true, message: 'Please enter product name' }]}><Input /></Form.Item>
              <Form.Item label="Batch / Lot Number" name="batchNumber" rules={[{ required: true, message: 'Please enter batch number' }]}>
                <Input placeholder="BATCH-0001" />
              </Form.Item>
              <Form.Item label="Recall Reason" name="reason" rules={[{ required: true, message: 'Please select reason' }]}>
                <Select options={RECALL_REASONS} placeholder="Select reason" />
              </Form.Item>
              <Form.Item label="Severity Level" name="severity" rules={[{ required: true, message: 'Please select severity' }]}>
                <Select options={[
                  { value: 'Class I',   label: 'Class I — Serious adverse health hazard' },
                  { value: 'Class II',  label: 'Class II — Temporary or medically reversible hazard' },
                  { value: 'Class III', label: 'Class III — Minimal likelihood of adverse health hazard' },
                ]} />
              </Form.Item>
              <Form.Item label="Initiated By" name="initiatedBy" rules={[{ required: true, message: 'Please enter initiator name' }]}>
                <Input placeholder="Your name / Title" />
              </Form.Item>
              <Form.Item label="Regulatory Reference Number" name="regulatoryRef">
                <Input placeholder="Ministry of Health decree / dossier ref" />
              </Form.Item>
              <Form.Item label="Detailed Description" name="description" className="sm:col-span-2">
                <Input.TextArea rows={3} placeholder="Detailed medical and operational rationale for recall…" />
              </Form.Item>
            </div>
            <AButton
              type="primary" danger htmlType="submit" loading={loading}
              icon={<AlertOutlined />} size="large"
              onClick={() => setCurrentStep(1)}
            >
              Initiate Batch Recall
            </AButton>
          </Form>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertOutlined className="text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-red-700 mb-2">Batch Recall In Active Effect</h2>
            <p className="text-red-600 mb-1">Recall ID: <strong className="font-mono">{result?.id}</strong></p>
            <p className="text-red-600 mb-4">Quarantined Units: <strong>{result?.affectedUnits}</strong></p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Tag color="red">Status: {result?.status}</Tag>
              <Tag color="orange">Batch: {form.getFieldValue('batchNumber')}</Tag>
            </div>
            <p className="text-xs text-red-400 mt-4">All relevant distribution units have been notified. Quarantine lock is active.</p>
            <AButton className="mt-4" onClick={() => { setResult(null); setCurrentStep(0); form.resetFields() }}>
              Initiate Another Recall
            </AButton>
          </div>
        </Card>
      )}
    </div>
  )
}
