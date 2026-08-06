import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/utils'
import { Spinner } from './Spinner'

const variants = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50',
  ghost:     'text-slate-600 hover:bg-slate-100',
  danger:    'bg-red-500 text-white hover:bg-red-600',
  success:   'bg-green-500 text-white hover:bg-green-600',
  outline:   'border border-slate-300 text-slate-700 hover:bg-slate-50',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-2',
}

export const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className,
  fullWidth = false,
  type = 'button',
  ...props
}, ref) => (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading}
    aria-disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer select-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {loading ? <Spinner size="sm" className="text-current shrink-0" /> : leftIcon}
    <span className={cn(loading && 'opacity-0', 'transition-opacity')}>
      {children}
    </span>
    {!loading && rightIcon}
  </button>
))

Button.displayName = 'Button'

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success', 'outline']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
}
