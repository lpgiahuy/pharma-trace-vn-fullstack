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
  { icon: 'dashboard',       color: 'text-blue-600 bg-blue-50',     title: 'Overview & Dashboard',    desc: 'View real-time revenue analytics, order volume, inventory levels, and interactive charts.' },
  { icon: 'inventory_2',     color: 'text-emerald-600 bg-emerald-50', title: 'Product Catalog',         desc: 'Create, update, and manage medications; configure categories, units of measure, and imagery.' },
  { icon: 'shopping_bag',    color: 'text-orange-600 bg-orange-50',  title: 'Order Management',        desc: 'Track order fulfillment status, process RMA return requests, and print waybills.' },
  { icon: 'manage_accounts', color: 'text-violet-600 bg-violet-50',  title: 'Staff & Role Permissions', desc: 'Manage team accounts and assign RBAC roles (Admin / Store Manager / Warehouse).' },
  { icon: 'assignment',      color: 'text-pink-600 bg-pink-50',      title: 'Prescriptions (Rx)',      desc: 'Review and verify customer-uploaded prescription images prior to dispensing medications.' },
  { icon: 'local_offer',     color: 'text-yellow-600 bg-yellow-50',  title: 'Vouchers & Promotions',    desc: 'Configure promotional discount codes, validity dates, minimum spends, and usage tracking.' },
  { icon: 'article',         color: 'text-cyan-600 bg-cyan-50',      title: 'Blog & Health News',      desc: 'Publish pharmaceutical insights and healthcare news articles with a rich text editor.' },
  { icon: 'business',        color: 'text-slate-600 bg-slate-100',   title: 'Units & Facilities',       desc: 'Maintain distribution centers, warehouses, and retail pharmacy network coordinates.' },
]

const WAREHOUSE_CARDS = [
  { icon: 'move_to_inbox', label: 'Inbound',    path: '/warehouse/inbound',     color: 'text-blue-600 bg-blue-50' },
  { icon: 'outbox',        label: 'Outbound',   path: '/warehouse/fulfillment', color: 'text-emerald-600 bg-emerald-50' },
  { icon: 'sync_alt',      label: 'Transfer',   path: '/warehouse/transfer',    color: 'text-orange-600 bg-orange-50' },
  { icon: 'delete',        label: 'Disposal',   path: '/warehouse/disposal',    color: 'text-red-600 bg-red-50' },
  { icon: 'recycling',     label: 'Recall',     path: '/warehouse/recall',      color: 'text-yellow-600 bg-yellow-50' },
  { icon: 'qr_code_scanner', label: 'Scanner',  path: '/warehouse/scanner',     color: 'text-violet-600 bg-violet-50' },
]

const FAQS = [
  {
    category: 'Accounts & Permissions',
    badge: 'bg-blue-100 text-blue-700',
    items: [
      { q: 'How do I add a new team member?', a: 'Go to Staff & Permissions → click "+ Add Staff" → enter email, full name, and assign role (Admin / Manager / Warehouse). The system will send an activation email automatically.' },
      { q: 'What is the difference between Admin and Store Manager?', a: 'Admins have complete platform authority including managing other staff accounts. Managers can oversee inventory, catalog, and orders, but cannot manage system users or security credentials.' },
      { q: 'I forgot my account password, what should I do?', a: 'Click "Forgot Password" on the login screen, enter your email, and follow the secure reset instructions sent to your inbox (link valid for 30 minutes).' },
    ],
  },
  {
    category: 'Products & Inventory',
    badge: 'bg-emerald-100 text-emerald-700',
    items: [
      { q: 'How do I add a new pharmaceutical product?', a: 'Navigate to Product Catalog → click "+ Add Product" → input details: name, registration number, category, price, stock, and photos. Products become visible on the storefront when marked Active.' },
      { q: 'How does low stock alert work?', a: 'The dashboard automatically flags products with inventory ≤ 10 units. You can customize the minimum threshold per product.' },
      { q: 'How do I record inbound stock shipments?', a: 'Access Warehouse WMS → Inbound → select product and enter batch/lot number, expiry date, and quantity. Unique QR serial codes are generated for item traceability.' },
    ],
  },
  {
    category: 'Orders & RMA Returns',
    badge: 'bg-orange-100 text-orange-700',
    items: [
      { q: 'What is the order fulfillment lifecycle?', a: 'Orders transition through: Awaiting Confirmation → Confirmed → In Delivery → Delivered / Cancelled. Statuses can be updated manually or automatically via integrated shipping carriers.' },
      { q: 'How do I process RMA return requests?', a: 'Go to Orders → RMA Returns → review customer claims → choose "Approve" or "Reject" with justification notes. Upon approval, refund vouchers are credited.' },
    ],
  },
  {
    category: 'Supply Chain Traceability',
    badge: 'bg-violet-100 text-violet-700',
    items: [
      { q: 'How does PharmaTrace cryptographic provenance work?', a: 'Each packaging unit has a unique serialized QR code. Scanning via /trace reveals complete milestone provenance: Manufacturer → Inbound Storage → Warehouse Transfer → Retail Pharmacy.' },
      { q: 'How do I print QR serial labels for lots?', a: 'Go to Warehouse WMS → Scanner / Lot Monitor → select the batch → click "Print QR Labels" to generate a ready-to-print PDF label sheet.' },
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
            <h1 className="font-display text-2xl font-bold">Help Center & Knowledge Base</h1>
            <p className="mt-1 text-sm text-blue-100">
              Learn how to operate PharmaTrace VN Admin — intelligent, secure pharmaceutical supply chain management.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Input
            size="large"
            placeholder="Search documentation, guides, FAQs..."
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
              <Icon name="menu_book" className="text-base" /> Admin Core Capabilities
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
              <Icon name="warehouse" className="text-base" /> Warehouse WMS Modules
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
                * Access warehouse subsystem at <code className="rounded bg-slate-100 px-1">/warehouse</code>. Requires Warehouse, Manager, or Admin role.
              </p>
            </div>
          </div>

          {/* Traceability */}
          <div className="card flex items-center gap-4 p-5 border border-brand-100 bg-brand-50/40">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              <Icon name="qr_code_scanner" filled className="text-2xl text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-700">Cryptographic Traceability (PharmaTrace)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Customers scan packaging QR codes to inspect authentic batch journey. Public portal at{' '}
                <code className="rounded bg-white px-1 text-brand-600">/trace</code>.
              </p>
            </div>
            <a href="/trace" target="_blank" rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
              Preview Portal <Icon name="open_in_new" className="text-sm" />
            </a>
          </div>
        </>
      )}

      {/* FAQ */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          <Icon name="forum" className="text-base" /> Frequently Asked Questions (FAQ)
        </h2>

        {filtered.length === 0 ? (
          <div className="card py-14 text-center">
            <Icon name="search_off" className="text-5xl text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-500">No results found for "{search}"</p>
            <p className="mt-1 text-sm text-slate-400">Try different search keywords or reach out to customer support below.</p>
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
            <Icon name="contact_support" filled className="text-xl text-brand-500" /> Still Need Assistance?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <ContactCard icon="mail" title="Support Email" value="support@pharmatrace.vn" sub="Response within 24 business hours" />
            <ContactCard icon="chat_bubble" title="Zalo Official Account" value="PharmaTrace VN" sub="Live support 8:00 – 17:00" />
            <ContactCard icon="phone_in_talk" title="Toll-Free Hotline" value="1800 1234" sub="Toll-free, Mon – Sat" />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Please provide your account username and a brief description of the issue for expedited support.
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
