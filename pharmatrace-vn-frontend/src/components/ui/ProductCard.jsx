import { useState, memo } from 'react'
import PropTypes from 'prop-types'
import { Heart, ShoppingCart, Star, Plus, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn, formatCurrency } from '@/utils'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { wishlistService } from '@/services/wishlist.service'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

export const ProductCard = memo(({ product, className }) => {
  const { t } = useTranslation()
  const addItem = useCartStore(s => s.addItem)
  const user = useAuthStore(s => s.user)
  
  const [isFavorite, setIsFavorite] = useState(product.isFavorited)
  const [isToggling, setIsToggling] = useState(false)

  const discount = product.discount || (product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0)

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Could show a login modal here, but for now just console log
      console.warn('Please login to add to favorites')
      return
    }

    if (isToggling) return
    
    setIsToggling(true)
    // Optimistic UI update
    const previousState = isFavorite
    setIsFavorite(!previousState)
    
    try {
      const result = await wishlistService.toggle(product.id)
      setIsFavorite(result.isFavorited)
    } catch (error) {
      console.error('Failed to toggle favorite', error)
      setIsFavorite(previousState) // revert on error
    } finally {
      setIsToggling(false)
    }
  }

  // Format currency without double symbols
  const formattedPrice = formatCurrency(product.price)
  
  return (
    <article 
      className={cn('bg-slate-50/50 rounded-2xl overflow-hidden card-hover border border-slate-100 flex flex-col h-full group pb-3', className)}
    >
      <Link 
        to={`/products/${product.id}`} 
        className="relative block overflow-hidden aspect-square bg-white m-2 rounded-xl border border-slate-50"
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10" aria-label="Product highlights">
          {discount > 0 && (
            <span className="bg-medical-red text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 z-10">
            <div className="bg-brand-500 text-white flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full shadow-sm">
                <div className="w-5 h-5 rounded-full bg-medical-green flex items-center justify-center font-black text-[10px] text-white shrink-0">P</div>
                <span className="text-[11px] font-black leading-none uppercase">PharmaTrace VN</span>
            </div>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
            <span className="bg-slate-800/90 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{t('product.out_of_stock')}</span>
          </div>
        )}

        <button 
          onClick={handleToggleFavorite}
          disabled={isToggling}
          aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isFavorite}
          className={cn(
            "absolute bottom-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-white active:scale-90 disabled:opacity-50",
            isFavorite ? "text-medical-red" : "text-slate-300 opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart className={cn("w-4 h-4 transition-colors", isFavorite && "fill-current")} />
        </button>
      </Link>

      <div className="px-3 flex flex-col flex-1">
        <div className="mb-2">
            <div className="inline-flex items-center gap-1 bg-medical-orange text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-lg shadow-sm">
                <Truck className="w-3 sm:w-3.5 h-3 sm:h-3.5" aria-hidden="true" />
                <span>{t('product.free_fast_delivery')}</span>
            </div>
        </div>

        <Link to={`/products/${product.id}`} className="block mb-2">
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-slate-700 line-clamp-2 leading-[1.4] min-h-[40px] group-hover:text-brand-500 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto mb-3" aria-label={`Price: ${product.price} Dong per ${product.unit}`}>
          <div className="flex flex-wrap items-baseline gap-x-1 font-black text-slate-900 leading-none">
            <span className="text-base sm:text-lg">
              {formattedPrice}
            </span>
            <span className="text-sm sm:text-base text-slate-500 font-bold">
              /{t(`product.unit.${product.unit?.toLowerCase()}`, { defaultValue: product.unit || t('product.unit.product') })}
            </span>
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-medium" aria-label={`Original price: ${product.originalPrice} Dong`}>
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!product.inStock}
          aria-label={product.inStock ? `${t('product.select_buy')} ${product.name}` : t('product.out_of_stock')}
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
          }}
          className={cn(
            "w-full h-9 sm:h-11 rounded-xl border-2 flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 shadow-sm font-bold text-xs sm:text-sm",
            product.inStock 
              ? "bg-white border-brand-500 text-brand-600 hover:bg-brand-50 active:scale-[0.98]" 
              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5" aria-hidden="true" />
          <span>{t('product.select_buy')}</span>
        </button>
      </div>
    </article>
  )
})

ProductCard.displayName = 'ProductCard'

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    unit: PropTypes.string,
    inStock: PropTypes.bool,
    isPrescription: PropTypes.bool,
    isFavorited: PropTypes.bool,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    soldCount: PropTypes.number,
  }).isRequired,
  className: PropTypes.string,
}

export const ProductCardSkeleton = memo(() => (
  <div 
    className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-2 flex flex-col gap-3"
    aria-hidden="true"
  >
    <div className="aspect-square bg-white rounded-xl skeleton shadow-sm" />
    <div className="px-1 flex flex-col gap-3">
      <div className="skeleton h-4 w-1/3 rounded-full opacity-60" />
      <div className="skeleton h-5 w-full rounded" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-6 w-1/2 rounded-lg mt-1" />
      <div className="skeleton h-11 w-full rounded-xl mt-1" />
    </div>
  </div>
))

ProductCardSkeleton.displayName = 'ProductCardSkeleton'
