import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    coupons: coupons.map(c => ({
      ...c,
      categoryIds: JSON.parse(c.categoryIds || '[]'),
      productIds: JSON.parse(c.productIds || '[]'),
    }))
  })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType,
        discountValue: parseFloat(body.discountValue),
        scope: body.scope || 'ALL',
        categoryIds: JSON.stringify(body.categoryIds || []),
        productIds: JSON.stringify(body.productIds || []),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        totalUsageLimit: body.totalUsageLimit || null,
        perCustomerLimit: body.perCustomerLimit || 1,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
