'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="font-gothic text-[120px] sm:text-[160px] font-bold text-white/5 select-none leading-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl sm:text-7xl" style={{ filter: 'drop-shadow(0 0 20px #ff007f)' }}>✝</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-gothic text-2xl sm:text-3xl font-bold text-white mb-3">
            Página Não Encontrada
          </h1>
          <p className="text-white/40 mb-8 text-base">
            A página que você está procurando sumiu nas sombras...
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 btn-neon px-6 py-3"
            >
              <Home size={18} />
              Voltar ao Início
            </Link>
            <Link
              href="/produtos"
              className="flex items-center justify-center gap-2 btn-ghost px-6 py-3"
            >
              <ShoppingBag size={18} />
              Ver Produtos
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,0,127,0.05)_0%,_transparent_60%)]" />
      </div>
    </div>
  )
}
