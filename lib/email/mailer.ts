/**
 * Sistema de envio de emails - DarkShop
 * Usa Nodemailer com SMTP (Gmail, Outlook, etc.)
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

/**
 * Cria transporter Nodemailer dinamicamente para evitar import estático
 * (Nodemailer usa Node.js APIs não disponíveis no edge runtime)
 *
 * Lança erro se as variáveis não estiverem configuradas ou se o import falhar.
 * O erro é capturado pelo chamador, que decide se retorna false ou relança.
 */
async function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      `Credenciais SMTP ausentes. Configure EMAIL_USER e EMAIL_PASS nas variáveis de ambiente. ` +
      `(EMAIL_HOST=${process.env.EMAIL_HOST || 'não definido'}, EMAIL_USER=${process.env.EMAIL_USER || 'não definido'})`
    )
  }

  const nodemailer = await import('nodemailer')
  return nodemailer.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

/**
 * Email de entrega com links do Google Drive
 */
export async function sendDeliveryEmail(params: DeliveryEmailParams): Promise<boolean> {
  let transporter: Awaited<ReturnType<typeof createTransporter>>
  try {
    transporter = await createTransporter()
  } catch (error) {
    console.error('[EMAIL] Falha ao criar transporter:', error)
    return false
  }

  try {
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
        </tr>
      `
      )
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #000; font-family: 'Inter', sans-serif; color: #fff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px; padding: 30px; 
                background: linear-gradient(135deg, #0d0d0d 0%, #1a001a 100%);
                border: 1px solid rgba(255,0,127,0.3); border-radius: 16px;">
      <div style="font-size: 32px; margin-bottom: 8px;">✝</div>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 4px;
                  color: #fff; text-shadow: 0 0 20px #ff007f;">
        DARK<span style="color: #ff007f;">SHOP</span>
      </h1>
      <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0; font-size: 14px;">
        Produtos Digitais Premium
      </p>
    </div>

    <!-- Main Content -->
    <div style="background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); 
                border-radius: 16px; padding: 32px; margin-bottom: 24px;">
      <h2 style="color: #ff007f; font-size: 20px; margin: 0 0 8px; font-weight: 700;">
        🎉 Pagamento Confirmado!
      </h2>
      <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px; line-height: 1.6;">
        Olá, <strong style="color: #fff;">${params.customerName}</strong>! 
        Seu pagamento foi confirmado com sucesso. Acesse seus produtos abaixo:
      </p>

      <!-- Order Info -->
      <div style="background: rgba(255,0,127,0.05); border: 1px solid rgba(255,0,127,0.15); 
                  border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
          Nº do Pedido
        </p>
        <p style="margin: 4px 0 0; color: #ff007f; font-weight: 700; font-family: monospace; font-size: 16px;">
          #${params.orderId.slice(-8).toUpperCase()}
        </p>
      </div>

      <!-- Products -->
      <h3 style="color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; 
                  letter-spacing: 2px; margin: 0 0 16px;">Seus Produtos:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <!-- Warning -->
    <div style="background: rgba(255,165,0,0.05); border: 1px solid rgba(255,165,0,0.2); 
                border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0; color: rgba(255,165,0,0.9); font-size: 13px; line-height: 1.5;">
        ⚠️ <strong>Importante:</strong> Os links de download são pessoais e intransferíveis. 
        Por favor, não os compartilhe. Faça backup dos seus arquivos após o download.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #1a1a1a;">
      <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
        DarkShop · Produtos Digitais Premium<br>
        Este email foi enviado automaticamente. Não responda a este email.
      </p>
    </div>
  </div>
</body>
</html>`

    await transporter.sendMail({
      from: `"DarkShop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: params.to,
      subject: `✅ Pedido #${params.orderId.slice(-8).toUpperCase()} Confirmado — DarkShop`,
      html,
    })

    return true
  } catch (error) {
    console.error('[EMAIL DELIVERY]', error)
    return false
  }
}

/**
 * Versão de teste que lança o erro ao invés de retornar false.
 * Usada pelo painel admin para exibir a mensagem real de falha SMTP.
 */
export async function sendDeliveryEmailOrThrow(params: DeliveryEmailParams): Promise<void> {
  const transporter = await createTransporter() // lança se não configurado
  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a;">
          <strong style="color: #fff;">${item.name}</strong><br/>
          <a href="${item.link}" style="color:#ff007f;">📥 Baixar / Acessar</a>
        </td>
      </tr>`
    )
    .join('')

  await transporter.sendMail({
    from: `"DarkShop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: params.to,
    subject: `✅ Pedido #${params.orderId.slice(-8).toUpperCase()} Confirmado — DarkShop (TESTE)`,
    html: `<body style="background:#000;color:#fff;font-family:sans-serif;padding:20px;">
      <h2 style="color:#ff007f;">🧪 E-mail de Teste — DarkShop</h2>
      <p>Olá, <strong>${params.customerName}</strong>! Este é um e-mail de teste enviado pelo painel admin.</p>
      <table style="width:100%;border-collapse:collapse;"><tbody>${itemsHtml}</tbody></table>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px;">Este é um e-mail de teste. Nenhum pedido real foi criado.</p>
    </body>`,
  })
}

/**
 * Email de boas-vindas ao cadastrar
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  let transporter: Awaited<ReturnType<typeof createTransporter>>
  try {
    transporter = await createTransporter()
  } catch {
    return false
  }

  try {
    await transporter.sendMail({
      from: `"DarkShop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: params.to,
      subject: `Bem-vindo à DarkShop, ${params.name}! ✝`,
      html: `
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px 20px;max-width:500px;margin:0 auto;">
  <h1 style="color:#ff007f;text-align:center;">Bem-vindo(a)!</h1>
  <p>Olá, <strong>${params.name}</strong>! Sua conta na DarkShop foi criada com sucesso.</p>
  <p>Explore nossa coleção de produtos digitais exclusivos.</p>
  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/produtos" 
     style="display:inline-block;background:#ff007f;color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px;">
    Ver Produtos
  </a>
</body>`,
    })
    return true
  } catch {
    return false
  }
}
