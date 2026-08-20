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
    label: 'Track Orders',
    desc: 'Check order status & shipment history',
    to: '/account/orders',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    icon: 'assignment_return',
    label: 'Return & Refund',
    desc: 'Submit return request & claim warranty',
    to: '/account/rma',
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
  {
    icon: 'medical_services',
    label: 'My Prescriptions',
    desc: 'View & upload doctor prescriptions',
    to: '/account/prescriptions',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    icon: 'qr_code_scanner',
    label: 'Batch Traceability',
    desc: 'Scan QR to view batch supply chain journey',
    to: '/trace',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
]

const FAQS = [
  {
    icon: 'shopping_bag',
    category: 'Orders & Payments',
    color: 'text-blue-600 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    items: [
      {
        q: 'How do I place an order online?',
        a: 'Select products → add to cart → click "Checkout" → enter delivery address and select payment method → confirm order. You will receive an immediate confirmation notification.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We support Cash on Delivery (COD), Direct Bank Transfer, and secure digital payment gateways (MoMo & VNPay). All online transactions are end-to-end encrypted.',
      },
      {
        q: 'Can I cancel an order after placing it?',
        a: 'You can cancel while the status is still "Pending". Navigate to My Orders → select order → click "Cancel Order". If the order is already packed or shipped, please contact our hotline.',
      },
      {
        q: 'Can I purchase without an account?',
        a: 'You can browse OTC products freely, but an authenticated account is required to place orders, upload prescriptions, and track live deliveries.',
      },
    ],
  },
  {
    icon: 'local_shipping',
    category: 'Shipping & Delivery',
    color: 'text-emerald-600 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    items: [
      {
        q: 'What is the estimated delivery time?',
        a: 'Urban metro areas (HCMC & Hanoi): 2–4 hours (express) or 1–2 business days. Other provinces: 2–5 business days depending on geographical location.',
      },
      {
        q: 'How are shipping fees calculated?',
        a: 'Enjoy Free Shipping on qualifying orders over 500,000₫. Standard flat-rate shipping is 30,000₫–50,000₫ based on distance and package weight.',
      },
      {
        q: 'How do I track my active delivery?',
        a: 'Go to Account → My Orders → select the order. You will see real-time logistics milestones and courier tracking status.',
      },
    ],
  },
  {
    icon: 'assignment_return',
    category: 'Returns & Refunds',
    color: 'text-orange-600 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    items: [
      {
        q: 'What are the return policy terms?',
        a: 'Products can be returned within 7 days of delivery if unopened, with tamper seals intact, or in case of verified defects/wrong items. Per health regulations, opened prescription medicines cannot be returned.',
      },
      {
        q: 'How long do refunds take to process?',
        a: 'Once approved: E-wallets are refunded in 1–2 days, bank transfers take 3–5 business days, and COD orders are refunded via direct bank transfer.',
      },
      {
        q: 'How do I submit an RMA return request?',
        a: 'Go to Account → Return / Refund Request → select your order number and item → provide the reason with optional photos → submit. Our team will review within 24 hours.',
      },
    ],
  },
  {
    icon: 'medication',
    category: 'Prescription Medications',
    color: 'text-pink-600 bg-pink-50',
    badge: 'bg-pink-100 text-pink-700',
    items: [
      {
        q: 'How do I purchase prescription drugs?',
        a: 'Add medications to cart → during checkout, upload your valid doctor prescription image or PDF. Our certified clinical pharmacists will review and approve within 30 minutes.',
      },
      {
        q: 'What information must be visible on the prescription?',
        a: 'A valid prescription must show: Doctor name and signature, hospital/clinic header, patient name, drug dosage instructions, and prescription date within the last 6 months.',
      },
    ],
  },
  {
    icon: 'qr_code_scanner',
    category: 'Supply Chain Traceability',
    color: 'text-violet-600 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
    items: [
      {
        q: 'How do I verify drug authenticity?',
        a: 'Scan the secure QR code on the packaging box with your phone or visit /trace and input the unique UID/Lot number to inspect the complete cryptographic custody trail.',
      },
      {
        q: 'What information is verified during lookup?',
        a: 'You can verify: Manufacturer credentials, manufacturing date, expiry date, batch lot number, warehouse temperature monitoring, and logistics chain of custody.',
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
          <h1 className="font-display text-3xl font-bold md:text-4xl">Help & Support Center</h1>
          <p className="mt-2 text-blue-100">We are here to support your healthcare journey 24/7</p>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <Icon name="search" className="text-slate-400 text-xl" />
              <input
                type="text"
                placeholder="Search questions, topics, keywords..."
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
              Quick Navigation
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
            Frequently Asked Questions
          </h2>

          {filtered.length === 0 ? (
            <div className="card py-16 text-center">
              <Icon name="search_off" className="text-slate-300 text-5xl mx-auto mb-3" />
              <p className="font-medium text-slate-500">No results found for "{search}"</p>
              <p className="mt-1 text-sm text-slate-400">Try a different keyword or contact our support team below.</p>
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
              Still Need Assistance?
            </h2>
            <p className="mb-5 text-sm text-slate-500">Our dedicated pharmacists and support specialists are always ready to assist.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <ContactItem icon="phone_in_talk" title="Toll-Free Hotline" value="1800 6821" sub="Mon – Sat, 8:00 – 20:00" color="text-emerald-600 bg-emerald-50" />
              <ContactItem icon="chat_bubble" title="Live Customer Support" value="Zalo Official" sub="Responds within 5 minutes" color="text-blue-600 bg-blue-50" />
              <ContactItem icon="mail" title="Support Email" value="support@pharmatrace.vn" sub="Responds within 24 hours" color="text-violet-600 bg-violet-50" />
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
