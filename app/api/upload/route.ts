import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { v2 as cloudinary } from 'cloudinary'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Retorna true se todas as 3 vars do Cloudinary estiverem preenchidas
function cloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

// Configura o SDK uma única vez por request (idempotente)
function setupCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure:     true,
  })
}

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
        { error: 'Arquivo muito grande. Máximo de 5 MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ── Cloudinary (preferencial) ─────────────────────────────────────────────
    if (cloudinaryConfigured()) {
      setupCloudinary()

      // Converte o buffer para data URI para enviar ao Cloudinary via upload_stream
      const base64 = buffer.toString('base64')
      const dataUri = `data:${file.type};base64,${base64}`

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload(
          dataUri,
          {
            folder:         'secretstore',
            resource_type:  'image',
            // Qualidade automática + formato moderno (WebP/AVIF) sem perda visível
            quality:        'auto',
            fetch_format:   'auto',
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload falhou'))
            resolve(result as { secure_url: string })
          }
        )
      })

      return NextResponse.json({ url: result.secure_url }, { status: 201 })
    }

    // ── Fallback: Base64 (quando Cloudinary não está configurado) ─────────────
    // Aviso no log para lembrar de configurar as variáveis de ambiente.
    console.warn(
      '[UPLOAD] Cloudinary não configurado — salvando como Base64 no banco. ' +
      'Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.'
    )
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
