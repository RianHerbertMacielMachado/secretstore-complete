'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null

  const icons: Record<string, string> = {
    ebooks: '📚',
    cursos: '🎓',
    templates: '🎨',
    softwares: '💻',
    musicas: '🎵',
    default: '✦',
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/produtos"
              className="flex-shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-neon-pink/30 bg-neon-pink/5 text-neon-pink hover:bg-neon-pink/10 transition-all duration-300 min-w-[100px]"
            >
              <span className="text-2xl">✦</span>
              <span className="text-xs font-medium whitespace-nowrap">Todos</span>
            </Link>
          </motion.div>

          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i + 1) * 0.1, duration: 0.5 }}
            >
              <Link
                href={`/categorias/${cat.slug}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-white/10 bg-white/3 text-white/60 hover:text-neon-pink hover:border-neon-pink/40 hover:bg-neon-pink/5 transition-all duration-300 min-w-[100px]"
              >
                <span className="text-2xl">
                  {icons[cat.slug] || icons.default}
                </span>
                <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
