import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mercado Pago Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const data = JSON.parse(body)

    // Log do webhook
    await prisma.webhookLog.create({
      data: {
        provider: 'mercadopago',
        eventType: data.type || 'unknown',
        payload: body.substring(0, 5000),
        status: 'received',
      },
    })

    // Processar pagamento aprovado
    if (data.type === 'payment' && data.data?.id) {
      const paymentId = data.data.id.toString()

      // Buscar o pedido pelo paymentId
      const order = await prisma.order.findFirst({
        where: { paymentId },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentConfirmedAt: new Date(),
          },
        })

        // TODO: Disparar entrega por email
        // await deliverOrder(order.id)
        
        await prisma.webhookLog.create({
          data: {
            provider: 'mercadopago',
            eventType: 'payment_approved',
            payload: paymentId,
            status: 'processed',
            orderId: order.id,
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MP WEBHOOK]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
