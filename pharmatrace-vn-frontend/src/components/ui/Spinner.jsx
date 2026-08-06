import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { cn } from '@/utils'

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-16 h-16' }

export const Spinner = ({ size = 'md', className, fullScreen = false }) => {
  const { t } = useTranslation()
  
  const spinner = (
    <svg
      role="status"
      aria-label={t('common.loading', { defaultValue: 'Loading...' })}
      className={cn('animate-spin text-brand-500', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" aria-hidden="true" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" aria-hidden="true" />
    </svg>
  )

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-slate-500 font-medium animate-pulse-soft">
            {t('common.loading_page', { defaultValue: 'Loading page...' })}
          </p>
        </div>
      </div>
    )
  }

  return spinner
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  fullScreen: PropTypes.bool,
}

export const PageLoader = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" aria-busy="true">
      <Spinner size="lg" />
      <span className="text-slate-400 text-sm font-medium animate-pulse">
        {t('common.please_wait', { defaultValue: 'Please wait...' })}
      </span>
    </div>
  )
}

export const InlineLoader = ({ text }) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center" role="status">
      <Spinner size="sm" />
      <span>{text || t('common.loading', { defaultValue: 'Loading...' })}</span>
    </div>
  )
}

InlineLoader.propTypes = {
  text: PropTypes.string,
}
