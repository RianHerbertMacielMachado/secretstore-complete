'use client'

import { useEffect, useRef } from 'react'

interface TickerItem {
  id: string
  text: string
}

interface Props {
  items: TickerItem[]
  speed?: string  // 'slow' | 'medium' | 'fast'
  color?: string  // cor hex dos textos
}

// Duração da animação em segundos por velocidade
const SPEED_MAP: Record<string, number> = {
  slow: 70,
  medium: 40,
  fast: 22,
}

/**
 * TopTicker — Faixa de avisos animada no topo da página
 * Rola horizontalmente em loop contínuo (CSS keyframes)
 * Os itens são separados por " /// "
 */
export default function TopTicker({ items, speed = 'medium', color = '#ffffff' }: Props) {
  if (!items || items.length === 0) return null

  const duration = SPEED_MAP[speed] || 40
  const texts = items.map((i) => i.text.toUpperCase())
  // Duplicamos o conteúdo para criar o loop seamless
  const content = [...texts, ...texts].join('   ///   ')

  return (
    <div
      className="w-full bg-[#0a0a0a] border-b border-white/10 overflow-hidden py-2.5 relative z-50"
      aria-label="Avisos e informações da loja"
      style={{ height: '36px' }}
    >
      <div
        className="whitespace-nowrap inline-flex items-center text-xs font-semibold tracking-widest"
        style={{
          animation: `top-ticker-scroll ${duration}s linear infinite`,
          color,
        }}
      >
        {/* Conteúdo duplicado para loop suave */}
        <span>{content}</span>
        <span className="ml-4">///</span>
        <span className="ml-4">{content}</span>
      </div>

      {/* Fades nas extremidades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />

      <style>{`
        @keyframes top-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
