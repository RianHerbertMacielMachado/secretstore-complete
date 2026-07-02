import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { sendDeliveryEmailOrThrow } from '@/lib/email/mailer'
import { grantDrivePermission, extractDriveId } from '@/lib/delivery'

// ─── Verificação de admin ────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: 'Não autenticado', status: 401 }
  if ((session.user as any)?.role !== 'ADMIN') return { error: 'Acesso negado', status: 403 }
  return { session }
}

// ─── POST /api/admin/test ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { action } = body

    // ── 1. Teste de PIX ──────────────────────────────────────────────────────
    if (action === 'test_pix') {
      const accessToken =
        process.env.MP_ACCESS_TOKEN ||
        process.env.MP_TEST_TOKEN ||
        null

      if (!accessToken) {
        return NextResponse.json({
          success: false,
          error: 'MP_ACCESS_TOKEN ou MP_TEST_TOKEN não configurado nas variáveis de ambiente.',
          detail: null,
        })
      }

      const isSandbox = accessToken.startsWith('TEST-')

      // Chamada mínima à API do MP para verificar token
      const mpRes = await fetch('https://api.mercadopago.com/v1/payments/search?limit=1', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const mpData = await mpRes.json()

      if (!mpRes.ok) {
        const causeCode = mpData?.cause?.[0]?.code
        const causeDesc = mpData?.cause?.[0]?.description || ''
        let errMsg = mpData?.message || 'Erro ao se comunicar com o Mercado Pago'

        if (causeCode === 7 || causeDesc.includes('live credentials')) {
          errMsg = 'Credenciais de produção não autorizadas. Sua conta MP precisa estar verificada e aprovada para usar o token APP_USR-.'
        } else if (mpRes.status === 401) {
          errMsg = 'Token inválido ou expirado. Verifique o valor de MP_ACCESS_TOKEN.'
        } else if (mpRes.status === 403) {
          errMsg = 'Token sem permissão para leitura de pagamentos. Verifique as permissões da aplicação MP.'
        }

        return NextResponse.json({
          success: false,
          error: errMsg,
          detail: JSON.stringify(mpData, null, 2),
        })
      }

      return NextResponse.json({
        success: true,
        message: `Token ${isSandbox ? 'de TESTE (TEST-)' : 'de produção (APP_USR-)'} válido. Comunicação com Mercado Pago OK.`,
        detail: JSON.stringify({
          ambiente: isSandbox ? 'sandbox' : 'produção',
          token_prefix: accessToken.slice(0, 12) + '...',
          payments_found: mpData?.results?.length ?? 0,
        }, null, 2),
      })
    }

    // ── 2. Teste de E-mail ───────────────────────────────────────────────────
    if (action === 'test_email') {
      const { to } = body
      if (!to) {
        return NextResponse.json({
          success: false,
          error: 'Campo "to" obrigatório para teste de e-mail.',
          detail: null,
        })
      }

      if (!process.env.EMAIL_USER) {
        return NextResponse.json({
          success: false,
          error: 'EMAIL_USER não configurado. Configure EMAIL_USER e EMAIL_PASS nas variáveis de ambiente.',
          detail: JSON.stringify({
            EMAIL_USER: process.env.EMAIL_USER ? 'configurado' : 'não configurado',
            EMAIL_PASS: process.env.EMAIL_PASS ? 'configurado' : 'não configurado',
            EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com (padrão)',
            EMAIL_PORT: process.env.EMAIL_PORT || '587 (padrão)',
          }, null, 2),
        })
      }

      try {
        await sendDeliveryEmailOrThrow({
          to,
          customerName: 'Teste Admin',
          orderId: 'TEST-' + Date.now(),
          items: [
            {
              name: 'Produto de Teste',
              link: 'https://drive.google.com/file/d/exemplo/view',
              method: 'LINK',
            },
          ],
        })

        return NextResponse.json({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${to}.`,
          detail: JSON.stringify({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || '587',
          }, null, 2),
        })
      } catch (smtpError: any) {
        // Extrai a mensagem real do erro SMTP (ex: "Invalid login", "535 Authentication failed", etc.)
        const smtpMsg = smtpError?.message || String(smtpError)
        const smtpCode = smtpError?.responseCode || smtpError?.code || null
        const smtpResponse = smtpError?.response || null

        let hint = ''
        if (smtpMsg.includes('Invalid login') || smtpMsg.includes('535') || smtpMsg.includes('Authentication')) {
          hint = 'Credenciais incorretas. Para o Resend, EMAIL_USER deve ser "resend" e EMAIL_PASS deve ser sua API Key (re_...). Para Gmail, use uma Senha de App (não a senha normal).'
        } else if (smtpMsg.includes('ECONNREFUSED') || smtpMsg.includes('connect')) {
          hint = 'Não foi possível conectar ao servidor SMTP. Verifique EMAIL_HOST e EMAIL_PORT.'
        } else if (smtpMsg.includes('ETIMEDOUT') || smtpMsg.includes('timeout')) {
          hint = 'Timeout ao conectar ao SMTP. Verifique se a porta não está bloqueada.'
        } else if (smtpMsg.includes('self signed') || smtpMsg.includes('certificate')) {
          hint = 'Erro de certificado SSL. Tente EMAIL_PORT=465 com secure=true, ou EMAIL_PORT=587.'
        }

        return NextResponse.json({
          success: false,
          error: `Falha SMTP: ${smtpMsg}${hint ? ` — ${hint}` : ''}`,
          detail: JSON.stringify({
            smtp_error: smtpMsg,
            smtp_code: smtpCode,
            smtp_response: smtpResponse,
            configuracao: {
              EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
              EMAIL_PORT: process.env.EMAIL_PORT || '587',
              EMAIL_USER: process.env.EMAIL_USER,
              EMAIL_FROM: process.env.EMAIL_FROM || '(usa EMAIL_USER)',
            },
            dica: hint || null,
          }, null, 2),
        })
      }
    }

    // ── 3. Teste de Link Direto ──────────────────────────────────────────────
    if (action === 'test_direct_link') {
      const { url } = body
      if (!url) {
        return NextResponse.json({
          success: false,
          error: 'Campo "url" obrigatório.',
          detail: null,
        })
      }

      const fileId = extractDriveId(url)
      if (!fileId) {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível extrair o ID do Google Drive da URL informada. Certifique-se de usar uma URL válida do Drive.',
          detail: JSON.stringify({ url_informada: url }, null, 2),
        })
      }

      const isFolder = url.includes('/folders/')
      const viewUrl = isFolder
        ? `https://drive.google.com/drive/folders/${fileId}?usp=sharing`
        : `https://drive.google.com/file/d/${fileId}/view?usp=sharing`

      return NextResponse.json({
        success: true,
        message: 'ID extraído com sucesso! O link será enviado ao cliente neste formato.',
        detail: JSON.stringify({
          url_original: url,
          id_extraido: fileId,
          tipo: isFolder ? 'pasta' : 'arquivo',
          link_entrega: viewUrl,
        }, null, 2),
      })
    }

    // ── 4. Teste de Pasta Compartilhada ─────────────────────────────────────
    if (action === 'test_shared_folder') {
      const { url } = body
      if (!url) {
        return NextResponse.json({
          success: false,
          error: 'Campo "url" obrigatório.',
          detail: null,
        })
      }

      const fileId = extractDriveId(url)
      if (!fileId) {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível extrair o ID do Google Drive da URL informada.',
          detail: JSON.stringify({ url_informada: url }, null, 2),
        })
      }

      // Para SHARED_FOLDER, o link é enviado diretamente (sem service account)
      const viewUrl = `https://drive.google.com/drive/folders/${fileId}?usp=sharing`

      return NextResponse.json({
        success: true,
        message: 'Pasta compartilhada validada! O link será enviado ao cliente sem necessidade de service account.',
        detail: JSON.stringify({
          url_original: url,
          id_extraido: fileId,
          link_entrega: viewUrl,
          observacao: 'O cliente recebe o link e acessa com a permissão que a pasta já tem configurada no Drive.',
        }, null, 2),
      })
    }

    // ── 5. Teste de Conceder Permissão ───────────────────────────────────────
    if (action === 'test_grant_permission') {
      const { url, email } = body
      if (!url || !email) {
        return NextResponse.json({
          success: false,
          error: 'Campos "url" e "email" obrigatórios.',
          detail: null,
        })
      }

      const googleSaEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      const googleKey = process.env.GOOGLE_PRIVATE_KEY

      if (!googleSaEmail || !googleKey) {
        return NextResponse.json({
          success: false,
          error: 'Service Account do Google não configurado. Configure GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY para usar GRANT_PERMISSION.',
          detail: JSON.stringify({
            GOOGLE_SERVICE_ACCOUNT_EMAIL: googleSaEmail ? 'configurado' : 'não configurado',
            GOOGLE_PRIVATE_KEY: googleKey ? 'configurado' : 'não configurado',
          }, null, 2),
        })
      }

      const fileId = extractDriveId(url)
      if (!fileId) {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível extrair o ID do Google Drive da URL informada.',
          detail: null,
        })
      }

      const resultUrl = await grantDrivePermission(url, email)

      if (!resultUrl) {
        return NextResponse.json({
          success: false,
          error: 'Falha ao conceder permissão. Verifique se a Service Account tem acesso ao arquivo/pasta.',
          detail: JSON.stringify({
            url_informada: url,
            id_extraido: fileId,
            email_destino: email,
            service_account: googleSaEmail,
          }, null, 2),
        })
      }

      return NextResponse.json({
        success: true,
        message: `Permissão concedida com sucesso para ${email}!`,
        detail: JSON.stringify({
          url_original: url,
          id_extraido: fileId,
          email_destino: email,
          link_resultado: resultUrl,
          service_account: googleSaEmail,
        }, null, 2),
      })
    }

    return NextResponse.json({ error: `Ação "${action}" não reconhecida` }, { status: 400 })
  } catch (error: any) {
    console.error('[ADMIN TEST]', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno no servidor',
      detail: error.stack || null,
    }, { status: 500 })
  }
}
