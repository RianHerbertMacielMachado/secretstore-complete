import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminPopupClient from '@/components/admin/AdminPopupClient'

export default async function AdminPopupPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/signin')

  const POPUP_KEYS = [
    'popup_enabled', 'popup_discount', 'popup_code',
    'popup_expiry_hours', 'popup_cta_text', 'popup_cta_link', 'popup_delay_seconds',
    'popup_design',
    'popup_color_accent', 'popup_color_text', 'popup_color_bg', 'popup_color_timer_bg',
  ]
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: POPUP_KEYS } },
  })
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  return (
    <AdminPopupClient
      config={{
        enabled:      map.popup_enabled === 'true',
        discount:     map.popup_discount || '15',
        code:         map.popup_code || '',
        expiryHours:  map.popup_expiry_hours || '24',
        ctaText:      map.popup_cta_text || 'RESGATAR OFERTA',
        ctaLink:      map.popup_cta_link || '/',
        delaySeconds: map.popup_delay_seconds || '3',
        design:       (map.popup_design || 'classic') as 'classic' | 'minimal' | 'bold',
        colors: {
          accentColor:  map.popup_color_accent   || '#dc2626',
          textColor:    map.popup_color_text     || '#ffffff',
          bgColor:      map.popup_color_bg       || '#0d0d0d',
          timerBg:      map.popup_color_timer_bg || '#1f1f1f',
        },
      }}
    />
  )
}
