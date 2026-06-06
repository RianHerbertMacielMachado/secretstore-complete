'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const LAYOUTS = [
  {
    id: 'dark-grunge',
    name: 'Dark Grunge',
    description: 'Texturas pesadas, grid masonry com profundidade',
    preview: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
    accent: '#8B0000',
    icon: '🖤',
  },
  {
    id: 'neon-minimal',
    name: 'Neon Minimal',
    description: 'Layout limpo com efeitos neon intensos',
    preview: 'bg-black',
    accent: '#00ff88',
    icon: '⚡',
  },
  {
    id: 'elegant-gothic',
    name: 'Elegant Gothic',
    description: 'Split hero, cards elegantes e refinados',
    preview: 'bg-gradient-to-br from-purple-950 via-black to-purple-900',
    accent: '#9333ea',
    icon: '🌹',
  },
  {
    id: 'street-punk',
    name: 'Street Punk',
    description: 'Layout assimétrico com elementos punk',
    preview: 'bg-gradient-to-br from-yellow-950 via-black to-red-950',
    accent: '#facc15',
    icon: '⚡',
  },
  {
    id: 'anime-shop',
    name: 'Anime Shop',
    description: 'Kawaii gótico com cards arredondados',
    preview: 'bg-gradient-to-br from-pink-950 via-black to-rose-950',
    accent: '#ec4899',
    icon: '🌸',
  },
  {
    id: 'ultra-minimal',
    name: 'Ultra Minimal',
    description: 'Extremamente limpo com foco total nos produtos',
    preview: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-900',
    accent: '#ffffff',
    icon: '◻',
  },
]

export default function AdminLayoutsPage() {
  const [activeLayout, setActiveLayout] = useState('dark-grunge')
  const [isLoading, setIsLoading] = useState(false)

  const handleActivate = async (layoutId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'active_layout', value: layoutId }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setActiveLayout(layoutId)
      toast.success(`Layout "${LAYOUTS.find(l => l.id === layoutId)?.name}" ativado!`)
    } catch {
      toast.error('Erro ao ativar layout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-gothic text-2xl font-bold text-white">Layouts da Loja</h1>
        <p className="text-white/40 text-sm mt-1">Selecione o visual que melhor representa sua marca</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LAYOUTS.map((layout, i) => (
          <motion.div
            key={layout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative bg-[#0d0d0d] border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
              activeLayout === layout.id
                ? 'border-neon-pink shadow-neon'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {/* Preview */}
            <div className={`h-40 ${layout.preview} relative overflow-hidden`}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">{layout.icon}</span>
                <div className="w-24 h-2 rounded" style={{ background: layout.accent, opacity: 0.8 }} />
                <div className="w-16 h-1 rounded" style={{ background: layout.accent, opacity: 0.5 }} />
              </div>
              {activeLayout === layout.id && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-neon-pink text-black text-xs font-bold rounded-full">
                  ATIVO
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5">
              <h3 className="font-gothic font-bold text-white mb-1">{layout.name}</h3>
              <p className="text-white/50 text-sm mb-4">{layout.description}</p>
              <button
                onClick={() => handleActivate(layout.id)}
                disabled={activeLayout === layout.id || isLoading}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                  activeLayout === layout.id
                    ? 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30 cursor-default'
                    : 'btn-ghost hover:border-neon-pink/40'
                }`}
              >
                {activeLayout === layout.id ? '✓ Layout Ativo' : 'Ativar Layout'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
