import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findFirst()
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: { id: 'singleton' } })
    }
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        discordUrl: body.discordUrl ?? null,
      },
      create: {
        id: 'singleton',
        discordUrl: body.discordUrl ?? null,
      },
    })
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
