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

      // Verificar se algum método está configurado
      const hasResend = !!process.env.RESEND_API_KEY
      const hasSmtp   = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)

      if (!hasResend && !hasSmtp) {
        return NextResponse.json({
          success: false,
          error: 'Nenhum método de envio de e-mail configurado.',
          detail: JSON.stringify({
            metodo_recomendado: 'Resend API (porta 443 — não é bloqueada pelo Railway)',
            RESEND_API_KEY: 'não configurado → adicione sua API Key do resend.com (re_...)',
            EMAIL_FROM: process.env.EMAIL_FROM || 'não configurado → ex: Secret Store <suporte@secretstore.online>',
            alternativa_smtp: 'Configure EMAIL_USER + EMAIL_PASS (pode falhar no Railway por bloqueio de porta 587)',
          }, null, 2),
        })
      }

      try {
        await sendDeliveryEmailOrThrow({
          to,
          customerName: 'Teste Admin',
          orderId: 'TEST-' + Date.now(),
          items: [{ name: 'Produto de Teste', link: 'https://drive.google.com/file/d/exemplo/view', method: 'LINK' }],
        })

        return NextResponse.json({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${to} via ${hasResend ? 'Resend API' : 'SMTP'}.`,
          detail: JSON.stringify({
            metodo: hasResend ? 'Resend API (HTTP)' : 'SMTP (Nodemailer)',
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            ...(hasResend
              ? { resend_key_prefix: process.env.RESEND_API_KEY!.slice(0, 8) + '...' }
              : { smtp_host: process.env.EMAIL_HOST || 'smtp.gmail.com', smtp_port: process.env.EMAIL_PORT || '587' }),
          }, null, 2),
        })
      } catch (emailError: any) {
        const msg = emailError?.message || String(emailError)

        // Dicas específicas por tipo de erro
        let hint = ''
        if (msg.includes('RESEND_API_KEY')) {
          hint = 'Adicione RESEND_API_KEY nas variáveis de ambiente do Railway com sua API Key do resend.com.'
        } else if (msg.includes('EMAIL_FROM')) {
          hint = 'Adicione EMAIL_FROM com um domínio verificado no Resend, ex: Secret Store <suporte@secretstore.online>.'
        } else if (msg.includes('Resend API 401') || msg.includes('Unauthorized')) {
          hint = 'API Key do Resend inválida ou expirada. Verifique o valor de RESEND_API_KEY em resend.com/api-keys.'
        } else if (msg.includes('Resend API 422') || msg.includes('domain') || msg.includes('from address')) {
          hint = 'Domínio do remetente não verificado no Resend. Acesse resend.com/domains e verifique o domínio do EMAIL_FROM.'
        } else if (msg.includes('Resend API 429')) {
          hint = 'Limite de envios do Resend atingido. Aguarde um momento e tente novamente.'
        } else if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
          hint = 'Timeout de conexão — a porta SMTP está bloqueada no Railway. Migre para Resend API: adicione RESEND_API_KEY nas variáveis de ambiente.'
        } else if (msg.includes('Invalid login') || msg.includes('535') || msg.includes('Authentication')) {
          hint = 'Credenciais SMTP incorretas. Para o Gmail, use uma Senha de App (não a senha normal da conta).'
        }

        return NextResponse.json({
          success: false,
          error: `Falha no envio: ${msg}${hint ? ` — ${hint}` : ''}`,
          detail: JSON.stringify({
            erro: msg,
            metodo_tentado: hasResend ? 'Resend API (HTTP)' : 'SMTP (Nodemailer)',
            configuracao: {
              RESEND_API_KEY: hasResend ? process.env.RESEND_API_KEY!.slice(0, 8) + '...' : 'não configurado',
              EMAIL_FROM: process.env.EMAIL_FROM || 'não configurado',
              EMAIL_USER: process.env.EMAIL_USER || 'não configurado',
              EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
              EMAIL_PORT: process.env.EMAIL_PORT || '587',
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

    // ── 6. Teste de PayPal ───────────────────────────────────────────────────
    if (action === 'test_paypal') {
      const clientId     = process.env.PAYPAL_CLIENT_ID
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET
      const mode         = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'

      if (!clientId || !clientSecret) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais do PayPal não configuradas.',
          detail: JSON.stringify({
            PAYPAL_CLIENT_ID:     clientId     ? 'configurado' : 'não configurado',
            PAYPAL_CLIENT_SECRET: clientSecret ? 'configurado' : 'não configurado',
            PAYPAL_MODE:          process.env.PAYPAL_MODE || 'não configurado (padrão: sandbox)',
            PAYPAL_WEBHOOK_ID:    process.env.PAYPAL_WEBHOOK_ID || 'não configurado (opcional)',
          }, null, 2),
        })
      }

      const baseUrl = mode === 'live'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com'

      try {
        // Obter access token — é a forma oficial de testar credenciais PayPal
        const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/x-www-form-urlencoded',
            Authorization:   `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
          body: 'grant_type=client_credentials',
        })
        const tokenData = await tokenRes.json()

        if (!tokenRes.ok) {
          let hint = ''
          if (tokenRes.status === 401) hint = 'Client ID ou Client Secret incorretos. Verifique em developer.paypal.com → Apps & Credentials.'
          else if (tokenRes.status === 400) hint = 'Requisição inválida. Confirme que PAYPAL_MODE corresponde ao tipo das credenciais (sandbox ou live).'

          return NextResponse.json({
            success: false,
            error: `Falha na autenticação PayPal (${tokenRes.status}): ${tokenData.error_description || tokenData.error || 'erro desconhecido'}${hint ? ` — ${hint}` : ''}`,
            detail: JSON.stringify({
              status_http:  tokenRes.status,
              paypal_error: tokenData.error,
              descricao:    tokenData.error_description,
              modo:         mode,
              dica:         hint || null,
            }, null, 2),
          })
        }

        // Verificar escopo mínimo necessário
        const scopes: string = tokenData.scope || ''
        const hasPayments = scopes.includes('https://uri.paypal.com/services/payments')
          || scopes.includes('openid')

        return NextResponse.json({
          success: true,
          message: `Credenciais PayPal válidas! Autenticado no ambiente de ${mode === 'live' ? 'produção' : 'sandbox'}.`,
          detail: JSON.stringify({
            ambiente:      mode,
            token_type:    tokenData.token_type,
            expires_in:    `${tokenData.expires_in}s`,
            client_id_prefix: clientId.slice(0, 10) + '...',
            webhook_id:    process.env.PAYPAL_WEBHOOK_ID || 'não configurado (webhook não será verificado)',
            scopes_preview: scopes.split(' ').slice(0, 4).join(' ') + '...',
          }, null, 2),
        })
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Erro ao conectar com PayPal: ${err.message}`,
          detail: JSON.stringify({ erro: err.message, modo: mode, baseUrl }, null, 2),
        })
      }
    }

    // ── 7. Teste de PicPay ───────────────────────────────────────────────────
    if (action === 'test_picpay') {
      const picpayToken   = process.env.PICPAY_TOKEN
      const picpaySeller  = process.env.PICPAY_SELLER_TOKEN
      const webhookSecret = process.env.PICPAY_WEBHOOK_SECRET

      if (!picpayToken && !picpaySeller) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais do PicPay não configuradas.',
          detail: JSON.stringify({
            PICPAY_TOKEN:          picpayToken   ? 'configurado' : 'não configurado',
            PICPAY_SELLER_TOKEN:   picpaySeller  ? 'configurado' : 'não configurado',
            PICPAY_WEBHOOK_SECRET: webhookSecret ? 'configurado' : 'não configurado (opcional)',
            instrucoes: 'Acesse https://lojista.picpay.com → Configurações → Tokens para obter suas credenciais.',
          }, null, 2),
        })
      }

      const token = picpayToken || picpaySeller!

      try {
        // PicPay API: verificar token tentando listar pagamentos (endpoint público da API)
        const ppRes = await fetch('https://appws.picpay.com/ecommerce/public/payments?offset=0&limit=1', {
          headers: {
            'x-picpay-token': token,
            'Content-Type': 'application/json',
          },
        })

        // 200 ou 404 = token válido (404 = sem pagamentos, mas auth OK)
        // 401/403 = token inválido
        if (ppRes.status === 401 || ppRes.status === 403) {
          const ppData = await ppRes.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error: `Token PicPay inválido ou sem permissão (HTTP ${ppRes.status}). Verifique o valor de PICPAY_TOKEN em lojista.picpay.com.`,
            detail: JSON.stringify({
              status_http: ppRes.status,
              resposta:    ppData,
              token_prefix: token.slice(0, 10) + '...',
            }, null, 2),
          })
        }

        const ppData = await ppRes.json().catch(() => ({}))

        return NextResponse.json({
          success: true,
          message: `Token PicPay válido! Conexão com a API estabelecida com sucesso.`,
          detail: JSON.stringify({
            status_http:     ppRes.status,
            token_prefix:    token.slice(0, 10) + '...',
            variavel_usada:  picpayToken ? 'PICPAY_TOKEN' : 'PICPAY_SELLER_TOKEN',
            webhook_secret:  webhookSecret ? 'configurado' : 'não configurado (webhook não verificará assinatura)',
            payments_sample: ppData?.data?.length ?? ppData?.total ?? 'n/a',
          }, null, 2),
        })
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Erro ao conectar com PicPay: ${err.message}`,
          detail: JSON.stringify({ erro: err.message }, null, 2),
        })
      }
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
