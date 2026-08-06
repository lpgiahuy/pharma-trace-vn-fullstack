import PropTypes from 'prop-types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'

export const Pagination = ({ page, totalPages, onChange, className }) => {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i)

  return (
    <nav 
      aria-label="Pagination Navigation"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Go to previous page"
        className="p-2 rounded-lg border border-surface-border text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <PageBtn n={1} active={page === 1} onClick={() => onChange(1)} />
          {pages[0] > 2 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
        </>
      )}

      {pages.map(n => (
        <PageBtn key={n} n={n} active={page === n} onClick={() => onChange(n)} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
          <PageBtn n={totalPages} active={page === totalPages} onClick={() => onChange(totalPages)} />
        </>
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Go to next page"
        className="p-2 rounded-lg border border-surface-border text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
}

const PageBtn = ({ n, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Page ${n}`}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors',
      active
        ? 'bg-brand-500 text-white shadow-sm'
        : 'border border-surface-border text-slate-600 hover:bg-slate-50'
    )}
  >
    {n}
  </button>
)

PageBtn.propTypes = {
  n: PropTypes.number.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
}
