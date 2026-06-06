import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) return NextResponse.json({ valid: false, error: 'Código obrigatório' }, { status: 400 })

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  if (!coupon) return NextResponse.json({ valid: false, error: 'Cupom inválido ou expirado' }, { status: 404 })
  if (coupon.totalUsageLimit && coupon.usageCount >= coupon.totalUsageLimit) {
    return NextResponse.json({ valid: false, error: 'Cupom atingiu o limite de uso' }, { status: 400 })
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount: coupon.discountValue,
    discountType: coupon.discountType,
  })
}
