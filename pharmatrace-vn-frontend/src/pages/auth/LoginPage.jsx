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
  const [loginType, setLoginType] = useState('customer')
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = location.state?.from?.pathname || '/'

  const customerSchema = z.object({
    phone:    z.string().min(9, t('auth.validation.invalid_phone')),
    password: z.string().min(6, t('auth.validation.pw_min')),
  })
  const adminSchema = z.object({
    email:    z.string().email(t('auth.validation.invalid_email')),
    password: z.string().min(6, t('auth.validation.pw_min')),
  })
  const schema   = loginType === 'admin' ? adminSchema : customerSchema
  const defaults = loginType === 'admin' ? { email: '', password: '' } : { phone: '', password: '' }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  const switchType = (type) => {
    setLoginType(type)
    reset(type === 'admin' ? { email: '', password: '' } : { phone: '', password: '' })
  }

  const onSubmit = async (data) => {
    try {
      const credentials = loginType === 'admin'
        ? { loginType: 'admin', email: data.email, password: data.password }
        : { loginType: 'customer', phone: data.phone, password: data.password }
      const result = await login(credentials)
      toast.success(`${t('auth.welcome_back')}, ${(result.user?.ho_ten || result.user?.name || '').split(' ').pop()}!`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('auth.signin_failed'))
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{t('auth.welcome_back')}</h1>
        <p className="text-slate-500">{t('auth.signin_desc')}</p>
      </div>

      {/* Login type toggle */}
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => switchType('customer')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            loginType === 'customer' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('auth.customer')}
        </button>
        <button
          type="button"
          onClick={() => switchType('admin')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            loginType === 'admin' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('auth.admin_staff')}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {loginType === 'admin' ? (
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="admin@pharmatrace.vn"
            error={errors.email?.message}
            required
            {...register('email')}
          />
        ) : (
          <Input
            label={t('auth.phone')}
            type="tel"
            placeholder="0909 123 456"
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
        )}
        <Input
          label={t('auth.password')}
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          rightIcon={
            <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">{t('auth.forgot_password')}</Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<LogIn className="w-4 h-4" />}>
          {t('auth.signin')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.no_account')}{' '}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">{t('auth.create_one')}</Link>
      </p>
    </div>
  )
}
