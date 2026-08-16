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
    identifier: z.string().min(3, 'Vui lòng nhập Email hoặc Số điện thoại'),
    password: z.string().min(6, t('auth.validation.pw_min')),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      const credentials = {
        loginType: 'customer',
        identifier: data.identifier,
        phone: data.identifier,
        email: data.identifier,
        password: data.password
      }
      const result = await login(credentials)
      const userRole = result.user?.role || result.user?.vai_tro

      const internalRoles = ['QuanLyKho', 'NhanVienKho', 'SuperAdmin', 'superadmin', 'Admin', 'admin', 'NhanVienBanHang', 'QuanLyCuaHang']
      if (internalRoles.includes(userRole)) {
        await useAuthStore.getState().logout()
        toast.error('Tài khoản hoặc mật khẩu không chính xác!')
        return
      }

      toast.success(`${t('auth.welcome_back')}, ${(result.user?.ho_ten || result.user?.name || '').split(' ').pop()}!`)
      const target = (from && from !== '/login') ? from : '/'
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Tài khoản hoặc mật khẩu không chính xác!')
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
          label={t('auth.email_or_phone')}
          type="text"
          placeholder="0909 123 456 hoặc name@example.com"
          error={errors.identifier?.message}
          required
          {...register('identifier')}
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
