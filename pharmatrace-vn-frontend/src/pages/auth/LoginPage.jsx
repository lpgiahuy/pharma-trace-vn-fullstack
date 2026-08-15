import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = location.state?.from?.pathname || '/'

  const customerSchema = z.object({
    phone:    z.string().min(9, t('auth.validation.invalid_phone')),
    password: z.string().min(6, t('auth.validation.pw_min')),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { phone: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      const credentials = { loginType: 'customer', phone: data.phone, password: data.password }
      const result = await login(credentials)
      toast.success(`${t('auth.welcome_back')}, ${(result.user?.ho_ten || result.user?.name || '').split(' ').pop()}!`)

      const userRole = result.user?.role || result.user?.vai_tro
      let target = '/'
      if (userRole === 'QuanLyKho') {
        target = '/warehouse/inbound'
      } else if (['SuperAdmin', 'QuanLyCuaHang', 'NhanVienBanHang'].includes(userRole)) {
        target = '/admin'
      } else {
        target = (from && from !== '/login') ? from : '/'
      }
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('auth.signin_failed'))
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">
          {t('auth.welcome_back')}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.phone')}
          type="tel"
          placeholder="0909 123 456"
          error={errors.phone?.message}
          required
          {...register('phone')}
        />
        <Input
          label={t('auth.password')}
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          rightIcon={
            <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs sm:text-sm text-brand-600 hover:underline font-medium">
            {t('auth.forgot_password')}
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<LogIn className="w-4 h-4" />}>
          {t('auth.signin')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.no_account')}{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
