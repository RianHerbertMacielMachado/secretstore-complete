'use client'

import { useEffect, useRef } from 'react'
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

const CARD_W = 208  // largura do card em px
const GAP = 16      // gap entre cards em px
const STEP = CARD_W + GAP
const SPEED = 0.6   // px por frame

export default function HeroCarousel({ items, title = 'Destaques' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const rafRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)

  // Garante que temos itens suficientes para nunca mostrar vazio
  // Duplicamos até ter pelo menos 12 cópias ou cobrir 3000px
  if (items.length === 0) return null

  const minCopies = Math.max(4, Math.ceil(3200 / (items.length * STEP)) + 2)
  const repeated: CarouselItem[] = []
  for (let i = 0; i < minCopies; i++) {
    items.forEach((item) => repeated.push(item))
  }

  // Largura de um bloco original
  const blockW = items.length * STEP

  // Inicia no 2º bloco para permitir scroll nos dois sentidos
  useEffect(() => {
    posRef.current = blockW
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`
    }
  }, [blockW])

  // Auto-scroll
  useEffect(() => {
    const animate = () => {
      if (!isPausedRef.current && !isDraggingRef.current && trackRef.current) {
        posRef.current += SPEED
        // Loop: quando passa do final do 2º bloco, volta ao início do 2º bloco
        if (posRef.current >= blockW * (minCopies - 2)) {
          posRef.current -= blockW * (minCopies - 4)
        }
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [blockW, minCopies])

  const scrollBy = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    const delta = dir === 'right' ? STEP * 3 : -STEP * 3
    posRef.current += delta
    if (posRef.current >= blockW * (minCopies - 2)) posRef.current -= blockW * (minCopies - 4)
    if (posRef.current < blockW) posRef.current += blockW
    trackRef.current.style.transition = 'transform 0.35s ease'
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`
    setTimeout(() => { if (trackRef.current) trackRef.current.style.transition = '' }, 360)
  }

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
    posRef.current = dragStartPosRef.current + (dragStartXRef.current - x)
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`
  }

  const onDragEnd = () => {
    isDraggingRef.current = false
    setTimeout(() => { isPausedRef.current = false }, 600)
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-gothic text-2xl font-bold text-white">{title}</h2>
            <div className="h-0.5 w-12 bg-red-600 mt-1 rounded-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => scrollBy('left')}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollBy('right')}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Track */}
        <div
          className="relative overflow-hidden select-none"
          style={{ cursor: 'grab' }}
          onMouseEnter={() => { isPausedRef.current = true }}
          onMouseLeave={() => { onDragEnd(); isPausedRef.current = false }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          {/* Fades laterais */}
          <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, var(--dark-bg, #0a0a0a), transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, var(--dark-bg, #0a0a0a), transparent)' }} />

          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{ gap: `${GAP}px`, width: `${repeated.length * STEP}px` }}
          >
            {repeated.map((item, idx) => (
              <ItemCard key={`${item.id}-${idx}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ItemCard({ item }: { item: CarouselItem }) {
  return (
    <Link
      href={item.link}
      draggable={false}
      className="group relative flex-shrink-0 rounded-xl overflow-hidden border border-white/10 hover:border-red-500/50 transition-colors duration-300"
      style={{ width: `${CARD_W}px`, height: '260px' }}
    >
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Nome */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{item.name}</p>
        <span className="text-red-400 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity block">
          Ver mais →
        </span>
      </div>
    </Link>
  )
}
