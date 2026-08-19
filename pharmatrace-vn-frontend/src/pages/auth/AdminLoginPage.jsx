import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Store, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const adminSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      const credentials = { loginType: 'admin', email: data.email, password: data.password }
      const result = await login(credentials)
      const userRole = result.user?.role || result.user?.vai_tro

      const allowedAdminRoles = ['SuperAdmin', 'superadmin', 'Admin', 'admin', 'NhanVienBanHang', 'QuanLyCuaHang', 'manager', 'staff']
      if (!allowedAdminRoles.includes(userRole)) {
        await useAuthStore.getState().logout()
        toast.error('Incorrect username or password!')
        return
      }

      toast.success(`Welcome ${result.user?.ho_ten || 'Manager'}!`)
      const target = (from && from !== '/' && from !== '/admin/login') ? from : '/admin'
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Incorrect username or password!')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-4">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>INTERNAL & STORE PORTAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Store className="w-7 h-7 text-brand-600 inline-block" />
          Welcome back, Admin!
        </h1>
        <p className="text-slate-500 text-sm">
          Restricted to Store Managers, Pharmacists, and PharmaTrace System Administrators.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Internal Account Email"
          type="email"
          placeholder="admin@pharmatrace.vn"
          error={errors.email?.message}
          required
          {...register('email')}
        />
        <Input
          label="Password"
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
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<LogIn className="w-4 h-4" />}>
          Sign In to Admin Portal
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
        <p>
          Are you warehouse logistics staff?{' '}
          <Link to="/warehouse/login" className="text-amber-600 font-semibold hover:underline">
            Sign in to Warehouse WMS Portal ➔
          </Link>
        </p>
        <p>
          Are you a retail customer?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Go to Customer Storefront Sign In ➔
          </Link>
        </p>
      </div>
    </div>
  )
}
