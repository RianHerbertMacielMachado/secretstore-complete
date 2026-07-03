import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { deliverOrder } from '@/lib/delivery'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()

    // ── Ação especial: reprocessar entrega ──────────────────────────────────
    if (body.action === 'redeliver') {
      // Garante que o pedido está marcado como PAID antes de reprocessar
      await prisma.order.update({
        where: { id: params.id },
        data: {
          deliveryStatus: 'PENDING', // reseta para permitir reprocessamento
          paymentStatus: 'PAID',
          paymentConfirmedAt: new Date(),
        },
      })
      const delivery = await deliverOrder(params.id)
      return NextResponse.json({ success: delivery.success, delivery })
    }

    // ── Atualização padrão de status ─────────────────────────────────────────
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: body.paymentStatus,
        deliveryStatus: body.deliveryStatus,
        paymentConfirmedAt: body.paymentStatus === 'PAID' ? new Date() : undefined,
      },
    })

    // Se marcou como PAID manualmente → disparar entrega automática
    if (body.paymentStatus === 'PAID') {
      deliverOrder(params.id).catch((err) =>
        console.error('[ADMIN PATCH] Erro na entrega automática:', err)
      )
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
