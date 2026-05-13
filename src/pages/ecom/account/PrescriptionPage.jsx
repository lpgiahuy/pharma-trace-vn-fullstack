import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { FileText, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { userService } from '@/services/user.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineLoader } from '@/components/ui/Spinner'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'

const STATUS_MAP = {
  HopLe:    { label: 'Approved', icon: CheckCircle2, color: 'text-green-600' },
  ChoDuyet: { label: 'Pending',  icon: Clock,        color: 'text-amber-500' },
  TuChoi:   { label: 'Rejected', icon: XCircle,      color: 'text-red-500'   },
}

export default function PrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    userService.getMyPrescriptions()
      .then(setPrescriptions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback((files) => {
    if (files[0]) setFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
  })

  const onSubmit = async (data) => {
    if (!file) {
      toast.error('Please select a prescription image or PDF.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('ten_bac_si',   data.ten_bac_si   || '')
      fd.append('ten_benh_vien', data.ten_benh_vien || '')
      fd.append('chuan_doan',   data.chuan_doan   || '')
      const rx = await userService.uploadPrescription(fd)
      setPrescriptions(prev => [rx, ...prev])
      toast.success('Prescription uploaded! Waiting for admin approval.')
      reset()
      setFile(null)
    } catch { toast.error('Upload failed. Please try again.') }
    finally { setUploading(false) }
  }

  return (
    <div className="page-container py-8 max-w-2xl animate-fade-in">
      <h1 className="section-title mb-2">My Prescriptions</h1>
      <p className="text-slate-500 text-sm mb-6">Upload doctor prescriptions required for certain medications.</p>

      {/* Upload form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 mb-6 space-y-4">
        <h2 className="font-display font-semibold text-slate-800">Upload New Prescription</h2>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-brand-500 bg-brand-50' : file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-medium text-green-700">{file.name}</p>
          ) : (
            <>
              <p className="font-semibold text-slate-700 mb-1">Drop prescription here</p>
              <p className="text-xs text-slate-500">PDF, JPG, PNG • Click to browse</p>
            </>
          )}
        </div>

        {/* Metadata fields matching ToaThuoc table */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Doctor Name (Tên bác sĩ)"
            placeholder="e.g. Dr. Nguyen Van A"
            error={errors.ten_bac_si?.message}
            {...register('ten_bac_si')}
          />
          <Input
            label="Hospital (Bệnh viện)"
            placeholder="e.g. Bệnh viện Chợ Rẫy"
            error={errors.ten_benh_vien?.message}
            {...register('ten_benh_vien')}
          />
        </div>
        <Input
          label="Diagnosis (Chẩn đoán)"
          placeholder="e.g. Type 2 Diabetes, Hypertension"
          error={errors.chuan_doan?.message}
          {...register('chuan_doan')}
        />

        <Button type="submit" loading={uploading} leftIcon={<Upload className="w-4 h-4" />}>
          Upload Prescription
        </Button>
      </form>

      {/* List */}
      {loading ? <InlineLoader /> : prescriptions.length === 0 ? (
        <p className="text-center text-slate-500 py-8">No prescriptions uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx, i) => {
            const s = STATUS_MAP[rx.trang_thai_duyet] || STATUS_MAP.ChoDuyet
            const StatusIcon = s.icon
            return (
              <div key={rx.id ?? i} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">
                    {rx.ten_bac_si ? `Dr. ${rx.ten_bac_si}` : `Prescription #${rx.id ?? i + 1}`}
                  </p>
                  {rx.ten_benh_vien && <p className="text-xs text-slate-500">{rx.ten_benh_vien}</p>}
                  {rx.chuan_doan && <p className="text-xs text-slate-400 italic">{rx.chuan_doan}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDate(rx.ngay_tao || rx.uploadedAt)}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${s.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
