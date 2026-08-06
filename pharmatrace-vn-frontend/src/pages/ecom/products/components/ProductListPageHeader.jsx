import React, { memo } from 'react'
import PropTypes from 'prop-types'
import { SlidersHorizontal, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { SORT_OPTIONS } from '@/constants'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'

export const ProductListPageHeader = memo(({ 
  searchInput, 
  onSearchChange, 
  sortValue, 
  onSortChange, 
  onToggleFilters,
  totalResults,
  currentSearch,
  loading,
  isFlashSale,
  inStock,
  onInStockChange
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={t('product_list.search_placeholder', { defaultValue: 'Search products...' })}
          value={searchInput}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1"
          aria-label="Search products"
        />
        <div className="flex gap-2">
          <select
            value={sortValue}
            onChange={e => onSortChange(e.target.value)}
            className="input text-sm w-48 border-surface-border rounded-lg px-3 focus:ring-2 focus:ring-brand-300 focus:outline-none"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {t(`sort.${o.value}`, { defaultValue: o.label })}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={() => onInStockChange(!inStock)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all shadow-sm",
              inStock 
                ? "bg-brand-50 border-brand-200 text-brand-700 ring-1 ring-brand-200" 
                : "bg-white border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-slate-50"
            )}
            aria-pressed={inStock}
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-all",
              inStock ? "bg-brand-600 border-brand-600" : "bg-white border-slate-300"
            )}>
              {inStock && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="hidden xs:inline">{t('product_list.in_stock_only', { defaultValue: 'In Stock' })}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFilters}
            className="md:hidden inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" /> 
            {t('product_list.filters_btn', { defaultValue: 'Filters' })}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500" aria-live="polite">
        <p>
          {loading 
            ? t('common.loading', { defaultValue: 'Loading…' }) 
            : t('product_list.results_count', { count: totalResults, defaultValue: `${totalResults.toLocaleString()} products found` })
          }
          {isFlashSale && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-medical-red/10 text-medical-red border border-medical-red/20 uppercase tracking-wider">
              🔥 {t('home.flash_sale', { defaultValue: 'Flash Sale' })}
            </span>
          )}
          {currentSearch && (
            <span className="ml-1">
              {t('product_list.for_query', { defaultValue: 'for' })} "<strong>{currentSearch}</strong>"
            </span>
          )}
        </p>
      </div>
    </div>
  )
})

ProductListPageHeader.displayName = 'ProductListPageHeader'

ProductListPageHeader.propTypes = {
  searchInput: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  sortValue: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onToggleFilters: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
  currentSearch: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  isFlashSale: PropTypes.bool,
  inStock: PropTypes.bool,
  onInStockChange: PropTypes.func
}
