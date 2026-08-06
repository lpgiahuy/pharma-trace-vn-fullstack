import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { BottomNav } from '@/components/shared/BottomNav'
import { CartDrawer } from '@/components/shared/CartDrawer'
import { ChatbotWidget } from '@/components/shared/ChatbotWidget'
import { PageLoader } from '@/components/ui/Spinner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export const MainLayout = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <Header />
    <main className="flex-1">
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </main>
    <Footer />
    <BottomNav />
    <CartDrawer />
    <ChatbotWidget />
  </div>
)
