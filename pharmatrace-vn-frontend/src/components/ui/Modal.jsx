import { useEffect, useRef, useId } from 'react'
import PropTypes from 'prop-types'
import { X } from 'lucide-react'
import { cn } from '@/utils'
import { Button } from './Button'

const sizes = {
  sm:   'max-w-md',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw]',
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closable = true,
  className,
}) => {
  const overlayRef = useRef(null)
  const idPrefix = useId()
  const titleId = `${idPrefix}-title`

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape' && closable) onClose?.() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, closable, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all"
      onClick={(e) => { if (e.target === overlayRef.current && closable) onClose?.() }}
      role="presentation"
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" 
        aria-hidden="true" 
      />
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-modal animate-slide-up flex flex-col max-h-[90vh]',
          sizes[size],
          className
        )}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
            {title && <h2 id={titleId} className="text-lg font-display font-semibold text-slate-900">{title}</h2>}
            {closable && (
              <button 
                onClick={onClose} 
                aria-label="Close modal"
                className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closable: PropTypes.bool,
  className: PropTypes.string,
}

export const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title || 'Confirm Action'}
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>
    }
  >
    <p className="text-slate-600">{message}</p>
  </Modal>
)

ConfirmModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  danger: PropTypes.bool,
  loading: PropTypes.bool,
}
