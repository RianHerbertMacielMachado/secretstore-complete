import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { items, couponCode, paymentMethod, customerEmail, customerName } = await req.json()

    if (!items?.length) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
    }

    // Calcular total
    let totalAmount = 0
    let discountAmount = 0

    const productIds = items.map((i: any) => i.id)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
    })

    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.id)
      if (!product) throw new Error(`Produto ${item.id} não encontrado`)
      const price = product.salePrice ?? product.price
      totalAmount += price * item.quantity
      return { productId: item.id, quantity: item.quantity, price }
    })

    // Aplicar cupom
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })

      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (coupon.discountValue / 100)
        } else {
          discountAmount = Math.min(coupon.discountValue, totalAmount)
        }
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        })
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: finalAmount,
        discountAmount,
        couponCode,
        paymentMethod,
        customerEmail: customerEmail || session.user.email || '',
        customerName: customerName || session.user.name || '',
        items: {
          create: orderItems,
        },
      },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json({ order, orderId: order.id }, { status: 201 })
  } catch (error: any) {
    console.error('[ORDERS POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar pedido' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: { select: { name: true, mainImage: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[ORDERS GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
