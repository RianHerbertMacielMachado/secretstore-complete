'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'

interface StoreNavbarProps {
  storeName?: string
  tickerHeight?: number  // mantido por compatibilidade (não mais utilizado)
}

export default function StoreNavbar({ storeName = 'DarkShop' }: StoreNavbarProps) {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))

  // Divide o nome em duas partes para aplicar o estilo neon na segunda metade
  const mid = Math.ceil(storeName.length / 2)
  const namePart1 = storeName.slice(0, mid).toUpperCase()
  const namePart2 = storeName.slice(mid).toUpperCase()

  return (
    <nav
      className="w-full z-50 border-b border-white/10 backdrop-blur-md"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div className="site-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl text-neon-pink" style={{filter:'drop-shadow(0 0 8px #ff007f)'}}>✝</span>
            <span className="font-gothic text-xl font-bold text-white text-neon-glow tracking-wider">
              {namePart1}<span className="text-neon-pink">{namePart2}</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white/70 hover:text-neon-pink transition-colors text-sm font-medium tracking-wide">
              Início
            </Link>
            <Link href="/produtos" className="text-white/70 hover:text-neon-pink transition-colors text-sm font-medium tracking-wide">
              Produtos
            </Link>
            <Link href="/categorias" className="text-white/70 hover:text-neon-pink transition-colors text-sm font-medium tracking-wide">
              Categorias
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="text-white/60 hover:text-neon-pink transition-colors">
              <Search size={20} />
            </button>

            <Link href="/carrinho" className="relative text-white/60 hover:text-neon-pink transition-colors">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-neon-pink text-black text-xs font-bold rounded-full flex items-center justify-center shadow-neon-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-white/60 hover:text-neon-pink transition-colors">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-neon-pink/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neon-pink/20 border border-neon-pink/50 flex items-center justify-center">
                      <User size={16} className="text-neon-pink" />
                    </div>
                  )}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-white/10 rounded-xl shadow-neon overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                    <p className="text-xs text-white/40 truncate">{session.user?.email}</p>
                  </div>
                  <Link href="/conta" className="block px-4 py-2 text-sm text-white/70 hover:text-neon-pink hover:bg-white/5 transition-colors">
                    Minha Conta
                  </Link>
                  <Link href="/conta/pedidos" className="block px-4 py-2 text-sm text-white/70 hover:text-neon-pink hover:bg-white/5 transition-colors">
                    Meus Pedidos
                  </Link>
                  {(session.user as any)?.role === 'ADMIN' && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-neon-pink hover:bg-neon-pink/10 transition-colors">
                      ⚡ Painel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-neon text-sm px-4 py-2">
                Entrar
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-white/60 hover:text-neon-pink"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 py-4 px-4 space-y-3">
          <Link href="/" className="block text-white/70 hover:text-neon-pink py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>
            Início
          </Link>
          <Link href="/produtos" className="block text-white/70 hover:text-neon-pink py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>
            Produtos
          </Link>
          <Link href="/categorias" className="block text-white/70 hover:text-neon-pink py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>
            Categorias
          </Link>
          {!session && (
            <Link href="/auth/login" className="block btn-neon text-center mt-4" onClick={() => setIsMenuOpen(false)}>
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
