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
    coupons: coupons.map((c) => ({
      ...c,
      categoryIds: JSON.parse(c.categoryIds || '[]'),
      subCategoryIds: JSON.parse(c.subCategoryIds || '[]'),
      productIds: JSON.parse(c.productIds || '[]'),
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()

    const categoryIds: string[] = body.categoryIds || []
    const subCategoryIds: string[] = body.subCategoryIds || []
    const productIds: string[] = body.productIds || []

    const scope =
      categoryIds.length === 0 && subCategoryIds.length === 0 && productIds.length === 0
        ? 'ALL'
        : 'SPECIFIC'

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType,
        discountValue: parseFloat(body.discountValue),
        scope,
        categoryIds: JSON.stringify(categoryIds),
        subCategoryIds: JSON.stringify(subCategoryIds),
        productIds: JSON.stringify(productIds),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        totalUsageLimit: body.totalUsageLimit ? parseInt(body.totalUsageLimit, 10) : null,
        perCustomerLimit: body.perCustomerLimit || 1,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(
      {
        coupon: {
          ...coupon,
          categoryIds: JSON.parse(coupon.categoryIds || '[]'),
          subCategoryIds: JSON.parse(coupon.subCategoryIds || '[]'),
          productIds: JSON.parse(coupon.productIds || '[]'),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
