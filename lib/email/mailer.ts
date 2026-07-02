/**
 * Sistema de envio de emails — DarkShop
 *
 * Usa a API HTTP do Resend (https://resend.com) via fetch na porta 443,
 * evitando bloqueios de porta SMTP (587/465) que ocorrem no Railway e similares.
 *
 * Variáveis de ambiente necessárias:
 *   RESEND_API_KEY  → obrigatório  (ex: re_xxxxxxxxxxxx)
 *   EMAIL_FROM      → obrigatório  (ex: Secret Store <suporte@secretstore.online>)
 *
 * Fallback legado (se RESEND_API_KEY não estiver configurado):
 *   EMAIL_USER + EMAIL_PASS via Nodemailer SMTP — pode falhar no Railway por bloqueio de porta.
 */

interface DeliveryEmailParams {
  to: string
  customerName: string
  orderId: string
  items: Array<{ name: string; link: string; method: string }>
}

interface WelcomeEmailParams {
  to: string
  name: string
}

// ─── HTML compartilhado ──────────────────────────────────────────────────────

function buildDeliveryHtml(params: DeliveryEmailParams): string {
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
          <strong style="color: #fff;">${item.name}</strong>
          <br />
          <a href="${item.link}"
             style="color: #ff007f; text-decoration: none; font-weight: bold;
                    background: rgba(255,0,127,0.1); border: 1px solid rgba(255,0,127,0.3);
                    padding: 8px 16px; border-radius: 8px; display: inline-block; margin-top: 8px;">
            📥 Baixar / Acessar
          </a>
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Inter',sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;padding:30px;
                background:linear-gradient(135deg,#0d0d0d 0%,#1a001a 100%);
                border:1px solid rgba(255,0,127,0.3);border-radius:16px;">
      <div style="font-size:32px;margin-bottom:8px;">✝</div>
      <h1 style="font-size:28px;font-weight:900;margin:0;letter-spacing:4px;
                  color:#fff;text-shadow:0 0 20px #ff007f;">
        SECRET<span style="color:#ff007f;">STORE</span>
      </h1>
      <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:14px;">
        Produtos Digitais Premium
      </p>
    </div>

    <!-- Main Content -->
    <div style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.1);
                border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#ff007f;font-size:20px;margin:0 0 8px;font-weight:700;">
        🎉 Pagamento Confirmado!
      </h2>
      <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;line-height:1.6;">
        Olá, <strong style="color:#fff;">${params.customerName}</strong>!
        Seu pagamento foi confirmado com sucesso. Acesse seus produtos abaixo:
      </p>

      <!-- Order Info -->
      <div style="background:rgba(255,0,127,0.05);border:1px solid rgba(255,0,127,0.15);
                  border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">
          Nº do Pedido
        </p>
        <p style="margin:4px 0 0;color:#ff007f;font-weight:700;font-family:monospace;font-size:16px;">
          #${params.orderId.slice(-8).toUpperCase()}
        </p>
      </div>

      <!-- Products -->
      <h3 style="color:rgba(255,255,255,0.8);font-size:14px;text-transform:uppercase;
                  letter-spacing:2px;margin:0 0 16px;">Seus Produtos:</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <!-- Warning -->
    <div style="background:rgba(255,165,0,0.05);border:1px solid rgba(255,165,0,0.2);
                border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:rgba(255,165,0,0.9);font-size:13px;line-height:1.5;">
        ⚠️ <strong>Importante:</strong> Os links de download são pessoais e intransferíveis.
        Por favor, não os compartilhe. Faça backup dos seus arquivos após o download.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #1a1a1a;">
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
        Secret Store · Produtos Digitais Premium<br>
        Este email foi enviado automaticamente. Não responda a este email.
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── Envio via Resend API HTTP (porta 443 — nunca bloqueada) ─────────────────

async function sendViaResend(payload: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY não configurada. Adicione a variável de ambiente com sua API Key do Resend (re_...).'
    )
  }

  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error(
      'EMAIL_FROM não configurado. Defina o remetente, ex: Secret Store <suporte@secretstore.online>'
    )
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, from }),
  })

  if (!res.ok) {
    const body = await res.text()
    let detail = body
    try {
      const json = JSON.parse(body)
      detail = json.message || json.error || body
    } catch { /* mantém body original */ }

    throw new Error(`Resend API ${res.status}: ${detail}`)
  }
}

