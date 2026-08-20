import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form, Input, InputNumber, Select, Switch, Button as AButton,
  Card, Upload, Space, Divider, Tabs, DatePicker, AutoComplete,
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
            Add
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
    unitService.getAll().then(setUnits).catch(() => {})
    if (!isEdit) return
    productService.getAdminById(id)
      .then(p => {
        const variants = p.quy_cach_dong_goi || p.packagingVariants || []
        const chiTietObj = typeof p.chi_tiet_thuoc === 'string' ? JSON.parse(p.chi_tiet_thuoc) : (p.chi_tiet_thuoc || {})
        const mfgName = p.nha_san_xuat || chiTietObj?.thong_tin_san_xuat?.nha_san_xuat || p.donvi?.ten_don_vi || ''

        const formData = {
          ten_thuoc: p.ten_thuoc || p.name || '',
          so_dang_ky: p.so_dang_ky || '',
          danh_muc_id: p.danh_muc_id || p.categoryId || null,
          don_vi_san_xuat_id: p.don_vi_san_xuat_id || null,
          nha_san_xuat_input: mfgName,
          hinh_anh_url: p.hinh_anh_url || p.image || '',
          la_thuoc_ke_don: p.la_thuoc_ke_don ?? p.isPrescription ?? false,
          mo_ta_ngan: p.mo_ta_ngan || p.description || '',
          trang_thai: p.trang_thai ?? p.isActive ?? true,
          quy_cach: variants.map(v => ({
            ten_don_vi: v.ten_don_vi || v.label || '',
            gia_ban: v.gia_ban !== undefined ? Number(v.gia_ban) : Number(v.price || 0),
            gia_goc: v.gia_goc ? Number(v.gia_goc) : null,
            phan_tram_giam: v.phan_tram_giam || 0,
            thoi_gian_bat_dau_sale: v.thoi_gian_bat_dau_sale ? dayjs(v.thoi_gian_bat_dau_sale) : null,
            thoi_gian_ket_thuc_sale: v.thoi_gian_ket_thuc_sale ? dayjs(v.thoi_gian_ket_thuc_sale) : null,
            la_don_vi_co_ban: v.la_don_vi_co_ban ?? v.isBase ?? false,
          })),
          chi_tiet_thuoc: chiTietObj,
        }
        form.setFieldsValue(formData)
        setImageUrl(p.hinh_anh_url || p.image || '')
      })
      .catch((err) => {
        console.error('[ProductFormPage load product error]', err)
        toast.error('Failed to load product details')
      })
      .finally(() => setInitLoading(false))
  }, [id, fetchCategories, form, isEdit])

  const handleGiaBanChange = (fieldKey, val) => {
    const giaBan = Number(val) || 0
    const quyCachList = form.getFieldValue('quy_cach') || []
    const row = quyCachList[fieldKey] || {}
    const giaGoc = Number(row.gia_goc) || 0
    const phanTramGiam = Number(row.phan_tram_giam) || 0

    if (giaGoc > 0) {
      if (giaBan > 0 && giaBan < giaGoc) {
        const pct = Math.max(0, Math.round(((giaGoc - giaBan) / giaGoc) * 100))
        form.setFieldValue(['quy_cach', fieldKey, 'phan_tram_giam'], pct)
      } else {
        form.setFieldValue(['quy_cach', fieldKey, 'phan_tram_giam'], 0)
      }
    } else if (phanTramGiam > 0 && phanTramGiam < 100 && giaBan > 0) {
      const computedGoc = Math.round(giaBan / (1 - phanTramGiam / 100))
      form.setFieldValue(['quy_cach', fieldKey, 'gia_goc'], computedGoc)
    }
  }

  const handleGiaGocChange = (fieldKey, val) => {
    const giaGoc = Number(val) || 0
    const quyCachList = form.getFieldValue('quy_cach') || []
    const row = quyCachList[fieldKey] || {}
    const giaBan = Number(row.gia_ban) || 0
    const phanTramGiam = Number(row.phan_tram_giam) || 0

    if (giaGoc > 0) {
      if (giaBan > 0) {
        if (giaGoc > giaBan) {
          const pct = Math.max(0, Math.round(((giaGoc - giaBan) / giaGoc) * 100))
          form.setFieldValue(['quy_cach', fieldKey, 'phan_tram_giam'], pct)
        } else {
          form.setFieldValue(['quy_cach', fieldKey, 'phan_tram_giam'], 0)
        }
      } else if (phanTramGiam > 0 && phanTramGiam < 100) {
        const computedBan = Math.max(0, Math.round(giaGoc * (1 - phanTramGiam / 100)))
        form.setFieldValue(['quy_cach', fieldKey, 'gia_ban'], computedBan)
      }
    }
  }

  const handlePhanTramGiamChange = (fieldKey, val) => {
    const pct = Number(val) || 0
    const quyCachList = form.getFieldValue('quy_cach') || []
    const row = quyCachList[fieldKey] || {}
    const giaGoc = Number(row.gia_goc) || 0
    const giaBan = Number(row.gia_ban) || 0

    if (giaGoc > 0) {
      const computedBan = Math.max(0, Math.round(giaGoc * (1 - pct / 100)))
      form.setFieldValue(['quy_cach', fieldKey, 'gia_ban'], computedBan)
    } else if (giaBan > 0 && pct > 0 && pct < 100) {
      const computedGoc = Math.round(giaBan / (1 - pct / 100))
      form.setFieldValue(['quy_cach', fieldKey, 'gia_goc'], computedGoc)
    }
  }

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const url = await cloudinaryService.uploadImage(file)
      setImageUrl(url)
      form.setFieldsValue({ hinh_anh_url: url })
      toast.success('Image uploaded successfully!')
    } catch {
      toast.error('Failed to upload image')
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
        toast.error('Please add at least 1 packaging variant.')
        return
      }
      if (quy_cach.some(v => !v.ten_don_vi || !v.gia_ban || Number(v.gia_ban) <= 0)) {
        toast.error('Valid unit name and price (> 0) are required for all variants.')
        return
      }

      const mfgInput = (values.nha_san_xuat_input || '').trim()
      const matchedUnit = units.find(u => u.name?.toLowerCase() === mfgInput.toLowerCase())
      const don_vi_san_xuat_id = matchedUnit ? matchedUnit.id : (values.don_vi_san_xuat_id || null)

      const chi_tiet_thuoc = buildChiTietThuoc(values.chi_tiet_thuoc) || {}
      if (mfgInput) {
        if (!chi_tiet_thuoc.thong_tin_san_xuat) chi_tiet_thuoc.thong_tin_san_xuat = {}
        chi_tiet_thuoc.thong_tin_san_xuat.nha_san_xuat = mfgInput
      }

      const payload = {
        thong_tin_thuoc: {
          ten_thuoc: values.ten_thuoc,
          so_dang_ky: values.so_dang_ky,
          danh_muc_id: values.danh_muc_id,
          don_vi_san_xuat_id: don_vi_san_xuat_id,
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

      toast.success(isEdit ? 'Product updated successfully!' : 'Product created successfully!')
      navigate('/admin/products')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) return <div className="text-center py-20 text-slate-400">Loading…</div>

  const detailTabs = [
    {
      key: 'composition',
      label: 'Composition',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Active Ingredients"
            fieldPath={['chi_tiet_thuoc', 'ingredients']}
            placeholder="e.g. Paracetamol 500mg"
          />
          <Form.Item label="Detailed Formulation" name={['chi_tiet_thuoc', 'thanh_phan_chi_tiet', 'hoat_chat']}>
            <Input placeholder="e.g. Glimepiride 2mg, Metformin 500mg" />
          </Form.Item>
          <Form.Item label="General Description" name={['chi_tiet_thuoc', 'mo_ta_chung']}>
            <TextArea rows={4} placeholder="General therapeutic overview and indications…" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'indications',
      label: 'Indications & Usage',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Indications"
            fieldPath={['chi_tiet_thuoc', 'chi_dinh']}
            placeholder="e.g. Treatment of type 2 diabetes mellitus"
          />
          <StringListField
            label="Contraindications"
            fieldPath={['chi_tiet_thuoc', 'chong_chi_dinh']}
            placeholder="e.g. Hypersensitivity to active ingredient"
          />
        </div>
      ),
    },
    {
      key: 'safety',
      label: 'Safety & Warnings',
      children: (
        <div className="space-y-4">
          <StringListField
            label="Side Effects"
            fieldPath={['chi_tiet_thuoc', 'tac_dung_phu']}
            placeholder="e.g. Nausea, headache, dizziness"
          />
          <StringListField
            label="Warnings & Precautions"
            fieldPath={['chi_tiet_thuoc', 'canh_bao_than_trong']}
            placeholder="e.g. Monitor blood glucose regularly"
          />
          <Form.Item label="Adverse Event Management" name={['chi_tiet_thuoc', 'xu_tri_tac_dung_phu']}>
            <TextArea rows={3} placeholder="Recommended actions upon experiencing adverse reactions…" />
          </Form.Item>
          <Form.Item label="Driving & Machinery Precautions" name={['chi_tiet_thuoc', 'anh_huong_lai_xe']}>
            <Input placeholder="e.g. May cause drowsiness — exercise caution when driving" />
          </Form.Item>
          <div className="grid sm:grid-cols-2 gap-4">
            <Form.Item label="Pregnancy Risk" name={['chi_tiet_thuoc', 'nhom_benh_nhan_dac_biet', 'phu_nu_mang_thai']}>
              <Input placeholder="e.g. Contraindicated in 1st trimester" />
            </Form.Item>
            <Form.Item label="Lactation / Breastfeeding" name={['chi_tiet_thuoc', 'nhom_benh_nhan_dac_biet', 'phu_nu_cho_con_bu']}>
              <Input placeholder="e.g. Consult physician before use" />
            </Form.Item>
          </div>
        </div>
      ),
    },
    {
      key: 'usage',
      label: 'Dosage & Administration',
      children: (
        <div className="grid sm:grid-cols-2 gap-4">
          <Form.Item label="Administration Method" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'cach_dung']} className="sm:col-span-2">
            <TextArea rows={3} placeholder="e.g. Oral administration after meals, 1-2 times daily" />
          </Form.Item>
          <Form.Item label="Dosage" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'lieu_dung']}>
            <TextArea rows={3} placeholder="e.g. Start with lowest effective dose, adjust per clinical response" />
          </Form.Item>
          <Form.Item label="Missed Dose" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'quen_lieu']}>
            <TextArea rows={3} placeholder="e.g. Take with next scheduled meal, do not double dose" />
          </Form.Item>
          <Form.Item label="Overdose Management" name={['chi_tiet_thuoc', 'huong_dan_su_dung', 'qua_lieu_va_xu_tri']} className="sm:col-span-2">
            <TextArea rows={3} placeholder="e.g. Seek emergency medical attention immediately" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'pharmacology',
      label: 'Pharmacology',
      children: (
        <div className="space-y-4">
          <Form.Item label="Pharmacological Class" name={['chi_tiet_thuoc', 'duoc_luc_hoc', 'nhom_duoc_ly']}>
            <Input placeholder="e.g. Sulfonylurea, Biguanide" />
          </Form.Item>
          <Form.Item label="Mechanism of Action" name={['chi_tiet_thuoc', 'duoc_luc_hoc', 'co_che_tac_dung']}>
            <TextArea rows={3} placeholder="Description of pharmacological mechanism of action…" />
          </Form.Item>
          <Divider plain>Pharmacokinetics</Divider>
          <Form.Item label="Absorption" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'hap_thu']}>
            <TextArea rows={2} placeholder="Bioavailability and absorption kinetics…" />
          </Form.Item>
          <Form.Item label="Metabolism" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'chuyen_hoa']}>
            <TextArea rows={2} placeholder="Hepatic / systemic metabolic pathway…" />
          </Form.Item>
          <Form.Item label="Elimination" name={['chi_tiet_thuoc', 'duoc_dong_hoc', 'thai_tru']}>
            <TextArea rows={2} placeholder="Renal / biliary excretion pathway and half-life…" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'interactions',
      label: 'Drug Interactions',
      children: (
        <Form.Item label="Drug Interactions">
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
                    <Form.Item label="Interacting Drug" name={[name, 'thuoc']}>
                      <Input placeholder="e.g. Furosemide" />
                    </Form.Item>
                    <Form.Item label="Interaction Effect" name={[name, 'hau_qua']} className="mb-0">
                      <TextArea rows={2} placeholder="Clinical impact and consequences of combination…" />
                    </Form.Item>
                  </Card>
                ))}
                <AButton type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Add Drug Interaction
                </AButton>
              </>
            )}
          </Form.List>
        </Form.Item>
      ),
    },
    {
      key: 'manufacturing',
      label: 'Manufacturing & Origin',
      children: (
        <div className="grid sm:grid-cols-2 gap-4">
          <Form.Item label="Brand Name" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'thuong_hieu']}>
            <Input placeholder="e.g. Hasan - Demarpharm" />
          </Form.Item>
          <Form.Item label="Manufacturer" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'nha_san_xuat']}>
            <Input placeholder="e.g. Hasan - Demarpharm Co., Ltd." />
          </Form.Item>
          <Form.Item label="Country of Origin" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'xuat_xu']}>
            <Input placeholder="e.g. Vietnam" />
          </Form.Item>
          <Form.Item label="Packaging Specification" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'quy_cach']}>
            <Input placeholder="e.g. Box of 3 blisters x 10 tablets" />
          </Form.Item>
          <Form.Item label="Storage Conditions" name={['chi_tiet_thuoc', 'thong_tin_san_xuat', 'bao_quan']} className="sm:col-span-2">
            <Input placeholder="e.g. Store below 30°C in a dry place, protect from light" />
          </Form.Item>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-slate-500 text-sm">Manage pharmaceutical catalog specifications & traceability data</p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="General Information" className="shadow-sm border-slate-200">
              <div className="grid sm:grid-cols-2 gap-x-4">
                <Form.Item label="Product Name" name="ten_thuoc" rules={[{ required: true }]} className="sm:col-span-2">
                  <Input placeholder="e.g. Panadol Extra with Optizorb" />
                </Form.Item>
                <Form.Item label="Registration / Visa Number" name="so_dang_ky">
                  <Input placeholder="VD-12345-20" />
                </Form.Item>
                <Form.Item label="Category" name="danh_muc_id" rules={[{ required: true }]}>
                  <Select placeholder="Select category">
                    {categories.map(c => (
                      <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Manufacturer" name="nha_san_xuat_input" className="sm:col-span-2">
                  <AutoComplete
                    placeholder="Select manufacturer (e.g. Pfizer, AstraZeneca, Hasan - Demarpharm...)"
                    options={units.map(u => ({ value: u.name, label: `${u.name} (${u.type === 'NhaMay' ? 'Manufacturer' : (u.type === 'NhaPhanPhoi' ? 'Distributor' : 'Pharmacy')})` }))}
                    filterOption={(inputValue, option) =>
                      option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                    allowClear
                  />
                </Form.Item>
                <Form.Item label="Short Description" name="mo_ta_ngan" className="sm:col-span-2">
                  <TextArea rows={3} placeholder="Brief summary of medication…" />
                </Form.Item>
              </div>
            </Card>

            <Card title="Clinical & Pharmacology Specifications" className="shadow-sm border-slate-200">
              <p className="text-xs text-slate-400 mb-4">
                Only fill relevant sections — empty fields will be omitted.
              </p>
              <Tabs items={detailTabs} size="small" />
            </Card>

            <Card title="Packaging Variants & Pricing" className="shadow-sm border-slate-200">
              <Form.List name="quy_cach" initialValue={[{ ten_don_vi: 'Box', gia_ban: null, la_don_vi_co_ban: true }]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" className="mb-3 bg-slate-50" extra={
                        <AButton type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      }>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <Form.Item {...restField} label="Unit Name" name={[name, 'ten_don_vi']} rules={[{ required: true, message: 'Unit name is required' }]}>
                            <Input placeholder="e.g. Box, Blister, Tablet" />
                          </Form.Item>
                          <Form.Item {...restField} label="Sale Price (₫)" name={[name, 'gia_ban']} rules={[{ required: true, message: 'Price is required' }]}>
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={v => v.replace(/\$\s?|(,*)/g, '')}
                              onChange={val => handleGiaBanChange(name, val)}
                            />
                          </Form.Item>
                          <Form.Item {...restField} label="Original Price (₫)" name={[name, 'gia_goc']}>
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              parser={v => v.replace(/\$\s?|(,*)/g, '')}
                              placeholder="Original MSRP"
                              onChange={val => handleGiaGocChange(name, val)}
                            />
                          </Form.Item>
                          <Form.Item {...restField} label="Discount %" name={[name, 'phan_tram_giam']} initialValue={0}>
                            <InputNumber
                              min={0}
                              max={100}
                              style={{ width: '100%' }}
                              addonAfter="%"
                              onChange={val => handlePhanTramGiamChange(name, val)}
                            />
                          </Form.Item>
                          <Form.Item {...restField} label="Sale Start Date" name={[name, 'thoi_gian_bat_dau_sale']}>
                            <DatePicker showTime style={{ width: '100%' }} placeholder="Sale start" />
                          </Form.Item>
                          <Form.Item {...restField} label="Sale End Date" name={[name, 'thoi_gian_ket_thuc_sale']}>
                            <DatePicker showTime style={{ width: '100%' }} placeholder="Sale end" />
                          </Form.Item>
                        </div>
                        <Form.Item {...restField} name={[name, 'la_don_vi_co_ban']} valuePropName="checked" label="Base Unit" className="mb-0">
                          <Switch size="small" />
                        </Form.Item>
                      </Card>
                    ))}
                    <Form.Item>
                      <AButton type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Packaging Variant
                      </AButton>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6">
            <Card title="Product Image" className="shadow-sm border-slate-200">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-4">
                      <UploadOutlined className="text-3xl text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">No image uploaded</p>
                    </div>
                  )}
                </div>
                <Form.Item name="hinh_anh_url" hidden><Input /></Form.Item>
                <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
                  <AButton loading={uploading} icon={<UploadOutlined />}>
                    {uploading ? 'Uploading...' : 'Change Image'}
                  </AButton>
                </Upload>
              </div>
            </Card>

            <Card title="Settings" className="shadow-sm border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Active Status</span>
                  <Form.Item name="trang_thai" valuePropName="checked" noStyle initialValue={true}>
                    <Switch />
                  </Form.Item>
                </div>
                <Divider className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Prescription Required (Rx)</span>
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
            {isEdit ? 'Update Product' : 'Create Product'}
          </AButton>
          <AButton onClick={() => navigate('/admin/products')} size="large">Cancel</AButton>
        </div>
      </Form>
    </div>
  )
}
