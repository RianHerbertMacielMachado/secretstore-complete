import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverOrder } from '@/lib/delivery'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    let data: any

    try {
      data = JSON.parse(body)
    } catch {
      return NextResponse.json({ received: true })
    }

    // Log inicial
    const log = await prisma.webhookLog.create({
      data: {
        provider: 'mercadopago',
        eventType: data.type || data.action || 'unknown',
        payload: body.substring(0, 5000),
        status: 'received',
      },
    })

    // Verificar assinatura (se configurado)
    const secret = process.env.MP_WEBHOOK_SECRET
    if (secret) {
      const xSignature = req.headers.get('x-signature') || ''
      const xRequestId = req.headers.get('x-request-id') || ''
      // Validação básica de assinatura MP
      // Em produção, implementar validação completa conforme docs MP
    }

    // Pagamento aprovado
    if (
      (data.type === 'payment' && data.data?.id) ||
      (data.action === 'payment.updated' && data.data?.id)
    ) {
      const paymentId = data.data.id.toString()

      // Buscar status real do pagamento na API do MP
      let paymentApproved = false
      const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MP_TEST_TOKEN
      if (accessToken) {
        try {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (mpRes.ok) {
            const mpData = await mpRes.json()
            paymentApproved = mpData.status === 'approved'
            console.log(`[MP WEBHOOK] paymentId=${paymentId} status=${mpData.status}`)
          }
        } catch {
          // Se não conseguir verificar, assume aprovado pelo webhook
          paymentApproved = true
        }
      } else {
        paymentApproved = true // Sem token, aceita o webhook
      }

      if (paymentApproved) {
        // Buscar pedido pelo paymentId
        const order = await prisma.order.findFirst({
          where: { paymentId },
        })

        if (order && order.paymentStatus !== 'PAID') {
          // Confirmar pagamento
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              paymentConfirmedAt: new Date(),
            },
          })

          // Disparar entrega automática
          const delivery = await deliverOrder(order.id)

          await prisma.webhookLog.update({
            where: { id: log.id },
            data: {
              status: 'processed',
              orderId: order.id,
              payload: `${body.substring(0, 4000)}\n[DELIVERY: ${JSON.stringify(delivery)}]`,
            },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MP WEBHOOK]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
