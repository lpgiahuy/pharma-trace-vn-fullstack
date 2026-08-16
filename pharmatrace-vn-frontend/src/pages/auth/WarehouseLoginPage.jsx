import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Warehouse, PackageCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function WarehouseLoginPage() {
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = location.state?.from?.pathname || '/warehouse/inbound'

  const warehouseSchema = z.object({
    email:    z.string().email('Email kho không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu từ 6 ký tự trở lên'),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      const credentials = { loginType: 'admin', email: data.email, password: data.password }
      const result = await login(credentials)
      const userRole = result.user?.role || result.user?.vai_tro

      const allowedWarehouseRoles = ['QuanLyKho', 'NhanVienKho', 'SuperAdmin', 'superadmin']
      if (!allowedWarehouseRoles.includes(userRole)) {
        await useAuthStore.getState().logout()
        toast.error('Tài khoản hoặc mật khẩu không chính xác!')
        return
      }

      toast.success(`Đăng nhập thành công! Xin chào ${result.user?.ho_ten || 'Quản lý kho'}`)
      const target = (from && from !== '/' && !from.includes('/login')) ? from : '/warehouse/inbound'
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Tài khoản hoặc mật khẩu không chính xác!')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
          <PackageCheck className="w-4 h-4 text-amber-600" />
          <span>PHARMATRACE WMS PORTAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Warehouse className="w-7 h-7 text-amber-600 inline-block" />
          Đăng Nhập Kho Bãi (WMS)
        </h1>
        <p className="text-slate-500 text-sm">
          Cổng đăng nhập hệ thống Quản lý Vận hành Kho, Kiểm kê & Nhập xuất dược phẩm.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Tài Khoản Kho"
          type="email"
          placeholder="warehouse@pharmatrace.vn"
          error={errors.email?.message}
          required
          {...register('email')}
        />
        <Input
          label="Mật Khẩu Kho"
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
          <Link to="/forgot-password" className="text-xs sm:text-sm text-amber-600 hover:underline font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-base rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <LogIn className="w-5 h-5" />
          <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Portal Kho WMS'}</span>
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
        <p>
          Bạn là Quản lý Cửa hàng / Admin?{' '}
          <Link to="/admin/login" className="text-brand-600 font-semibold hover:underline">
            Đăng nhập Portal Cửa Hàng ➔
          </Link>
        </p>
        <p>
          Bạn là khách hàng mua sắm?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Về trang Đăng nhập Khách hàng ➔
          </Link>
        </p>
      </div>
    </div>
  )
}
