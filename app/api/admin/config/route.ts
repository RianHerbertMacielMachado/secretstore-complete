import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function GET() {
  const configs = await prisma.siteConfig.findMany()
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  return NextResponse.json({ configs: map })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const { key, value } = await req.json()
    const config = await prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
