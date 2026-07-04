'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, GripVertical, Image as ImageIcon, Link as LinkIcon, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageUpload } from '@/components/shared/ImageUpload'

interface CarouselItem {
  id: string
  name: string
  image: string
  link: string
  sortOrder: number
  isActive: boolean
}

interface Props {
  items: CarouselItem[]
}

const EMPTY_FORM = { name: '', image: '', link: '', sortOrder: 0, isActive: true }

export default function AdminCarrosselClient({ items: init }: Props) {
  const [items, setItems] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CarouselItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  const openEdit = (item: CarouselItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      image: item.image,
      link: item.link,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.image.trim()) { toast.error('Imagem é obrigatória'); return }
    if (!form.link.trim()) { toast.error('Link é obrigatório'); return }

    setIsLoading(true)
    try {
      const url = editing ? `/api/admin/carousel/${editing.id}` : '/api/admin/carousel'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')

      if (editing) {
        setItems((prev) => prev.map((i) => (i.id === editing.id ? data.item : i)))
        toast.success('Item atualizado!')
      } else {
        setItems((prev) => [...prev, data.item])
        toast.success('Item adicionado!')
      }
      setShowForm(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este item do carrossel?')) return
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Item removido!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleActive = async (item: CarouselItem) => {
    try {
      const res = await fetch(`/api/admin/carousel/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)))
      toast.success(data.item.isActive ? 'Item ativado' : 'Item desativado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Carrossel da Home</h1>
          <p className="text-white/40 text-sm mt-1">
            Gerencie os itens exibidos no carrossel da página inicial
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Adicionar Item
        </button>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {editing ? 'Editar Item' : 'Novo Item do Carrossel'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Mapa Exclusivo Temporada 3"
                  className="input-dark w-full"
                  required
                />
                <p className="text-xs text-white/30 mt-1">Texto exibido centralizado sobre a imagem</p>
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Imagem de Fundo <span className="text-red-400">*</span>
                </label>
                <ImageUpload
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                />
                <p className="text-xs text-white/30 mt-1">Recomendado: 1920×600px. JPG/PNG/WEBP, máx. 5MB</p>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Link de Redirecionamento <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="Ex: /categorias/showcase ou https://..."
                    className="input-dark w-full pl-9"
                    required
                  />
                </div>
              </div>

              {/* Ordem + Ativo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="input-dark w-full"
                    min={0}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.isActive ? 'bg-neon-pink' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-sm text-white/70">Visível no site</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                  {isLoading ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Adicionar ao Carrossel'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="btn-outline px-6"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de itens */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhum item no carrossel</p>
          <p className="text-sm mt-1">Clique em "Adicionar Item" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => (
              <motion.div
                key={item.id}
                layout
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Preview imagem */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">{item.name}</span>
                      {!item.isActive && (
                        <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded">
                          Oculto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <LinkIcon size={12} className="text-white/30 flex-shrink-0" />
                      <span className="text-xs text-white/40 truncate">{item.link}</span>
                    </div>
                    <span className="text-xs text-white/25 mt-1 block">Ordem: {item.sortOrder}</span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      title={item.isActive ? 'Desativar' : 'Ativar'}
                      className={`p-2 rounded-lg transition-colors ${item.isActive ? 'text-green-400 hover:bg-green-400/10' : 'text-white/30 hover:bg-white/5'}`}
                    >
                      {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Dica */}
      {items.length > 0 && (
        <p className="text-xs text-white/25 text-center mt-6">
          {items.filter((i) => i.isActive).length} de {items.length} itens visíveis no carrossel
        </p>
      )}
    </div>
  )
}
