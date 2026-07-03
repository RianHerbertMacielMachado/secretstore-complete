'use client'

import { useState } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/utils/helpers'
import { Search, Eye, Send, ChevronDown, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  deliveryStatus: string
  createdAt: Date | string
  items: Array<{ product: { name: string; mainImage: string }; quantity: number; price: number }>
  user: { name: string; email: string }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow',
  PAID: 'badge-green',
  CANCELLED: 'badge-red',
  FAILED: 'badge-red',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
  FAILED: 'Falhou',
}

export default function AdminPedidosClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search)
    const matchStatus = statusFilter === 'ALL' || o.paymentStatus === statusFilter
    return matchSearch && matchStatus
  })

  const updateOrderStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus } : o))
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const redeliverOrder = async (orderId: string) => {
    const toastId = toast.loading('Reprocessando entrega...')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeliver' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(`Erro: ${data.delivery?.message || data.error || 'Falha na entrega'}`, { id: toastId })
      } else {
        toast.success(`Entrega reprocessada: ${data.delivery?.message || 'OK'}`, { id: toastId })
        setOrders(orders.map(o => o.id === orderId ? { ...o, deliveryStatus: 'DELIVERED', paymentStatus: 'PAID' } : o))
      }
    } catch {
      toast.error('Erro ao reprocessar entrega', { id: toastId })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-gothic text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-white/40 text-sm mt-1">{orders.length} pedidos no total</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou ID..."
            className="input-dark pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-dark sm:w-40"
        >
          <option value="ALL" style={{ background: '#0d0d0d' }}>Todos</option>
          <option value="PENDING" style={{ background: '#0d0d0d' }}>Pendente</option>
          <option value="PAID" style={{ background: '#0d0d0d' }}>Pago</option>
          <option value="CANCELLED" style={{ background: '#0d0d0d' }}>Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">ID</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase hidden sm:table-cell">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Valor</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase hidden md:table-cell">Pagamento</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase hidden lg:table-cell">Data</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-white/60">{order.id.slice(0, 8)}...</span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div>
                        <p className="text-sm text-white">{order.user?.name || order.customerName || 'N/A'}</p>
                        <p className="text-xs text-white/30">{order.user?.email || order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-neon-pink font-medium text-sm">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs text-white/50 capitalize">{order.paymentMethod}</span>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer ${
                          order.paymentStatus === 'PAID' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                          order.paymentStatus === 'PENDING' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                          'text-red-400 border-red-500/30 bg-red-500/10'
                        }`}
                      >
                        <option value="PENDING" style={{ background: '#0d0d0d' }}>Pendente</option>
                        <option value="PAID" style={{ background: '#0d0d0d' }}>Pago</option>
                        <option value="CANCELLED" style={{ background: '#0d0d0d' }}>Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-xs text-white/30">{formatDateTime(order.createdAt)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {order.paymentStatus === 'PAID' && (
                          <button
                            onClick={() => redeliverOrder(order.id)}
                            className="p-1.5 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                            title="Reenviar entrega (conceder permissão + email)"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-white/40 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                          title="Detalhes"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-y-4 right-4 w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-y-auto z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-gothic text-lg font-bold text-white">Detalhes do Pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-white/40">ID do Pedido</p>
                <p className="text-sm font-mono text-white mt-1">{selectedOrder.id}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-white/40 mb-2">Produtos</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    {item.product.mainImage && (
                      <img src={item.product.mainImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.product.name}</p>
                      <p className="text-xs text-white/40">Qtd: {item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-4 bg-neon-pink/5 border border-neon-pink/20 rounded-xl">
                <span className="text-white/70 font-medium">Total</span>
                <span className="text-neon-pink font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
