import { Link } from 'react-router-dom'
import { Package, Heart, FileText, RefreshCw, Settings, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'

const MENU = [
  { icon: User,       label: 'Thông tin cá nhân', sub: 'Quản lý thông tin & Thành viên', to: '/account/profile' },
  { icon: Package,    label: 'Đơn hàng của tôi',   sub: 'Theo dõi & quản lý đơn hàng', to: '/account/orders' },
  { icon: Heart,      label: 'Sản phẩm yêu thích', sub: 'Sản phẩm bạn đã lưu',         to: '/account/wishlist' },
  { icon: FileText,   label: 'Sổ khám bệnh',       sub: 'Các hồ sơ bệnh án & đơn thuốc', to: '/account/prescriptions' },
]

export default function AccountPage() {
  const { user } = useAuthStore()
  return (
    <div className="page-container py-8 animate-fade-in max-w-2xl">
      <div className="card p-6 flex items-center gap-4 mb-6">
        <Avatar src={user?.avatar} name={user?.name} size="xl" />
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900">{user?.name}</h1>
          <p className="text-slate-500 text-sm">{user?.email}</p>
        </div>
      </div>
      <div className="space-y-2">
        {MENU.map(({ icon: Icon, label, sub, to }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-4 hover:shadow-elevated transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{label}</p>
              <p className="text-sm text-slate-500">{sub}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
