import { useEffect, useState } from 'react'
import { Table, Alert } from 'antd'
import { DollarSign, ShoppingBag, Users, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { analyticsService } from '@/services/analytics.service'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils'

const PIE_COLORS = ['#0b7de8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

function formatYAxis(v) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}T`
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(0)}M`
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`
  return v
}

const PiePercentLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: 13,
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats]            = useState(null)
  const [chart, setChart]            = useState([])
  const [topProducts, setTop]        = useState([])
  const [lowStock, setLowStock]      = useState([])
  const [categoryCount, setCatCount] = useState([])
  const [loading, setLoading]        = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboardStats(),
      analyticsService.getRevenueChart(),
      analyticsService.getTopProducts(5),
      analyticsService.getLowStockAlerts(),
      analyticsService.getCategoryCount(),
    ]).then(([s, c, tp, ls, cat]) => {
      setStats(s); setChart(c); setTop(tp); setLowStock(ls); setCatCount(cat)
    }).finally(() => setLoading(false))
  }, [])

  const productCols = [
    {
      title: t('admin.col_product'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: v => <span className="font-medium text-slate-800">{v}</span>,
    },
    {
      title: t('admin.col_category'),
      dataIndex: 'category',
      key: 'category',
      render: v => (
        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{v}</span>
      ),
    },
    {
      title: t('admin.col_sold'),
      dataIndex: 'soldCount',
      key: 'sold',
      render: v => (
        <span className="font-semibold text-slate-700">
          {v?.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('admin.col_price'),
      dataIndex: 'price',
      key: 'price',
      render: v => <span className="text-slate-600">{formatCurrency(v)}</span>,
    },
  ]

  const lowStockCols = [
    { title: t('admin.col_product'),  dataIndex: 'productName', key: 'name', ellipsis: true },
    { title: t('admin.col_location'), dataIndex: 'location',    key: 'loc'  },
    {
      title: t('admin.col_qty'),
      dataIndex: 'quantity',
      key: 'qty',
      render: v => <Badge color={v === 0 ? 'red' : v < 5 ? 'red' : 'orange'}>{v}</Badge>,
    },
    { title: t('admin.col_expiry'),   dataIndex: 'expiryDate',  key: 'exp'  },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">{t('admin.dashboard')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('admin.welcome_back')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard loading={loading} title={t('admin.total_revenue')}   value={stats?.revenue?.value || 0}   change={Number(stats?.revenue?.change || 0)}   trend={stats?.revenue?.trend}   icon={DollarSign}    color="blue"   prefix="₫" />
        <StatCard loading={loading} title={t('admin.total_orders')}    value={stats?.orders?.value || 0}    change={Number(stats?.orders?.change || 0)}    trend={stats?.orders?.trend}    icon={ShoppingBag}   color="green"  />
        <StatCard loading={loading} title={t('admin.total_customers')} value={stats?.customers?.value || 0} change={Number(stats?.customers?.change || 0)} trend={stats?.customers?.trend} icon={Users}         color="purple" />
        <StatCard loading={loading} title={t('admin.low_stock_items')} value={stats?.lowStock?.value || 0}  change={Number(stats?.lowStock?.change || 0)}  trend={stats?.lowStock?.trend}  icon={AlertTriangle} color="orange" />
      </div>

      {/* Charts row: Revenue Overview (2/3) + Monthly Orders (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-display font-semibold text-slate-800 mb-1">{t('admin.revenue_overview')}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('admin.revenue')} (VNĐ)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chart} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0b7de8" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0b7de8" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={52}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v) => [formatCurrency(v), t('admin.revenue')]}
                labelStyle={{ fontWeight: 600, color: '#334155' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0b7de8"
                strokeWidth={2.5}
                fill="url(#gradRev)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#0b7de8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 mb-1">{t('admin.monthly_orders')}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('admin.col_sold')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v) => [v, t('admin.total_orders')]}
                labelStyle={{ fontWeight: 600, color: '#334155' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="orders" fill="#0b7de8" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie chart + Top products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-800 mb-1">{t('admin.products_by_category')}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('admin.active_products_only')}</p>
          {categoryCount.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryCount}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="46%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={2}
                  labelLine={false}
                  label={PiePercentLabel}
                >
                  {categoryCount.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v, name) => [`${v} sản phẩm`, name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span style={{ color: '#475569' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="xl:col-span-2 card p-5">
          <h3 className="font-display font-semibold text-slate-800 mb-4">{t('admin.top_selling')}</h3>
          <Table
            dataSource={topProducts}
            columns={productCols}
            rowKey="id"
            pagination={false}
            size="small"
            loading={loading}
          />
        </div>
      </div>

      {/* Low Stock */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          {t('admin.low_stock_alerts')}
        </h3>
        {lowStock.length > 0 && (
          <Alert
            message={`${lowStock.length} ${t('admin.items_restocking')}`}
            type="warning"
            showIcon
            className="mb-3"
          />
        )}
        <Table
          dataSource={lowStock}
          columns={lowStockCols}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loading}
        />
      </div>
    </div>
  )
}
