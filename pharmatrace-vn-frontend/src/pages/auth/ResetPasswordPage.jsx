import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  password:        z.string().min(6),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }) => {
    try {
      await authService.resetPassword({ token: searchParams.get('token'), password })
      toast.success('Password reset successfully. Please sign in.')
      navigate('/login')
    } catch {
      toast.error('Reset link expired or invalid.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">New password</h1>
        <p className="text-slate-500">Choose a strong new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New Password" type="password" error={errors.password?.message} required {...register('password')} />
        <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} required {...register('confirmPassword')} />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Reset Password</Button>
      </form>
      <p className="mt-4 text-center text-sm"><Link to="/login" className="text-brand-600 hover:underline">Back to Sign In</Link></p>
    </div>
  )
}
