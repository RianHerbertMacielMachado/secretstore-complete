'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  _count: { products: number }
}

const ICONS: Record<string, string> = {
  ebooks: '📚', cursos: '🎓', templates: '🎨',
  softwares: '💻', musicas: '🎵', jogos: '🎮',
  presets: '🎞️', fontes: '🔤', default: '✦',
}

const GRADIENTS = [
  'from-pink-900/40 to-purple-900/40',
  'from-purple-900/40 to-blue-900/40',
  'from-blue-900/40 to-cyan-900/40',
  'from-red-900/40 to-pink-900/40',
  'from-yellow-900/40 to-orange-900/40',
  'from-green-900/40 to-teal-900/40',
]

export default function CategoriasClient({ categories }: { categories: Category[] }) {
  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5 mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,0,127,0.08)_0%,_transparent_60%)]" />
        <div className="site-container relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-gothic text-4xl sm:text-5xl font-bold text-white mb-3"
          >
            Categorias
          </motion.h1>
          <p className="text-white/40 text-lg">
            {categories.length} categori{categories.length !== 1 ? 'as' : 'a'} disponíve{categories.length !== 1 ? 'is' : 'l'}
          </p>
        </div>
      </div>

      <div className="site-container">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Package size={48} className="text-white/10" />
            <p className="text-white/40 text-lg">Nenhuma categoria disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/categorias/${cat.slug}`}>
                  <div className="group relative h-48 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden hover:border-neon-pink/50 transition-all duration-300">
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />

                    {/* Image if exists */}
                    {cat.image && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                        style={{ backgroundImage: `url(${cat.image})` }}
                      />
                    )}

                    {/* Neon border on hover */}
                    <div className="absolute inset-0 border border-transparent group-hover:border-neon-pink/30 rounded-2xl transition-all duration-300 group-hover:shadow-[inset_0_0_30px_rgba(255,0,127,0.05)]" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 p-6">
                      <span className="text-5xl drop-shadow-lg">{ICONS[cat.slug] || ICONS.default}</span>
                      <div className="text-center">
                        <h3 className="font-gothic text-xl font-bold text-white group-hover:text-neon-pink transition-colors duration-300">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-white/50 text-sm mt-1 line-clamp-2">{cat.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-xs text-white/50 group-hover:border-neon-pink/30 group-hover:text-neon-pink/70 transition-all">
                        {cat._count.products} produto{cat._count.products !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
