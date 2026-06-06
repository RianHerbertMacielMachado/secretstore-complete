'use client'

import { formatCurrency, formatDateTime } from '@/lib/utils/helpers'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign, Package } from 'lucide-react'

interface DashboardData {
  kpis: {
    totalRevenue: number
    monthRevenue: number
    revenueGrowth: number
    totalOrders: number
    paidOrdersCount: number
    monthOrdersCount: number
    totalCustomers: number
  }
  chartData: Array<{ date: string; receita: number; pedidos: number }>
  recentOrders: any[]
  webhookLogs: any[]
}

function KPICard({ title, value, subtitle, icon: Icon, trend }: any) {
  return (
    <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6 hover:border-neon-pink/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-neon-pink/10 rounded-lg flex items-center justify-center">
          <Icon size={20} className="text-neon-pink" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white font-gothic">{value}</div>
      <div className="text-xs text-white/40 mt-1">{title}</div>
      {subtitle && <div className="text-xs text-neon-pink/60 mt-1">{subtitle}</div>}
    </div>
  )
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'badge-yellow' },
  PAID: { label: 'Pago', className: 'badge-green' },
  CANCELLED: { label: 'Cancelado', className: 'badge-red' },
  FAILED: { label: 'Falhou', className: 'badge-red' },
}

export default function AdminDashboardClient({ data }: { data: DashboardData }) {
  const { kpis, chartData, recentOrders, webhookLogs } = data

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-gothic text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Visão geral da sua loja</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita Total"
          value={formatCurrency(kpis.totalRevenue)}
          icon={DollarSign}
        />
        <KPICard
          title="Receita do Mês"
          value={formatCurrency(kpis.monthRevenue)}
          subtitle={`${kpis.monthOrdersCount} pedidos`}
          trend={kpis.revenueGrowth}
          icon={TrendingUp}
        />
        <KPICard
          title="Total de Pedidos"
          value={kpis.totalOrders.toString()}
          subtitle={`${kpis.paidOrdersCount} pagos`}
          icon={ShoppingBag}
        />
        <KPICard
          title="Clientes"
          value={kpis.totalCustomers.toString()}
          icon={Users}
        />
      </div>

      {/* Gráfico de Receita */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-6">Receita - Últimos 7 dias</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff007f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="date" stroke="#ffffff30" tick={{ fontSize: 12 }} />
            <YAxis stroke="#ffffff30" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
            <Tooltip
              contentStyle={{ background: '#0d0d0d', border: '1px solid #ff007f30', borderRadius: '8px', color: '#fff' }}
              formatter={(v: any) => [formatCurrency(v), 'Receita']}
            />
            <Area type="monotone" dataKey="receita" stroke="#ff007f" fill="url(#colorReceita)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos Recentes */}
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Pedidos Recentes</h2>
            <a href="/admin/pedidos" className="text-xs text-neon-pink hover:text-neon-rose transition-colors">
              Ver todos →
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-white/30 text-sm">Nenhum pedido ainda</p>
            ) : (
              recentOrders.map((order) => {
                const status = STATUS_MAP[order.paymentStatus] || STATUS_MAP.PENDING
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium">{order.customerName || 'Cliente'}</p>
                      <p className="text-xs text-white/30">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={status.className}>{status.label}</span>
                      <span className="text-neon-pink text-sm font-medium">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Logs de Webhook */}
        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Webhooks Recentes</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {webhookLogs.length === 0 ? (
              <p className="text-white/30 text-sm">Nenhum webhook registrado</p>
            ) : (
              webhookLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    log.status === 'processed' ? 'bg-green-400' :
                    log.status === 'received' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">{log.provider}</p>
                    <p className="text-xs text-white/30 truncate">{log.eventType}</p>
                  </div>
                  <span className="text-xs text-white/20 flex-shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
