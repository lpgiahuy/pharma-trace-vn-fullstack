import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()

  const schema = z.object({
    name:            z.string().min(2, t('auth.validation.name_min')),
    phone:           z.string().min(9, t('auth.validation.invalid_phone')),
    email:           z.string().email(t('auth.validation.invalid_email')).optional().or(z.literal('')),
    password:        z.string().min(6, t('auth.validation.pw_min')),
    confirmPassword: z.string(),
    address:         z.string().optional().or(z.literal('')),
  }).refine(d => d.password === d.confirmPassword, { message: t('auth.validation.pw_match'), path: ['confirmPassword'] })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await authService.register({
        name:     data.name,
        phone:    data.phone,
        email:    data.email || undefined,
        password: data.password,
        address:  data.address || undefined,
      })
      toast.success(t('auth.signup_success', { defaultValue: 'Account created! Please sign in.' }))
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.signup_failed', { defaultValue: 'Registration failed' }))
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{t('auth.create_account')}</h1>
        <p className="text-slate-500">{t('auth.join_us')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label={t('account.full_name')}      type="text"  placeholder="Nguyen Van A"          error={errors.name?.message}  required {...register('name')} />
        <Input label={t('auth.phone')}             type="tel"   placeholder="0909 123 456"           error={errors.phone?.message} required {...register('phone')} />
        <Input label={t('auth.email')}             type="email" placeholder="you@example.com"        error={errors.email?.message}          {...register('email')} />
        <Input label={t('account.address')}        type="text"  placeholder="123 Nguyen Hue, Q1"     error={errors.address?.message}        {...register('address')} />
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
        <Input
          label={t('auth.confirm_password')}
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<UserPlus className="w-4 h-4" />}>
          {t('auth.signup')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.already_have_account')}{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">{t('auth.signin_now')}</Link>
      </p>
    </div>
  )
}
