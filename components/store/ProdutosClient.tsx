'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, Grid3X3, List } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/helpers'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  mainImage: string
  featured: boolean
  status: string
  category: { id: string; name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  products: Product[]
  categories: Category[]
  activeCategory: string
  searchQuery: string
  sortOrder: string
  subCategoryName?: string
  categoryName?: string
  categorySlug?: string
}

function ProductCard({ product, index, view }: { product: Product; index: number; view: 'grid' | 'list' }) {
  const addItem = useCartStore((s) => s.addItem)
  const currentPrice = product.salePrice ?? product.price
  const hasDiscount = product.salePrice && product.salePrice < product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({ id: product.id, name: product.name, price: currentPrice, image: product.mainImage, quantity: 1 })
    toast.success(`${product.name} adicionado!`)
  }

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Link href={`/produtos/${product.slug}`}>
          <div className="flex gap-4 items-center bg-[#0d0d0d] border border-white/10 rounded-xl p-4 hover:border-neon-pink/40 transition-all group">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundImage: `url(${product.mainImage})` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-neon-pink/70 font-medium">{product.category.name}</span>
              <h3 className="text-white font-semibold mt-0.5 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neon-pink font-bold">{formatCurrency(currentPrice)}</span>
                {hasDiscount && (
                  <span className="text-white/30 text-sm line-through">{formatCurrency(product.price)}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-shrink-0 px-4 py-2 bg-neon-pink text-black text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-neon-rose shadow-neon-sm"
            >
              + Carrinho
            </button>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link href={`/produtos/${product.slug}`}>
        <div className="card-product group h-72 sm:h-80">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.mainImage})` }}
          />
          <div className="absolute inset-0 bg-card-overlay" />
          <div className="absolute inset-0 bg-neon-pink/0 group-hover:bg-neon-pink/5 transition-all duration-300" />
          <div className="absolute inset-0 border border-transparent group-hover:border-neon-pink/60 rounded-xl transition-all duration-300" />

          <div className="absolute top-4 left-4 flex gap-2">
            <span className="badge-neon text-xs">{product.category.name}</span>
            {hasDiscount && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium">
                OFERTA
              </span>
            )}
          </div>

          {product.featured && (
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium">
                ⭐ DESTAQUE
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <h3 className="text-white font-bold text-lg sm:text-xl leading-tight mb-2 font-display">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-neon-pink font-bold text-lg">{formatCurrency(currentPrice)}</span>
                {hasDiscount && (
                  <span className="text-white/40 text-sm line-through">{formatCurrency(product.price)}</span>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="px-4 py-2 bg-neon-pink text-black text-sm font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-neon-rose shadow-neon-sm"
              >
                + Carrinho
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

const SORT_OPTIONS = [
  { value: 'recentes', label: 'Mais Recentes' },
  { value: 'preco-asc', label: 'Menor Preço' },
  { value: 'preco-desc', label: 'Maior Preço' },
  { value: 'nome', label: 'Nome A-Z' },
]

export default function ProdutosClient({ products, categories, activeCategory, searchQuery, sortOrder, subCategoryName, categoryName, categorySlug }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const updateParams = (params: Record<string, string>) => {
    const sp = new URLSearchParams()
    if (params.categoria) sp.set('categoria', params.categoria)
    if (params.busca) sp.set('busca', params.busca)
    if (params.ordem && params.ordem !== 'recentes') sp.set('ordem', params.ordem)
    const q = sp.toString()
    router.push(`/produtos${q ? `?${q}` : ''}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ categoria: activeCategory, busca: search, ordem: sortOrder })
  }

  const handleCategory = (slug: string) => {
    updateParams({ categoria: slug, busca: search, ordem: sortOrder })
  }

  const handleSort = (value: string) => {
    updateParams({ categoria: activeCategory, busca: search, ordem: value })
  }

  const handleClearSearch = () => {
    setSearch('')
    updateParams({ categoria: activeCategory, busca: '', ordem: sortOrder })
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero Banner */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,0,127,0.08)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-gothic text-4xl sm:text-5xl font-bold text-white mb-3"
          >
            {subCategoryName
              ? subCategoryName
              : activeCategory
              ? categories.find((c) => c.slug === activeCategory)?.name || 'Produtos'
              : 'Todos os Produtos'}
          </motion.h1>
          {subCategoryName && categoryName && (
            <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
              <a href={`/categorias`} className="hover:text-neon-pink transition-colors">Categorias</a>
              <span>/</span>
              <a href={`/categorias/${categorySlug}`} className="hover:text-neon-pink transition-colors">{categoryName}</a>
              <span>/</span>
              <span className="text-white/60">{subCategoryName}</span>
            </div>
          )}
          <p className="text-white/40 text-lg">
            {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="input-dark pl-10 pr-10 w-full"
            />
            {search && (
              <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={16} />
              </button>
            )}
          </form>

          <div className="flex items-center gap-3">
            <select
              value={sortOrder}
              onChange={(e) => handleSort(e.target.value)}
              className="input-dark text-sm pr-8 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="flex border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/40 hover:text-white'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2.5 transition-colors ${view === 'list' ? 'bg-neon-pink/20 text-neon-pink' : 'text-white/40 hover:text-white'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 mb-8">
          <button
            onClick={() => handleCategory('')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-neon-pink text-black shadow-neon-sm'
                : 'bg-white/5 text-white/60 border border-white/10 hover:border-neon-pink/40 hover:text-neon-pink'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.slug)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.slug
                  ? 'bg-neon-pink text-black shadow-neon-sm'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-neon-pink/40 hover:text-neon-pink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-4"
          >
            <span className="text-6xl">🔍</span>
            <p className="text-white/40 text-lg">Nenhum produto encontrado</p>
            <button
              onClick={() => { setSearch(''); updateParams({ categoria: '', busca: '', ordem: 'recentes' }) }}
              className="btn-ghost text-sm px-6 py-2 rounded-lg mt-2"
            >
              Limpar filtros
            </button>
          </motion.div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} view="grid" />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} view="list" />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
