import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Input, Button as AButton, Card, Select } from 'antd'
import { SaveOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons'
import { blogService } from '@/services/analytics.service'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const { TextArea } = Input

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ]
}

export default function BlogFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEdit)
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    if (!isEdit) return
    blogService.getBySlug(id)
      .then(b => {
        form.setFieldsValue({
          title: b.title,
          coverImage: b.coverImage,
          content: b.content,
          category: b.category,
          excerpt: b.excerpt
        })
        setCoverPreview(b.coverImage)
      })
      .finally(() => setInitLoading(false))
  }, [id, form, isEdit])

  const onFinish = async (vals) => {
    setLoading(true)
    try {
      const payload = {
        tieu_de:    vals.title,
        anh_bia:    vals.coverImage || '',
        noi_dung:   vals.content,
      }

      if (isEdit) await blogService.update(id, payload)
      else        await blogService.create(payload)

      toast.success(isEdit ? 'Article updated successfully!' : 'Article published successfully!')
      navigate('/admin/blog')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save article')
    }
    finally { setLoading(false) }
  }

  const handleUrlChange = (e) => {
    setCoverPreview(e.target.value)
  }

  if (initLoading) return <div className="text-center py-20 text-slate-400">Loading…</div>

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AButton icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/blog')}>Back</AButton>
          <h1 className="text-2xl font-display font-bold text-slate-900">{isEdit ? 'Edit Blog Article' : 'New Article Post'}</h1>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Content Editor" className="shadow-sm border-slate-200">
              <Form.Item label="Article Title" name="title" rules={[{ required: true, message: 'Please enter article title' }]}>
                <Input placeholder="e.g. 10 Tips for Optimal Cardiovascular Health" size="large" />
              </Form.Item>

              <Form.Item label="Article Content" name="content" rules={[{ required: true, message: 'Please write article content' }]} className="blog-editor-item mb-0">
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  placeholder="Write medical or healthcare content here..."
                  style={{ height: '400px', marginBottom: '50px' }}
                />
              </Form.Item>
            </Card>

            <Card title="Summary & Metadata" className="shadow-sm border-slate-200">
              <Form.Item label="Short Excerpt" name="excerpt">
                <TextArea rows={3} placeholder="Brief summary displayed on article listing cards…" />
              </Form.Item>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Cover Banner Image" className="shadow-sm border-slate-200">
              <div className="space-y-4">
                <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative group">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <EyeOutlined className="text-2xl text-slate-300 mb-1" />
                      <p className="text-[10px] text-slate-400">URL Preview</p>
                    </div>
                  )}
                </div>

                <Form.Item label="Cover Image URL" name="coverImage">
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    onChange={handleUrlChange}
                  />
                </Form.Item>
              </div>
            </Card>

            <Card title="Publish Settings" className="shadow-sm border-slate-200">
              <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
                <Select placeholder="Select category" options={[
                  { value: 'Health Tips',    label: 'Health Tips & Advice' },
                  { value: 'Medicine Guide', label: 'Medication Usage Guide' },
                  { value: 'Wellness',       label: 'Wellness & Nutrition' },
                  { value: 'Industry News',  label: 'Pharma Industry News' },
                ]} />
              </Form.Item>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Notice:</strong> Blog articles are public and visible to all patients and portal visitors. Ensure medical accuracy.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <AButton type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large" className="px-10">
            {isEdit ? 'Update Article' : 'Publish Article'}
          </AButton>
          <AButton onClick={() => navigate('/admin/blog')} size="large">Cancel</AButton>
        </div>
      </Form>
    </div>
  )
}
