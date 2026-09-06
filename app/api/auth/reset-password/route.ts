import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Busca o token no banco
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    // Token não existe
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link inválido. Solicite uma nova recuperação de senha.' },
        { status: 400 }
      )
    }

    // Token já foi usado
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado. Solicite uma nova recuperação de senha.' },
        { status: 400 }
      )
    }

    // Token expirado
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Link expirado. Solicite uma nova recuperação de senha.' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualiza a senha e marca o token como usado — em transação
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data:  { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data:  { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' })
  } catch (error) {
    console.error('[RESET PASSWORD]', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente.' },
      { status: 500 }
    )
  }
}

// Valida se um token ainda é válido (GET) — usado pela página antes de exibir o form
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token não informado' })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { expiresAt: true, usedAt: true },
    })

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Token inválido' })
    }
    if (resetToken.usedAt) {
      return NextResponse.json({ valid: false, error: 'Token já utilizado' })
    }
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token expirado' })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('[VALIDATE RESET TOKEN]', error)
    return NextResponse.json({ valid: false, error: 'Erro ao validar token' })
  }
}
