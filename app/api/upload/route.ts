import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo de 5MB.' },
        { status: 400 }
      )
    }

    // Converte para base64 Data URL — sem filesystem, funciona em qualquer ambiente
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url: dataUrl }, { status: 201 })
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
