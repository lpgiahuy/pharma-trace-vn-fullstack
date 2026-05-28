import { Outlet, Link } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const PHARMACIST_IMG = 'https://img.freepik.com/premium-photo/man-pharmacy-with-white-coat-stands-front-shelf-with-medicines_856987-278.jpg?w=2000'

const BadgeItem = ({ icon, label }) => (
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-[18px] text-white/80">{icon}</span>
    <span className="text-xs font-semibold text-white/80 tracking-wide">{label}</span>
  </div>
)

export const AuthLayout = () => (
  <div className="min-h-screen flex">
    {/* Left panel – image + overlay */}
    <div
      className="hidden lg:flex flex-col justify-between w-[42%] relative overflow-hidden"
      style={{ backgroundImage: `url(${PHARMACIST_IMG})`, backgroundSize: 'cover', backgroundPosition: 'right top' }}
    >
      {/* Blue overlay */}
      <div className="absolute inset-0 bg-brand-700/40" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
          <span className="text-xl font-display font-bold text-white">PharmaTrace VN</span>
        </Link>

        {/* Tagline */}
        <div style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
          <h1 className="text-4xl font-display font-extrabold text-white leading-tight mb-4">
            Your trusted<br />pharmacy partner
          </h1>
          <p className="text-white/90 text-base leading-relaxed max-w-xs">
            Access certified medicines, track your orders, and manage your health with confidence.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-row items-center gap-6 border-t border-white/20 pt-6">
          <BadgeItem icon="lock" label="Secure & Encrypted" />
          <BadgeItem icon="verified" label="GMP Certified" />
          <BadgeItem icon="local_shipping" label="Fast Delivery" />
        </div>
      </div>
    </div>

    {/* Right panel – form */}
    <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
      <div className="w-full max-w-md py-6">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
          <span className="text-lg font-display font-bold text-slate-800">PharmaTrace VN</span>
        </Link>

        {/* Desktop logo (above form on right) */}
        <div className="hidden lg:block mb-8">
          <Link to="/" className="text-2xl font-display font-extrabold text-brand-600">PharmaTrace VN</Link>
        </div>

        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  </div>
)
