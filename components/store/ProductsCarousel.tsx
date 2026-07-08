'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react'
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
  featured?: boolean
  category: { name: string }
}

interface ProductCarouselProps {
  products: Product[]
  title: string
  showAll?: boolean
}

function CarouselCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
    <Link
      href={`/produtos/${product.slug}`}
      className="group relative flex-shrink-0 w-[260px] sm:w-[300px] rounded-xl overflow-hidden cursor-pointer"
      draggable={false}
    >
      {/* Imagem */}
      <div className="relative h-[170px] sm:h-[190px] overflow-hidden bg-gray-900">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Brilho neon no hover */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-neon-pink/70 rounded-xl transition-all duration-300 shadow-[inset_0_0_0_0_rgba(255,0,127,0)] group-hover:shadow-[inset_0_0_30px_rgba(255,0,127,0.12)]" />

        {/* Badges canto esquerdo: categoria */}
        <div className="absolute top-2.5 left-2.5">
          <span className="badge-neon text-[10px] px-2 py-0.5">
            {product.category.name}
          </span>
        </div>

        {/* Badges canto direito: OFERTA + DESTAQUE */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {hasDiscount && (
            <span className="px-2 py-0.5 bg-green-500/25 text-green-400 border border-green-500/40 rounded text-[10px] font-semibold backdrop-blur-sm">
              OFERTA
            </span>
          )}
          {product.featured && (
            <span className="px-2 py-0.5 bg-yellow-500/25 text-yellow-400 border border-yellow-500/40 rounded text-[10px] font-semibold backdrop-blur-sm flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-yellow-400" /> DESTAQUE
            </span>
          )}
        </div>
      </div>

      {/* Info bar — fundo escuro sólido */}
      <div className="bg-[#111318] border-t border-white/5 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm leading-tight truncate font-display">
            {product.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-neon-pink font-bold text-sm">
              {formatCurrency(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-white/35 text-xs line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-neon-pink hover:bg-neon-rose text-black text-xs font-bold rounded-lg transition-all duration-200 shadow-neon-sm hover:scale-105 active:scale-95"
          title="Adicionar ao carrinho"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Comprar</span>
        </button>
      </div>
    </Link>
  )
}

export default function ProductsCarousel({ products, title, showAll }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const posRef = useRef(0)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartPos = useRef(0)
  const isPaused = useRef(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Duplica os cards para criar loop infinito
  const SPEED = 0.5 // px por frame (~30px/s a 60fps)

  if (products.length === 0) return null

  // Duplicamos 3x para garantir seamless loop em qualquer largura de tela
  const loopedProducts = [...products, ...products, ...products]

  const CARD_WIDTH = 300 + 20 // width + gap (aprox)

  const getSingleSetWidth = useCallback(() => {
    return products.length * CARD_WIDTH
  }, [products.length])

  // Auto-scroll loop
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const singleW = getSingleSetWidth()

    const step = () => {
      if (!isPaused.current && !isDragging.current) {
        posRef.current += SPEED
        // Reset suave ao completar um ciclo (volta ao início do 2º set)
        if (posRef.current >= singleW) {
          posRef.current -= singleW
        }
        track.style.transform = `translateX(-${posRef.current}px)`
      }
      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [getSingleSetWidth])

  // Scroll manual com botões
  const scrollBy = (direction: 'left' | 'right') => {
    const singleW = getSingleSetWidth()
    const amount = CARD_WIDTH * 3
    if (direction === 'right') {
      posRef.current = Math.min(posRef.current + amount, singleW - 1)
    } else {
      posRef.current = Math.max(posRef.current - amount, 0)
    }
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.4s ease'
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      setTimeout(() => {
        if (trackRef.current) trackRef.current.style.transition = ''
      }, 420)
    }
  }

  // Drag/touch para arrastar
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartPos.current = posRef.current
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const delta = dragStartX.current - e.clientX
    const singleW = getSingleSetWidth()
    let next = dragStartPos.current + delta
    // Clamp dentro dos limites do loop
    if (next < 0) next = 0
    if (next >= singleW) next = singleW - 1
    posRef.current = next
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`
    }
  }

  const onPointerUp = () => {
    isDragging.current = false
  }

  return (
    <section className="py-14 overflow-hidden">
      {/* Header — respeita padding lateral, mas o carrossel vai de ponta a ponta */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-gothic text-3xl sm:text-4xl font-bold text-white">
              {title}
            </h2>
            <div className="w-24 h-0.5 bg-neon-gradient mt-3" />
          </div>

          <div className="flex items-center gap-3">
            {showAll && (
              <Link
                href="/produtos"
                className="text-neon-pink hover:text-neon-rose text-sm font-medium transition-colors border border-neon-pink/30 px-4 py-2 rounded-lg hover:border-neon-pink/60"
              >
                Ver todos →
              </Link>
            )}

            {/* Botões de navegação */}
            <div className="flex gap-2">
              <button
                onClick={() => scrollBy('left')}
                onMouseEnter={() => { isPaused.current = true }}
                onMouseLeave={() => { isPaused.current = false }}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:border-neon-pink/60 hover:bg-neon-pink/10 flex items-center justify-center text-white/60 hover:text-neon-pink transition-all duration-200"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollBy('right')}
                onMouseEnter={() => { isPaused.current = true }}
                onMouseLeave={() => { isPaused.current = false }}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:border-neon-pink/60 hover:bg-neon-pink/10 flex items-center justify-center text-white/60 hover:text-neon-pink transition-all duration-200"
                aria-label="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carrossel — ocupa 100vw, de borda a borda, sem padding lateral */}
      <div
        ref={containerRef}
        className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => { isPaused.current = true }}
        onMouseLeave={() => { isPaused.current = false; isDragging.current = false }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Fade esquerda — funde com o fundo do site */}
        <div
          className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #0a0a0f 0%, transparent 100%)' }}
        />
        {/* Fade direita — funde com o fundo do site */}
        <div
          className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0a0a0f 0%, transparent 100%)' }}
        />

        {/* Track — sem padding lateral para começar/terminar na borda */}
        <div
          ref={trackRef}
          className="flex gap-5 w-max pb-2 pt-1"
          style={{ willChange: 'transform' }}
        >
          {loopedProducts.map((product, i) => (
            <CarouselCard key={`${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
