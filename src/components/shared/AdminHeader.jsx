import { Layout, Dropdown } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, MenuOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useTranslation } from 'react-i18next'

const { Header } = Layout

export const AdminHeader = ({ collapsed, onToggle, portal = 'Admin', isMobile }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en'
  const toggleLang = () => i18n.changeLanguage(currentLang === 'vi' ? 'en' : 'vi')

  const menuItems = [
    { key: 'profile', label: t('admin.my_profile'), onClick: () => navigate('/account') },
    { key: 'store',   label: t('admin.back_to_store'), onClick: () => navigate('/') },
    { type: 'divider' },
    { key: 'logout',  label: <span className="text-red-500">{t('admin.sign_out')}</span>, onClick: logout },
  ]

  return (
    <Header
      style={{
        background: '#fff',
        padding: isMobile ? '0 16px' : '0 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 99,
      }}
    >
      <button onClick={onToggle} className="p-2 rounded-lg hover:bg-slate-100 transition-colors mr-2 sm:mr-4 text-slate-600">
        {isMobile
          ? <MenuOutlined style={{ fontSize: 18 }} />
          : (collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />)
        }
      </button>

      <span className="text-sm font-medium text-slate-400 truncate max-w-[100px] sm:max-w-none">
        {portal} Portal
      </span>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          title={currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-xs font-semibold text-slate-600 select-none"
        >
          <span className="text-base leading-none">
            {currentLang === 'vi' ? '🇻🇳' : '🇺🇸'}
          </span>
          <span>{currentLang === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <BellOutlined style={{ fontSize: 18 }} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button className="flex items-center gap-2 py-1 px-1.5 sm:px-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-700 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
          </button>
        </Dropdown>
      </div>
    </Header>
  )
}
