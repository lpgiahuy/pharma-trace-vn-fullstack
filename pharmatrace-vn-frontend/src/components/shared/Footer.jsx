import { Link } from 'react-router-dom'
import { Pill, Facebook, Youtube, Phone, Mail, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Footer = () => {
  const { t, i18n } = useTranslation()
  
  return (
    <footer className="bg-brand-500 text-white mt-auto overflow-hidden">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* About */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <Pill className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <span className="text-white font-display font-black text-2xl block leading-none">PharmaTrace VN</span>
                <span className="text-[10px] text-white font-black tracking-widest uppercase">Health & Care</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white font-medium max-w-xs">
              {t('footer.about_text')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-brand-500 transition-all">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-medical-red hover:text-white transition-all">
                <Youtube className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 relative inline-block">
              {t('footer.products')}
            </h4>
            <ul className="space-y-4 text-[13px] font-bold text-white">
              {[
                { label: 'Thực phẩm chức năng', en: 'Dietary Supplements' },
                { label: 'Thuốc không kê đơn', en: 'OTC Medicines' },
                { label: 'Chăm sóc cá nhân', en: 'Personal Care' },
                { label: 'Dược mỹ phẩm', en: 'Cosmeceuticals' },
                { label: 'Thiết bị y tế', en: 'Medical Devices' },
                { label: 'Sản phẩm cho bé', en: 'Baby Products' }
              ].map(item => (
                <li key={item.en}>
                  <Link to="/products" className="hover:text-green-300 transition-all flex items-center hover:translate-x-1 duration-300">
                    {i18n.language?.startsWith('en') ? item.en : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 relative inline-block">
              {t('footer.customer_support')}
            </h4>
            <ul className="space-y-4 text-[13px] font-bold text-white">
              {[
                { label: 'Đơn hàng của tôi', en: 'My Orders' },
                { label: 'Chính sách đổi trả', en: 'Returns Policy' },
                { label: 'Giao hàng - Thanh toán', en: 'Shipping & Payment' },
                { label: 'Blog sức khỏe', en: 'Health Blog' },
                { label: 'Câu hỏi thường gặp', en: 'FAQs', to: '/help' },
                { label: 'Tra cứu nguồn gốc', en: 'Product Traceability', to: '/trace' }
              ].map(item => (
                <li key={item.en}>
                  <Link to={item.to ?? '#'} className="hover:text-green-300 transition-all flex items-center hover:translate-x-1 duration-300">
                    {i18n.language?.startsWith('en') ? item.en : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 relative inline-block">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                  <Phone className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-white/70 text-[10px] uppercase font-black tracking-tighter">{t('footer.free_hotline')}</p>
                  <p className="text-white font-black text-lg leading-none">1800 6821</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                      <Mail className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                      <p className="text-white/70 text-[10px] uppercase font-black tracking-tighter">{t('footer.email_support')}</p>
                      <p className="text-white font-black text-sm">support@pharmatrace.vn</p>
                  </div>
              </li>
              <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                      <MapPin className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                      <p className="text-white/70 text-[10px] uppercase font-black tracking-tighter">{t('footer.head_office')}</p>
                      <p className="text-white font-black text-sm">{i18n.language?.startsWith('en') ? 'Ho Chi Minh City' : 'TP. Hồ Chí Minh'}</p>
                  </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-brand-600 py-6 border-t border-white/10">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-black text-white uppercase tracking-[0.2em]">
          <p>{t('footer.copyright')}</p>
          <div className="flex gap-8">
            <Link to="#" className="hover:text-green-300 transition-colors">{t('footer.privacy')}</Link>
            <Link to="#" className="hover:text-green-300 transition-colors">{t('footer.terms')}</Link>
            <Link to="#" className="hover:text-green-300 transition-colors">{t('footer.license')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

