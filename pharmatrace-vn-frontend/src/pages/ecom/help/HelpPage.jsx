import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Collapse } from 'antd'

const { Panel } = Collapse

const Icon = ({ name, filled = false, className = '' }) => (
  <span
    className={`material-symbols-outlined select-none leading-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
  >
    {name}
  </span>
)

const QUICK_ACTIONS = [
  {
    icon: 'package_2',
    label: 'Theo dõi đơn hàng',
    desc: 'Kiểm tra trạng thái & lịch sử đơn',
    to: '/account/orders',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    icon: 'assignment_return',
    label: 'Yêu cầu đổi trả',
    desc: 'Gửi yêu cầu hoàn trả sản phẩm',
    to: '/account/rma',
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
  {
    icon: 'medical_services',
    label: 'Đơn thuốc của tôi',
    desc: 'Xem & tải lên đơn thuốc',
    to: '/account/prescriptions',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: 'qr_code_scanner',
    label: 'Tra cứu nguồn gốc',
    desc: 'Quét QR xem hành trình lô thuốc',
    to: '/trace',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
]

const FAQS = [
  {
    icon: 'shopping_bag',
    category: 'Đặt hàng & Thanh toán',
    color: 'text-blue-600 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    items: [
      {
        q: 'Làm sao đặt hàng trực tuyến?',
        a: 'Chọn sản phẩm → thêm vào giỏ hàng → nhấn "Thanh toán" → nhập địa chỉ giao hàng và chọn phương thức thanh toán → xác nhận đơn hàng. Bạn sẽ nhận email xác nhận ngay sau đó.',
      },
      {
        q: 'Những phương thức thanh toán nào được hỗ trợ?',
        a: 'Hiện tại chúng tôi hỗ trợ: Thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví điện tử MoMo và VNPay. Tất cả giao dịch trực tuyến đều được mã hóa bảo mật.',
      },
      {
        q: 'Tôi có thể hủy đơn hàng sau khi đặt không?',
        a: 'Bạn có thể hủy đơn khi trạng thái còn là "Chờ xác nhận". Vào Đơn hàng của tôi → chọn đơn → nhấn "Hủy đơn". Sau khi đơn đã được xác nhận, vui lòng liên hệ hotline để được hỗ trợ.',
      },
      {
        q: 'Tôi có thể mua hàng không cần đăng nhập không?',
        a: 'Một số sản phẩm không kê đơn có thể xem và thêm vào giỏ mà không cần tài khoản, nhưng bạn cần đăng nhập để hoàn tất đặt hàng và theo dõi đơn hàng.',
      },
    ],
  },
  {
    icon: 'local_shipping',
    category: 'Giao hàng & Vận chuyển',
    color: 'text-emerald-600 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    items: [
      {
        q: 'Thời gian giao hàng dự kiến là bao lâu?',
        a: 'Nội thành TP.HCM & Hà Nội: 2–4 giờ (giao nhanh) hoặc 1–2 ngày. Tỉnh thành khác: 2–5 ngày làm việc. Thời gian có thể thay đổi tùy khu vực và thời điểm cao điểm.',
      },
      {
        q: 'Phí vận chuyển được tính như thế nào?',
        a: 'Miễn phí vận chuyển cho đơn từ 299.000đ trở lên (nội thành). Đơn dưới 299.000đ tính phí 30.000đ–50.000đ tùy khoảng cách. Giao hàng tỉnh theo biểu phí của đơn vị vận chuyển.',
      },
      {
        q: 'Làm sao theo dõi đơn hàng đang giao?',
        a: 'Vào tài khoản → Đơn hàng của tôi → chọn đơn hàng cần theo dõi. Bạn sẽ thấy trạng thái cập nhật theo thời gian thực. Ngoài ra hệ thống gửi SMS/email thông báo mỗi khi trạng thái thay đổi.',
      },
    ],
  },
  {
    icon: 'assignment_return',
    category: 'Đổi trả & Hoàn tiền',
    color: 'text-orange-600 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    items: [
      {
        q: 'Điều kiện để được đổi trả hàng?',
        a: 'Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng khi: sản phẩm còn nguyên vẹn, chưa khui, còn hạn sử dụng; sản phẩm bị lỗi sản xuất hoặc giao sai hàng. Riêng thuốc kê đơn không áp dụng đổi trả theo quy định.',
      },
      {
        q: 'Hoàn tiền mất bao lâu?',
        a: 'Sau khi yêu cầu đổi trả được duyệt: ví điện tử hoàn tiền trong 1–2 ngày, chuyển khoản ngân hàng trong 3–5 ngày làm việc, COD hoàn qua chuyển khoản ngân hàng trong 5–7 ngày.',
      },
      {
        q: 'Làm sao gửi yêu cầu đổi trả?',
        a: 'Vào tài khoản → Yêu cầu đổi trả → chọn đơn hàng → chọn sản phẩm cần đổi/trả → chọn lý do và tải ảnh minh chứng → gửi yêu cầu. Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24h.',
      },
    ],
  },
  {
    icon: 'medication',
    category: 'Thuốc kê đơn',
    color: 'text-pink-600 bg-pink-50',
    badge: 'bg-pink-100 text-pink-700',
    items: [
      {
        q: 'Làm sao mua thuốc kê đơn?',
        a: 'Thêm sản phẩm vào giỏ → tại bước thanh toán, hệ thống yêu cầu tải lên đơn thuốc từ bác sĩ. Dược sĩ của chúng tôi sẽ xem xét và xác nhận trong vòng 30 phút trong giờ làm việc trước khi đơn hàng được xử lý.',
      },
      {
        q: 'Đơn thuốc cần có những thông tin gì?',
        a: 'Đơn thuốc hợp lệ cần có: tên bác sĩ và chữ ký, tên bệnh nhân, tên thuốc & liều dùng, ngày kê đơn (không quá 6 tháng). Bạn có thể tải ảnh chụp hoặc file PDF.',
      },
    ],
  },
  {
    icon: 'qr_code_scanner',
    category: 'Truy xuất nguồn gốc',
    color: 'text-violet-600 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    items: [
      {
        q: 'Làm sao kiểm tra nguồn gốc sản phẩm?',
        a: 'Quét mã QR trên bao bì sản phẩm bằng camera điện thoại hoặc truy cập /trace và nhập mã lô. Hệ thống hiển thị toàn bộ hành trình từ nhà sản xuất đến tay bạn.',
      },
      {
        q: 'Thông tin nào được hiển thị khi tra cứu?',
        a: 'Bạn sẽ thấy: nhà sản xuất & địa chỉ, ngày sản xuất & hạn sử dụng, số lô, hành trình nhập kho → xuất kho → giao hàng, kết quả kiểm định chất lượng (nếu có).',
      },
    ],
  },
]

export default function CustomerHelpPage() {
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-500 text-white">
        <div className="page-container py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Icon name="support_agent" filled className="text-4xl text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Trung tâm trợ giúp</h1>
          <p className="mt-2 text-blue-100">Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <Icon name="search" className="text-slate-400 text-xl" />
              <input
                type="text"
                placeholder="Tìm câu hỏi, từ khóa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <Icon name="close" className="text-slate-400 text-xl hover:text-slate-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-10 space-y-10">
        {/* Quick Actions */}
        {search === '' && (
          <div>
            <h2 className="mb-4 text-base font-bold text-slate-700 flex items-center gap-2">
              <Icon name="bolt" filled className="text-brand-500 text-xl" />
              Truy cập nhanh
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map(action => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${action.color}`}
                >
                  <Icon name={action.icon} filled className="text-4xl" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 className="mb-4 text-base font-bold text-slate-700 flex items-center gap-2">
            <Icon name="help" filled className="text-brand-500 text-xl" />
            Câu hỏi thường gặp
          </h2>

          {filtered.length === 0 ? (
            <div className="card py-16 text-center">
              <Icon name="search_off" className="text-slate-300 text-5xl mx-auto mb-3" />
              <p className="font-medium text-slate-500">Không tìm thấy kết quả cho "{search}"</p>
              <p className="mt-1 text-sm text-slate-400">Thử từ khóa khác hoặc liên hệ hỗ trợ bên dưới.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(group => (
                <div key={group.category} className="card overflow-hidden p-0">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${group.color}`}>
                      <Icon name={group.icon} filled className="text-xl" />
                    </div>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${group.badge}`}>
                      {group.category}
                    </span>
                  </div>
                  <Collapse ghost>
                    {group.items.map((item, idx) => (
                      <Panel
                        key={idx}
                        header={<span className="text-sm font-medium text-slate-800">{item.q}</span>}
                        className="border-b border-slate-50 last:border-0"
                      >
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
            <h2 className="mb-1 font-bold text-slate-800 flex items-center gap-2">
              <Icon name="contact_support" filled className="text-brand-500 text-xl" />
              Vẫn cần hỗ trợ?
            </h2>
            <p className="mb-5 text-sm text-slate-500">Đội ngũ dược sĩ & chăm sóc khách hàng luôn sẵn sàng.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ContactItem icon="phone_in_talk" title="Hotline (miễn phí)" value="1800 6821" sub="T2 – T7, 8:00 – 20:00" color="text-emerald-600 bg-emerald-50" />
              <ContactItem icon="chat_bubble" title="Chat trực tuyến" value="Zalo OA" sub="Phản hồi trong 5 phút" color="text-blue-600 bg-blue-50" />
              <ContactItem icon="mail" title="Email hỗ trợ" value="support@pharmatrace.vn" sub="Phản hồi trong 24h" color="text-violet-600 bg-violet-50" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactItem({ icon, title, value, sub, color }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
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
