import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const data = JSON.parse(body)

    await prisma.webhookLog.create({
      data: {
        provider: 'paypal',
        eventType: data.event_type || 'unknown',
        payload: body.substring(0, 5000),
        status: 'received',
      },
    })

    if (
      data.event_type === 'PAYMENT.CAPTURE.COMPLETED' ||
      data.event_type === 'CHECKOUT.ORDER.APPROVED'
    ) {
      const paymentId = data.resource?.id || data.resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id

      if (paymentId) {
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
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PAYPAL WEBHOOK]', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
