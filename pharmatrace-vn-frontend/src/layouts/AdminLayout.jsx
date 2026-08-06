import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { Layout, Grid } from 'antd'
import { AdminSidebar } from '@/components/shared/AdminSidebar'
import { AdminHeader } from '@/components/shared/AdminHeader'
import { PageLoader } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const { Content } = Layout
const { useBreakpoint } = Grid

export const AdminLayout = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const screens = useBreakpoint()
  
  // screens.md is true for 768px and up. If false, we are on mobile.
  const isMobile = screens.md === false

  return (
    <Layout className="min-h-screen">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={toggleSidebar} 
        isMobile={isMobile}
      />
      
      <Layout 
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? 'ml-0' : (sidebarCollapsed ? 'ml-20' : 'ml-60')
        }`}
      >
        <AdminHeader collapsed={sidebarCollapsed} onToggle={toggleSidebar} isMobile={isMobile} />
        <Content className="p-4 sm:p-6 min-h-[calc(100vh-64px)]">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  )
}
