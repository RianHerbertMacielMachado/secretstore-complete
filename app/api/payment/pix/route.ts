import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deliverOrder } from '@/lib/delivery'

// ─── Detecta se o token é de teste ou produção ──────────────────────────────
function isSandboxToken(token: string): boolean {
  return token.startsWith('TEST-')
}

// ─── URL da API MP ─────────────────────────────────────────────────────────
const MP_API = 'https://api.mercadopago.com'

// ─── Gera pagamento PIX via Mercado Pago ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId obrigatório' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Se já está PAGO → retornar sem gerar novo PIX
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ paymentStatus: 'PAID' })
    }

    // Se já tem PIX gerado e não expirou, retornar o existente
    if (order.pixCopiaECola && order.pixExpiresAt && order.pixExpiresAt > new Date()) {
      return NextResponse.json({
        pixQrCodeBase64: order.pixQrCodeBase64,
        pixCopiaECola:   order.pixCopiaECola,
        pixExpiresAt:    order.pixExpiresAt,
        paymentId:       order.paymentId,
        paymentStatus:   order.paymentStatus,
        cached: true,
      })
    }

    const accessToken =
      process.env.MP_ACCESS_TOKEN ||
      process.env.MP_TEST_TOKEN ||
      null

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'MP_NAO_CONFIGURADO',
          message: 'Mercado Pago não configurado. Configure MP_ACCESS_TOKEN nas variáveis de ambiente.',
        },
        { status: 503 }
      )
    }

    const isSandbox = isSandboxToken(accessToken)

    const expiresAt    = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    const expiresAtISO = expiresAt.toISOString().replace('Z', '-03:00')

    const description =
      order.items.length === 1
        ? order.items[0].product.name
        : `${order.items.length} produtos`

    const payerEmail = isSandbox
      ? 'test_user_buyer@testuser.com'
      : (order.customerEmail || 'comprador@email.com')

    const payload: Record<string, any> = {
      transaction_amount: Number(order.totalAmount.toFixed(2)),
      description:        description.slice(0, 120),
      payment_method_id:  'pix',
      payer: {
        email:      payerEmail,
        first_name: (order.customerName || 'Cliente').split(' ')[0],
        last_name:  (order.customerName || 'Cliente').split(' ').slice(1).join(' ') || 'Comprador',
      },
      date_of_expiration: expiresAtISO,
      external_reference: orderId,
    }

    if (!isSandbox && process.env.MP_WEBHOOK_URL) {
      payload.notification_url = process.env.MP_WEBHOOK_URL
    }

    const mpRes = await fetch(`${MP_API}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        Authorization:       `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify(payload),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      console.error('[PIX] Erro MP:', JSON.stringify(mpData, null, 2))

      const causeCode    = mpData?.cause?.[0]?.code
      const causeDesc    = mpData?.cause?.[0]?.description || ''
      const mpStatusCode = mpData?.status || mpRes.status

      let friendlyError = mpData?.message || 'Erro ao gerar PIX no Mercado Pago'

      if (causeCode === 7 || causeDesc.includes('live credentials')) {
        friendlyError =
          'Credenciais de produção não autorizadas. Sua conta Mercado Pago precisa estar verificada e aprovada para usar o Access Token de produção. Use o token de TESTE (TEST-...) enquanto a conta não for aprovada.'
      } else if (mpStatusCode === 400 && causeDesc.includes('email')) {
        friendlyError =
          'Email do pagador inválido para o ambiente de testes. Use um email @testuser.com.'
      } else if (mpStatusCode === 403) {
        friendlyError =
          'Acesso negado pelo Mercado Pago. Verifique se o token está correto e se a conta tem permissão para PIX.'
      }

      return NextResponse.json(
        { error: friendlyError, mp_code: causeCode, isSandbox },
        { status: 400 }
      )
    }

    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null
    const copiaECola   = mpData.point_of_interaction?.transaction_data?.qr_code || null
    const paymentId    = mpData.id?.toString() || null

    if (!copiaECola) {
      console.error('[PIX] MP não retornou qr_code:', JSON.stringify(mpData, null, 2))
      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou o código PIX. Verifique se a conta MP está habilitada para receber via PIX.',
          mp_status: mpData.status,
        },
        { status: 502 }
      )
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        pixQrCodeBase64: qrCodeBase64,
        pixCopiaECola:   copiaECola,
        pixExpiresAt:    expiresAt,
      },
    })

    return NextResponse.json({
      pixQrCodeBase64: qrCodeBase64,
      pixCopiaECola:   copiaECola,
      pixExpiresAt:    expiresAt,
      paymentId,
      paymentStatus:   order.paymentStatus,
      isSandbox,
    })
  } catch (error: any) {
    console.error('[PIX POST]', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

// ─── Consulta status do pagamento (chamado pelo polling da página) ──────────
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
        paymentStatus:      true,
        paymentId:          true,
        pixCopiaECola:      true,
        pixQrCodeBase64:    true,
        pixExpiresAt:       true,
        paymentConfirmedAt: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // ── 1. Já pago no banco → retorna PAID imediatamente ──
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        paymentStatus:      'PAID',
        paymentConfirmedAt: order.paymentConfirmedAt,
      })
    }

    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MP_TEST_TOKEN

    // ── 2. Tem paymentId → consultar status REAL no MP (fallback para webhook) ──
    // Isso garante que mesmo sem webhook configurado, o pagamento é confirmado
    if (order.paymentId && accessToken) {
      try {
        const mpRes = await fetch(`${MP_API}/v1/payments/${order.paymentId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        })

        if (mpRes.ok) {
          const mpData = await mpRes.json()
          const mpStatus = mpData.status // 'approved', 'pending', 'rejected', etc.

          console.log(`[PIX GET] orderId=${orderId} paymentId=${order.paymentId} mp_status=${mpStatus}`)

          if (mpStatus === 'approved') {
            // Atualizar banco e disparar entrega
            await prisma.order.update({
              where: { id: orderId },
              data: {
                paymentStatus:      'PAID',
                paymentConfirmedAt: new Date(),
              },
            })

            // Disparar entrega em background (não bloqueia resposta)
            deliverOrder(orderId).catch((err) =>
              console.error('[PIX GET] Erro na entrega:', err)
            )

            return NextResponse.json({
              paymentStatus:      'PAID',
              paymentConfirmedAt: new Date(),
            })
          }

          // Pagamento rejeitado ou cancelado
          if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
            return NextResponse.json({
              paymentStatus: mpStatus.toUpperCase(),
              mp_status: mpStatus,
            })
          }

          // Ainda pendente — retorna dados do PIX para manter exibição do QR
          return NextResponse.json({
            paymentStatus:   order.paymentStatus,
            pixQrCodeBase64: order.pixQrCodeBase64,
            pixCopiaECola:   order.pixCopiaECola,
            pixExpiresAt:    order.pixExpiresAt,
            paymentId:       order.paymentId,
            mp_status:       mpStatus,
          })
        }
      } catch (err) {
        console.error('[PIX GET] Erro ao consultar MP:', err)
        // Falha na consulta ao MP → continua e retorna dados do banco
      }
    }

    // ── 3. Sem paymentId ainda ou sem token → retorna dados do banco ──
    return NextResponse.json({
      paymentStatus:   order.paymentStatus,
      pixQrCodeBase64: order.pixQrCodeBase64,
      pixCopiaECola:   order.pixCopiaECola,
      pixExpiresAt:    order.pixExpiresAt,
      paymentId:       order.paymentId,
    })
  } catch (error: any) {
    console.error('[PIX GET]', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
