import React, { useState, useEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { X, Search, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/utils'
import CategoryFilterItem from './CategoryFilterItem'

export const ProductFilters = memo(({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  selectedBrand,
  onBrandChange,
  onClearFilters,
  showAllCategories,
  onToggleShowAllCategories,
  inStock,
  onInStockChange,
  brands = []
}) => {
  const { t, i18n } = useTranslation()
  const [localMin, setLocalMin] = useState(minPrice || '')
  const [localMax, setLocalMax] = useState(maxPrice || '')
  const [brandSearch, setBrandSearch] = useState('')
  const [showAllBrands, setShowAllBrands] = useState(false)

  // Sync local inputs with props when filters are cleared
  useEffect(() => {
    setLocalMin(minPrice || '')
    setLocalMax(maxPrice || '')
  }, [minPrice, maxPrice])


  const PRICE_PRESETS = [
    { label: t('product_list.price_under', { price: '100.000 đ' }), min: '', max: '100000' },
    { label: t('product_list.price_between', { min: '100.000 đ', max: '300.000 đ' }), min: '100000', max: '300000' },
    { label: t('product_list.price_between', { min: '300.000 đ', max: '500.000 đ' }), min: '300000', max: '500000' },
    { label: t('product_list.price_above', { price: '500.000 đ' }), min: '500000', max: '' },
  ]

  const handleApplyPrice = () => {
    onPriceChange('minPrice', localMin)
    onPriceChange('maxPrice', localMax)
  }

  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
  const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 5)

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || selectedBrand || inStock

  return (
    <div className="card p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">{t('product_list.filters', { defaultValue: 'Filters' })}</h3>
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters} 
            className="text-xs text-red-500 hover:underline flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" /> {t('common.clear_all', { defaultValue: 'Clear all' })}
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800">{t('product_list.category', { defaultValue: 'Danh mục' })}</h4>
        <div className="space-y-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => onCategoryChange('')}
            aria-pressed={!selectedCategory}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all group",
              !selectedCategory 
                ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
                : "bg-surface-soft/50 border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-white"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
              !selectedCategory ? "border-brand-500 bg-brand-500" : "border-slate-300 group-hover:border-brand-400"
            )}>
              {!selectedCategory && <Check className="w-3 h-3 text-white" />}
            </div>
            {t('product_list.all_categories', { defaultValue: 'Tất cả danh mục' })}
          </button>

          {categories.map(cat => (
            <CategoryFilterItem 
              key={cat.id}
              cat={cat}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 mb-4">{t('product_list.availability', { defaultValue: 'Tình trạng hàng' })}</h4>
        <button
          onClick={() => onInStockChange(!inStock)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all group",
            inStock 
              ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
              : "bg-surface-soft/50 border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-white"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            inStock ? "border-brand-500 bg-brand-500" : "border-slate-300 group-hover:border-brand-400"
          )}>
            {inStock && <Check className="w-3 h-3 text-white" />}
          </div>
          {t('product_list.in_stock_only', { defaultValue: 'Chỉ xem còn hàng' })}
        </button>
      </div>

      {/* Price Range */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 mb-4">{t('product_list.price_range', { defaultValue: 'Khoảng giá' })}</h4>
        
        {/* Presets */}
        <div className="space-y-2 mb-4">
          {PRICE_PRESETS.map(preset => {
            const isActive = minPrice === preset.min && maxPrice === preset.max
            return (
              <button
                key={preset.label}
                onClick={() => {
                  onPriceChange('minPrice', preset.min)
                  onPriceChange('maxPrice', preset.max)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all group",
                  isActive 
                    ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
                    : "bg-surface-soft/50 border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-white"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isActive ? "border-brand-500 bg-brand-500" : "border-slate-300 group-hover:border-brand-400"
                )}>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </div>
                {preset.label}
              </button>
            )
          })}
        </div>

        {/* Custom Input */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('product_list.custom_range_label', { defaultValue: 'Or enter personal range:' })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                placeholder={t('product_list.min_price', { defaultValue: 'Min' })}
                value={localMin}
                onChange={e => setLocalMin(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase underline decoration-slate-300">đ</span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder={t('product_list.max_price', { defaultValue: 'Max' })}
                value={localMax}
                onChange={e => setLocalMax(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase underline decoration-slate-300">đ</span>
            </div>
          </div>
          <Button 
            className="w-full h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-brand-500/10"
            onClick={handleApplyPrice}
          >
            {t('product_list.apply', { defaultValue: 'Apply' })}
          </Button>
        </div>
      </div>

      {/* Brand Filter */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-800 mb-4">{t('product_list.brand', { defaultValue: 'Thương hiệu' })}</h4>
        
        {/* Brand Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder={t('product_list.search_brand', { defaultValue: 'Search Brand' })}
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium"
          />
        </div>

        {/* Brand List */}
        <div className="space-y-2">
          {displayedBrands.map(brand => {
            const isActive = selectedBrand === brand
            return (
              <button
                key={brand}
                onClick={() => onBrandChange(isActive ? '' : brand)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all group text-left",
                  isActive 
                    ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
                    : "bg-surface-soft/50 border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-white"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  isActive ? "border-brand-500 bg-brand-500" : "border-slate-300 group-hover:border-brand-400"
                )}>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </div>
                {brand}
              </button>
            )
          })}
        </div>

        {filteredBrands.length > 5 && (
          <button 
            type="button"
            onClick={() => setShowAllBrands(!showAllBrands)}
            className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors py-2"
          >
            {showAllBrands ? (
              <><ChevronUp className="w-3.5 h-3.5" /> {t('common.show_less', { defaultValue: 'Show less' })}</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> {t('common.show_more', { defaultValue: 'Show more' })}</>
            )}
          </button>
        )}
      </div>
    </div>
  )
})

ProductFilters.displayName = 'ProductFilters'

ProductFilters.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  minPrice: PropTypes.string,
  maxPrice: PropTypes.string,
  onPriceChange: PropTypes.func.isRequired,
  selectedBrand: PropTypes.string,
  onBrandChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  showAllCategories: PropTypes.bool.isRequired,
  onToggleShowAllCategories: PropTypes.func.isRequired,
  inStock: PropTypes.bool,
  onInStockChange: PropTypes.func,
  brands: PropTypes.arrayOf(PropTypes.string)
}

export default ProductFilters;
