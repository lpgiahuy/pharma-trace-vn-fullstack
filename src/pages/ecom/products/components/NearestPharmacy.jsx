import { useEffect, useState } from 'react'
import { MapPin, Loader2, ChevronRight } from 'lucide-react'
import { productService } from '@/services/product.service'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function NearestPharmacy({ productId, inStock }) {
  const { t } = useTranslation()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasLocation, setHasLocation] = useState(false)

  const requestLocation = async () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Location services not available')
      toast.error('Your browser does not support geolocation')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setHasLocation(true)

        try {
          const result = await productService.getNearestPharmacy(productId, latitude, longitude)
          if (result) {
            setPharmacy(result)
            toast.success('Found nearest pharmacy')
          } else {
            setError('No nearby pharmacies with stock found')
            toast.error('No nearby pharmacies found')
          }
        } catch (err) {
          setError('Failed to find pharmacies')
          console.error(err)
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied')
          toast.error('Please enable location access')
        } else {
          setError('Unable to get location')
          toast.error('Unable to get your location')
        }
      },
      { timeout: 10000 }
    )
  }

  const openMap = () => {
    if (pharmacy) {
      const maps = `https://maps.google.com/?q=${encodeURIComponent(pharmacy.address)}`
      window.open(maps, '_blank')
    }
  }

  if (!inStock) return null

  if (pharmacy) {
    return (
      <div className="my-6 p-5 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
              {t('product.nearest_pharmacy', { defaultValue: 'Nearest Pharmacy' })}
            </p>
            <h3 className="text-lg font-bold text-slate-900 mb-1 break-words">{pharmacy.name}</h3>
            <p className="text-sm text-slate-600 mb-3 break-words">{pharmacy.address}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
                {pharmacy.distance.toFixed(1)} {pharmacy.distanceUnit}
              </div>
              <button
                onClick={openMap}
                className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                View on Map
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="my-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
        <p className="text-sm font-medium text-slate-600">{t('product.finding_pharmacy', { defaultValue: 'Finding nearest pharmacy...' })}</p>
      </div>
    )
  }

  if (error && hasLocation) {
    return (
      <div className="my-6 p-5 bg-red-50/80 rounded-2xl border border-red-200">
        <p className="text-sm font-medium text-red-600 mb-3">{error}</p>
        <button
          onClick={requestLocation}
          className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="my-6 p-5 bg-blue-50/80 rounded-2xl border border-blue-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
            {t('product.find_near_you', { defaultValue: 'Find Near You' })}
          </p>
          <p className="text-sm text-slate-700 mb-3 font-medium">
            {t('product.enable_location', { defaultValue: 'Enable location to find the nearest pharmacy with this product in stock.' })}
          </p>
          <button
            onClick={requestLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locating...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Enable Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
