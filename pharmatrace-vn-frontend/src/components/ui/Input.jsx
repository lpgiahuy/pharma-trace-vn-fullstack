import { forwardRef, useId } from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/utils'

export const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  wrapperClassName,
  id,
  required,
  ...props
}, ref) => {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className={cn('flex flex-col gap-1', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'w-full px-3 py-2 rounded-lg border text-sm placeholder:text-slate-400 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400' : 'border-surface-border bg-white',
            leftIcon  && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'

Input.propTypes = {
  label: PropTypes.node,
  error: PropTypes.string,
  hint: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
}

export const Textarea = forwardRef(({ label, error, hint, className, wrapperClassName, id, required, ...props }, ref) => {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className={cn('flex flex-col gap-1', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          'w-full px-3 py-2 rounded-lg border text-sm placeholder:text-slate-400 transition-all duration-150 resize-vertical min-h-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400',
          error ? 'border-red-400 bg-red-50' : 'border-surface-border bg-white',
          className
        )}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Input

Textarea.propTypes = {
  label: PropTypes.node,
  error: PropTypes.string,
  hint: PropTypes.string,
  className: PropTypes.string,
  wrapperClassName: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
}
