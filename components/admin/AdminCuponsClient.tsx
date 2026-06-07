'use client'

import { useState } from 'react'
import { Plus, X, Tag, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  scope: string
  expiresAt: Date | null
  totalUsageLimit: number | null
  usageCount: number
  isActive: boolean
}

export default function AdminCuponsClient({ coupons: init }: { coupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: '10',
    expiresAt: '', totalUsageLimit: '', isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, discountValue: parseFloat(form.discountValue) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCoupons([data.coupon, ...coupons])
      toast.success('Cupom criado!')
      setShowForm(false)
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '10', expiresAt: '', totalUsageLimit: '', isActive: true })
    } catch (err: any) { toast.error(err.message) }
    finally { setIsLoading(false) }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !isActive } : c))
      toast.success(isActive ? 'Cupom desativado' : 'Cupom ativado')
    } catch { toast.error('Erro ao atualizar') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Cupons de Desconto</h1>
          <p className="text-white/40 text-sm mt-1">{coupons.length} cupons cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-neon-solid flex items-center gap-2">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-xs text-white/40 uppercase">Código</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase hidden sm:table-cell">Desconto</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase hidden md:table-cell">Uso</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-white/30">Nenhum cupom ainda</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-neon-pink" />
                    <span className="font-mono text-neon-pink font-bold">{c.code}</span>
                  </div>
                  {c.expiresAt && <p className="text-xs text-white/30 mt-0.5">Expira: {formatDate(c.expiresAt)}</p>}
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <span className="text-white font-medium">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-white/60 text-sm">
                    {c.usageCount}{c.totalUsageLimit ? `/${c.totalUsageLimit}` : ''}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(c.id, c.isActive)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      c.isActive ? 'badge-green' : 'badge-red'
                    }`}
                  >
                    {c.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="fixed inset-y-4 right-4 w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-y-auto z-50 p-6"
              style={{ boxShadow: '0 0 60px rgba(255,0,127,0.1)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gothic text-xl font-bold text-white">Novo Cupom</h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Código *</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-dark font-mono" placeholder="PROMO20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Tipo</label>
                    <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-dark">
                      <option value="PERCENTAGE" style={{ background: '#0d0d0d' }}>Porcentagem (%)</option>
                      <option value="FIXED" style={{ background: '#0d0d0d' }}>Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Valor *</label>
                    <input required type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="input-dark" placeholder={form.discountType === 'PERCENTAGE' ? '10' : '20.00'} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Validade</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Limite de Usos</label>
                  <input type="number" min="1" value={form.totalUsageLimit} onChange={(e) => setForm({ ...form, totalUsageLimit: e.target.value })} className="input-dark" placeholder="Ilimitado" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-ghost py-3">Cancelar</button>
                  <button type="submit" disabled={isLoading} className="flex-1 btn-neon-solid py-3 disabled:opacity-50">{isLoading ? 'Criando...' : 'Criar Cupom'}</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
