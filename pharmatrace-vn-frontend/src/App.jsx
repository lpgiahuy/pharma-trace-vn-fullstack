import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { useAuth } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useCartStore } from '@/store/cartStore'
import { Spinner } from '@/components/ui/Spinner'
import { authService } from '@/services/auth.service'
import { getPortalKey } from '@/utils/portalAuth'

export default function App() {
  const { isAuthenticated, updateUser, logout } = useAuth()
  const { globalLoading } = useUIStore()
  const { pathname } = useLocation()

  // Scroll to top when pathname changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!isAuthenticated) return
    const portal = getPortalKey(pathname)

    authService.getProfile()
      .then(user => { if (user) updateUser(user) })
      .catch((err) => {
        if (err.response?.status === 401) {
          logout()
        }
      })
    
    // Sync cart from server ONLY on customer portal
    if (portal === 'customer') {
      useCartStore.getState().fetchCart()
    }
  }, [isAuthenticated, pathname])

  return (
    <>
      {globalLoading && <Spinner fullScreen />}
      <AppRoutes />
    </>
  )
}

