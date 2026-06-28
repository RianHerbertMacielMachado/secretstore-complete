'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, X, Package, Youtube } from 'lucide-react'
import { formatCurrency, slugify } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'
import { ImageUpload, MultiImageUpload } from '@/components/shared/ImageUpload'

interface SubCategory {
  id: string
  name: string
  category: { id: string; name: string }
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  mainImage: string
  status: string
  featured: boolean
  youtubeUrl: string | null
  subCategory: { id: string; name: string; category: { id: string; name: string } }
  subCategoryId: string
  description: string
  driveLink: string
  driveDeliveryMethod: string
  images: string[]
}

interface Props {
  products: Product[]
  subCategories: SubCategory[]
}

const emptyForm = (defaultSubCategoryId = '') => ({
  name: '',
  slug: '',
  description: '',
  price: '',
  salePrice: '',
  mainImage: '',
  images: [] as string[],
  youtubeUrl: '',
  subCategoryId: defaultSubCategoryId,
  driveLink: '',
  driveDeliveryMethod: 'LINK',
  status: 'ACTIVE',
  featured: false,
})

export default function AdminProdutosClient({ products: initialProducts, subCategories }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState(emptyForm(subCategories[0]?.id || ''))

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subCategory.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subCategory.category.name.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm(emptyForm(subCategories[0]?.id || ''))
    setEditingProduct(null)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      salePrice: product.salePrice?.toString() || '',
      mainImage: product.mainImage,
      images: product.images || [],
      youtubeUrl: product.youtubeUrl || '',
      subCategoryId: product.subCategoryId,
      driveLink: product.driveLink,
      driveDeliveryMethod: product.driveDeliveryMethod,
      status: product.status,
      featured: product.featured,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const payload = {
        ...form,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        youtubeUrl: form.youtubeUrl || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...data.product } : p))
        toast.success('Produto atualizado!')
      } else {
        setProducts([data.product, ...products])
        toast.success('Produto criado!')
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
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setProducts(products.filter(p => p.id !== id))
      toast.success('Produto excluído!')
    } catch {
      toast.error('Erro ao excluir produto')
    }
  }

  // Group subCategories by parent category
  const groupedSubCategories = subCategories.reduce((acc, sub) => {
    const catName = sub.category.name
    if (!acc[catName]) acc[catName] = []
    acc[catName].push(sub)
    return acc
  }, {} as Record<string, SubCategory[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Produtos</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-neon-solid flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="input-dark pl-10"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Produto</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Preço</th>
                <th className="text-left p-4 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-right p-4 text-xs font-medium text-white/40 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/30">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.mainImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            <img src={product.mainImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-white/20" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-white/30">{product.slug}</p>
                            {product.youtubeUrl && (
                              <span title="Tem vídeo YouTube">
                                <Youtube size={12} className="text-red-400" />
                              </span>
                            )}
                            {product.images?.length > 0 && (
                              <span className="text-xs text-white/20">📷 {product.images.length}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div>
                        <span className="badge-neon">{product.subCategory.name}</span>
                        <p className="text-xs text-white/30 mt-1">{product.subCategory.category.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="text-neon-pink text-sm font-medium">
                          {formatCurrency(product.salePrice ?? product.price)}
                        </span>
                        {product.salePrice && (
                          <span className="text-white/30 text-xs line-through block">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={product.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}>
                        {product.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-white/40 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
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

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-y-4 right-4 w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-y-auto z-50 p-6"
              style={{ boxShadow: '0 0 60px rgba(255,0,127,0.1)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gothic text-xl font-bold text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Nome *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    className="input-dark"
                    placeholder="Nome do produto"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="input-dark font-mono text-sm"
                    placeholder="slug-do-produto"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Descrição *</label>
                  <textarea
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-dark min-h-[80px] resize-none"
                    placeholder="Descrição do produto"
                  />
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Preço (R$) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input-dark"
                      placeholder="29.90"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Preço Promocional</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.salePrice}
                      onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                      className="input-dark"
                      placeholder="19.90"
                    />
                  </div>
                </div>

                {/* Imagem Principal */}
                <ImageUpload
                  label="Imagem Principal"
                  required
                  value={form.mainImage}
                  onChange={(url) => setForm(prev => ({ ...prev, mainImage: url }))}
                />

                {/* Múltiplas Imagens */}
                <MultiImageUpload
                  label="Galeria de Imagens"
                  images={form.images}
                  onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))}
                />

                {/* YouTube URL */}
                <div>
                  <label className="block text-xs text-white/60 mb-1 flex items-center gap-1.5">
                    <Youtube size={13} className="text-red-400" />
                    Link do YouTube (opcional)
                  </label>
                  <input
                    type="url"
                    value={form.youtubeUrl}
                    onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                    className="input-dark"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-white/30 mt-1">
                    O vídeo aparecerá como primeiro item no carrossel do produto
                  </p>
                </div>

                {/* Sub-Categoria */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Sub-Categoria *</label>
                  <select
                    required
                    value={form.subCategoryId}
                    onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })}
                    className="input-dark"
                  >
                    <option value="" style={{ background: '#0d0d0d' }}>Selecione uma sub-categoria</option>
                    {Object.entries(groupedSubCategories).map(([catName, subs]) => (
                      <optgroup key={catName} label={catName}>
                        {subs.map((sub) => (
                          <option key={sub.id} value={sub.id} style={{ background: '#0d0d0d' }}>
                            {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Drive */}
                <div>
                  <label className="block text-xs text-white/60 mb-1">Link do Google Drive *</label>
                  <input
                    required
                    value={form.driveLink}
                    onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
                    className="input-dark"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Método de Entrega</label>
                  <select
                    value={form.driveDeliveryMethod}
                    onChange={(e) => setForm({ ...form, driveDeliveryMethod: e.target.value })}
                    className="input-dark"
                  >
                    <option value="LINK" style={{ background: '#0d0d0d' }}>Link Direto</option>
                    <option value="FOLDER" style={{ background: '#0d0d0d' }}>Pasta Compartilhada</option>
                    <option value="PERMISSION" style={{ background: '#0d0d0d' }}>Conceder Permissão</option>
                  </select>
                </div>

                {/* Status + Featured */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="input-dark"
                    >
                      <option value="ACTIVE" style={{ background: '#0d0d0d' }}>Ativo</option>
                      <option value="INACTIVE" style={{ background: '#0d0d0d' }}>Inativo</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="w-4 h-4 accent-neon-pink"
                      />
                      <span className="text-sm text-white/60">Em Destaque</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
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
                    {isLoading ? 'Salvando...' : editingProduct ? 'Salvar' : 'Criar'}
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
