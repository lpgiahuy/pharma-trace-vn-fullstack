import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '@/services/auth.service'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async ({ email }) => {
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Failed to send reset email')
    }
  }

  if (sent) return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-8 h-8 text-green-500" />
      </div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Check your email</h1>
      <p className="text-slate-500 mb-6">We've sent a password reset link to your email address.</p>
      <Link to="/login" className="text-brand-600 hover:underline font-medium">Back to Sign In</Link>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Reset password</h1>
        <p className="text-slate-500">Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email Address" type="email" placeholder="you@example.com" error={errors.email?.message} required {...register('email', { required: 'Email is required' })} />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>Send Reset Link</Button>
      </form>
      <p className="mt-4 text-center text-sm"><Link to="/login" className="text-brand-600 hover:underline">Back to Sign In</Link></p>
    </div>
  )
}
