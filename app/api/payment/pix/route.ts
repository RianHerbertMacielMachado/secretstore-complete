import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Gera pagamento PIX via Mercado Pago ────────────────────────────────────
// Nota: sem verificação de sessão — orderId (CUID) é suficientemente opaco
// O usuário só obtém o orderId após criar o pedido com sucesso
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
    }

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Se já tem PIX gerado e não expirou, retornar o existente
    if (order.pixCopiaECola && order.pixExpiresAt && order.pixExpiresAt > new Date()) {
      return NextResponse.json({
        pixQrCodeBase64: order.pixQrCodeBase64,
        pixCopiaECola: order.pixCopiaECola,
        pixExpiresAt: order.pixExpiresAt,
        paymentId: order.paymentId,
        paymentStatus: order.paymentStatus,
        cached: true,
      })
    }

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado. Adicione MP_ACCESS_TOKEN nas variáveis de ambiente.' },
        { status: 503 }
      )
    }

    // Montar payload para MP Pix
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    const expiresAtISO = expiresAt.toISOString().replace('Z', '-03:00') // horário BRT

    const description =
      order.items.length === 1
        ? order.items[0].product.name
        : `${order.items.length} produtos`

    const payload = {
      transaction_amount: Number(order.totalAmount.toFixed(2)),
      description: description.slice(0, 120),
      payment_method_id: 'pix',
      payer: {
        email: order.customerEmail || 'comprador@email.com',
        first_name: (order.customerName || 'Cliente').split(' ')[0],
        last_name: (order.customerName || 'Cliente').split(' ').slice(1).join(' ') || 'Comprador',
      },
      date_of_expiration: expiresAtISO,
      // Notificação de webhook quando o PIX for pago
      notification_url: process.env.MP_WEBHOOK_URL || undefined,
      external_reference: orderId, // vincula o paymentId ao pedido
    }

    // Chamar API do Mercado Pago
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId, // evita duplicação se chamado 2x
      },
      body: JSON.stringify(payload),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      console.error('[PIX] Erro MP:', mpData)
      const errMsg =
        mpData?.message ||
        mpData?.cause?.[0]?.description ||
        'Erro ao gerar PIX no Mercado Pago'
      return NextResponse.json({ error: errMsg }, { status: mpRes.status })
    }

    // Extrair dados do PIX
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null
    const copiaECola = mpData.point_of_interaction?.transaction_data?.qr_code || null
    const paymentId = mpData.id?.toString() || null

    if (!copiaECola) {
      console.error('[PIX] MP não retornou qr_code:', mpData)
      return NextResponse.json(
        { error: 'Mercado Pago não retornou o código PIX. Verifique se a conta MP está habilitada para PIX.' },
        { status: 502 }
      )
    }

    // Salvar dados PIX no pedido
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        pixQrCodeBase64: qrCodeBase64,
        pixCopiaECola: copiaECola,
        pixExpiresAt: expiresAt,
      },
    })

    return NextResponse.json({
      pixQrCodeBase64: qrCodeBase64,
      pixCopiaECola: copiaECola,
      pixExpiresAt: expiresAt,
      paymentId,
      paymentStatus: order.paymentStatus,
    })
  } catch (error: any) {
    console.error('[PIX POST]', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

// ─── Consulta status do pagamento ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        paymentStatus: true,
        paymentId: true,
        pixCopiaECola: true,
        pixQrCodeBase64: true,
        pixExpiresAt: true,
        paymentConfirmedAt: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Se já está pago no banco, retorna direto sem consultar MP
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ paymentStatus: 'PAID', paymentConfirmedAt: order.paymentConfirmedAt })
    }

    // Consultar status atual no MP (para casos onde o webhook falhou)
    if (order.paymentId && process.env.MP_ACCESS_TOKEN) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${order.paymentId}`, {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        })
        if (mpRes.ok) {
          const mpData = await mpRes.json()
          if (mpData.status === 'approved') {
            // Confirmar no banco (webhook deve ter falhado)
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'PAID', paymentConfirmedAt: new Date() },
            })
            return NextResponse.json({ paymentStatus: 'PAID', paymentConfirmedAt: new Date() })
          }
          return NextResponse.json({ paymentStatus: mpData.status || order.paymentStatus })
        }
      } catch {
        // Falha silenciosa — retorna status do banco
      }
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      pixExpiresAt: order.pixExpiresAt,
    })
  } catch (error: any) {
    console.error('[PIX GET]', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