// ─── Fallback: Nodemailer SMTP ───────────────────────────────────────────────
// Usado apenas se RESEND_API_KEY não estiver configurada.
// ATENÇÃO: Railway bloqueia portas SMTP (587/465). Prefira sempre o Resend.

async function sendViaSmtp(payload: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Nenhum método de envio configurado. Configure RESEND_API_KEY (recomendado) ' +
      'ou EMAIL_USER + EMAIL_PASS para SMTP.'
    )
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail(payload)
}

// ─── Dispatcher: tenta Resend primeiro, cai para SMTP se necessário ──────────

async function sendEmail(payload: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@secretstore.online'
  const full = { ...payload, from }

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(full)
  } else {
    await sendViaSmtp(full)
  }
}

// ─── Exports públicos ────────────────────────────────────────────────────────

/**
 * Envia e-mail de entrega com links do Google Drive.
 * Retorna true em sucesso, false em falha (não lança).
 */
export async function sendDeliveryEmail(params: DeliveryEmailParams): Promise<boolean> {
  try {
    await sendEmail({
      to: params.to,
      subject: `✅ Pedido #${params.orderId.slice(-8).toUpperCase()} Confirmado — Secret Store`,
      html: buildDeliveryHtml(params),
    })
    return true
  } catch (error) {
    console.error('[EMAIL DELIVERY]', error)
    return false
  }
}

/**
 * Versão que lança o erro em vez de retornar false.
 * Usada pelo painel admin (/admin/testes) para exibir a mensagem real de falha.
 */
export async function sendDeliveryEmailOrThrow(params: DeliveryEmailParams): Promise<void> {
  const isTest = params.orderId.startsWith('TEST-')
  const subject = isTest
    ? `🧪 E-mail de Teste — Secret Store`
    : `✅ Pedido #${params.orderId.slice(-8).toUpperCase()} Confirmado — Secret Store`

  const html = isTest
    ? `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px 20px;max-width:600px;margin:0 auto;">
  <div style="background:#0d0d0d;border:1px solid rgba(255,0,127,0.3);border-radius:16px;padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🧪</div>
    <h1 style="color:#ff007f;margin:0 0 8px;">E-mail de Teste</h1>
    <p style="color:rgba(255,255,255,0.6);">Enviado pelo painel admin da Secret Store.</p>
    <p style="color:rgba(255,255,255,0.4);font-size:13px;">
      Se você recebeu este e-mail, a integração de envio está funcionando corretamente! ✅
    </p>
    <p style="color:rgba(255,255,255,0.25);font-size:11px;margin-top:24px;">
      Nenhum pedido real foi criado. Este é apenas um teste.
    </p>
  </div>
</body></html>`
    : buildDeliveryHtml(params)

  await sendEmail({ to: params.to, subject, html })
}

/**
 * E-mail de boas-vindas ao cadastrar.
 * Retorna true em sucesso, false em falha (não lança).
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  try {
    await sendEmail({
      to: params.to,
      subject: `Bem-vindo à Secret Store, ${params.name}! ✝`,
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px 20px;max-width:500px;margin:0 auto;">
  <h1 style="color:#ff007f;text-align:center;">Bem-vindo(a)!</h1>
  <p>Olá, <strong>${params.name}</strong>! Sua conta na Secret Store foi criada com sucesso.</p>
  <p>Explore nossa coleção de produtos digitais exclusivos.</p>
  <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/produtos"
     style="display:inline-block;background:#ff007f;color:#000;padding:12px 24px;
            border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px;">
    Ver Produtos
  </a>
</body></html>`,
    })
    return true
  } catch (error) {
    console.error('[EMAIL WELCOME]', error)
    return false
  }
}
