import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ShoppingCart, Heart, Star, Shield, Truck, RotateCcw, Plus, Minus, ChevronRight } from 'lucide-react'
import { productService } from '@/services/product.service'
import { wishlistService } from '@/services/wishlist.service'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, cn } from '@/utils'
import { sanitizeHtml } from '@/utils/security'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import NearestPharmacy from './components/NearestPharmacy'

/**
 * Helper component to safely render content that might be a string (HTMl), 
 * an array, or a nested object. Avoids "Objects are not valid as a React child" crash.
 */
function RenderSafeContent({ content, className = "text-base text-slate-700 leading-relaxed font-medium" }) {
  const { t } = useTranslation()
  if (!content) return null

  if (typeof content === 'string') {
    // If it looks like HTML, use dangerouslySetInnerHTML, otherwise plain text with line breaks
    if (content.includes('<') && content.includes('>')) {
      return <div className={`prose prose-sm max-w-none font-medium ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
    }
    return <p className={`${className} whitespace-pre-line`}>{content}</p>
  }

  if (Array.isArray(content)) {
    return (
      <ul className={`list-disc pl-6 space-y-2 ${className}`}>
        {content.map((item, i) => (
          <li key={i}>
            {typeof item === 'object' ? <RenderSafeContent content={item} className="mt-1" /> : item}
          </li>
        ))}
      </ul>
    )
  }

  if (typeof content === 'object') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Object.entries(content).map(([key, val]) => {
          if (!val || (typeof val === 'string' && val.trim() === '')) return null
          
          const label = t(`product.detail_labels.${key}`, { 
            defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
          })

          return (
            <div key={key} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-3">{label}</h4>
              <RenderSafeContent content={val} className="text-base text-slate-700 leading-relaxed font-medium" />
            </div>
          )
        })}
      </div>
    )
  }

  return <div className={className}>{String(content)}</div>
}

export default function ProductDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [qty, setQty]         = useState(1)
  const [activeTab, setActiveTab] = useState('thanh_phan')
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewStars, setReviewStars] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  
  const addItem = useCartStore(s => s.addItem)
  const user = useAuthStore(s => s.user)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    setLoading(true)
    productService.getById(id)
      .then(res => {
        setProduct(res)
        setIsFavorite(res.isFavorited)
        if (res.variants?.length > 0) {
          const base = res.variants.find(v => v.isBase) || res.variants[0]
          setSelectedVariant(base)
        }
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (activeTab !== 'reviews' || !id) return
    setReviewsLoading(true)
    productService.getReviews(id)
      .then(res => setReviews(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [activeTab, id])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.error(t('auth.login_required', { defaultValue: 'Please login to submit a review.' })); return }
    setReviewSubmitting(true)
    try {
      const newReview = await productService.addReview(id, { so_sao: reviewStars, noi_dung: reviewText })
      setReviews(prev => [newReview, ...prev])
      setReviewText('')
      setReviewStars(5)
      toast.success('Review submitted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error(t('auth.login_required_favorite', { defaultValue: 'Please login to add to wishlist!' }))
      return
    }
    if (isToggling) return
    
    setIsToggling(true)
    const prev = isFavorite
    setIsFavorite(!prev)
    
    try {
      const res = await wishlistService.toggle(product.id)
      setIsFavorite(res.isFavorited)
    } catch (e) {
      setIsFavorite(prev)
      console.error('Toggle favorite failed', e)
    } finally {
      setIsToggling(false)
    }
  }

  if (loading) return <PageLoader />
  if (error || !product) return <div className="page-container py-16"><ErrorState error={error} /></div>

  // Active price: use selected variant price if available, otherwise product base price
  const activePrice = selectedVariant?.price ?? product.price
  const activeOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice
  const discount = selectedVariant?.discount || (activeOriginalPrice ? Math.round((1 - activePrice / activeOriginalPrice) * 100) : 0)

  // Build cart item using the active variant
  const cartItem = selectedVariant
    ? { ...product, price: selectedVariant.price, unit: selectedVariant.unit, variantId: selectedVariant.id }
    : product

  return (
    <div className="page-container py-8 animate-fade-in">
      <Helmet>
        <title>{`${product.name} | PharmaChain`}</title>
        <meta name="description" content={product.description || `${product.name} - ${product.brand}. Quality healthcare products at PharmaChain.`} />
        <meta property="og:title" content={`${product.name} | PharmaChain`} />
        <meta property="og:description" content={product.description || `${product.name} - ${product.brand}. Quality healthcare products at PharmaChain.`} />
        <meta property="og:image" content={product.image} />
        <meta name="keywords" content={`${product.name}, ${product.brand}, pharmacy, medicine, healthcare, PharmaChain`} />
      </Helmet>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600">{t('nav.home', { defaultValue: 'Home' })}</Link>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
        <Link to="/products" className="hover:text-brand-600">{t('nav.products', { defaultValue: 'Products' })}</Link>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
        <span className="text-slate-800 font-medium truncate" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Image */}
        <div className="space-y-3">
          <div className="aspect-[1.25/1] rounded-2xl bg-slate-50 border border-surface-border overflow-hidden flex items-center justify-center p-6">
            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-brand-500 font-semibold uppercase tracking-wide mb-1">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1" aria-label={`Rating: ${product.rating} stars`}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} aria-hidden="true" />
              ))}
            </div>
            <span className="text-sm text-slate-500">
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <span className="text-sm text-slate-500">
              {t('product.sold_count', { count: product.soldCount, defaultValue: `Sold ${product.soldCount}` })}
            </span>
          </div>

          {/* Unit / Packaging Switcher */}
          {product.variants?.length > 1 && (
            <div className="mb-6">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                {t('product.packaging_variants', { defaultValue: 'Packaging Options' })}
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select packaging variant">
                {product.variants.map(v => (
                  <button
                    key={v.id ?? v.unit}
                    onClick={() => setSelectedVariant(v)}
                    aria-checked={selectedVariant?.unit === v.unit}
                    role="radio"
                    className={cn(
                      'flex flex-col items-start px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-left min-w-[90px]',
                      selectedVariant?.unit === v.unit
                        ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-100'
                        : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-black uppercase tracking-tight leading-none',
                      selectedVariant?.unit === v.unit ? 'text-brand-600' : 'text-slate-500'
                    )}>{v.unit}</span>
                    <span className={cn(
                      'text-sm font-black mt-1 leading-none',
                      selectedVariant?.unit === v.unit ? 'text-brand-700' : 'text-slate-700'
                    )}>{formatCurrency(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price & Discount Box */}
          <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 mb-6 shadow-sm">
            {activeOriginalPrice && activePrice < activeOriginalPrice && (
              <div className="inline-flex items-center bg-medical-red text-white text-[10px] font-black px-2 py-1 rounded mb-3 shadow-sm uppercase tracking-tight">
                {t('product.discount_amount', { 
                  amount: formatCurrency(activeOriginalPrice - activePrice), 
                  defaultValue: `GIẢM ${formatCurrency(activeOriginalPrice - activePrice)}` 
                })}
              </div>
            )}
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-display font-black text-brand-600 tracking-tight">
                {formatCurrency(activePrice)}
                <span className="text-lg md:text-xl font-bold text-slate-400 ml-1.5 uppercase">
                  /{selectedVariant?.unit || product.unit}
                </span>
              </span>
              
              {activeOriginalPrice && activePrice < activeOriginalPrice && (
                <span className="text-lg md:text-xl text-slate-300 line-through font-medium decor-slate-200">
                  {formatCurrency(activeOriginalPrice)}
                </span>
              )}
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-4 leading-relaxed italic border-t border-slate-200/60 pt-3">
              * {t('product.price_disclaimer', { defaultValue: 'Giá đã bao gồm thuế. Phí vận chuyển và các chi phí khác (nếu có) sẽ được thể hiện khi đặt hàng.' })}
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {product.inStock ? (
              <Badge color="green">{t('product.in_stock_with_count', { count: product.totalStock, defaultValue: 'In Stock' })}</Badge>
            ) : (
              <Badge color="red">{t('product.out_of_stock', { defaultValue: 'Out of Stock' })}</Badge>
            )}
            {product.tags?.map(tag => <Badge key={tag} color="blue">{tag}</Badge>)}
          </div>

          {/* Qty + Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 border border-surface-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setQty(q => Math.max(1, q - 1))} 
                className="p-3 hover:bg-slate-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold" aria-label="Current quantity">{qty}</span>
              <button 
                onClick={() => setQty(q => q + 1)} 
                className="p-3 hover:bg-slate-100 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button
              size="lg"
              disabled={!product.inStock}
              onClick={() => addItem(cartItem, qty)}
              leftIcon={<ShoppingCart className="w-5 h-5" />}
              className="flex-1"
            >
              {product.inStock ? t('product.add_to_cart', { defaultValue: 'Add to Cart' }) : t('product.out_of_stock')}
            </Button>
            <button 
              onClick={handleToggleFavorite}
              disabled={isToggling}
              aria-label={isFavorite ? t('product.remove_wishlist') : t('product.add_wishlist')}
              aria-pressed={isFavorite}
              className={cn(
                "p-3 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50",
                isFavorite 
                  ? "bg-red-50 border-red-200 text-red-500 shadow-sm" 
                  : "border-surface-border hover:bg-slate-50 text-slate-400"
              )}
            >
              <Heart className={cn("w-5 h-5 transition-colors", isFavorite && "fill-current")} />
            </button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
            {[
              { icon: Shield, labelKey: 'product.trust.authentic',    subKey: 'product.trust.authentic_sub' },
              { icon: Truck,  labelKey: 'product.trust.fast_delivery', subKey: 'product.trust.fast_delivery_sub' },
              { icon: RotateCcw, labelKey: 'product.trust.easy_returns', subKey: 'product.trust.easy_returns_sub' },
            ].map(({ icon: Icon, labelKey, subKey }) => (
              <div key={labelKey} className="flex flex-col items-center text-center gap-1">
                <Icon className="w-5 h-5 text-brand-500" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">{t(labelKey)}</p>
                <p className="text-[10px] text-slate-400">{t(subKey)}</p>
              </div>
            ))}
          </div>

          {/* Batch info */}
          <div className="mt-4 text-xs text-slate-400 space-y-0.5" aria-label="Batch information">
            <p>{t('product.batch', { defaultValue: 'Batch' })}: <span className="font-mono text-slate-600">{product.batchNumber}</span></p>
            <p>{t('product.expires', { defaultValue: 'Expires' })}: <span className="text-slate-600">{formatDate(product.expiryDate)}</span></p>
          </div>
        </div>
      </div>

      {/* Nearest Pharmacy Section */}
      <NearestPharmacy productId={product.id} inStock={product.inStock} />

      {/* Tabs Section */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-surface-border bg-slate-50/50">
          <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">{t('product.description_title', { defaultValue: 'Product Description' })}</h2>
        </div>
        <div className="flex border-b border-surface-border overflow-x-auto no-scrollbar scroll-smooth snap-x" role="tablist">
          {[
            { id: 'thanh_phan', label: t('product.tabs.ingredients', { defaultValue: 'Ingredients' }), keys: ['thanh_phan_chi_tiet', 'ingredients', 'thanh_phan'] },
            { id: 'chi_dinh', label: t('product.tabs.usage', { defaultValue: 'Usage & Indications' }), keys: ['mo_ta_chung', 'chi_dinh', 'cong_dung'] },
            { id: 'cach_su_dung', label: t('product.tabs.how_to_use', { defaultValue: 'How to Use' }), keys: ['huong_dan_su_dung', 'cach_su_dung'] },
            { id: 'than_trong', label: t('product.tabs.precautions', { defaultValue: 'Precautions' }), keys: ['than_trong', 'tac_dung_phu', 'canh_bao_than_trong', 'chong_chi_dinh', 'nhom_benh_nhan_dac_biet'] },
            { id: 'thong_tin_san_xuat', label: t('product.tabs.manufacturing', { defaultValue: 'Manufacturing' }), keys: ['thong_tin_san_xuat'] },
            { id: 'reviews', label: t('product.tabs.reviews', { defaultValue: 'Reviews' }), keys: [] },
          ].filter(t => 
            t.id === 'reviews' || 
            (product.chi_tiet_thuoc && t.keys.some(k => product.chi_tiet_thuoc[k])) ||
            (t.id === 'chi_dinh' && product.description)
          ).map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 sm:py-5 text-sm sm:text-base font-bold whitespace-nowrap transition-all relative snap-start ${
                activeTab === tab.id 
                  ? 'text-brand-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 animate-in slide-in-from-left-full duration-300" />
              )}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6 md:p-10" id={`panel-${activeTab}`} role="tabpanel">
          {activeTab === 'thanh_phan' && (
            <div className="space-y-8 animate-fade-in">
              {product.chi_tiet_thuoc?.thanh_phan_chi_tiet?.hoat_chat && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {t('product.active_ingredient', { defaultValue: 'Active Ingredient' })}
                  </h3>
                  <RenderSafeContent content={product.chi_tiet_thuoc.thanh_phan_chi_tiet.hoat_chat} className="text-base text-slate-700 leading-relaxed font-medium pl-3.5" />
                </section>
              )}
              {product.chi_tiet_thuoc?.thanh_phan_chi_tiet?.ta_duoc && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {t('product.excipients', { defaultValue: 'Excipients' })}
                  </h3>
                  <RenderSafeContent content={product.chi_tiet_thuoc.thanh_phan_chi_tiet.ta_duoc} className="text-base text-slate-700 leading-relaxed pl-3.5" />
                </section>
              )}
              {(product.chi_tiet_thuoc?.ingredients || product.chi_tiet_thuoc?.thanh_phan) && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {t('product.ingredient_details', { defaultValue: 'Ingredient Details' })}
                  </h3>
                  <div className="pl-3.5">
                    <RenderSafeContent content={product.chi_tiet_thuoc?.ingredients || product.chi_tiet_thuoc?.thanh_phan} className="text-base text-slate-700 leading-relaxed font-medium" />
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'chi_dinh' && (
            <div className="text-base text-slate-700 leading-relaxed font-medium animate-fade-in">
              <RenderSafeContent content={product.chi_tiet_thuoc?.mo_ta_chung || product.chi_tiet_thuoc?.chi_dinh || product.chi_tiet_thuoc?.cong_dung || product.description} />
            </div>
          )}

          {activeTab === 'cach_su_dung' && (
            <div className="space-y-6 animate-fade-in">
              {product.chi_tiet_thuoc?.huong_dan_su_dung ? (
                <RenderSafeContent content={product.chi_tiet_thuoc.huong_dan_su_dung} />
              ) : (
                <RenderSafeContent content={product.chi_tiet_thuoc?.cach_su_dung} />
              )}
            </div>
          )}

          {activeTab === 'than_trong' && (
            <div className="space-y-8 animate-fade-in">
              {product.chi_tiet_thuoc?.chong_chi_dinh && (
                <section className="p-5 bg-red-50/50 rounded-2xl border border-red-100 shadow-sm" role="alert">
                  <h3 className="text-base font-bold text-red-900 mb-2.5 flex items-center gap-2">
                    🚫 {t('product.contraindications', { defaultValue: 'Contraindications' })}
                  </h3>
                  <div className="text-red-800 font-medium">
                    <RenderSafeContent content={product.chi_tiet_thuoc.chong_chi_dinh} className="text-base leading-relaxed" />
                  </div>
                </section>
              )}
              {(product.chi_tiet_thuoc?.canh_bao_than_trong || product.chi_tiet_thuoc?.than_trong) && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{t('product.warnings_precautions', { defaultValue: 'Warnings & Precautions' })}</h3>
                  <div className="pl-3.5">
                    <RenderSafeContent content={product.chi_tiet_thuoc?.canh_bao_than_trong || product.chi_tiet_thuoc?.than_trong} />
                  </div>
                </section>
              )}
              {product.chi_tiet_thuoc?.tac_dung_phu && (
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{t('product.side_effects', { defaultValue: 'Side Effects' })}</h3>
                  <div className="pl-3.5">
                    <RenderSafeContent content={product.chi_tiet_thuoc.tac_dung_phu} className="text-base text-slate-700 leading-relaxed font-medium" />
                  </div>
                </section>
              )}
              {product.chi_tiet_thuoc?.tuong_tac_thuoc && (
                <section>
                  <h3 className="text-base font-bold text-slate-900 mb-3">{t('product.drug_interactions', { defaultValue: 'Drug Interactions' })}</h3>
                  {Array.isArray(product.chi_tiet_thuoc.tuong_tac_thuoc) ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                      <table className="w-full text-base text-left">
                        <thead className="bg-slate-50 text-slate-900 font-bold">
                          <tr>
                            <th className="px-5 py-3 border-b">{t('product.interaction_item', { defaultValue: 'Item' })}</th>
                            <th className="px-5 py-3 border-b">{t('product.interaction_effect', { defaultValue: 'Effect' })}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                          {product.chi_tiet_thuoc.tuong_tac_thuoc.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 text-slate-900 font-bold">{item.thuoc}</td>
                              <td className="px-5 py-3 text-slate-700">{item.hau_qua}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-base text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                      {product.chi_tiet_thuoc.tuong_tac_thuoc}
                    </p>
                  )}
                </section>
              )}
              {product.chi_tiet_thuoc?.nhom_benh_nhan_dac_biet && (
                <section>
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-brand-500 rounded-full" />
                    {t('product.special_patient_groups', { defaultValue: 'Special Patient Groups' })}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {typeof product.chi_tiet_thuoc.nhom_benh_nhan_dac_biet === 'object' && !Array.isArray(product.chi_tiet_thuoc.nhom_benh_nhan_dac_biet) ? (
                      Object.entries(product.chi_tiet_thuoc.nhom_benh_nhan_dac_biet)
                        .filter(([_, val]) => val && String(val).trim() !== '')
                        .map(([key, val]) => {
                          const label = t(`product.special_groups.${key}`, { 
                            defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                          })

                          return (
                            <div key={key} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                              <h4 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2.5">
                                {label}
                              </h4>
                                <RenderSafeContent content={val} className="text-base text-slate-800 leading-relaxed font-bold" />
                            </div>
                          )
                        })
                    ) : (
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 col-span-2">
                        <p className="text-base text-slate-700 leading-relaxed font-medium">
                          {String(product.chi_tiet_thuoc.nhom_benh_nhan_dac_biet)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'thong_tin_san_xuat' && product.chi_tiet_thuoc?.thong_tin_san_xuat && (
            <div className="grid gap-5 sm:grid-cols-2 animate-fade-in">
              {[
                { label: t('product.manufacturing.brand'), value: product.chi_tiet_thuoc.thong_tin_san_xuat.thuong_hieu, icon: '🏷️' },
                { label: t('product.manufacturing.manufacturer'), value: product.chi_tiet_thuoc.thong_tin_san_xuat.nha_san_xuat, icon: '🏭' },
                { label: t('product.manufacturing.origin'), value: product.chi_tiet_thuoc.thong_tin_san_xuat.xuat_xu, icon: '📍' },
                { label: t('product.manufacturing.packaging'), value: product.chi_tiet_thuoc.thong_tin_san_xuat.quy_cach, icon: '📦' },
                { label: t('product.manufacturing.storage'), value: product.chi_tiet_thuoc.thong_tin_san_xuat.bao_quan, icon: '🌡️' },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-brand-50 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                    <span className="text-base font-bold text-slate-900 leading-tight">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-fade-in">
              {/* Submit review form */}
              {user && (
                <form onSubmit={handleSubmitReview} className="card p-6 space-y-4 border-brand-100">
                  <h3 className="font-display font-bold text-slate-900">Write a Review</h3>
                  {/* Star selector */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Rating</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewStars(s)}
                          className="p-0.5 transition-transform hover:scale-110"
                          aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                        >
                          <Star className={`w-7 h-7 transition-colors ${s <= reviewStars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      rows={3}
                      placeholder="Share your experience with this product..."
                      className="w-full px-4 py-3 border border-surface-border rounded-xl focus:outline-none focus:border-brand-500 text-sm resize-none"
                    />
                  </div>
                  <Button type="submit" loading={reviewSubmitting} size="sm">Submit Review</Button>
                </form>
              )}

              {/* Existing reviews */}
              {reviewsLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-slate-500 text-base py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 font-medium shadow-inner">
                  {t('product.no_reviews', { defaultValue: 'No reviews yet. Be the first to review this product.' })}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rv, i) => (
                    <div key={rv.id ?? i} className="card p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= rv.so_sao ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(rv.ngay_danh_gia || rv.date)}</span>
                      </div>
                      {rv.noi_dung && <p className="text-sm text-slate-700 leading-relaxed">{rv.noi_dung}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
