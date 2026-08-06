import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, History, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'

export const BottomNav = () => {
  const { t } = useTranslation()
  const location = useLocation()

  const navItems = [
    { id: 'home', icon: Home, label: t('nav.home', { defaultValue: 'Home' }), path: '/' },
    { id: 'products', icon: LayoutGrid, label: t('nav.categories', { defaultValue: 'Categories' }), path: '/products' },
    { id: 'orders', icon: History, label: t('nav.orders_short', { defaultValue: 'Orders' }), path: '/account/orders' },
    { id: 'account', icon: User, label: t('nav.account', { defaultValue: 'Account' }), path: '/account/profile' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-300 min-w-[64px]",
                isActive ? "text-brand-600" : "text-slate-400 hover:text-brand-400"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-transform duration-300",
                isActive ? "scale-110" : "scale-100"
              )}>
                <Icon className={cn("w-5.5 h-5.5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight transition-all duration-300",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-brand-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
