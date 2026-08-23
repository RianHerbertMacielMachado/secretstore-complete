'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Tag, Trash2, ChevronDown, ChevronUp, Search, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

interface Coupon {
  id: string
  code: string
  discountType: string
  discountValue: number
  scope: string
  categoryIds: string[]
  subCategoryIds: string[]
  productIds: string[]
  expiresAt: Date | null
  totalUsageLimit: number | null
  usageCount: number
  isActive: boolean
}

interface Category {
  id: string
  name: string
}

interface SubCategory {
  id: string
  name: string
  categoryId: string
  category: { id: string; name: string }
}

interface Product {
  id: string
  name: string
  subCategoryId: string
  subCategory: { id: string; name: string; category: { id: string; name: string } }
}

// ──────────────────────────────────────────────────────────────────────────────
// MultiSelect component
// ──────────────────────────────────────────────────────────────────────────────
function MultiSelect({
  label,
  items,
  selected,
  onChange,
  placeholder,
}: {
  label: string
  items: { id: string; label: string; sub?: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    (i.sub ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id))
    else onChange([...selected, id])
  }

  const selectedLabels = items.filter((i) => selected.includes(i.id)).map((i) => i.label)

  return (
    <div className="relative">
      <label className="block text-xs text-white/60 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-dark w-full text-left flex items-center justify-between gap-2"
      >
        <span className={`text-sm truncate ${selected.length === 0 ? 'text-white/30' : 'text-white'}`}>
          {selected.length === 0
            ? placeholder
            : selectedLabels.length <= 2
            ? selectedLabels.join(', ')
            : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`}
        </span>
        {open ? <ChevronUp size={14} className="text-white/40 shrink-0" /> : <ChevronDown size={14} className="text-white/40 shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/15 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded px-2">
                <Search size={12} className="text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-transparent text-sm text-white placeholder-white/30 py-1.5 outline-none w-full"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-4">Nenhum item encontrado</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                      selected.includes(item.id)
                        ? 'bg-neon-pink border-neon-pink'
                        : 'border-white/30'
                    }`}>
                      {selected.includes(item.id) && <Check size={10} className="text-black" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{item.label}</p>
                      {item.sub && <p className="text-xs text-white/40 truncate">{item.sub}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
            {selected.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Scope badge helper
// ──────────────────────────────────────────────────────────────────────────────
function ScopeBadge({ scope, categoryIds, subCategoryIds, productIds }: {
  scope: string
  categoryIds: string[]
  subCategoryIds: string[]
  productIds: string[]
}) {
  if (scope === 'ALL') return <span className="text-xs text-white/40">Loja inteira</span>

  const parts: string[] = []
  if (productIds.length > 0) parts.push(`${productIds.length} produto${productIds.length > 1 ? 's' : ''}`)
  if (subCategoryIds.length > 0) parts.push(`${subCategoryIds.length} subcateg.`)
  if (categoryIds.length > 0) parts.push(`${categoryIds.length} categ.`)

  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((p, i) => (
        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-neon-pink/10 text-neon-pink border border-neon-pink/20">
          {p}
        </span>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminCuponsClient({
  coupons: init,
  categories: initCategories,
  subCategories: initSubCategories,
  products: initProducts,
}: {
  coupons: Coupon[]
  categories: Category[]
  subCategories: SubCategory[]
  products: Product[]
}) {
  const [coupons, setCoupons] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    expiresAt: '',
    totalUsageLimit: '',
    isActive: true,
  })

  // Scope state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Derived scope
  const scope =
    selectedCategories.length === 0 &&
    selectedSubCategories.length === 0 &&
    selectedProducts.length === 0
      ? 'ALL'
      : 'SPECIFIC'

  // Filter subCategories based on selected categories (if any)
  const filteredSubCategories = selectedCategories.length > 0
    ? initSubCategories.filter((s) => selectedCategories.includes(s.categoryId))
    : initSubCategories

  // Filter products based on selected sub-categories + categories
  const filteredProducts = (() => {
    if (selectedSubCategories.length > 0) {
      return initProducts.filter((p) => selectedSubCategories.includes(p.subCategoryId))
    }
    if (selectedCategories.length > 0) {
      return initProducts.filter((p) =>
        selectedCategories.includes(p.subCategory.category.id)
      )
    }
    return initProducts
  })()

  // When categories change, remove sub-categories that no longer belong
  useEffect(() => {
    if (selectedCategories.length > 0) {
      setSelectedSubCategories((prev) =>
        prev.filter((id) => {
          const sub = initSubCategories.find((s) => s.id === id)
          return sub && selectedCategories.includes(sub.categoryId)
        })
      )
    }
  }, [selectedCategories])

  // When sub-categories change, remove products that no longer belong
  useEffect(() => {
    if (selectedSubCategories.length > 0) {
      setSelectedProducts((prev) =>
        prev.filter((id) => {
          const p = initProducts.find((pr) => pr.id === id)
          return p && selectedSubCategories.includes(p.subCategoryId)
        })
      )
    }
  }, [selectedSubCategories])

  const resetForm = () => {
    setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '10', expiresAt: '', totalUsageLimit: '', isActive: true })
    setSelectedCategories([])
    setSelectedSubCategories([])
    setSelectedProducts([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = {
        ...form,
        discountValue: parseFloat(form.discountValue),
        totalUsageLimit: form.totalUsageLimit ? parseInt(form.totalUsageLimit, 10) : null,
        scope,
        categoryIds: selectedCategories,
        subCategoryIds: selectedSubCategories,
        productIds: selectedProducts,
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCoupons([data.coupon, ...coupons])
      toast.success('Cupom criado!')
      setShowForm(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      setCoupons(coupons.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c)))
      toast.success(isActive ? 'Cupom desativado' : 'Cupom ativado')
    } catch {
      toast.error('Erro ao atualizar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cupom?')) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir cupom')
      setCoupons(coupons.filter((coupon) => coupon.id !== id))
      toast.success('Cupom excluído!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cupom')
    }
  }

  // Items for MultiSelect
  const categoryItems = initCategories.map((c) => ({ id: c.id, label: c.name }))
  const subCategoryItems = filteredSubCategories.map((s) => ({
    id: s.id,
    label: s.name,
    sub: s.category.name,
  }))
  const productItems = filteredProducts.map((p) => ({
    id: p.id,
    label: p.name,
    sub: `${p.subCategory.category.name} › ${p.subCategory.name}`,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Cupons de Desconto</h1>
          <p className="text-white/40 text-sm mt-1">{coupons.length} cupons cadastrados</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-neon-solid flex items-center gap-2">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-xs text-white/40 uppercase">Código</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase hidden sm:table-cell">Desconto</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase hidden lg:table-cell">Aplicação</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase hidden md:table-cell">Uso</th>
              <th className="text-left p-4 text-xs text-white/40 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-white/30">
                  Nenhum cupom ainda
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-neon-pink" />
                      <span className="font-mono text-neon-pink font-bold">{c.code}</span>
                    </div>
                    {c.expiresAt && (
                      <p className="text-xs text-white/30 mt-0.5">Expira: {formatDate(c.expiresAt)}</p>
                    )}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-white font-medium">
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}%`
                        : formatCurrency(c.discountValue)}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <ScopeBadge
                      scope={c.scope}
                      categoryIds={c.categoryIds}
                      subCategoryIds={c.subCategoryIds}
                      productIds={c.productIds}
                    />
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-white/60 text-sm">
                      {c.usageCount}
                      {c.totalUsageLimit ? `/${c.totalUsageLimit}` : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(c.id, c.isActive)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          c.isActive ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {c.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs px-3 py-1 rounded-full border border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => { setShowForm(false); resetForm() }}
            />
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="fixed inset-y-4 right-4 w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-y-auto z-50 p-6"
              style={{ boxShadow: '0 0 60px rgba(255,0,127,0.1)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gothic text-xl font-bold text-white">Novo Cupom</h2>
                <button
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Code */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Código *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input-dark font-mono"
                    placeholder="PROMO20"
                  />
                </div>

                {/* Discount type + value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Tipo</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      className="input-dark"
                    >
                      <option value="PERCENTAGE" style={{ background: '#0d0d0d' }}>Porcentagem (%)</option>
                      <option value="FIXED" style={{ background: '#0d0d0d' }}>Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Valor *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                      className="input-dark"
                      placeholder={form.discountType === 'PERCENTAGE' ? '10' : '20.00'}
                    />
                  </div>
                </div>

                {/* Expiry + limit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Validade</label>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Limite de Usos</label>
                    <input
                      type="number"
                      min="1"
                      value={form.totalUsageLimit}
                      onChange={(e) => setForm({ ...form, totalUsageLimit: e.target.value })}
                      className="input-dark"
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>

                {/* ── Scope section ── */}
                <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/2">
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Onde aplicar o cupom</p>
                    <p className="text-xs text-white/40">
                      Deixe em branco para aplicar na loja inteira. Selecione uma ou mais opções para restringir.
                    </p>
                  </div>

                  {/* Scope summary pill */}
                  <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                    scope === 'ALL'
                      ? 'border-white/20 text-white/40'
                      : 'border-neon-pink/40 text-neon-pink bg-neon-pink/5'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${scope === 'ALL' ? 'bg-white/30' : 'bg-neon-pink'}`} />
                    {scope === 'ALL' ? 'Loja inteira' : 'Aplicação restrita'}
                  </div>

                  {/* Category selector */}
                  <MultiSelect
                    label="Categorias"
                    items={categoryItems}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Todas as categorias"
                  />

                  {/* SubCategory selector */}
                  <MultiSelect
                    label={`Subcategorias${selectedCategories.length > 0 ? ` (filtradas por categoria)` : ''}`}
                    items={subCategoryItems}
                    selected={selectedSubCategories}
                    onChange={setSelectedSubCategories}
                    placeholder="Todas as subcategorias"
                  />

                  {/* Product selector */}
                  <MultiSelect
                    label={`Produtos${selectedSubCategories.length > 0 ? ` (filtrados por subcategoria)` : selectedCategories.length > 0 ? ` (filtrados por categoria)` : ''}`}
                    items={productItems}
                    selected={selectedProducts}
                    onChange={setSelectedProducts}
                    placeholder="Todos os produtos"
                  />

                  {/* Summary */}
                  {scope === 'SPECIFIC' && (
                    <div className="text-xs text-white/50 space-y-0.5">
                      {selectedCategories.length > 0 && (
                        <p>• {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada{selectedCategories.length > 1 ? 's' : ''}</p>
                      )}
                      {selectedSubCategories.length > 0 && (
                        <p>• {selectedSubCategories.length} subcategoria{selectedSubCategories.length > 1 ? 's' : ''} selecionada{selectedSubCategories.length > 1 ? 's' : ''}</p>
                      )}
                      {selectedProducts.length > 0 && (
                        <p>• {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''} selecionado{selectedProducts.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="flex-1 btn-ghost py-3"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-neon-solid py-3 disabled:opacity-50"
                  >
                    {isLoading ? 'Criando...' : 'Criar Cupom'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
