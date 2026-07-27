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

    // Validate productsPerPage — only accept 15, 20 or 25
    const allowedPerPage = [15, 20, 25]
    const productsPerPage =
      allowedPerPage.includes(Number(body.productsPerPage))
        ? Number(body.productsPerPage)
        : 15

    // Validate socialLinks — must be a valid JSON array
    let socialLinks = '[]'
    if (body.socialLinks !== undefined) {
      try {
        const parsed = typeof body.socialLinks === 'string'
          ? JSON.parse(body.socialLinks)
          : body.socialLinks
        if (Array.isArray(parsed)) {
          socialLinks = JSON.stringify(parsed)
        }
      } catch {
        socialLinks = '[]'
      }
    } else {
      // Keep existing value if not provided
      const existing = await prisma.storeSettings.findFirst({ select: { socialLinks: true } })
      socialLinks = existing?.socialLinks ?? '[]'
    }

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        discordUrl: body.discordUrl ?? null,
        productsPerPage,
        socialLinks,
      },
      create: {
        id: 'singleton',
        discordUrl: body.discordUrl ?? null,
        productsPerPage,
        socialLinks,
      },
    })
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
