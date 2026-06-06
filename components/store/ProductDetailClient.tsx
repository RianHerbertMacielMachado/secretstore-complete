'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Tag, Star, ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/helpers'
import { useCartStore } from '@/stores/cartStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  salePrice: number | null
  mainImage: string
  images: string[]
  category: { name: string; slug: string }
  driveDeliveryMethod: string
}

export default function ProductDetailClient({
  product,
  related,
}: {
  product: Product
  related: Product[]
}) {
  const [selectedImage, setSelectedImage] = useState(product.mainImage)
  const addItem = useCartStore((s) => s.addItem)

  const currentPrice = product.salePrice ?? product.price
  const hasDiscount = product.salePrice && product.salePrice < product.price
  const discountPct = hasDiscount
    ? Math.round(((product.price - currentPrice) / product.price) * 100)
    : 0

  const allImages = [product.mainImage, ...(product.images.filter(i => i !== product.mainImage))]

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.mainImage,
      quantity: 1,
    })
    toast.success(`${product.name} adicionado ao carrinho!`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
        <Link href="/" className="hover:text-neon-pink transition-colors">Início</Link>
        <span>/</span>
        <Link href={`/categorias/${product.category.slug}`} className="hover:text-neon-pink transition-colors">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-white/70">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Imagens */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden mb-4"
            style={{ boxShadow: '0 0 40px rgba(255,0,127,0.15)' }}
          >
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
            {hasDiscount && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-neon-pink text-black text-sm font-bold rounded-full shadow-neon">
                -{discountPct}%
              </div>
            )}
          </motion.div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === img ? 'border-neon-pink shadow-neon-sm' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-2">
            <Link href={`/categorias/${product.category.slug}`} className="badge-neon text-xs">
              {product.category.name}
            </Link>
          </div>

          <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white mb-4 mt-3 leading-tight">
            {product.name}
          </h1>

          {/* Avaliação */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={16} className="text-neon-pink fill-neon-pink" />
            ))}
            <span className="text-white/40 text-sm ml-1">(5.0)</span>
          </div>

          {/* Preço */}
          <div className="mb-6 p-5 bg-white/3 border border-white/10 rounded-xl">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-neon-pink font-gothic" style={{
                textShadow: '0 0 20px rgba(255,0,127,0.4)'
              }}>
                {formatCurrency(currentPrice)}
              </span>
              {hasDiscount && (
                <div>
                  <span className="text-xl text-white/30 line-through block">{formatCurrency(product.price)}</span>
                  <span className="text-green-400 text-sm font-medium">
                    Economia de {formatCurrency(product.price - currentPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Entrega */}
          <div className="flex items-center gap-2 text-sm text-green-400/80 mb-6 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <span>⚡</span>
            <span>Entrega imediata via Google Drive após confirmação do pagamento</span>
          </div>

          {/* Botão */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            className="w-full btn-neon-solid py-4 text-lg rounded-xl flex items-center justify-center gap-3 mb-4"
          >
            <ShoppingCart size={22} />
            Adicionar ao Carrinho
          </motion.button>

          <Link href="/carrinho" className="w-full block text-center btn-ghost py-4 rounded-xl">
            Ir para o Carrinho
          </Link>

          {/* Descrição */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="font-gothic text-lg font-semibold text-white mb-4">Sobre o Produto</h3>
            <p className="text-white/60 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Produtos Relacionados */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-gothic text-2xl font-bold text-white mb-8">Você também pode gostar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/produtos/${p.slug}`}>
                <div className="card-product group h-56">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${p.mainImage})` }} />
                  <div className="absolute inset-0 bg-card-overlay" />
                  <div className="absolute bottom-0 p-4">
                    <p className="text-white text-sm font-medium">{p.name}</p>
                    <p className="text-neon-pink text-sm">{formatCurrency(p.salePrice ?? p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
