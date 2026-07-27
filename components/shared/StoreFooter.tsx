"use client"

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FaDiscord, FaInstagram, FaYoutube, FaTiktok, FaFacebook, FaPinterest, FaTelegram, FaWhatsapp, FaTwitch, FaLinkedin } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { Share2 } from 'lucide-react'

interface SocialLink {
  id: string
  network: string
  url: string
  label?: string
}

interface StoreFooterProps {
  storeName?: string
  discordUrl?: string | null
  socialLinks?: SocialLink[]
}

// Map network key → icon + color
const SOCIAL_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  instagram: { icon: <FaInstagram size={18} />, color: '#E1306C' },
  youtube:   { icon: <FaYoutube size={18} />,   color: '#FF0000' },
  tiktok:    { icon: <FaTiktok size={18} />,    color: '#69C9D0' },
  twitter:   { icon: <FaXTwitter size={18} />,  color: '#1DA1F2' },
  discord:   { icon: <FaDiscord size={18} />,   color: '#5865F2' },
  facebook:  { icon: <FaFacebook size={18} />,  color: '#1877F2' },
  pinterest: { icon: <FaPinterest size={18} />, color: '#E60023' },
  telegram:  { icon: <FaTelegram size={18} />,  color: '#229ED9' },
  whatsapp:  { icon: <FaWhatsapp size={18} />,  color: '#25D366' },
  twitch:    { icon: <FaTwitch size={18} />,    color: '#9146FF' },
  linkedin:  { icon: <FaLinkedin size={18} />,  color: '#0A66C2' },
}

function SocialIcon({ link }: { link: SocialLink }) {
  const meta = SOCIAL_ICON_MAP[link.network]
  const icon = meta?.icon ?? <Share2 size={18} />
  const color = meta?.color ?? '#ffffff'
  const title = link.label || (link.network.charAt(0).toUpperCase() + link.network.slice(1))

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center transition-all group"
      style={{
        ['--hover-color' as string]: color,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = color + '80'
        el.style.background = color + '18'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = ''
        el.style.background = ''
      }}
    >
      <span className="text-white/40 transition-colors group-hover:opacity-100" style={{}}>
        {icon}
      </span>
    </a>
  )
}

export default function StoreFooter({ storeName = 'DarkShop', discordUrl, socialLinks = [] }: StoreFooterProps) {
  const mid = Math.ceil(storeName.length / 2)
  const namePart1 = storeName.slice(0, mid).toUpperCase()
  const namePart2 = storeName.slice(mid).toUpperCase()

  // Build final icon list: custom social links + discord (legacy, appended if not already in socialLinks)
  const hasDiscordInLinks = socialLinks.some((l) => l.network === 'discord')
  const legacyDiscord: SocialLink | null =
    discordUrl && !hasDiscordInLinks
      ? { id: '__discord_legacy__', network: 'discord', url: discordUrl }
      : null

  const allLinks: SocialLink[] = [
    ...socialLinks,
    ...(legacyDiscord ? [legacyDiscord] : []),
  ]

  return (
    <footer className="border-t border-white/10 bg-black/80 py-12 mt-16">
      <div className="site-container">
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

            {/* Social icons row */}
            <div className="flex flex-wrap gap-2 mt-6">
              {/* Static decorative icons (original) */}
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-neon-pink hover:border-neon-pink/50 cursor-pointer transition-all">
                ♥
              </div>
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-neon-pink hover:border-neon-pink/50 cursor-pointer transition-all">
                ✦
              </div>

              {/* Dynamic social links */}
              {allLinks.map((link) => (
                <SocialIcon key={link.id} link={link} />
              ))}

              {/* Discord legacy fallback — show inactive icon if no links configured at all */}
              {allLinks.length === 0 && (
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-[#5865F2] hover:border-[#5865F2]/50 cursor-pointer transition-all">
                  <FaDiscord size={20} />
                </div>
              )}
            </div>
          </div>

          {/* Loja */}
          <div>
            <h4 className="font-gothic text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Loja</h4>
            <ul className="space-y-2">
              {[
                { label: 'Todos os Produtos', href: '/produtos' },
                { label: 'Categorias', href: '/categorias' },
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
            <FooterSuporteLinks />
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

// Componente separado para usar hooks do client side
function FooterSuporteLinks() {
  const { data: session } = useSession()
  return (
    <ul className="space-y-2">
      {[
        { label: 'Minha Conta', href: session ? '/conta' : null },
        { label: 'Meus Pedidos', href: '/conta/pedidos' },
        { label: 'FAQ', href: null },
        { label: 'Contato', href: null },
      ].map((item) => (
        <li key={item.label}>
          {item.href ? (
            <Link href={item.href} className="text-sm text-white/50 hover:text-neon-pink transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-sm text-white/50">{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
