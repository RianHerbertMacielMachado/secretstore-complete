import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverOrder } from '@/lib/delivery'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    let data: any
    try { data = JSON.parse(body) } catch { return NextResponse.json({ received: true }) }

    const log = await prisma.webhookLog.create({
      data: {
        provider: 'picpay',
        eventType: data.authorizationId ? 'payment' : 'unknown',
        payload: body.substring(0, 5000),
        status: 'received',
      },
    })

    // PicPay envia: { referenceId, authorizationId, status: 'paid'|'refunded'|'chargeback' }
    if (data.status === 'paid' && data.referenceId) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { paymentId: data.authorizationId?.toString() },
            { id: data.referenceId },
          ],
        },
      })

      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentId: data.authorizationId?.toString() || order.paymentId,
            paymentConfirmedAt: new Date(),
          },
        })

        const delivery = await deliverOrder(order.id)

        await prisma.webhookLog.update({
          where: { id: log.id },
          data: { status: 'processed', orderId: order.id },
        })
      }
    } else if (data.status === 'refunded' && data.referenceId) {
      const order = await prisma.order.findFirst({
        where: { id: data.referenceId },
      })
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'REFUNDED' },
        })
        await prisma.webhookLog.update({
          where: { id: log.id },
          data: { status: 'processed', orderId: order.id },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PICPAY WEBHOOK]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
