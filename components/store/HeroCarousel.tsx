'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselItem {
  id: string
  name: string
  image: string
  link: string
}

interface Props {
  items: CarouselItem[]
  title?: string
}

/**
 * HeroCarousel — Carrossel configurável pelo admin
 * Miniaturas lado a lado rolando infinitamente (estilo ProductsCarousel)
 * Lista triplicada para loop seamless · auto-scroll · drag · setas
 */
export default function HeroCarousel({ items, title = 'Destaques' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const posRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Triplicar para loop seamless
  const tripled = items.length > 0 ? [...items, ...items, ...items] : []

  const CARD_W = 220   // largura do card em px (inclui gap)
  const SPEED = 0.5    // px por frame (~30px/s a 60fps)

  // Largura total de um terço da lista (para resetar o loop)
  const segmentW = items.length * CARD_W

  // Inicia no terço do meio para poder rolar para ambos os lados
  useEffect(() => {
    if (!trackRef.current || segmentW === 0) return
    posRef.current = segmentW
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`
  }, [segmentW])

  // Auto-scroll com requestAnimationFrame
  useEffect(() => {
    if (items.length === 0) return

    const animate = () => {
      if (!isPausedRef.current && !isDraggingRef.current && trackRef.current) {
        posRef.current += SPEED

        // Quando ultrapassa o 2º terço, volta para o 1º terço (loop seamless)
        if (posRef.current >= segmentW * 2) {
          posRef.current -= segmentW
        }
        // Quando recua antes do 1º terço, vai para o 2º terço
        if (posRef.current < segmentW) {
          posRef.current += segmentW
        }

        trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [segmentW])

  // Scroll manual com setas
  const scrollBy = (direction: 'left' | 'right') => {
    const delta = direction === 'right' ? CARD_W * 3 : -CARD_W * 3
    posRef.current += delta
    // Clamp no loop
    if (posRef.current >= segmentW * 2) posRef.current -= segmentW
    if (posRef.current < segmentW) posRef.current += segmentW
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.35s ease'
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      setTimeout(() => {
        if (trackRef.current) trackRef.current.style.transition = ''
      }, 360)
    }
  }

  // Drag handlers (mouse + touch)
  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true
    isPausedRef.current = true
    dragStartXRef.current = 'touches' in e ? e.touches[0].clientX : e.clientX
    dragStartPosRef.current = posRef.current
    if (trackRef.current) trackRef.current.style.transition = ''
  }

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    const delta = dragStartXRef.current - x
    posRef.current = dragStartPosRef.current + delta
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`
  }

  const onDragEnd = () => {
    isDraggingRef.current = false
    // Clamp no loop
    if (posRef.current >= segmentW * 2) posRef.current -= segmentW
    if (posRef.current < segmentW) posRef.current += segmentW
    setTimeout(() => { isPausedRef.current = false }, 800)
  }

  if (items.length === 0) return null

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-gothic text-2xl font-bold text-white">{title}</h2>
            <div className="h-0.5 w-12 bg-red-600 mt-1 rounded-full" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy('left')}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy('right')}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
              aria-label="Próximo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Track container */}
        <div
          className="relative overflow-hidden select-none"
          onMouseEnter={() => { isPausedRef.current = true }}
          onMouseLeave={() => { if (!isDraggingRef.current) isPausedRef.current = false }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        >
          {/* Fades laterais */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--dark-bg,#0a0a0a)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--dark-bg,#0a0a0a)] to-transparent z-10 pointer-events-none" />

          {/* Faixa rolante */}
          <div
            ref={trackRef}
            className="flex gap-4 will-change-transform"
            style={{ width: `${tripled.length * CARD_W}px` }}
          >
            {tripled.map((item, idx) => (
              <CarouselItemCard key={`${item.id}-${idx}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Card individual do carrossel
function CarouselItemCard({ item }: { item: CarouselItem }) {
  return (
    <Link
      href={item.link}
      draggable={false}
      className="group relative flex-shrink-0 rounded-xl overflow-hidden border border-white/10 hover:border-red-500/50 transition-all duration-300"
      style={{ width: '204px', height: '260px' }}
    >
      {/* Imagem de fundo */}
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-white/5" />
      )}

      {/* Overlay gradiente — escurece embaixo para o texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Blur sutil nas bordas laterais */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* Nome */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-sm">
          {item.name}
        </p>
        {/* Indicador de clique */}
        <span className="text-red-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver mais →
        </span>
      </div>
    </Link>
  )
}
