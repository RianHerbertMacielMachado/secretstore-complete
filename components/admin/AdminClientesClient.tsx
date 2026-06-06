'use client'

import { useState } from 'react'
import { Search, User, Mail, ShoppingBag, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import { motion } from 'framer-motion'

interface Customer {
  id: string
  name: string
  email: string
  avatar: string | null
  createdAt: Date | string
  totalOrders: number
  totalSpent: number
  googleId: string | null
  discordId: string | null
}

export default function AdminClientesClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0)
  const totalOrders = customers.reduce((acc, c) => acc + c.totalOrders, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-gothic text-2xl font-bold text-white">Clientes</h1>
        <p className="text-white/40 text-sm mt-1">{customers.length} clientes cadastrados</p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total de Clientes', value: customers.length, icon: User, color: 'text-neon-pink' },
          { label: 'Pedidos Realizados', value: totalOrders, icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Receita Total', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} className={kpi.color} />
              <span className="text-xs text-white/40">{kpi.label}</span>
            </div>
            <p className={`text-xl font-bold font-gothic ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="input-dark pl-10"
        />
      </div>

      {/* Lista */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Cliente</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">Cadastro</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Pedidos</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Total Gasto</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Login Via</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <User size={40} className="text-white/10" />
                      <p className="text-white/30 text-sm">
                        {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(customer)}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt=""
                            className="w-9 h-9 rounded-full border border-neon-pink/30 flex-shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-neon-pink text-sm font-bold">
                              {customer.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{customer.name}</p>
                          <p className="text-xs text-white/40 truncate">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Calendar size={12} />
                        {formatDate(customer.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-white/30" />
                        <span className="text-white text-sm">{customer.totalOrders}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium text-sm ${customer.totalSpent > 0 ? 'text-neon-pink' : 'text-white/30'}`}>
                        {formatCurrency(customer.totalSpent)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex gap-1.5">
                        {customer.googleId && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                            Google
                          </span>
                        )}
                        {customer.discordId && (
                          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                            Discord
                          </span>
                        )}
                        {!customer.googleId && !customer.discordId && (
                          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/30">
                            Email
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalhes */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setSelected(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl z-50 p-6"
            style={{ boxShadow: '0 0 40px rgba(255,0,127,0.1)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-gothic text-lg font-bold text-white">Detalhes do Cliente</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>

            {/* Avatar e nome */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/3 rounded-xl">
              {selected.avatar ? (
                <img src={selected.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-neon-pink/40 object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-neon-pink/10 border-2 border-neon-pink/30 flex items-center justify-center">
                  <span className="text-neon-pink text-2xl font-bold">{selected.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{selected.name}</p>
                <p className="text-white/50 text-sm">{selected.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-white/3 rounded-lg text-center">
                <p className="text-2xl font-bold text-neon-pink font-gothic">{selected.totalOrders}</p>
                <p className="text-xs text-white/40 mt-0.5">Pedidos</p>
              </div>
              <div className="p-3 bg-white/3 rounded-lg text-center">
                <p className="text-xl font-bold text-green-400 font-gothic">{formatCurrency(selected.totalSpent)}</p>
                <p className="text-xs text-white/40 mt-0.5">Total Gasto</p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Cadastrado em</span>
                <span className="text-white">{formatDate(selected.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Login via</span>
                <div className="flex gap-1">
                  {selected.googleId && <span className="badge-neon text-xs">Google</span>}
                  {selected.discordId && <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">Discord</span>}
                  {!selected.googleId && !selected.discordId && <span className="text-white/40">Email/Senha</span>}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ID</span>
                <span className="font-mono text-xs text-white/30">{selected.id}</span>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full btn-ghost py-3 rounded-xl mt-6 text-sm"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
