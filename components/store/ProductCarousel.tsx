'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { extractYoutubeId } from '@/lib/utils/helpers'

interface MediaItem {
  type: 'image' | 'youtube'
  url: string        // image URL or YouTube video URL
  videoId?: string   // extracted YouTube video ID
}

interface ProductCarouselProps {
  mainImage: string
  images: string[]
  youtubeUrl?: string | null
  productName: string
  discountBadge?: React.ReactNode
}

export default function ProductCarousel({
  mainImage,
  images,
  youtubeUrl,
  productName,
  discountBadge,
}: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  // Build media items list
  const mediaItems: MediaItem[] = (() => {
    const items: MediaItem[] = []

    // YouTube first (if present)
    if (youtubeUrl) {
      const videoId = extractYoutubeId(youtubeUrl)
      if (videoId) {
        items.push({ type: 'youtube', url: youtubeUrl, videoId })
      }
    }

    // Main image
    if (mainImage) {
      items.push({ type: 'image', url: mainImage })
    }

    // Additional images (filter duplicates)
    const extra = (images || []).filter((img) => img && img !== mainImage)
    extra.forEach((url) => items.push({ type: 'image', url }))

    return items
  })()

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  const scrollTo = (index: number) => emblaApi?.scrollTo(index)
  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  if (mediaItems.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-white/5 flex items-center justify-center">
        <span className="text-white/20 text-6xl">📦</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Carousel */}
      <div className="relative group">
        <div className="overflow-hidden rounded-2xl" style={{ boxShadow: '0 0 40px rgba(255,0,127,0.15)' }} ref={emblaRef}>
          <div className="flex">
            {mediaItems.map((item, idx) => (
              <div key={idx} className="relative flex-[0_0_100%] aspect-square">
                {item.type === 'youtube' && item.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${item.videoId}?rel=0&modestbranding=1`}
                    title={`${productName} — vídeo`}
                    className="w-full h-full rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={`${productName} — imagem ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discount Badge */}
        {discountBadge && (
          <div className="absolute top-4 left-4 z-10">
            {discountBadge}
          </div>
        )}

        {/* Navigation Arrows (show only if multiple items) */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-neon-pink/80 hover:border-neon-pink transition-all opacity-0 group-hover:opacity-100"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-neon-pink/80 hover:border-neon-pink transition-all opacity-0 group-hover:opacity-100"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {mediaItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={`transition-all rounded-full ${
                    selectedIndex === idx
                      ? 'w-5 h-2 bg-neon-pink shadow-neon-sm'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Ir para item ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                selectedIndex === idx
                  ? 'border-neon-pink shadow-neon-sm scale-105'
                  : 'border-white/10 hover:border-white/30'
              }`}
              aria-label={`Ver ${item.type === 'youtube' ? 'vídeo' : `imagem ${idx + 1}`}`}
            >
              {item.type === 'youtube' && item.videoId ? (
                <>
                  <img
                    src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                    alt="Miniatura do vídeo"
                    className="w-full h-full object-cover"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={12} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
