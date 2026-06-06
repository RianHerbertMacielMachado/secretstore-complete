'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, ShoppingBag, LogOut, Calendar, Mail, Shield, Package, ExternalLink, ChevronRight } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string; mainImage: string; slug: string } | null
}

interface Order {
  id: string
  totalAmount: number
  paymentStatus: string
  deliveryStatus: string
  paymentMethod: string
  createdAt: Date
  items: OrderItem[]
}

interface UserData {
  id: string
  name: string | null
  email: string
  avatar: string | null
  createdAt: Date
  googleId: string | null
  discordId: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  PAID: { label: 'Pago', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  FAILED: { label: 'Falhou', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  REFUNDED: { label: 'Reembolsado', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

const DELIVERY_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  SENT: { label: 'Enviado', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  DELIVERED: { label: 'Entregue', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  FAILED: { label: 'Erro', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

const PAYMENT_ICONS: Record<string, string> = {
  PIX: '💠', PAYPAL: '🅿', PICPAY: '💚',
}

export default function ContaClient({ user, orders, defaultTab = 'perfil' }: {
  user: UserData
  orders: Order[]
  defaultTab?: 'perfil' | 'pedidos'
}) {
  const [tab, setTab] = useState<'perfil' | 'pedidos'>(defaultTab)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const totalSpent = orders.filter(o => o.paymentStatus === 'PAID').reduce((acc, o) => acc + o.totalAmount, 0)
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10 p-6 bg-[#0d0d0d] border border-white/10 rounded-2xl">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-neon-pink/50 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neon-pink/10 border-2 border-neon-pink/30 flex items-center justify-center flex-shrink-0">
              <span className="text-neon-pink text-2xl font-bold font-gothic">{user.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-gothic text-2xl font-bold text-white">{user.name || 'Usuário'}</h1>
            <p className="text-white/50 text-sm">{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              {user.googleId && <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">Google</span>}
              {user.discordId && <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">Discord</span>}
              {!user.googleId && !user.discordId && <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/40">Email</span>}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pedidos', value: orders.length, icon: ShoppingBag, color: 'text-neon-pink' },
            { label: 'Confirmados', value: paidOrders, icon: Package, color: 'text-green-400' },
            { label: 'Total Gasto', value: formatCurrency(totalSpent), icon: Shield, color: 'text-blue-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={15} className={stat.color} />
                <span className="text-xs text-white/40">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold font-gothic ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          {[
            { id: 'perfil', label: 'Perfil', icon: User },
            { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-neon-pink border-neon-pink'
                  : 'text-white/40 border-transparent hover:text-white'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Perfil Tab */}
        {tab === 'perfil' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-gothic text-lg font-bold text-white">Informações da Conta</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Nome</label>
                  <p className="text-white mt-1">{user.name || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                  <p className="text-white mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Membro desde</label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    <Calendar size={14} className="text-white/30" />
                    {formatDate(user.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider">Login via</label>
                  <p className="text-white mt-1">
                    {user.googleId ? 'Google' : user.discordId ? 'Discord' : 'Email/Senha'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6">
              <h2 className="font-gothic text-lg font-bold text-white mb-4">Ações Rápidas</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setTab('pedidos')}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={18} className="text-neon-pink" />
                    <span className="text-white text-sm">Ver Meus Pedidos</span>
                  </div>
                  <ChevronRight size={16} className="text-white/30" />
                </button>
                <Link
                  href="/produtos"
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-purple-400" />
                    <span className="text-white text-sm">Explorar Produtos</span>
                  </div>
                  <ChevronRight size={16} className="text-white/30" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pedidos Tab */}
        {tab === 'pedidos' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <ShoppingBag size={48} className="text-white/10" />
                <p className="text-white/40">Você ainda não fez nenhum pedido</p>
                <Link href="/produtos" className="btn-neon text-sm px-6 py-3 mt-2">
                  Explorar Produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = STATUS_MAP[order.paymentStatus] || STATUS_MAP.PENDING
                  const delivery = DELIVERY_MAP[order.deliveryStatus] || DELIVERY_MAP.PENDING
                  return (
                    <motion.div
                      key={order.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="bg-[#0d0d0d] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-white/30">#{order.id.slice(-8).toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${status.color}`}>{status.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${delivery.color}`}>{delivery.label}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-1">
                            {formatDate(order.createdAt)} · {PAYMENT_ICONS[order.paymentMethod] || '💳'} {order.paymentMethod} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-neon-pink font-bold font-gothic">{formatCurrency(order.totalAmount)}</span>
                      </div>

                      {selectedOrder?.id === order.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-white/10 space-y-3"
                        >
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              {item.product?.mainImage && (
                                <div
                                  className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0"
                                  style={{ backgroundImage: `url(${item.product.mainImage})` }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{item.product?.name || 'Produto removido'}</p>
                                <p className="text-white/40 text-xs">Qtd: {item.quantity} · {formatCurrency(item.price)}</p>
                              </div>
                              {item.product?.slug && (
                                <Link
                                  href={`/produtos/${item.product.slug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-white/30 hover:text-neon-pink transition-colors"
                                >
                                  <ExternalLink size={14} />
                                </Link>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
