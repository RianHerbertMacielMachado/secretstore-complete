import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverOrder } from '@/lib/delivery'

// Verificação de assinatura PayPal
async function verifyPaypalSignature(body: string, headers: Headers): Promise<boolean> {
  if (!process.env.PAYPAL_WEBHOOK_ID) return true // Sem config, aceita

  try {
    const authAssertion = headers.get('paypal-auth-assertion') || ''
    const transmissionId = headers.get('paypal-transmission-id') || ''
    const transmissionTime = headers.get('paypal-transmission-time') || ''
    const certUrl = headers.get('paypal-cert-url') || ''
    const transmissionSig = headers.get('paypal-transmission-sig') || ''

    if (!transmissionId) return true

    const mode = process.env.PAYPAL_MODE === 'sandbox' ? 'sandbox' : 'live'
    const baseUrl = mode === 'sandbox' ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'

    // Obter access token
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) return true

    const { access_token } = await tokenRes.json()

    // Verificar assinatura
    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        auth_algo: authAssertion,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    })

    if (!verifyRes.ok) return true
    const verifyData = await verifyRes.json()
    return verifyData.verification_status === 'SUCCESS'
  } catch {
    return true
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    let data: any
    try { data = JSON.parse(body) } catch { return NextResponse.json({ received: true }) }

    const log = await prisma.webhookLog.create({
      data: {
        provider: 'paypal',
        eventType: data.event_type || 'unknown',
        payload: body.substring(0, 5000),
        status: 'received',
      },
    })

    // Verificar assinatura
    const isValid = await verifyPaypalSignature(body, req.headers)
    if (!isValid) {
      await prisma.webhookLog.update({ where: { id: log.id }, data: { status: 'invalid_signature' } })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Pagamento capturado/completado
    const approvedEvents = ['PAYMENT.CAPTURE.COMPLETED', 'CHECKOUT.ORDER.APPROVED', 'PAYMENT.ORDER.CREATED']

    if (approvedEvents.includes(data.event_type)) {
      const resource = data.resource || {}
      const paymentId = resource.id || resource.supplementary_data?.related_ids?.order_id

      if (paymentId) {
        const order = await prisma.order.findFirst({
          where: { paymentId },
        })

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', paymentConfirmedAt: new Date() },
          })

          const delivery = await deliverOrder(order.id)

          await prisma.webhookLog.update({
            where: { id: log.id },
            data: { status: 'processed', orderId: order.id },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PAYPAL WEBHOOK]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
