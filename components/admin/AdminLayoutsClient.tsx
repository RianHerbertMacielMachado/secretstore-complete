'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export const LAYOUTS = [
  {
    id: 'dark-grunge',
    name: 'Dark Grunge',
    description: 'Texturas pesadas, grid masonry com profundidade e sombras intensas',
    preview: 'from-gray-900 via-black to-gray-800',
    accent: '#8B0000',
    accentName: 'Crimson',
    icon: '🖤',
    tags: ['Dark', 'Grunge', 'Masonry'],
  },
  {
    id: 'neon-minimal',
    name: 'Neon Minimal',
    description: 'Layout limpo com efeitos neon intensos e espaço negativo estratégico',
    preview: 'from-black via-black to-zinc-950',
    accent: '#00ff88',
    accentName: 'Neon Green',
    icon: '⚡',
    tags: ['Minimal', 'Neon', 'Clean'],
  },
  {
    id: 'elegant-gothic',
    name: 'Elegant Gothic',
    description: 'Split hero, cards elegantes com tipografia refinada e cores suaves',
    preview: 'from-purple-950 via-black to-purple-900',
    accent: '#9333ea',
    accentName: 'Purple',
    icon: '🌹',
    tags: ['Gothic', 'Elegant', 'Purple'],
  },
  {
    id: 'street-punk',
    name: 'Street Punk',
    description: 'Layout assimétrico com elementos punk, texturas ásperas e atitude',
    preview: 'from-yellow-950 via-black to-red-950',
    accent: '#facc15',
    accentName: 'Yellow',
    icon: '💀',
    tags: ['Punk', 'Street', 'Raw'],
  },
  {
    id: 'anime-shop',
    name: 'Anime Shop',
    description: 'Kawaii gótico com cards arredondados, gradientes suaves e vibração',
    preview: 'from-pink-950 via-black to-rose-950',
    accent: '#ec4899',
    accentName: 'Hot Pink',
    icon: '🌸',
    tags: ['Kawaii', 'Anime', 'Pink'],
  },
  {
    id: 'ultra-minimal',
    name: 'Ultra Minimal',
    description: 'Extremamente limpo com foco total nos produtos e tipografia elegante',
    preview: 'from-zinc-950 via-black to-zinc-900',
    accent: '#ffffff',
    accentName: 'White',
    icon: '◻',
    tags: ['Minimal', 'Clean', 'Focus'],
  },
]

export default function AdminLayoutsClient({ activeLayout: initialActive }: { activeLayout: string }) {
  const [activeLayout, setActiveLayout] = useState(initialActive)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleActivate = async (layoutId: string) => {
    if (layoutId === activeLayout) return
    setIsLoading(true)
    setLoadingId(layoutId)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'active_layout', value: layoutId }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setActiveLayout(layoutId)
      const name = LAYOUTS.find((l) => l.id === layoutId)?.name
      toast.success(`Layout "${name}" ativado com sucesso!`)
    } catch {
      toast.error('Erro ao ativar layout. Tente novamente.')
    } finally {
      setIsLoading(false)
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-gothic text-2xl font-bold text-white">Layouts da Loja</h1>
          <p className="text-white/40 text-sm mt-1">
            Ativo: <span className="text-neon-pink font-medium">{LAYOUTS.find((l) => l.id === activeLayout)?.name}</span>
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-sm text-white/40 hover:text-neon-pink transition-colors border border-white/10 hover:border-neon-pink/40 px-4 py-2 rounded-lg"
        >
          <ExternalLink size={14} />
          Ver Loja
        </Link>
      </div>

      {/* Active Layout Banner */}
      <div className="p-4 bg-neon-pink/5 border border-neon-pink/20 rounded-xl flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
        <p className="text-sm text-white/70">
          O layout <span className="text-neon-pink font-semibold">{LAYOUTS.find((l) => l.id === activeLayout)?.name}</span> está ativo na sua loja agora.
          Alterações são aplicadas imediatamente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LAYOUTS.map((layout, i) => {
          const isActive = activeLayout === layout.id
          const isLoadingThis = loadingId === layout.id
          return (
            <motion.div
              key={layout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-[#0d0d0d] border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                isActive ? 'border-neon-pink shadow-neon' : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* Preview */}
              <div className={`h-44 bg-gradient-to-br ${layout.preview} relative overflow-hidden`}>
                {/* Simulated store preview */}
                <div className="absolute inset-0 p-4 flex flex-col gap-2">
                  {/* Navbar mock */}
                  <div className="flex items-center justify-between h-6">
                    <div className="h-3 w-20 rounded" style={{ background: layout.accent, opacity: 0.8 }} />
                    <div className="flex gap-2">
                      <div className="h-2 w-8 bg-white/20 rounded" />
                      <div className="h-2 w-8 bg-white/20 rounded" />
                      <div className="h-4 w-12 rounded" style={{ background: layout.accent, opacity: 0.6 }} />
                    </div>
                  </div>
                  {/* Hero mock */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                    <span className="text-2xl">{layout.icon}</span>
                    <div className="h-2 w-28 bg-white/30 rounded" />
                    <div className="h-1.5 w-20 bg-white/20 rounded" />
                    <div className="h-5 w-16 rounded mt-1" style={{ background: layout.accent, opacity: 0.7 }} />
                  </div>
                  {/* Cards mock */}
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex-1 h-10 bg-black/30 rounded-lg border border-white/10" />
                    ))}
                  </div>
                </div>

                {/* Accent color bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${layout.accent}, transparent)` }} />

                {isActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-neon-pink text-black text-xs font-bold rounded-full shadow-neon-sm">
                    <Check size={10} />
                    ATIVO
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-gothic font-bold text-white">{layout.name}</h3>
                  <div className="w-4 h-4 rounded-full flex-shrink-0 ml-2 mt-0.5" style={{ background: layout.accent }} title={layout.accentName} />
                </div>
                <p className="text-white/50 text-sm mb-3 leading-relaxed">{layout.description}</p>
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {layout.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/30">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleActivate(layout.id)}
                  disabled={isActive || isLoading}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30 cursor-default'
                      : isLoadingThis
                      ? 'bg-white/5 text-white/40 border border-white/10 cursor-wait'
                      : 'btn-ghost hover:border-neon-pink/40 hover:text-neon-pink'
                  }`}
                >
                  {isActive ? '✓ Layout Ativo' : isLoadingThis ? 'Ativando...' : 'Ativar Este Layout'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
