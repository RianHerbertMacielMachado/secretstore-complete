'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, FolderOpen } from 'lucide-react'
import { slugify } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageUpload } from '@/components/shared/ImageUpload'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  isVisible: boolean
  sortOrder: number
  _count: { subCategories: number }
}

export default function AdminCategoriasClient({ categories: init }: { categories: Category[] }) {
  const [categories, setCategories] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', image: '', isVisible: true, sortOrder: 0,
  })

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', image: '', isVisible: true, sortOrder: 0 })
    setEditing(null)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || '',
      image: cat.image || '', isVisible: cat.isVisible, sortOrder: cat.sortOrder,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      if (editing) {
        setCategories(categories.map(c =>
          c.id === editing.id ? { ...c, ...data.category, _count: c._count } : c
        ))
        toast.success('Categoria atualizada!')
      } else {
        setCategories([{ ...data.category, _count: { subCategories: 0 } }, ...categories])
        toast.success('Categoria criada!')
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
    if (!confirm('Excluir esta categoria? Todas as sub-categorias serão removidas.')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setCategories(categories.filter(c => c.id !== id))
      toast.success('Categoria excluída!')
    } catch { toast.error('Erro ao excluir categoria') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Categorias</h1>
          <p className="text-white/40 text-sm mt-1">{categories.length} categorias</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-neon-solid flex items-center gap-2"
        >
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden hover:border-neon-pink/30 transition-all"
          >
            {cat.image && (
              <div className="h-28 overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
            )}
            {!cat.image && (
              <div className="h-28 bg-white/3 flex items-center justify-center">
                <FolderOpen size={32} className="text-white/10" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{cat.name}</h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cat)} className="p-1.5 text-white/40 hover:text-neon-pink transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {cat.description && <p className="text-sm text-white/50 mb-3 line-clamp-2">{cat.description}</p>}
              <div className="flex items-center gap-3">
                <span className={cat.isVisible ? 'badge-green' : 'badge-red'}>
                  {cat.isVisible ? 'Visível' : 'Oculta'}
                </span>
                <span className="text-xs text-white/30">{cat._count.subCategories} sub-categorias</span>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/30">
            Nenhuma categoria cadastrada
          </div>
        )}
      </div>

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
                  {editing ? 'Editar' : 'Nova'} Categoria
                </h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Nome *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    className="input-dark"
                    placeholder="Nome da categoria"
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
                  label="Imagem da Categoria"
                  value={form.image}
                  onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
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
