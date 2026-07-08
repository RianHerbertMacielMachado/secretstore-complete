'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
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
  category: { name: string }
}

interface FeaturedProductsProps {
  products: Product[]
  title: string
  showAll?: boolean
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: product.salePrice ?? product.price,
      image: product.mainImage,
      quantity: 1,
    })
    toast.success(`${product.name} adicionado ao carrinho!`)
  }

  const currentPrice = product.salePrice ?? product.price
  const hasDiscount = product.salePrice && product.salePrice < product.price

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link href={`/produtos/${product.slug}`}>
        <div className="card-product group h-72 sm:h-80">
          {/* Imagem de fundo */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.mainImage})` }}
          />

          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-card-overlay" />
          
          {/* Overlay hover extra */}
          <div className="absolute inset-0 bg-neon-pink/0 group-hover:bg-neon-pink/5 transition-all duration-300" />

          {/* Borda neon no hover */}
          <div className="absolute inset-0 border border-transparent group-hover:border-neon-pink/60 rounded-xl transition-all duration-300 shadow-[inset_0_0_0_0_rgba(255,0,127,0)] group-hover:shadow-[inset_0_0_30px_rgba(255,0,127,0.1)]" />

          {/* Categoria badge */}
          <div className="absolute top-3 left-3">
            <span className="badge-neon text-xs">
              {product.category.name}
            </span>
          </div>

          {/* Badges direita: OFERTA empilhado (pronto para adicionar DESTAQUE futuramente) */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {hasDiscount && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs font-medium">
                OFERTA
              </span>
            )}
          </div>

          {/* Conteúdo */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <h3 className="text-white font-bold text-lg sm:text-xl leading-tight mb-2 font-display">
              {product.name}
            </h3>

            {/* Preço - aparece no hover */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-neon-pink font-bold text-lg">
                  {formatCurrency(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-white/40 text-sm line-through">
                    {formatCurrency(product.price)}
                  </span>
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

export default function FeaturedProducts({ products, title, showAll }: FeaturedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="py-16 site-container">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-gothic text-3xl sm:text-4xl font-bold text-white">
              {title}
            </h2>
            <div className="w-24 h-0.5 bg-neon-gradient mt-3" />
          </div>

          {showAll && (
            <Link
              href="/produtos"
              className="text-neon-pink hover:text-neon-rose text-sm font-medium transition-colors border border-neon-pink/30 px-4 py-2 rounded-lg hover:border-neon-pink/60"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
