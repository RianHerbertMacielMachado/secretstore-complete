'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface HeroSectionProps {
  storeName?: string
  storeSubtitle?: string
  bgImages?: string[]    // URLs das imagens de fundo configuradas no admin
  bgInterval?: number    // segundos entre troca de imagem
}

export default function HeroSection({
  storeName = 'DarkShop',
  storeSubtitle = 'Produtos digitais e entrega imediata',
  bgImages = [],
  bgInterval = 5,
}: HeroSectionProps) {
  const [currentBg, setCurrentBg] = useState(0)

  // Divide o nome em duas partes visuais
  const mid = Math.ceil(storeName.length / 2)
  const namePart1 = storeName.slice(0, mid).toUpperCase()
  const namePart2 = storeName.slice(mid).toUpperCase()

  // Slideshow automático das imagens de fundo
  useEffect(() => {
    if (bgImages.length <= 1) return
    const id = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % bgImages.length)
    }, bgInterval * 1000)
    return () => clearInterval(id)
  }, [bgImages.length, bgInterval])

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">

      {/* ── Camada de fundo ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black">

        {/* Slideshow de imagens configuradas pelo admin */}
        {bgImages.length > 0 ? (
          <>
            <AnimatePresence>
              <motion.div
                key={currentBg}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgImages[currentBg]})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </AnimatePresence>
            {/* Overlay escuro sobre a imagem para o texto ficar legível */}
            <div className="absolute inset-0 bg-black/60" />
            {/* Gradiente vertical embaixo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </>
        ) : (
          /* Fundo padrão gótico quando não há imagens configuradas */
          <>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 30% 50%, rgba(255,0,127,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(255,20,147,0.10) 0%, transparent 50%)'
            }} />
            <div className="absolute inset-0 opacity-5">
              {['♥', '✝', '♦', '✧', '♥', '✝', '✦', '♠'].map((sym, i) => (
                <span key={i} className="absolute text-neon-pink" style={{
                  left: `${(i * 13 + 5) % 95}%`,
                  top: `${(i * 17 + 10) % 85}%`,
                  fontSize: `${(i % 3) * 20 + 20}px`,
                  transform: `rotate(${i * 15 - 30}deg)`,
                }}>{sym}</span>
              ))}
            </div>
            <div className="absolute top-10 left-10 w-64 h-64 opacity-5 border-2 border-neon-pink rounded-full" style={{ filter: 'blur(2px)' }} />
            <div className="absolute bottom-20 right-20 w-48 h-48 opacity-5 border border-neon-pink" style={{ transform: 'rotate(45deg)', filter: 'blur(1px)' }} />
          </>
        )}
      </div>

      {/* ── Dots de navegação (quando há >1 imagem) ──────────────────── */}
      {bgImages.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {bgImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBg(i)}
              className={`rounded-full transition-all ${
                i === currentBg ? 'w-5 h-2 bg-neon-pink' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-full text-neon-pink text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
            Produtos Digitais Premium
          </motion.div>

          {/* Nome da loja */}
          <h1 className="font-gothic text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
            <span className="block">{namePart1}</span>
            <span
              className="block text-neon-pink text-neon-glow"
              style={{ textShadow: '0 0 30px #ff007f, 0 0 60px #ff007f40' }}
            >
              {namePart2}
            </span>
          </h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl sm:text-2xl text-white/70 mb-10 max-w-2xl mx-auto font-light"
          >
            {storeSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/produtos" className="btn-neon-solid text-lg px-10 py-4 rounded-xl">
              ✦ Explorar Loja
            </Link>
            <Link href="/categorias" className="btn-ghost text-lg px-10 py-4 rounded-xl">
              Ver Categorias
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center gap-12 mt-16"
          >
            {[
              { label: 'Produtos', value: '50+' },
              { label: 'Clientes', value: '1k+' },
              { label: 'Avaliação', value: '5.0 ★' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-neon-pink font-gothic">{stat.value}</div>
                <div className="text-sm text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-neon-pink/40 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-neon-pink rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
