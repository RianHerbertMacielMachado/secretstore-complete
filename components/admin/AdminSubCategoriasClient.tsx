'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Layers } from 'lucide-react'
import { slugify } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageUpload } from '@/components/shared/ImageUpload'

interface Category {
  id: string
  name: string
}

interface SubCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  isVisible: boolean
  sortOrder: number
  categoryId: string
  category: { id: string; name: string }
  _count: { products: number }
}

interface Props {
  subCategories: SubCategory[]
  categories: Category[]
}

export default function AdminSubCategoriasClient({ subCategories: init, categories }: Props) {
  const [subCategories, setSubCategories] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SubCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', description: '', image: '',
    isVisible: true, sortOrder: 0,
    categoryId: categories[0]?.id || '',
  })

  const filtered = filterCategoryId
    ? subCategories.filter(s => s.categoryId === filterCategoryId)
    : subCategories

  const resetForm = () => {
    setForm({
      name: '', slug: '', description: '', image: '',
      isVisible: true, sortOrder: 0,
      categoryId: categories[0]?.id || '',
    })
    setEditing(null)
  }

  const openEdit = (sub: SubCategory) => {
    setEditing(sub)
    setForm({
      name: sub.name, slug: sub.slug, description: sub.description || '',
      image: sub.image || '', isVisible: sub.isVisible, sortOrder: sub.sortOrder,
      categoryId: sub.categoryId,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { toast.error('Selecione uma categoria'); return }
    setIsLoading(true)
    try {
      const url = editing ? `/api/admin/subcategories/${editing.id}` : '/api/admin/subcategories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      if (editing) {
        setSubCategories(subCategories.map(s =>
          s.id === editing.id ? { ...s, ...data.subCategory, _count: s._count } : s
        ))
        toast.success('Sub-Categoria atualizada!')
      } else {
        setSubCategories([{ ...data.subCategory, _count: { products: 0 } }, ...subCategories])
        toast.success('Sub-Categoria criada!')
      }
      resetForm()
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta sub-categoria? Todos os produtos vinculados serão afetados.')) return
    try {
      const res = await fetch(`/api/admin/subcategories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setSubCategories(subCategories.filter(s => s.id !== id))
      toast.success('Sub-Categoria excluída!')
    } catch {
      toast.error('Erro ao excluir sub-categoria')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Sub-Categorias</h1>
          <p className="text-white/40 text-sm mt-1">{subCategories.length} sub-categorias</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-neon-solid flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} /> Nova Sub-Categoria
        </button>
      </div>

      {/* Filter by Category */}
      {categories.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterCategoryId('')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !filterCategoryId
                ? 'bg-neon-pink text-black shadow-neon-sm'
                : 'bg-white/5 text-white/60 border border-white/10 hover:border-neon-pink/40 hover:text-neon-pink'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filterCategoryId === cat.id
                  ? 'bg-neon-pink text-black shadow-neon-sm'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-neon-pink/40 hover:text-neon-pink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sub) => (
          <div
            key={sub.id}
            className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden hover:border-neon-pink/30 transition-all"
          >
            {sub.image ? (
              <div className="h-24 overflow-hidden">
                <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-24 bg-white/3 flex items-center justify-center">
                <Layers size={28} className="text-white/10" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-neon-pink/70 font-medium mb-0.5">{sub.category.name}</p>
                  <h3 className="font-medium text-white">{sub.name}</h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{sub.slug}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(sub)} className="p-1.5 text-white/40 hover:text-neon-pink transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {sub.description && <p className="text-xs text-white/40 mb-2 line-clamp-1">{sub.description}</p>}
              <div className="flex items-center gap-3">
                <span className={sub.isVisible ? 'badge-green' : 'badge-red'}>
                  {sub.isVisible ? 'Visível' : 'Oculta'}
                </span>
                <span className="text-xs text-white/30">{sub._count.products} produtos</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/30">
            Nenhuma sub-categoria encontrada
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="fixed inset-y-4 right-4 w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-y-auto z-50 p-6"
              style={{ boxShadow: '0 0 60px rgba(255,0,127,0.1)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gothic text-xl font-bold text-white">
                  {editing ? 'Editar' : 'Nova'} Sub-Categoria
                </h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Categoria Pai */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Categoria Pai *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="input-dark"
                  >
                    <option value="" style={{ background: '#0d0d0d' }}>Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} style={{ background: '#0d0d0d' }}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Nome *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    className="input-dark"
                    placeholder="Nome da sub-categoria"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="input-dark font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark resize-none"
                    rows={2}
                  />
                </div>

                <ImageUpload
                  label="Imagem da Sub-Categoria"
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                />

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isVisible}
                      onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                      className="w-4 h-4 accent-neon-pink"
                    />
                    <span className="text-sm text-white/60">Visível na loja</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="input-dark"
                  />
                </div>

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
                    {isLoading ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
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
