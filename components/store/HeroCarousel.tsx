'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
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
}

/**
 * HeroCarousel — Carrossel configurável pelo admin
 * Cada item é uma imagem de fundo com overlay + nome centralizado
 * Auto-scroll suave com pause on hover, drag e setas de navegação
 */
export default function HeroCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const total = items.length

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total)
  }, [total])

  const goNext = useCallback(() => goTo(current + 1), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-play a cada 5 segundos
  useEffect(() => {
    if (isPaused || total <= 1) return
    intervalRef.current = setInterval(goNext, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPaused, goNext, total])

  // Drag / swipe handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    setIsPaused(true)
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragStartX(x)
  }

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
    const delta = x - dragStartX
    if (delta < -50) goNext()
    else if (delta > 50) goPrev()
    setTimeout(() => setIsPaused(false), 1000)
  }

  if (!items || items.length === 0) return null

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      style={{ height: 'clamp(280px, 45vw, 560px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchEnd={handleDragEnd}
    >
      {/* Slides */}
      {items.map((item, idx) => {
        const isActive = idx === current
        const isPrev = idx === (current - 1 + total) % total
        const isNext = idx === (current + 1) % total

        return (
          <Link
            key={item.id}
            href={item.link}
            draggable={false}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              isActive
                ? 'opacity-100 scale-100 z-10'
                : isPrev || isNext
                ? 'opacity-0 scale-105 z-0'
                : 'opacity-0 z-0'
            }`}
            onClick={(e) => { if (isDragging) e.preventDefault() }}
          >
            {/* Imagem de fundo */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url(${item.image})`, filter: 'blur(0px)' }}
            />

            {/* Overlay gradiente duplo: escurece bordas e mantém centro legível */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

            {/* Área da imagem com blur sutil nos extremos — deixa o nome em destaque */}
            <div
              className="absolute inset-0 backdrop-blur-[1px]"
              style={{
                maskImage: 'radial-gradient(ellipse 60% 40% at 50% 50%, transparent 30%, black 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 60% 40% at 50% 50%, transparent 30%, black 100%)',
              }}
            />

            {/* Nome centralizado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 z-10">
              <h2
                className="font-gothic text-white text-center leading-tight tracking-wide drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                  textShadow: '0 0 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.9)',
                }}
              >
                {item.name}
              </h2>
              {/* Linha decorativa */}
              <div className="mt-3 flex items-center gap-3 opacity-70">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-red-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-red-500" />
              </div>
            </div>
          </Link>
        )
      })}

      {/* Setas de navegação */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 hover:border-white/40 transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 hover:border-white/40 transition-all"
            aria-label="Próximo"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots de navegação */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`transition-all rounded-full ${
                idx === current
                  ? 'w-6 h-2 bg-red-500'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
