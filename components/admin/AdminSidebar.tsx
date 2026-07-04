'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, FolderOpen, Layers, ShoppingCart, Users,
  Tag, Settings, BookOpen, Palette, Menu, X, ChevronRight, FlaskConical,
  Sliders, AlignLeft, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: FolderOpen },
  { href: '/admin/subcategorias', label: 'Sub-Categorias', icon: Layers },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/cupons', label: 'Cupons', icon: Tag },
  { href: '/admin/layouts', label: 'Layouts', icon: Palette },
  // ── Personalização ─────────────────────────────────────────────────────
  { href: '/admin/carrossel', label: 'Carrossel', icon: Sliders },
  { href: '/admin/faixa', label: 'Faixa do Topo', icon: AlignLeft },
  { href: '/admin/popup', label: 'Popup de Cupom', icon: Gift },
  // ── Ferramentas ────────────────────────────────────────────────────────
  { href: '/admin/guia-configuracao', label: 'Guia de Config', icon: BookOpen, highlight: true },
  { href: '/admin/testes', label: 'Testes', icon: FlaskConical },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl text-neon-pink" style={{filter:'drop-shadow(0 0 6px #ff007f)'}}>✝</span>
          <div>
            <div className="font-gothic text-lg font-bold text-white">
              SECRET<span className="text-neon-pink">STORE</span>
            </div>
            <div className="text-xs text-white/30">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'admin-sidebar-item group',
                isActive && 'active',
                item.highlight && !isActive && 'text-neon-pink/70 hover:text-neon-pink'
              )}
            >
              <Icon size={18} className={cn('flex-shrink-0', item.highlight && 'text-neon-pink')} />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.highlight && (
                <span className="w-1.5 h-1.5 bg-neon-pink rounded-full animate-pulse" />
              )}
              {isActive && <ChevronRight size={14} className="opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <Link href="/" className="admin-sidebar-item text-xs">
          ← Voltar à loja
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/10 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/80 border border-white/10 rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col z-50">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
