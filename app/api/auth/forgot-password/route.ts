import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email/mailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Sempre responde com sucesso para não vazar quais emails estão cadastrados
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      // Invalida tokens anteriores não usados deste usuário
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      })

      // Gera token seguro de 32 bytes (64 caracteres hex)
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      })

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
        'https://secretstore.online'

      const resetUrl = `${siteUrl}/auth/redefinir-senha/${token}`

      await sendPasswordResetEmail({
        to:       user.email,
        name:     user.name,
        resetUrl,
      })
    }

    // Resposta genérica — não revela se o email existe ou não
    return NextResponse.json({
      message: 'Se este email estiver cadastrado, você receberá as instruções em breve.',
    })
  } catch (error) {
    console.error('[FORGOT PASSWORD]', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
