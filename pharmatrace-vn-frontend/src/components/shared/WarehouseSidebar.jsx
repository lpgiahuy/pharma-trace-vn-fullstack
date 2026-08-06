import { Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  InboxOutlined, CheckSquareOutlined, SwapOutlined,
  DeleteOutlined, AlertOutlined, QrcodeOutlined, UserOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
const Logo = 'https://res.cloudinary.com/dc64co0el/image/upload/v1777731026/Logo_ck5ouv.svg'

const { Sider } = Layout

export const WarehouseSidebar = ({ collapsed, onCollapse }) => {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const menuItems = [
    { key: '/warehouse/inbound',    icon: <InboxOutlined />,       label: <Link to="/warehouse/inbound">{t('warehouse.inbound')}</Link> },
    { key: '/warehouse/fulfillment',icon: <CheckSquareOutlined />, label: <Link to="/warehouse/fulfillment">{t('warehouse.fulfillment')}</Link> },
    { key: '/warehouse/transfer',   icon: <SwapOutlined />,        label: <Link to="/warehouse/transfer">{t('warehouse.transfer')}</Link> },
    { key: '/warehouse/disposal',   icon: <DeleteOutlined />,      label: <Link to="/warehouse/disposal">{t('warehouse.disposal')}</Link> },
    { key: '/warehouse/recall',     icon: <AlertOutlined />,       label: <Link to="/warehouse/recall">{t('warehouse.recall')}</Link> },
    { key: '/warehouse/scanner',    icon: <QrcodeOutlined />,      label: <Link to="/warehouse/scanner">{t('warehouse.scanner')}</Link> },
    { type: 'divider' },
    { key: '/warehouse/profile',    icon: <UserOutlined />,        label: <Link to="/warehouse/profile">{t('warehouse.my_profile')}</Link> },
  ]

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
      <div className={`flex items-center gap-2.5 px-4 h-16 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
        <img src={Logo} alt="Logo" className={`${collapsed ? 'h-8' : 'h-10'} w-auto object-contain`} />
        {!collapsed && <span className="font-display font-bold text-teal-600 text-base">Warehouse</span>}
      </div>
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('warehouse.wms_portal')}</span>
        </div>
      )}
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        style={{ border: 'none', padding: '0 8px' }}
      />
    </Sider>
  )
}
