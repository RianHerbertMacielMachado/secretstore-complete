import { NextResponse } from 'next/server'

/**
 * GET /api/payment/methods
 *
 * Retorna quais métodos de pagamento estão configurados via variáveis de ambiente.
 * Não expõe nenhum token — apenas um booleano por método.
 *
 * PIX  → requer MP_ACCESS_TOKEN
 * PayPal → requer PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET
 * PicPay → requer PICPAY_TOKEN + PICPAY_SELLER_TOKEN
 */
export async function GET() {
  const methods = {
    PIX:    !!(process.env.MP_ACCESS_TOKEN?.trim()),
    PAYPAL: !!(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim()),
    PICPAY: !!(process.env.PICPAY_TOKEN?.trim() && process.env.PICPAY_SELLER_TOKEN?.trim()),
  }

  return NextResponse.json({ methods })
}
