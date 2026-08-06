import { useState } from 'react'
import { Collapse, Input } from 'antd'

const { Panel } = Collapse

const Icon = ({ name, filled = false, className = '' }) => (
  <span
    className={`material-symbols-outlined select-none leading-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
  >
    {name}
  </span>
)

const FEATURE_CARDS = [
  { icon: 'dashboard',       color: 'text-blue-600 bg-blue-50',     title: 'Tổng quan (Dashboard)',   desc: 'Xem thống kê doanh thu, đơn hàng, tồn kho và biểu đồ phân tích theo thời gian thực.' },
  { icon: 'inventory_2',     color: 'text-emerald-600 bg-emerald-50', title: 'Quản lý sản phẩm',       desc: 'Thêm, sửa, xóa sản phẩm; quản lý danh mục, đơn vị tính và hình ảnh.' },
  { icon: 'shopping_bag',    color: 'text-orange-600 bg-orange-50',  title: 'Quản lý đơn hàng',        desc: 'Theo dõi trạng thái đơn hàng, xử lý yêu cầu hoàn trả (RMA) và in phiếu giao hàng.' },
  { icon: 'manage_accounts', color: 'text-violet-600 bg-violet-50',  title: 'Nhân viên & Phân quyền',  desc: 'Tạo tài khoản nhân viên, phân vai trò Admin / Manager / Warehouse.' },
  { icon: 'assignment',      color: 'text-pink-600 bg-pink-50',      title: 'Đơn thuốc',               desc: 'Xem xét và phê duyệt đơn thuốc do khách hàng tải lên trước khi giao hàng.' },
  { icon: 'local_offer',     color: 'text-yellow-600 bg-yellow-50',  title: 'Voucher & Khuyến mãi',    desc: 'Tạo mã giảm giá, đặt điều kiện áp dụng và theo dõi lượt sử dụng.' },
  { icon: 'article',         color: 'text-cyan-600 bg-cyan-50',      title: 'Blog & Tin tức',           desc: 'Đăng bài viết y tế, tin tức dược phẩm với trình soạn thảo văn bản phong phú.' },
  { icon: 'business',        color: 'text-slate-600 bg-slate-100',   title: 'Chi nhánh & Kho',          desc: 'Quản lý danh sách nhà thuốc, kho hàng và địa điểm trong hệ thống.' },
]

const WAREHOUSE_CARDS = [
  { icon: 'move_to_inbox', label: 'Nhập kho',  path: '/warehouse/inbound',     color: 'text-blue-600 bg-blue-50' },
  { icon: 'outbox',        label: 'Xuất kho',  path: '/warehouse/fulfillment', color: 'text-emerald-600 bg-emerald-50' },
  { icon: 'sync_alt',      label: 'Chuyển kho',path: '/warehouse/transfer',    color: 'text-orange-600 bg-orange-50' },
  { icon: 'delete',        label: 'Huỷ lô',    path: '/warehouse/disposal',    color: 'text-red-600 bg-red-50' },
  { icon: 'recycling',     label: 'Thu hồi',   path: '/warehouse/recall',      color: 'text-yellow-600 bg-yellow-50' },
  { icon: 'qr_code_scanner', label: 'Quét QR', path: '/warehouse/scanner',     color: 'text-violet-600 bg-violet-50' },
]

const FAQS = [
  {
    category: 'Tài khoản & Phân quyền',
    badge: 'bg-blue-100 text-blue-700',
    items: [
      { q: 'Làm sao thêm nhân viên mới?', a: 'Vào Nhân viên & Phân quyền → nhấn "+ Thêm nhân viên" → nhập email, họ tên và chọn vai trò (Admin / Manager / Warehouse). Hệ thống sẽ gửi email kích hoạt tài khoản tự động.' },
      { q: 'Sự khác biệt giữa vai trò Admin và Manager là gì?', a: 'Admin có toàn quyền kể cả tạo/xóa tài khoản nhân viên. Manager có thể quản lý sản phẩm, đơn hàng, blog nhưng không thể tạo tài khoản mới hay thay đổi phân quyền.' },
      { q: 'Tôi quên mật khẩu, phải làm gì?', a: 'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email và kiểm tra hộp thư để nhận link đặt lại mật khẩu (hiệu lực 30 phút).' },
    ],
  },
  {
    category: 'Sản phẩm & Kho hàng',
    badge: 'bg-emerald-100 text-emerald-700',
    items: [
      { q: 'Làm sao thêm sản phẩm mới?', a: 'Vào Quản lý sản phẩm → nhấn "+ Thêm sản phẩm" → điền đầy đủ thông tin: tên, danh mục, giá, số lượng, hình ảnh. Sản phẩm chỉ hiển thị trên web khi trạng thái là "Đang bán".' },
      { q: 'Cảnh báo tồn kho thấp hoạt động như thế nào?', a: 'Dashboard tự động hiển thị danh sách sản phẩm có số lượng ≤ 10. Bạn có thể cập nhật ngưỡng cảnh báo trong phần cài đặt của từng sản phẩm.' },
      { q: 'Làm sao nhập hàng vào kho?', a: 'Vào phân hệ Kho hàng → Nhập kho → chọn sản phẩm và điền số lô (batch), hạn sử dụng, số lượng. Mỗi lô sẽ được gán mã QR riêng để truy xuất nguồn gốc.' },
    ],
  },
  {
    category: 'Đơn hàng & RMA',
    badge: 'bg-orange-100 text-orange-700',
    items: [
      { q: 'Luồng xử lý đơn hàng như thế nào?', a: 'Đơn hàng đi qua các bước: Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn thành / Đã hủy. Mỗi bước bạn có thể cập nhật thủ công hoặc hệ thống tự chuyển khi tích hợp vận chuyển.' },
      { q: 'Xử lý yêu cầu hoàn trả (RMA) như thế nào?', a: 'Vào Đơn hàng → RMA → xem yêu cầu của khách → chọn "Chấp thuận" hoặc "Từ chối" kèm lý do. Khi chấp thuận, hệ thống sẽ tạo phiếu hoàn tiền và cập nhật tồn kho.' },
    ],
  },
  {
    category: 'Truy xuất nguồn gốc',
    badge: 'bg-violet-100 text-violet-700',
    items: [
      { q: 'Hệ thống truy xuất nguồn gốc hoạt động ra sao?', a: 'Mỗi lô sản phẩm được gán mã QR duy nhất. Khi quét mã tại trang /trace, khách hàng thấy toàn bộ hành trình: nhà sản xuất → nhập kho → xuất kho → giao hàng.' },
      { q: 'Làm sao in mã QR cho lô hàng?', a: 'Vào Kho hàng → Quét QR → chọn lô hàng → nhấn "In mã QR". Mã QR sẽ được xuất dưới dạng PDF sẵn sàng in nhãn.' },
    ],
  },
]

export default function AdminHelpPage() {
  const [search, setSearch] = useState('')

  const filtered = FAQS.map(group => ({
    ...group,
    items: group.items.filter(
      item =>
        search === '' ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 px-8 py-10 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Icon name="help" filled className="text-3xl text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Trợ giúp & Hướng dẫn</h1>
            <p className="mt-1 text-sm text-blue-100">
              Tìm hiểu cách sử dụng PharmaTrace VN Admin — quản lý dược phẩm thông minh, an toàn.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Input
            size="large"
            placeholder="Tìm kiếm hướng dẫn, câu hỏi thường gặp..."
            prefix={<Icon name="search" className="text-slate-400 text-xl mr-1" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl"
            allowClear
          />
        </div>
      </div>

      {/* Feature Cards */}
      {search === '' && (
        <>
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <Icon name="menu_book" className="text-base" /> Tính năng Admin
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_CARDS.map(card => (
                <div key={card.title} className="card flex gap-3 p-4 hover:shadow-md transition-shadow cursor-default">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon name={card.icon} filled className="text-2xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{card.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              <Icon name="warehouse" className="text-base" /> Phân hệ Kho hàng
            </h2>
            <div className="card p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {WAREHOUSE_CARDS.map(wc => (
                  <a key={wc.label} href={wc.path} className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-3 text-center hover:bg-slate-50 transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${wc.color}`}>
                      <Icon name={wc.icon} filled className="text-xl" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{wc.label}</span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                * Truy cập phân hệ kho tại <code className="rounded bg-slate-100 px-1">/warehouse</code>. Yêu cầu vai trò Warehouse, Manager hoặc Admin.
              </p>
            </div>
          </div>

          {/* Traceability */}
          <div className="card flex items-center gap-4 p-5 border border-brand-100 bg-brand-50/40">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Icon name="qr_code_scanner" filled className="text-2xl text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-700">Truy xuất nguồn gốc (PharmaTrace)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Khách hàng quét mã QR để tra cứu hành trình lô thuốc. Trang công khai tại{' '}
                <code className="rounded bg-white px-1 text-brand-600">/trace</code>.
              </p>
            </div>
            <a href="/trace" target="_blank" rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
              Xem thử <Icon name="open_in_new" className="text-sm" />
            </a>
          </div>
        </>
      )}

      {/* FAQ */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          <Icon name="forum" className="text-base" /> Câu hỏi thường gặp
        </h2>

        {filtered.length === 0 ? (
          <div className="card py-14 text-center">
            <Icon name="search_off" className="text-5xl text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-500">Không tìm thấy kết quả cho "{search}"</p>
            <p className="mt-1 text-sm text-slate-400">Thử từ khóa khác hoặc liên hệ bộ phận hỗ trợ bên dưới.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(group => (
              <div key={group.category} className="card overflow-hidden p-0">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${group.badge}`}>
                    {group.category}
                  </span>
                </div>
                <Collapse ghost>
                  {group.items.map((item, idx) => (
                    <Panel key={idx} header={<span className="text-sm font-medium text-slate-800">{item.q}</span>} className="border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-600 leading-relaxed pb-1">{item.a}</p>
                    </Panel>
                  ))}
                </Collapse>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      {search === '' && (
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
            <Icon name="contact_support" filled className="text-xl text-brand-500" /> Vẫn cần hỗ trợ?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <ContactCard icon="mail" title="Email hỗ trợ" value="support@pharmatrace.vn" sub="Phản hồi trong 24h làm việc" />
            <ContactCard icon="chat_bubble" title="Zalo OA" value="PharmaTrace VN" sub="Hỗ trợ nhanh 8:00 – 17:00" />
            <ContactCard icon="phone_in_talk" title="Hotline" value="1800 1234" sub="Miễn phí, T2 – T7" />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Khi liên hệ vui lòng cung cấp tên tài khoản và mô tả ngắn gọn vấn đề để được hỗ trợ nhanh nhất.
          </p>
        </div>
      )}
    </div>
  )
}

function ContactCard({ icon, title, value, sub }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-600 bg-brand-50">
        <Icon name={icon} filled className="text-xl" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="font-semibold text-slate-800 text-sm">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  )
}
