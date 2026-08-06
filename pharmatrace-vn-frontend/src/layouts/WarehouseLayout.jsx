import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { Layout } from 'antd'
import { WarehouseSidebar } from '@/components/shared/WarehouseSidebar'
import { AdminHeader } from '@/components/shared/AdminHeader'
import { PageLoader } from '@/components/ui/Spinner'
import { useUIStore } from '@/store/uiStore'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

const { Content } = Layout

export const WarehouseLayout = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <Layout className="min-h-screen">
      <WarehouseSidebar collapsed={sidebarCollapsed} onCollapse={toggleSidebar} />
      <Layout className={`transition-all duration-200 ${sidebarCollapsed ? 'ml-20' : 'ml-60'}`}>
        <AdminHeader collapsed={sidebarCollapsed} onToggle={toggleSidebar} portal="Warehouse" />
        <Content className="p-6 min-h-[calc(100vh-64px)]">
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
