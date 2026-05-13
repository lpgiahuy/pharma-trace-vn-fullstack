import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, HeartPulse, ShieldCheck, Eye, Search, MapPin, Pill, ChevronLeft, ChevronRight, Tag, Activity } from 'lucide-react'
import { productService } from '@/services/product.service'
import { blogService } from '@/services/analytics.service'
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard'
import { useCategoryStore } from '@/store/categoryStore'
import { useTranslation } from 'react-i18next'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

const FlashSaleCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 0);
      
      const difference = target.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-white">
      <span className="bg-black/20 px-2 py-1 rounded-md font-bold tabular-nums w-10 text-center">{timeLeft.hours}</span> :
      <span className="bg-black/20 px-2 py-1 rounded-md font-bold tabular-nums w-10 text-center">{timeLeft.minutes}</span> :
      <span className="bg-black/20 px-2 py-1 rounded-md font-bold tabular-nums w-10 text-center">{timeLeft.seconds}</span>
    </div>
  );
};

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const [featured, setFeatured] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [blogLoading, setBlogLoading] = useState(true)
  const [flashSaleLoading, setFlashSaleLoading] = useState(true)
  const [heroSearch, setHeroSearch] = useState('')
  const [bgSlide, setBgSlide] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeParentId, setActiveParentId] = useState(null)
  const categories = useCategoryStore(s => s.categories)

  const activeParent = categories.find(c => c.id === activeParentId)
  const displayedCategories = activeParent ? activeParent.children : categories
  const sectionTitle = activeParent 
    ? `${t('home.category_title_prefix', { defaultValue: 'Danh mục' })} ${activeParent.name}` 
    : t('home.featured_categories')

  const handleCategoryClick = (cat) => {
    if (!activeParentId && cat.children && cat.children.length > 0) {
      setActiveParentId(cat.id)
      return false // Prevent navigation to drill down
    }
    return true // Navigate to product list
  }

  const BG_SLIDES = [
    { id: 1, image: 'https://wallpapercave.com/wp/wp15262378.jpg' },
    { id: 2, image: 'https://wallpapercave.com/wp/wp13751014.jpg' },
    { id: 3, image: 'https://thumbs.dreamstime.com/z/vitamins-supplements-shelves-different-types-pharmacy-45969522.jpg' },
  ]

  const BANNERS = [
    { id: 1, title: 'Thuốc chính hãng, giao nhanh toàn quốc', cta: 'Mua ngay', to: '/products', image: 'https://wallpapercave.com/wp/wp15262378.jpg' },
    { id: 2, title: 'Vitamin & Thực phẩm bổ sung – Giảm đến 30%', cta: 'Xem ưu đãi', to: '/products', image: 'https://thumbs.dreamstime.com/z/vitamins-supplements-shelves-different-types-pharmacy-45969522.jpg' },
    { id: 3, title: 'Chăm sóc sức khỏe mẹ & bé toàn diện', cta: 'Khám phá ngay', to: '/products', image: 'https://wallpapercave.com/wp/wp13751014.jpg' },
    { id: 4, title: 'Giao hàng miễn phí – Đơn từ 500.000đ', cta: 'Mua ngay', to: '/products', image: 'https://wallpapercave.com/wp/wp15262378.jpg' },
  ]
  const slideCount = Math.ceil(BANNERS.length / 2)

  const SUGGESTIONS = ['khẩu trang', 'sữa dinh dưỡng', 'nước nhỏ mắt', 'omega 3', 'xịt chống nắng', 'probiotics', 'Mua 1 Tặng 1']

  const QUICK_LINKS = [
    { label: 'Đặt đơn thuốc', icon: Pill, to: '/account/prescriptions' },
    { label: 'Liên hệ dược sĩ', icon: HeartPulse, to: '/blog' },
    { label: 'Tìm nhà thuốc', icon: MapPin, to: '/pharmacies' },
  ]

  const ACTION_CARDS = [
    { label: 'Tư vấn mua thuốc', icon: Pill, to: '/account/prescriptions', bg: 'bg-green-100', color: 'text-green-600' },
    { label: 'Hệ thống nhà thuốc', icon: MapPin, to: '/pharmacies', bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Liên hệ dược sĩ', icon: HeartPulse, to: '/blog', bg: 'bg-teal-100', color: 'text-teal-600' },
    { label: 'Mã giảm giá riêng', icon: Tag, to: '/account/vouchers', bg: 'bg-amber-100', color: 'text-amber-600' },
    { label: 'Kiểm tra sức khỏe', icon: Activity, to: '/blog', bg: 'bg-purple-100', color: 'text-purple-600' },
  ]

  useEffect(() => {
    productService.getFeatured(20)
      .then(res => {
        const all = Array.isArray(res) ? res : []
        const seen = new Map()
        all.forEach(p => {
          const existing = seen.get(p.id)
          if (!existing || p.price < existing.price) seen.set(p.id, p)
        })
        setFeatured(Array.from(seen.values()))
      })
      .catch(err => {
        console.error('[HomePage] Failed to load featured products:', err)
        setFeatured([])
      })
      .finally(() => setLoading(false))

    setFlashSaleLoading(true)
    productService.getAll({ is_flash_sale: true, limit: 15 })
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : []
        const seen = new Map()
        all.forEach(p => {
          const existing = seen.get(p.id)
          if (!existing || p.price < existing.price) seen.set(p.id, p)
        })
        setFlashSaleProducts(Array.from(seen.values()))
      })
      .catch(err => {
        console.error('[HomePage] Failed to load flash sale products:', err)
        setFlashSaleProducts([])
      })
      .finally(() => setFlashSaleLoading(false))

    setBlogLoading(true)
    blogService.getAll({ limit: 3 })
      .then(res => setBlogs(res.data || []))
      .catch(err => console.error('[HomePage] Failed to load blogs:', err))
      .finally(() => setBlogLoading(false))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setBgSlide(s => (s + 1) % BG_SLIDES.length), 4000)
    return () => clearInterval(timer)
  }, [BG_SLIDES.length])

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % slideCount), 5000)
    return () => clearInterval(timer)
  }, [slideCount])

  const navigate = useNavigate()
  const [traceUid, setTraceUid] = useState('')

  const handleTraceEnter = (e) => {
    if (e.key === 'Enter' && traceUid.trim()) {
      navigate('/trace', { state: { uid: traceUid.trim() } })
    }
  }

  const handleHeroSearch = (e) => {
    e.preventDefault()
    if (heroSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(heroSearch.trim())}`)
    }
  }

  return (
    <div className="animate-fade-in bg-white pb-12">
      {/* Hero — background slider + search card */}
      <section className="relative overflow-hidden min-h-[360px] sm:min-h-[435px]">
        {/* Background image slides */}
        {BG_SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: i === bgSlide ? 1 : 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-brand-900/55" />

        {/* Right arrow for bg slider */}
        <button
          onClick={() => setBgSlide(s => (s + 1) % BG_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
          aria-label="Ảnh nền tiếp theo"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>

        {/* Search card — centered over background */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
          <div className="page-container pb-24 flex justify-center pointer-events-auto">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <form onSubmit={handleHeroSearch}>
                  <div className="relative flex items-center border border-slate-200 rounded-full h-12 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    placeholder="Bạn đang tìm gì hôm nay..."
                    className="flex-1 h-full pl-12 pr-4 rounded-full focus:outline-none text-slate-800 placeholder:text-slate-400 text-[15px] font-medium"
                  />
                  </div>
                </form>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                  {SUGGESTIONS.map(kw => (
                    <Link
                    key={kw}
                    to={`/products?search=${encodeURIComponent(kw)}`}
                    className="text-[13px] text-brand-500 hover:text-brand-700 hover:underline transition-colors"
                  >
                    {kw}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
                {QUICK_LINKS.map(({ label, icon: Icon, to }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 group-hover:text-brand-600 flex-1 leading-tight">{label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bg slide dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {BG_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === bgSlide ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/60'}`}
              aria-label={`Nền ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Promo banner slider — trong page-container */}
      <section className="bg-white pt-5 pb-2">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: slideCount }).map((_, slideIdx) => (
                <div key={slideIdx} className="w-full shrink-0 grid grid-cols-2 gap-3">
                  {BANNERS.slice(slideIdx * 2, slideIdx * 2 + 2).map(banner => (
                    <Link
                      key={banner.id}
                      to={banner.to}
                      className="relative rounded-xl overflow-hidden h-44 sm:h-56 group block"
                    >
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-lg line-clamp-2">{banner.title}</p>
                        <span className="text-white/80 text-xs font-semibold mt-1 inline-flex items-center gap-1 uppercase tracking-wide">
                          {banner.cta} <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {slideCount > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide(s => (s - 1 + slideCount) % slideCount)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                  aria-label="Slide trước"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  onClick={() => setCurrentSlide(s => (s + 1) % slideCount)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                  aria-label="Slide sau"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4 mb-2">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-brand-500 w-5 h-2' : 'bg-slate-300 w-2 h-2 hover:bg-slate-400'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Action cards row */}
      <section className="bg-white border-b border-slate-100 py-4">
        <div className="page-container">
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {ACTION_CARDS.map(({ label, icon: Icon, to, bg, color }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all whitespace-nowrap shrink-0 group min-w-[150px]"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 leading-tight">{label}</span>
              </Link>
            ))}
            <button className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all shrink-0 self-center ml-1">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="page-container py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {activeParentId && (
              <button 
                onClick={() => setActiveParentId(null)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-brand-50 hover:text-brand-500 transition-all border border-slate-100"
                title={t('common.back')}
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h2 className="section-title">{sectionTitle}</h2>
          </div>
          <Link to="/products" className="text-sm text-brand-500 font-black hover:underline uppercase">{t('home.view_all')}</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-8 gap-x-4">
          {displayedCategories.slice(0, 16).map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              onClick={(e) => {
                const shouldNavigate = handleCategoryClick(cat)
                if (!shouldNavigate) e.preventDefault()
              }}
              className="flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-1 group"
            >
              <CategoryIcon 
                name={cat.iconName} 
                className="w-20 h-20 bg-white border border-slate-100 shadow-sm group-hover:border-brand-200 group-hover:shadow-md"
                size={32}
              />
              <span className="text-[13px] font-bold text-slate-700 text-center leading-tight line-clamp-2">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Sale Section */}
      <section className="page-container mb-12">
        <div className="bg-medical-red rounded-2xl overflow-hidden shadow-xl shadow-medical-red/10">
          <div className="bg-medical-red px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase italic">{t('home.flash_sale')}</h2>
              <FlashSaleCountdown />
            </div>
            <Link to="/products?is_flash_sale=true" className="text-white text-xs font-black uppercase hover:underline">{t('home.low_stock')}</Link>
          </div>
          <div className="bg-white p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {flashSaleLoading 
                ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : flashSaleProducts.slice(0, 6).map(p => (
                <div key={p.id} className="flex flex-col h-full">
                  <ProductCard product={p} className="border-none shadow-none hover:shadow-none translate-y-0" />
                  <div className="mt-2 px-3">
                    <div className="h-4 bg-red-100 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-medical-red to-orange-400 w-[60%] rounded-full" />
                        <span className="absolute inset-0 text-[10px] font-black text-white flex items-center justify-center uppercase">{t('home.selling_fast')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!flashSaleLoading && flashSaleProducts.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-500 font-medium">
                  {t('home.no_flash_sale_today', { defaultValue: 'No flash sale products today.' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="page-container mb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h2 className="section-title">{t('home.recommended')}</h2>
                <div className="flex items-center gap-6">
                    {['Sức khỏe', 'Làm đẹp', 'Vitamin'].map(tab => (
                        <button key={tab} className="text-sm font-bold text-slate-400 hover:text-brand-500 transition-colors uppercase tracking-widest">{tab}</button>
                    ))}
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {loading
                        ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        : featured.slice(0, 10).map(p => <ProductCard key={p?.id || p?._id} product={p} />)
                    }
                </div>
                {!loading && featured.length > 0 && (
                    <div className="mt-12 flex justify-center">
                        <Link to="/products" className="px-12 py-3.5 bg-white border-2 border-brand-500 text-brand-600 font-black rounded-xl hover:bg-brand-50 transition-all uppercase tracking-widest text-sm shadow-xl shadow-brand-100/50">
                            {t('home.view_all')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* Health Blog Section */}
      <section className="page-container pb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">{t('home.health_handbook')}</h2>
          <Link to="/blog" className="text-sm text-brand-500 font-black hover:underline uppercase">{t('home.view_all_posts')}</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map(blog => (
            <Link key={blog.id} to={`/blog/${blog.id}`} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 card-hover group">
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-4">
                <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2 block">{blog.category || 'Sức khỏe'}</span>
              <h3 className="text-[15px] font-black text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2 leading-tight">
                {blog.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                {blog.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">{blog.author} · {new Date(blog.publishedAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                   <Eye className="w-3 h-3" /> {blog.views?.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Secure Traceability Section */}
      <section className="page-container pb-12">
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-900/20 relative group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 md:p-16">
            <div className="flex-1 text-white w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-brand-100 text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-medical-green" /> {t('home.guaranteed_authentic')}
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
                {t('home.traceability')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">{t('home.absolute_transparency')}</span>
              </h2>
              <p className="text-sm sm:text-lg text-brand-100/80 mb-6 sm:mb-10 max-w-lg leading-relaxed">
                {t('home.trace_desc')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1 relative group/input">
                    <input 
                        value={traceUid}
                        onChange={(e) => setTraceUid(e.target.value)}
                        onKeyDown={handleTraceEnter}
                        placeholder={t('home.uid_placeholder')}
                        className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-all font-mono text-sm"
                    />
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-focus-within/input:text-brand-300 transition-colors" />
                </div>
                <button 
                  onClick={() => traceUid && navigate('/trace', { state: { uid: traceUid.trim() } })}
                  className="h-12 sm:h-14 px-8 bg-medical-green hover:bg-green-600 text-white font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-green-900/20 whitespace-nowrap uppercase text-sm"
                >
                  {t('home.check_now')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              {/* Trust Badges - Wrapped for mobile */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] sm:text-[11px] font-bold text-brand-200 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> {t('home.transparency')}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> {t('home.security')}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> {t('home.tamper_proof')}</span>
              </div>
            </div>
            
            {/* QR Card - Optimized for mobile */}
            <div className="relative shrink-0 w-full sm:w-72 lg:w-80 h-auto sm:h-80 flex items-center justify-center mt-4 lg:mt-0">
                <div className="absolute inset-0 bg-white/5 rounded-3xl rotate-3 sm:rotate-6 group-hover:rotate-12 transition-transform duration-500 border border-white/10 hidden sm:block" />
                <div className="relative z-10 w-full max-w-[280px] sm:w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border-4 border-slate-50 flex items-center justify-center rounded-2xl mb-3 sm:mb-4 relative overflow-hidden group/qr">
                        <div className="text-[80px] sm:text-[120px] filter grayscale group-hover:grayscale-0 transition-all duration-500 text-brand-500">
                          <span className="material-symbols-outlined text-[100px] sm:text-[140px]">qr_code_scanner</span>
                        </div>
                        <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity">
                            <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">{t('home.scan_qr')}</span>
                        </div>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">{t('home.qr_desc')}</p>
                </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
