import { Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Drawer } from 'antd'
import {
  DashboardOutlined, ShoppingOutlined, AppstoreOutlined,
  OrderedListOutlined, TeamOutlined, TagOutlined, FileTextOutlined,
  SwapOutlined, AlertOutlined, UserOutlined, FileDoneOutlined,
  BankOutlined, QuestionCircleOutlined, ShoppingCartOutlined, CalendarOutlined, CarOutlined, SafetyCertificateOutlined, CrownOutlined, HistoryOutlined,
} from '@ant-design/icons'
import { Pill as PillIcon } from 'lucide-react'
const Logo = 'https://res.cloudinary.com/dc64co0el/image/upload/v1777731026/Logo_ck5ouv.svg'

import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

const { Sider } = Layout

export function AdminSidebar({ collapsed: collapsedProp, isCollapsed, onCollapse, isMobile, mobileOpen, onMobileClose }) {
  const collapsed = collapsedProp ?? isCollapsed ?? false
  const location = useLocation()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const userRole = user?.role || user?.vai_tro
  const isSuperAdmin = ['SuperAdmin', 'superadmin'].includes(userRole)

  const menuItems = [
    { key: '/admin',                icon: <DashboardOutlined />, label: <Link to="/admin">{t('admin.dashboard')}</Link> },
    {
      key: 'products-group', icon: <ShoppingOutlined />, label: t('admin.products'),
      children: [
        { key: '/admin/products',    label: <Link to="/admin/products">{t('admin.all_products')}</Link> },
        { key: '/admin/categories',  label: <Link to="/admin/categories">{t('admin.categories')}</Link> },
      ],
    },
    { key: '/admin/orders',         icon: <OrderedListOutlined />, label: <Link to="/admin/orders">Quản lý Đơn hàng</Link> },
    { key: '/admin/rma',            icon: <HistoryOutlined />,     label: <Link to="/admin/rma">Quản lý Đổi trả RMA</Link> },
    ...(['SuperAdmin', 'Admin', 'QuanLyKho', 'admin', 'manager'].includes(userRole) ? [
      { key: '/warehouse/inbound',   icon: <BankOutlined />,      label: <Link to="/warehouse/inbound">Quản lý Kho (WMS)</Link> }
    ] : []),
    { key: '/admin/vouchers',       icon: <TagOutlined />,       label: <Link to="/admin/vouchers">{t('admin.vouchers')}</Link> },
    { key: '/admin/procurement',    icon: <ShoppingCartOutlined />, label: <Link to="/admin/procurement">Mua hàng & PO</Link> },
    { key: '/admin/inventory/lots', icon: <CalendarOutlined />,     label: <Link to="/admin/inventory/lots">Quản lý Lô & FEFO</Link> },
    { key: '/admin/logistics/cod',  icon: <CarOutlined />,          label: <Link to="/admin/logistics/cod">Vận chuyển & COD</Link> },
    { key: '/admin/security/fraud-anomalies', icon: <SafetyCertificateOutlined />, label: <Link to="/admin/security/fraud-anomalies">Cảnh báo Gian lận QR</Link> },
    { key: '/admin/crm/loyalty',    icon: <CrownOutlined />,        label: <Link to="/admin/crm/loyalty">CRM & Tích điểm VIP</Link> },
    { key: '/admin/blog',           icon: <FileTextOutlined />,  label: <Link to="/admin/blog">{t('admin.blog_news')}</Link> },
    ...(isSuperAdmin ? [
      { key: '/admin/finance',        icon: <BankOutlined />,         label: <Link to="/admin/finance">Tài Chính & Công Nợ</Link> },
      { key: '/admin/staff',          icon: <TeamOutlined />,      label: <Link to="/admin/staff">{t('admin.staff_rbac')}</Link> },
      { key: '/admin/customers',      icon: <UserOutlined />,      label: <Link to="/admin/customers">{t('admin.customers')}</Link> },
    ] : []),
    { key: '/admin/prescriptions',  icon: <FileDoneOutlined />,  label: <Link to="/admin/prescriptions">{t('admin.prescriptions')}</Link> },
    { key: '/admin/help',           icon: <QuestionCircleOutlined />, label: <Link to="/admin/help">{t('admin.help')}</Link> },
  ]

  const SidebarContent = ({ collapsed }) => {
    const { pathname } = useLocation()
    const selectedKeys = [pathname]
    const openKeys = menuItems
      .filter(item => item.children?.some(c => c.key === pathname))
      .map(item => item.key)

    return (
      <div className="flex h-full flex-col">
        <div className={`flex shrink-0 items-center gap-2.5 px-4 h-16 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          <img src={Logo} alt="Logo" className={`${collapsed ? 'h-8' : 'h-10'} w-auto object-contain`} />
          {!collapsed && <span className="font-display font-bold text-brand-600 text-base">PharmaTrace VN</span>}
        </div>
        {!collapsed && (
          <div className="shrink-0 px-4 py-2 mt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('admin.sidebar_title')}</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={openKeys}
            items={menuItems}
            style={{ border: 'none', padding: '0 8px' }}
          />
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        onClose={onCollapse}
        open={!collapsed} 
        width={240}
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        <SidebarContent collapsed={false} />
      </Drawer>
    )
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={240}
      collapsedWidth={80}
      style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      theme="light"
    >
      <SidebarContent collapsed={collapsed} />
    </Sider>
  )
}

export default AdminSidebar
