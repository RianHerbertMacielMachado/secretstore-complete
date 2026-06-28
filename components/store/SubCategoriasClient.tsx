'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Layers } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface SubCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  isVisible: boolean
  _count: { products: number }
}

interface Props {
  category: Category
  subCategories: SubCategory[]
}

const GRADIENTS = [
  'from-pink-900/40 to-purple-900/40',
  'from-purple-900/40 to-blue-900/40',
  'from-blue-900/40 to-cyan-900/40',
  'from-red-900/40 to-pink-900/40',
  'from-yellow-900/40 to-orange-900/40',
  'from-green-900/40 to-teal-900/40',
]

export default function SubCategoriasClient({ category, subCategories }: Props) {
  const visibleSubs = subCategories.filter(s => s.isVisible)

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <div className="relative py-14 px-4 sm:px-6 lg:px-8 border-b border-white/5 mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,0,127,0.08)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
            <Link href="/" className="hover:text-neon-pink transition-colors">Início</Link>
            <span>/</span>
            <Link href="/categorias" className="hover:text-neon-pink transition-colors">Categorias</Link>
            <span>/</span>
            <span className="text-white/70">{category.name}</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-gothic text-4xl sm:text-5xl font-bold text-white mb-3"
          >
            {category.name}
          </motion.h1>
          {category.description && (
            <p className="text-white/40 text-lg max-w-2xl">{category.description}</p>
          )}
          <p className="text-white/30 text-sm mt-2">
            {visibleSubs.length} sub-categori{visibleSubs.length !== 1 ? 'as' : 'a'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {visibleSubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Layers size={48} className="text-white/10" />
            <p className="text-white/40 text-lg">Nenhuma sub-categoria disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleSubs.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/categorias/${category.slug}/${sub.slug}`}>
                  <div className="group relative h-48 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden hover:border-neon-pink/50 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} />

                    {sub.image && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                        style={{ backgroundImage: `url(${sub.image})` }}
                      />
                    )}

                    <div className="absolute inset-0 border border-transparent group-hover:border-neon-pink/30 rounded-2xl transition-all duration-300 group-hover:shadow-[inset_0_0_30px_rgba(255,0,127,0.05)]" />

                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 p-6">
                      <Layers size={32} className="text-white/40 group-hover:text-neon-pink/60 transition-colors" />
                      <div className="text-center">
                        <h3 className="font-gothic text-xl font-bold text-white group-hover:text-neon-pink transition-colors duration-300">
                          {sub.name}
                        </h3>
                        {sub.description && (
                          <p className="text-white/50 text-sm mt-1 line-clamp-2">{sub.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-xs text-white/50 group-hover:border-neon-pink/30 group-hover:text-neon-pink/70 transition-all">
                        {sub._count.products} produto{sub._count.products !== 1 ? 's' : ''}
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
