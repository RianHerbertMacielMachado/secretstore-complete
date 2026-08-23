// Server Component — lê process.env diretamente no servidor, sem cache de build
export const dynamic = 'force-dynamic'

import CheckoutClient from '@/components/store/CheckoutClient'

type PaymentMethod = 'PIX' | 'PAYPAL' | 'PICPAY'

export default function CheckoutPage() {
  // Detecta quais métodos têm credenciais preenchidas
  // Executado no servidor a cada request — nunca cacheado
  const enabledMethods: PaymentMethod[] = []

  if (process.env.MP_ACCESS_TOKEN?.trim()) {
    enabledMethods.push('PIX')
  }
  if (process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim()) {
    enabledMethods.push('PAYPAL')
  }
  if (process.env.PICPAY_TOKEN?.trim() && process.env.PICPAY_SELLER_TOKEN?.trim()) {
    enabledMethods.push('PICPAY')
  }

  return <CheckoutClient enabledMethods={enabledMethods} />
}
