import { User, Mail, Shield, Building2, Hash, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

const ROLE_COLORS = {
  SuperAdmin:        { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  QuanLyKho:        { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  NhanVienBanHang:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  admin:            { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  manager:          { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  staff:            { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
}

const getRoleKey = (vai_tro, role) => {
  if (vai_tro === 'SuperAdmin' || role === 'admin')          return 'role_superadmin'
  if (vai_tro === 'QuanLyKho' || role === 'manager')         return 'role_manager'
  if (vai_tro === 'NhanVienBanHang' || role === 'staff')     return 'role_staff'
  return 'role_admin'
}

const getColorScheme = (vai_tro, role) => {
  return ROLE_COLORS[vai_tro] || ROLE_COLORS[role] || ROLE_COLORS.staff
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.trim().split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(-2).join('')
}

export default function WarehouseProfilePage() {
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const vai_tro = user?.vai_tro || ''
  const role    = user?.role || ''
  const colors  = getColorScheme(vai_tro, role)
  const initials = getInitials(user?.ho_ten || user?.name)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">{t('warehouse.profile_title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('warehouse.profile_desc')}</p>
      </div>

      {/* Employee Card */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 mb-6 shadow-lg shadow-teal-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xl tracking-tight">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">
              PharmaTrace VN — WMS
            </p>
            <h2 className="text-white text-xl font-black truncate">
              {user?.ho_ten || user?.name || '—'}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${colors.bg} ${colors.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {t(`warehouse.${getRoleKey(vai_tro, role)}`)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white">
                <CheckCircle className="w-3 h-3" />
                {t('warehouse.active')}
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block flex-shrink-0">
            <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest">{t('warehouse.employee_id')}</p>
            <p className="text-white font-black text-lg">#{String(user?.id || 0).padStart(4, '0')}</p>
          </div>
        </div>
      </div>

      {/* Info Fields */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('warehouse.account_info')}</h3>
        </div>

        <div className="divide-y divide-slate-50">
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label={t('warehouse.full_name')}
            value={user?.ho_ten || user?.name}
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label={t('warehouse.email')}
            value={user?.email}
          />
          <InfoRow
            icon={<Shield className="w-4 h-4" />}
            label={t('warehouse.role')}
            value={
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {t(`warehouse.${getRoleKey(vai_tro, role)}`)}
              </span>
            }
          />
          <InfoRow
            icon={<Building2 className="w-4 h-4" />}
            label={t('warehouse.unit')}
            value={user?.don_vi_id ? t('warehouse.unit_id', { id: user.don_vi_id }) : '—'}
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label={t('warehouse.employee_id')}
            value={`#${String(user?.id || 0).padStart(4, '0')}`}
          />
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">{t('warehouse.status_active')}</span>
        </div>
        <span>{t('warehouse.wms_portal')}</span>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-slate-800">
          {typeof value === 'string' ? (value || '—') : value}
        </div>
      </div>
    </div>
  )
}
