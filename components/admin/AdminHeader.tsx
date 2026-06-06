'use client'

import { signOut } from 'next-auth/react'
import { Bell, LogOut, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AdminHeaderProps {
  user: any
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-[#0a0a0a] border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-white/60 text-sm hidden sm:block">
          Painel Administrativo
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-white/40 hover:text-neon-pink text-xs transition-colors"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">Ver Loja</span>
        </Link>

        <button className="relative text-white/40 hover:text-neon-pink transition-colors p-2">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon-pink rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          {user?.image ? (
            <img src={user.image} alt="" className="w-8 h-8 rounded-full border border-neon-pink/50" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neon-pink/20 border border-neon-pink/50 flex items-center justify-center text-neon-pink text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white leading-none">{user?.name}</p>
            <p className="text-xs text-white/30 mt-0.5">Admin</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="p-2 text-white/30 hover:text-red-400 transition-colors"
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
