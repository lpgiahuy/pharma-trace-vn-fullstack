import { useEffect, useState } from 'react'
import { wishlistService } from '@/services/wishlist.service'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { 
    wishlistService.getMine().then(setProducts).finally(() => setLoading(false)) 
  }, [])
  return (
    <div className="page-container py-8 animate-fade-in">
      <h1 className="section-title mb-6">My Wishlist</h1>
      {!loading && products.length === 0
        ? <EmptyState icon={Heart} title="Wishlist is empty" description="Save products you love for later." />
        : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
    </div>
  )
}
