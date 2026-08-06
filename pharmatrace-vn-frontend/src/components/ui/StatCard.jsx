import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils'

export const StatCard = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon, 
  color = 'blue', 
  prefix = '', 
  suffix = '', 
  loading = false,
  comparisonText
}) => {
  const { t } = useTranslation()
  const colorMap = {
    blue:   { bg: 'bg-brand-50',  icon: 'text-brand-500',  iconBg: 'bg-brand-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  iconBg: 'bg-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    iconBg: 'bg-red-100'   },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500', iconBg: 'bg-orange-100'},
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', iconBg: 'bg-purple-100'},
  }
  const c = colorMap[color] || colorMap.blue
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'

  if (loading) {
    return (
      <div className="card p-5" aria-hidden="true">
        <div className="flex justify-between items-start mb-4">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-10 w-10 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-32 rounded mb-2" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    )
  }

  return (
    <div 
      role="region"
      aria-label={`${title} statistics`}
      className={cn('card p-5 hover:shadow-elevated transition-shadow duration-200')}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl', c.iconBg)}>
            <Icon className={cn('w-5 h-5', c.icon)} aria-hidden="true" />
          </div>
        )}
      </div>
      <p 
        className="text-2xl font-display font-bold text-slate-900 mb-1"
        aria-description={`Value for ${title}`}
      >
        {prefix}{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}{suffix}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1" aria-label={`Trend: ${change}% ${trend}`}>
          <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} aria-hidden="true" />
          <span className={cn('text-xs font-medium', trendColor)}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-slate-400">
            {comparisonText || t('admin.dashboard.vs_last_month', { defaultValue: 'vs last month' })}
          </span>
        </div>
      )}
    </div>
  )
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'orange', 'purple']),
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  loading: PropTypes.bool,
  comparisonText: PropTypes.string,
}
