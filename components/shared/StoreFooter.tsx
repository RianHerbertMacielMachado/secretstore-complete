import Link from 'next/link'

interface StoreFooterProps {
  storeName?: string
}

export default function StoreFooter({ storeName = 'DarkShop' }: StoreFooterProps) {
  const mid = Math.ceil(storeName.length / 2)
  const namePart1 = storeName.slice(0, mid).toUpperCase()
  const namePart2 = storeName.slice(mid).toUpperCase()

  return (
    <footer className="border-t border-white/10 bg-black/80 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-neon-pink">✝</span>
              <span className="font-gothic text-xl font-bold text-white">
                {namePart1}<span className="text-neon-pink">{namePart2}</span>
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Sua loja de produtos digitais premium. 
              Qualidade, estilo e entrega imediata.
            </p>
            <div className="flex gap-4 mt-6">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-neon-pink hover:border-neon-pink/50 cursor-pointer transition-all">
                ♥
              </div>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-neon-pink hover:border-neon-pink/50 cursor-pointer transition-all">
                ✦
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-gothic text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Loja</h4>
            <ul className="space-y-2">
              {[
                { label: 'Todos os Produtos', href: '/produtos' },
                { label: 'Categorias', href: '/categorias' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/50 hover:text-neon-pink transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-gothic text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Suporte</h4>
            <ul className="space-y-2">
              {['Minha Conta', 'Meus Pedidos', 'FAQ', 'Contato'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 hover:text-neon-pink transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-neon my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <span>Pagamentos seguros via</span>
            <span className="text-neon-pink/60 font-medium">Mercado Pago · PayPal · PicPay</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
