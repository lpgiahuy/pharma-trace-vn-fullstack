import { useEffect, useState, useCallback, memo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { productService } from '@/services/product.service'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { Pagination } from '@/components/ui/Pagination'
import { SearchEmpty } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useCategoryStore } from '@/store/categoryStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

// Sub-components
import { ProductFilters } from './components/ProductFilters'
import { ProductListPageHeader } from './components/ProductListPageHeader'
import QuickSubCategorySelect from './components/QuickSubCategorySelect'

/**
 * ProductListPage handles global state for filtering, searching, and sorting products.
 * It is decoupled into specialized presentation components.
 */
export default function ProductListPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [brands, setBrands]       = useState([])
  const categories = useCategoryStore(s => s.categories)

  const page     = Number(searchParams.get('page'))     || 1
  const category = searchParams.get('category')         || ''
  const sort     = searchParams.get('sort')             || 'newest'
  const search   = searchParams.get('search')           || ''
  const minPrice = searchParams.get('minPrice')         || ''
  const maxPrice = searchParams.get('maxPrice')         || ''
  const brand    = searchParams.get('brand')            || ''
  const isFlashSale = searchParams.get('is_flash_sale') === 'true'
  const inStock     = searchParams.get('in_stock')       === 'true'

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebounce(searchInput, 400)

  const setParam = useCallback((key, val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const currentVal = next.get(key) || ''
      const newVal = String(val || '')
      
      if (currentVal === newVal) return prev
      
      if (val) next.set(key, val); else next.delete(key)
      if (key !== 'page') next.set('page', '1')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productService.getAll({ 
        category, sort, search, minPrice, maxPrice, brand, 
        is_flash_sale: isFlashSale, 
        in_stock: inStock,
        limit: 10000 
      })
      const allData = Array.isArray(res?.data) ? res.data : []

      // Deduplicate: same drug ID may appear once per packaging variant.
      // Keep only one card per product ID — prefer the base unit or the cheapest variant.
      const seen = new Map()
      allData.forEach(p => {
        const existing = seen.get(p.id)
        if (!existing) {
          seen.set(p.id, p)
        } else {
          // Prefer the base unit if available, otherwise keep the cheaper one
          const isBase = p.la_don_vi_co_ban || p.quy_cach_dong_goi?.find(q => q.la_don_vi_co_ban && q.ten_don_vi === p.unit)
          if (isBase || p.price < existing.price) {
            seen.set(p.id, p)
          }
        }
      })

      const deduped = Array.from(seen.values())
      setProducts(deduped)
      setTotal(deduped.length)
    } catch (err) {
      console.error('[ProductListPage] Failed to fetch products:', err)
      setError(err?.response?.data?.message || err?.message || t('product_list.error_loading'))
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [category, sort, search, minPrice, maxPrice, brand, isFlashSale, inStock, page, t])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  
  useEffect(() => { 
    if (debouncedSearch !== search) {
      setParam('search', debouncedSearch)
    }
  }, [debouncedSearch, search, setParam])

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsData = await productService.getBrands()
        setBrands(brandsData)
      } catch (err) {
        console.error('[ProductListPage] Failed to fetch brands:', err)
      }
    }
    fetchBrands()
  }, [])

  const displayedProducts = products.slice((page - 1) * 20, page * 20)

  const clearFilters = () => setSearchParams({})

  return (
    <div className="page-container py-8 animate-fade-in min-h-[70vh]">
      <Helmet>
        <title>{category ? `${category} | PharmaChain` : 'Our Medicines & Products | PharmaChain'}</title>
        <meta name="description" content={category ? `Shop for ${category} products at PharmaChain. Quality guaranteed, fast delivery.` : 'Discover a wide range of authentic medicines, healthcare products, and pharmacy supplies at PharmaChain.'} />
        <meta property="og:title" content={category ? `${category} | PharmaChain` : 'Our Medicines & Products | PharmaChain'} />
        <meta property="og:description" content="Authentic medicines and healthcare products with fast delivery." />
        <meta name="keywords" content="pharmacy, medicine, healthcare, medicine list, pharmaceutical products, PharmaChain" />
      </Helmet>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`w-full md:w-60 shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <ProductFilters 
            key={category || 'all'}
            categories={categories}
            selectedCategory={category}
            onCategoryChange={val => setParam('category', val)}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={setParam}
            brands={brands}
            selectedBrand={brand}
            onBrandChange={val => setParam('brand', val)}
            onClearFilters={clearFilters}
            showAllCategories={showAllCategories}
            onToggleShowAllCategories={() => setShowAllCategories(!showAllCategories)}
            inStock={inStock}
            onInStockChange={val => setParam('in_stock', val ? 'true' : '')}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sub-category Quick Select */}
          <QuickSubCategorySelect 
            categories={categories}
            category={category}
            setParam={setParam}
            t={t}
          />

          <ProductListPageHeader             searchInput={searchInput}
            onSearchChange={setSearchInput}
            sortValue={sort}
            onSortChange={val => setParam('sort', val)}
            onToggleFilters={() => setShowFilters(!showFilters)}
            totalResults={total}
            currentSearch={search}
            loading={loading}
            isFlashSale={isFlashSale}
            inStock={inStock}
            onInStockChange={val => setParam('in_stock', val ? 'true' : '')}
          />

          {/* Error state */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">{t('product_list.error_title', { defaultValue: 'Failed to load products' })}</p>
                <p className="text-xs text-red-600 mt-0.5 font-medium">{error}</p>
              </div>
              <Button 
                size="xs" 
                variant="outline" 
                className="bg-white"
                onClick={fetchProducts} 
                leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
              >
                {t('common.retry', { defaultValue: 'Retry' })}
              </Button>
            </div>
          )}

          {/* Grid Layout */}
          {!loading && products.length === 0 ? (
            <SearchEmpty query={search} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : displayedProducts.map(p => <ProductCard key={p?.id || p?._id} product={p} />)
              }
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 20 && (
            <Pagination
              page={page}
              totalPages={Math.ceil(total / 20)}
              onChange={p => setParam('page', p)}
              className="mt-12"
            />
          )}
        </div>
      </div>
    </div>
  )
}
