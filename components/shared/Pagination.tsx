'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  // Build page number array with ellipsis
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const pages = getPages()

  return (
    <div className="flex items-center justify-center gap-2 mt-12 select-none">
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-white/50
                   hover:border-neon-pink/50 hover:text-neon-pink disabled:opacity-30 disabled:cursor-not-allowed
                   transition-all"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-white/30 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all
              ${
                currentPage === p
                  ? 'bg-neon-pink text-black shadow-neon-sm border border-neon-pink'
                  : 'border border-white/10 text-white/60 hover:border-neon-pink/50 hover:text-neon-pink'
              }`}
            aria-label={`Página ${p}`}
            aria-current={currentPage === p ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-white/50
                   hover:border-neon-pink/50 hover:text-neon-pink disabled:opacity-30 disabled:cursor-not-allowed
                   transition-all"
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </button>

      {/* Counter */}
      <span className="ml-3 text-xs text-white/30">
        {currentPage} / {totalPages}
      </span>
    </div>
  )
}
