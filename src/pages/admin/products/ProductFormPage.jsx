import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form, Input, InputNumber, Select, Switch, Button as AButton,
  Card, Upload, Space, Divider, Tabs, DatePicker,
} from 'antd'
import { UploadOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { productService } from '@/services/product.service'
import { cloudinaryService } from '@/services/cloudinary.service'
import { useCategoryStore } from '@/store/categoryStore'
import { unitService } from '@/services/user.service'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

const { TextArea } = Input

const StringListField = ({ label, fieldPath, placeholder }) => (
  <Form.Item label={label}>
    <Form.List name={fieldPath}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <Space key={key} className="flex mb-2" align="baseline">
              <Form.Item name={name} noStyle>
                <Input placeholder={placeholder} style={{ width: 420 }} />
              </Form.Item>
              <AButton type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
            </Space>
          ))}
          <AButton type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
            Thêm
          </AButton>
        </>
      )}
    </Form.List>
  </Form.Item>
)

const buildChiTietThuoc = (ct = {}) => {
  const result = {}

  ;['mo_ta_chung', 'anh_huong_lai_xe', 'xu_tri_tac_dung_phu'].forEach(k => {
    if (ct[k]?.trim()) result[k] = ct[k].trim()
  })

  ;['ingredients', 'chi_dinh', 'chong_chi_dinh', 'tac_dung_phu', 'canh_bao_than_trong'].forEach(k => {
    const arr = (ct[k] || []).filter(v => v?.trim?.())
    if (arr.length) result[k] = arr
  })

  const dl = ct.duoc_luc_hoc || {}
  if (dl.nhom_duoc_ly?.trim() || dl.co_che_tac_dung?.trim()) {
    result.duoc_luc_hoc = {}
    if (dl.nhom_duoc_ly?.trim()) result.duoc_luc_hoc.nhom_duoc_ly = dl.nhom_duoc_ly.trim()
    if (dl.co_che_tac_dung?.trim()) result.duoc_luc_hoc.co_che_tac_dung = dl.co_che_tac_dung.trim()
  }

  const dd = ct.duoc_dong_hoc || {}
  if (Object.values(dd).some(v => v?.trim())) {
    result.duoc_dong_hoc = {}
    ;['hap_thu', 'chuyen_hoa', 'thai_tru'].forEach(k => {
      if (dd[k]?.trim()) result.duoc_dong_hoc[k] = dd[k].trim()
    })
  }

  const hd = ct.huong_dan_su_dung || {}
  if (Object.values(hd).some(v => v?.trim())) {
    result.huong_dan_su_dung = {}
    ;['cach_dung', 'lieu_dung', 'quen_lieu', 'qua_lieu_va_xu_tri'].forEach(k => {
      if (hd[k]?.trim()) result.huong_dan_su_dung[k] = hd[k].trim()
    })
  }

  const sx = ct.thong_tin_san_xuat || {}
  if (Object.values(sx).some(v => v?.trim())) {
    result.thong_tin_san_xuat = {}
    ;['thuong_hieu', 'nha_san_xuat', 'xuat_xu', 'bao_quan', 'quy_cach'].forEach(k => {
      if (sx[k]?.trim()) result.thong_tin_san_xuat[k] = sx[k].trim()
    })
  }

  const nb = ct.nhom_benh_nhan_dac_biet || {}
  if (nb.phu_nu_mang_thai?.trim() || nb.phu_nu_cho_con_bu?.trim()) {
    result.nhom_benh_nhan_dac_biet = {}
    if (nb.phu_nu_mang_thai?.trim()) result.nhom_benh_nhan_dac_biet.phu_nu_mang_thai = nb.phu_nu_mang_thai.trim()
    if (nb.phu_nu_cho_con_bu?.trim()) result.nhom_benh_nhan_dac_biet.phu_nu_cho_con_bu = nb.phu_nu_cho_con_bu.trim()
  }

  if (ct.thanh_phan_chi_tiet?.hoat_chat?.trim()) {
    result.thanh_phan_chi_tiet = { hoat_chat: ct.thanh_phan_chi_tiet.hoat_chat.trim() }
  }

  const ttArr = (ct.tuong_tac_thuoc || []).filter(v => v?.thuoc?.trim() || v?.hau_qua?.trim())
  if (ttArr.length) result.tuong_tac_thuoc = ttArr

  return Object.keys(result).length > 0 ? result : undefined
}

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(isEdit)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [units, setUnits] = useState([])
  const { categories, fetchCategories } = useCategoryStore()

  useEffect(() => {
    fetchCategories()
    unitService.getAll().then(list => setUnits(list.filter(u => u.type === 'NhaMay'))).catch(() => {})
    if (!isEdit) return
    productService.getById(id)
      .then(p => {
        const formData = {
          ten_thuoc: p.name,
          so_dang_ky: p.so_dang_ky,
          danh_muc_id: p.categoryId,
          don_vi_san_xuat_id: p.don_vi_san_xuat_id || null,
          hinh_anh_url: p.image,
          la_thuoc_ke_don: p.isPrescription,
          mo_ta_ngan: p.description,
          trang_thai: p.isActive ?? true,
          quy_cach: p.packagingVariants?.map(v => ({
            ten_don_vi: v.label,
            gia_ban: v.price,
            gia_goc: v.gia_goc || null,
            phan_tram_giam: v.phan_tram_giam || 0,
            thoi_gian_bat_dau_sale: v.thoi_gian_bat_dau_sale ? dayjs(v.thoi_gian_bat_dau_sale) : null,
            thoi_gian_ket_thuc_sale: v.thoi_gian_ket_thuc_sale ? dayjs(v.thoi_gian_ket_thuc_sale) : null,
            la_don_vi_co_ban: v.isBase,
          })) || [],
          chi_tiet_thuoc: p.chi_tiet_thuoc || {},
        }
        form.setFieldsValue(formData)
        setImageUrl(p.image)
      })
      .finally(() => setInitLoading(false))
  }, [id, fetchCategories, form, isEdit])

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const url = await cloudinaryService.uploadImage(file)
      setImageUrl(url)
      form.setFieldsValue({ hinh_anh_url: url })
      toast.success('Tải ảnh thành công!')
    } catch {
      toast.error('Tải ảnh thất bại')
    } finally {
      setUploading(false)
    }
    return false
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const quy_cach = values.quy_cach || []
      if (quy_cach.length === 0) {
        toast.error('Vui lòng thêm ít nhất 1 quy cách đóng gói.')
        return
      }
      if (quy_cach.some(v => !v.ten_don_vi || !v.gia_ban || Number(v.gia_ban) <= 0)) {
        toast.error('Tên đơn vị và giá bán hợp lệ (> 0) là bắt buộc cho tất cả quy cách.')
        return
      }

      const chi_tiet_thuoc = buildChiTietThuoc(values.chi_tiet_thuoc)

      const payload = {
        thong_tin_thuoc: {
          ten_thuoc: values.ten_thuoc,
          so_dang_ky: values.so_dang_ky,
          danh_muc_id: values.danh_muc_id,
          don_vi_san_xuat_id: values.don_vi_san_xuat_id || null,
          hinh_anh_url: values.hinh_anh_url || '',
          la_thuoc_ke_don: values.la_thuoc_ke_don ?? false,
          mo_ta_ngan: values.mo_ta_ngan || '',
          trang_thai: values.trang_thai ?? true,
          slug: values.ten_thuoc
            ? values.ten_thuoc.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            : '',
          chi_tiet_thuoc: chi_tiet_thuoc || {},
        },
        quy_cach_dong_goi: quy_cach.map(v => ({
          ten_don_vi: v.ten_don_vi,
          gia_ban: Number(v.gia_ban),
          gia_goc: v.gia_goc ? Number(v.gia_goc) : null,
          phan_tram_giam: Number(v.phan_tram_giam) || 0,
          thoi_gian_bat_dau_sale: v.thoi_gian_bat_dau_sale ? v.thoi_gian_bat_dau_sale.toISOString() : null,
          thoi_gian_ket_thuc_sale: v.thoi_gian_ket_thuc_sale ? v.thoi_gian_ket_thuc_sale.toISOString() : null,
          la_don_vi_co_ban: v.la_don_vi_co_ban || false,
        })),
      }

      if (isEdit) await productService.update(id, payload)
      else await productService.create(payload)

      toast.success(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!')
      navigate('/admin/products')
    } catch (error) {
      console.error(error)
      toast.error('Lưu sản phẩm thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) return <div className="text-center py-20 text-slate-400">Đang tải…</div>

  const detailTabs = [
    {
      key: 'composition',
      label: 'Thành phần',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Hoạt chất"
            fieldPath={['chi_tiet_thuoc', 'ingredients']}
            placeholder="VD: Paracetamol 500mg"
          />
          <Form.Item label="Thành phần chi tiết" name={['chi_tiet_thuoc', 'thanh_phan_chi_tiet', 'hoat_chat']}>
            <Input placeholder="VD: Glimepiride 2mg, Metformin 500mg" />
          </Form.Item>
          <Form.Item label="Mô tả chung" name={['chi_tiet_thuoc', 'mo_ta_chung']}>
            <TextArea rows={4} placeholder="Tổng quan về công dụng và cách dùng thuốc…" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'indications',
      label: 'Chỉ định',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Chỉ định"
            fieldPath={['chi_tiet_thuoc', 'chi_dinh']}
            placeholder="VD: Điều trị đái tháo đường type 2"
          />
          <StringListField
            label="Chống chỉ định"
            fieldPath={['chi_tiet_thuoc', 'chong_chi_dinh']}
            placeholder="VD: Quá mẫn với hoạt chất"
          />
        </div>
      ),
    },
    {
      key: 'safety',
      label: 'An toàn',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Tác dụng phụ"
            fieldPath={['chi_tiet_thuoc', 'tac_dung_phu']}
            placeholder="VD: Buồn nôn, chóng mặt"
          />
          <StringListField
            label="Cảnh báo & Thận trọng"
            fieldPath={['chi_tiet_thuoc', 'canh_bao_than_trong']}
            placeholder="VD: Theo dõi đường huyết thường xuyên"
          />
          <Form.Item label="Xử trí tác dụng phụ" name={['chi_tiet_thuoc', 'xu_tri_tac_dung_phu']}>
            <TextArea rows={3} placeholder="Các bước xử lý khi xảy ra tác dụng phụ…" />
          </Form.Item>
          <Form.Item label="Ảnh hưởng lái xe" name={['chi_tiet_thuoc', 'anh_huong_lai_xe']}>
            <Input placeholder="VD: Có thể gây chóng mặt — thận trọng khi lái xe" />
          </Form.Item>
          <div className="grid sm:grid-cols-2 gap-4">
            <Form.Item label="Phụ nữ mang thai" name={['chi_tiet_thuoc', 'nhom_benh_nhan_dac_biet', 'phu_nu_mang_thai']}>
              <Input placeholder="VD: Chống chỉ định" />
            </Form.Item>
            <Form.Item label="Phụ nữ cho con bú" name={['chi_tiet_thuoc', 'nhom_benh_nhan_dac_biet', 'phu_nu_cho_con_bu']}>
              <Input placeholder="VD: Chống chỉ định" />
            </Form.Item>
          </div>
        </div>
      ),
    },
    {
      key: 'usage',
      label: 'Cách dùng',
      children: (
        <div className="grid sm:grid-cols-2 gap-4">
          <Form.Item label="Cách dùng" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'cach_dung']} className="sm:col-span-2">
            <TextArea rows={3} placeholder="VD: Uống sau bữa ăn, 1-2 lần/ngày" />
          </Form.Item>
          <Form.Item label="Liều dùng" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'lieu_dung']}>
            <TextArea rows={3} placeholder="VD: Bắt đầu liều thấp nhất, điều chỉnh theo bệnh nhân" />
          </Form.Item>
          <Form.Item label="Quên liều" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'quen_lieu']}>
            <TextArea rows={3} placeholder="VD: Uống vào bữa ăn tiếp theo, không uống gấp đôi" />
          </Form.Item>
          <Form.Item label="Quá liều & Xử trí" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'qua_lieu_va_xu_tri']} className="sm:col-span-2">
            <TextArea rows={3} placeholder="VD: Đến cơ sở y tế khẩn cấp ngay lập tức" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'pharmacology',
      label: 'Dược lý',
      children: (
        <div className="space-y-4">
          <Form.Item label="Nhóm dược lý" name={['chi_tiet_thuoc', 'duoc_luc_hoc', 'nhom_duoc_ly']}>
            <Input placeholder="VD: Sulfonylurea, Biguanide" />
          </Form.Item>
          <Form.Item label="Cơ chế tác dụng" name={['chi_tiet_thuoc', 'duoc_luc_hoc', 'co_che_tac_dung']}>
            <TextArea rows={3} placeholder="Mô tả cơ chế hoạt động của thuốc…" />
          </Form.Item>
          <Divider plain>Dược động học</Divider>
          <Form.Item label="Hấp thu" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'hap_thu']}>
            <TextArea rows={2} placeholder="Đặc điểm hấp thu…" />
          </Form.Item>
          <Form.Item label="Chuyển hóa" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'chuyen_hoa']}>
            <TextArea rows={2} placeholder="Con đường chuyển hóa…" />
          </Form.Item>
          <Form.Item label="Thải trừ" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'thai_tru']}>
            <TextArea rows={2} placeholder="Đường và tốc độ thải trừ…" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'interactions',
      label: 'Tương tác thuốc',
      children: (
        <Form.Item label="Tương tác thuốc">
          <Form.List name={['chi_tiet_thuoc', 'tuong_tac_thuoc']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-3"
                    extra={<AButton type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
                  >
                    <Form.Item label="Tên thuốc" name={[name, 'thuoc']}>
                      <Input placeholder="VD: Furosemide" />
                    </Form.Item>
                    <Form.Item label="Hậu quả" name={[name, 'hau_qua']} className="mb-0">
                      <TextArea rows={2} placeholder="Hậu quả của tương tác…" />
                    </Form.Item>
                  </Card>
                ))}
                <AButton type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Thêm tương tác thuốc
                </AButton>
              </>
            )}
          </Form.List>
        </Form.Item>
      ),
    },
    {
      key: 'manufacturing',
      label: 'Sản xuất',
      children: (
        <div className="grid sm:grid-cols-2 gap-4">
          <Form.Item label="Thương hiệu" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'thuong_hieu']}>
            <Input placeholder="VD: Hasan - Demarpharm" />
          </Form.Item>
          <Form.Item label="Nhà sản xuất" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'nha_san_xuat']}>
            <Input placeholder="VD: Công ty TNHH Hasan - Demarpharm" />
          </Form.Item>
          <Form.Item label="Xuất xứ" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'xuat_xu']}>
            <Input placeholder="VD: Việt Nam" />
          </Form.Item>
          <Form.Item label="Quy cách đóng gói" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'quy_cach']}>
            <Input placeholder="VD: Hộp 3 vỉ x 10 viên" />
          </Form.Item>
          <Form.Item label="Bảo quản" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'bao_quan']} className="sm:col-span-2">
            <Input placeholder="VD: Bảo quản dưới 30°C, tránh ánh sáng và ẩm" />
          </Form.Item>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
        <p className="text-slate-500 text-sm">Quản lý thông tin dược phẩm và truy xuất nguồn gốc</p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Cột trái ── */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Thông tin chung" className="shadow-sm border-slate-200">
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Form.Item label="Tên sản phẩm" name="ten_thuoc" rules={[{ required: true }]} className="sm:col-span-2">
                  <Input placeholder="VD: Panadol Extra với Optizorb" />
                </Form.Item>
                <Form.Item label="Số đăng ký" name="so_dang_ky">
                  <Input placeholder="VD-12345-20" />
                </Form.Item>
                <Form.Item label="Danh mục" name="danh_muc_id" rules={[{ required: true }]}>
                  <Select placeholder="Chọn danh mục">
                    {categories.map(c => (
                      <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Nhà sản xuất" name="don_vi_san_xuat_id" className="sm:col-span-2">
                  <Select placeholder="Chọn đơn vị sản xuất" allowClear showSearch optionFilterProp="children">
                    {units.map(u => (
                      <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Mô tả ngắn" name="mo_ta_ngan" className="sm:col-span-2">
                  <TextArea rows={3} placeholder="Mô tả ngắn về thuốc…" />
                </Form.Item>
              </div>
            </Card>

            <Card title="Chi tiết thuốc" className="shadow-sm border-slate-200">
              <p className="text-xs text-slate-400 mb-4">
                Chỉ điền các mục liên quan — các trường bỏ trống sẽ không được lưu.
              </p>
              <Tabs items={detailTabs} size="small" />
            </Card>

            <Card title="Đóng gói & Giá bán" className="shadow-sm border-slate-200">
              <Form.List name="quy_cach" initialValue={[{ ten_don_vi: 'Hộp', gia_ban: null, la_don_vi_co_ban: true }]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" className="mb-3 bg-slate-50" extra={
                        <AButton type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      }>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <Form.Item {...restField} label="Tên đơn vị" name={[name, 'ten_don_vi']} rules={[{ required: true, message: 'Tên đơn vị là bắt buộc' }]}>
                            <Input placeholder="VD: Hộp, Vỉ, Viên" />
                          </Form.Item>
                          <Form.Item {...restField} label="Giá bán (₫)" name={[name, 'gia_ban']} rules={[{ required: true, message: 'Giá bán là bắt buộc' }]}>
                            <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                          </Form.Item>
                          <Form.Item {...restField} label="Giá gốc (₫)" name={[name, 'gia_goc']}>
                            <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} placeholder="Trước giảm giá" />
                          </Form.Item>
                          <Form.Item {...restField} label="Giảm giá %" name={[name, 'phan_tram_giam']} initialValue={0}>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
                          </Form.Item>
                          <Form.Item {...restField} label="Bắt đầu giảm" name={[name, 'thoi_gian_bat_dau_sale']}>
                            <DatePicker showTime style={{ width: '100%' }} placeholder="Bắt đầu sale" />
                          </Form.Item>
                          <Form.Item {...restField} label="Kết thúc giảm" name={[name, 'thoi_gian_ket_thuc_sale']}>
                            <DatePicker showTime style={{ width: '100%' }} placeholder="Kết thúc sale" />
                          </Form.Item>
                        </div>
                        <Form.Item {...restField} name={[name, 'la_don_vi_co_ban']} valuePropName="checked" label="Đơn vị cơ sở" className="mb-0">
                          <Switch size="small" />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item>
                      <AButton type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Thêm quy cách đóng gói
                      </AButton>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Card>
          </div>

          {/* ── Cột phải ── */}
          <div className="space-y-6">
            <Card title="Hình ảnh sản phẩm" className="shadow-sm border-slate-200">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-4">
                      <UploadOutlined className="text-3xl text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Chưa có ảnh</p>
                    </div>
                  )}
                </div>
                <Form.Item name="hinh_anh_url" hidden><Input /></Form.Item>
                <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
                  <AButton loading={uploading} icon={<UploadOutlined />}>
                    {uploading ? 'Đang tải...' : 'Thay ảnh'}
                  </AButton>
                </Upload>
              </div>
            </Card>

            <Card title="Cài đặt" className="shadow-sm border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Trạng thái hoạt động</span>
                  <Form.Item name="trang_thai" valuePropName="checked" noStyle initialValue={true}>
                    <Switch />
                  </Form.Item>
                </div>
                <Divider className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Thuốc kê đơn</span>
                  <Form.Item name="la_thuoc_ke_don" valuePropName="checked" noStyle initialValue={false}>
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <AButton type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large" className="px-10">
            {isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
          </AButton>
          <AButton onClick={() => navigate('/admin/products')} size="large">Hủy</AButton>
        </div>
      </Form>
    </div>
  )
}
