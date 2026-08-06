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

      toast.success(isEdit ? 'Bài viết đã được cập nhật!' : 'Bài viết đã được đăng!')
      navigate('/admin/blog')
    } catch (error) {
      console.error(error)
      toast.error('Lưu bài viết thất bại')
    }
    finally { setLoading(false) }
  }

  const handleUrlChange = (e) => {
    setCoverPreview(e.target.value)
  }

  if (initLoading) return <div className="text-center py-20 text-slate-400">Đang tải…</div>

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AButton icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/blog')}>Quay lại</AButton>
          <h1 className="text-2xl font-display font-bold text-slate-900">{isEdit ? 'Chỉnh sửa bài viết' : 'Bài đăng mới'}</h1>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Trình soạn thảo nội dung" className="shadow-sm border-slate-200">
              <Form.Item label="Tiêu đề bài viết" name="title" rules={[{ required: true }]}>
                <Input placeholder="VD: 10 Mẹo để có sức khỏe tim mạch tốt" size="large" />
              </Form.Item>

              <Form.Item label="Nội dung" name="content" rules={[{ required: true }]} className="blog-editor-item mb-0">
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  placeholder="Viết nội dung bài viết y tế tại đây..."
                  style={{ height: '400px', marginBottom: '50px' }}
                />
              </Form.Item>
            </Card>

            <Card title="Tóm tắt & Thông tin" className="shadow-sm border-slate-200">
              <Form.Item label="Tóm tắt ngắn" name="excerpt">
                <TextArea rows={3} placeholder="Tóm tắt ngắn hiển thị trên trang danh sách bài viết…" />
              </Form.Item>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Ảnh bìa" className="shadow-sm border-slate-200">
              <div className="space-y-4">
                <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative group">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <EyeOutlined className="text-2xl text-slate-300 mb-1" />
                      <p className="text-[10px] text-slate-400">Xem trước URL</p>
                    </div>
                  )}
                </div>

                <Form.Item label="URL ảnh bìa" name="coverImage">
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    onChange={handleUrlChange}
                  />
                </Form.Item>
              </div>
            </Card>

            <Card title="Thông tin đăng bài" className="shadow-sm border-slate-200">
              <Form.Item label="Danh mục" name="category" rules={[{ required: true }]}>
                <Select placeholder="Chọn danh mục" options={[
                  { value: 'Health Tips',    label: 'Mẹo sức khỏe' },
                  { value: 'Medicine Guide', label: 'Hướng dẫn dùng thuốc' },
                  { value: 'Wellness',       label: 'Lối sống lành mạnh' },
                  { value: 'Industry News',  label: 'Tin tức ngành' },
                ]} />
              </Form.Item>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Lưu ý:</strong> Bài viết blog công khai và hiển thị với tất cả người dùng. Đảm bảo nội dung chính xác.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <AButton type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large" className="px-10">
            {isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết'}
          </AButton>
          <AButton onClick={() => navigate('/admin/blog')} size="large">Hủy</AButton>
        </div>
      </Form>
    </div>
  )
}
