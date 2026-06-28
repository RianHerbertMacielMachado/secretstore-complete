/**
 * Sistema de entrega automática de produtos digitais
 * Suporta: Google Drive (link direto, pasta compartilhada ou permissão por e-mail)
 */

import { prisma } from '@/lib/prisma'
import { sendDeliveryEmail } from '@/lib/email/mailer'

export interface DeliveryResult {
  success: boolean
  method: string
  message: string
  driveLinks?: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de URL do Google Drive
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai o ID de qualquer formato de URL do Google Drive.
 * Suporta:
 *   - /file/d/{ID}/view
 *   - /file/d/{ID}/edit
 *   - /drive/folders/{ID}
 *   - /open?id={ID}
 *   - /folderview?id={ID}
 *   - id={ID} como query param avulso
 */
export function extractDriveId(url: string): string | null {
  if (!url) return null

  // /file/d/{ID}  ou  /folders/{ID}
  const pathMatch = url.match(/\/(?:file\/d|folders)\/([a-zA-Z0-9_-]{10,})/)
  if (pathMatch) return pathMatch[1]

  // ?id={ID}
  try {
    const u = new URL(url)
    const id = u.searchParams.get('id')
    if (id && id.length >= 10) return id
  } catch {
    // URL inválida — continua tentando
  }

  // fallback: primeiro segmento que pareça um ID do Drive
  const rawMatch = url.match(/([a-zA-Z0-9_-]{25,})/)
  return rawMatch ? rawMatch[1] : null
}

/**
 * Determina se a URL aponta para uma pasta do Drive.
 */
function isFolderUrl(url: string): boolean {
  return url.includes('/folders/') || url.includes('folderview')
}

/**
 * Monta URL de acesso final dependendo do tipo (arquivo ou pasta).
 */
function buildDriveViewUrl(id: string, isFolder: boolean): string {
  return isFolder
    ? `https://drive.google.com/drive/folders/${id}?usp=sharing`
    : `https://drive.google.com/file/d/${id}/view?usp=sharing`
}

// ─────────────────────────────────────────────────────────────────────────────
// Autenticação com Service Account (JWT → access_token)
// ─────────────────────────────────────────────────────────────────────────────

async function getServiceAccountToken(): Promise<string | null> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[DRIVE] GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_PRIVATE_KEY não configurados')
    return null
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }

    // Montar JWT (header.payload.signature)
    const toBase64Url = (str: string) =>
      btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const payload = toBase64Url(JSON.stringify(jwtPayload))
    const unsigned = `${header}.${payload}`

    // Importar chave privada RSA
    const keyData = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(unsigned)
    )

    const sigBytes = new Uint8Array(signatureBuffer)
    let sigBinary = ''
    for (let i = 0; i < sigBytes.length; i++) sigBinary += String.fromCharCode(sigBytes[i])
    const signature = toBase64Url(sigBinary)

    const jwt = `${unsigned}.${signature}`

    // Trocar JWT por access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[DRIVE] Falha ao obter token:', err)
      return null
    }

    const { access_token } = await tokenRes.json()
    return access_token as string
  } catch (error) {
    console.error('[DRIVE] Erro ao gerar token de service account:', error)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conceder permissão individual a um e-mail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compartilha um arquivo ou pasta do Drive especificamente com o e-mail do cliente.
 * Funciona igual para arquivo e pasta — a API do Drive aplica herança automaticamente.
 *
 * @returns a URL de acesso direto já formatada, ou null em caso de falha
 */
export async function grantDrivePermission(
  driveUrl: string,
  customerEmail: string
): Promise<string | null> {
  const fileId = extractDriveId(driveUrl)
  if (!fileId) {
    console.error('[DRIVE] Não foi possível extrair o ID da URL:', driveUrl)
    return null
  }

  const isFolder = isFolderUrl(driveUrl)
  const viewUrl = buildDriveViewUrl(fileId, isFolder)

  const accessToken = await getServiceAccountToken()
  if (!accessToken) {
    // Sem service account configurado — retorna o link direto mesmo sem permissão individual
    console.warn('[DRIVE] Sem service account. Retornando link direto sem permissão individual.')
    return viewUrl
  }

  try {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'user',           // específico para este usuário
          role: 'reader',         // somente leitura
          emailAddress: customerEmail,
          sendNotificationEmail: false, // não envia email do Google — o nosso sistema envia
        }),
      }
    )

    if (!permRes.ok) {
      const err = await permRes.text()
      console.error(`[DRIVE] Falha ao conceder permissão para ${customerEmail}:`, err)
      // Mesmo com falha na permissão, retorna o link para não bloquear a entrega
      return viewUrl
    }

    console.log(`[DRIVE] Permissão concedida para ${customerEmail} no recurso ${fileId} (${isFolder ? 'pasta' : 'arquivo'})`)
    return viewUrl
  } catch (error) {
    console.error('[DRIVE] Erro ao conceder permissão:', error)
    return viewUrl
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrega principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processa entrega automática após pagamento confirmado.
 * Diferencia os 3 métodos:
 *   - LINK            → envia o link diretamente por e-mail
 *   - SHARED_FOLDER   → envia o link da pasta por e-mail
 *   - GRANT_PERMISSION → concede permissão individual via Drive API, depois envia e-mail
 */
export async function deliverOrder(orderId: string): Promise<DeliveryResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                driveLink: true,
                driveDeliveryMethod: true,
                mainImage: true,
              },
            },
          },
        },
        user: { select: { email: true, name: true } },
      },
    })

    if (!order) return { success: false, method: 'none', message: 'Pedido não encontrado' }
    if (order.deliveryStatus === 'DELIVERED') {
      return { success: true, method: 'none', message: 'Já foi entregue' }
    }

    const customerEmail = order.customerEmail || order.user?.email || ''
    const customerName  = order.customerName  || order.user?.name  || 'Cliente'

    if (!customerEmail) {
      return { success: false, method: 'none', message: 'E-mail do cliente não encontrado' }
    }

    // ── Processar cada item do pedido ──────────────────────────────────────
    const deliveryItems: Array<{ name: string; link: string; method: string }> = []
    const errors: string[] = []

    for (const item of order.items) {
      const product = item.product
      if (!product?.driveLink) continue

      const method = product.driveDeliveryMethod || 'LINK'

      if (method === 'GRANT_PERMISSION') {
        // Conceder permissão individual e obter link final
        const link = await grantDrivePermission(product.driveLink, customerEmail)
        if (link) {
          deliveryItems.push({ name: product.name, link, method })
        } else {
          errors.push(`Falha ao conceder permissão para "${product.name}"`)
        }
      } else {
        // LINK ou SHARED_FOLDER — apenas envia o link como está
        deliveryItems.push({
          name: product.name,
          link: product.driveLink,
          method,
        })
      }
    }

    if (deliveryItems.length === 0 && errors.length > 0) {
      return { success: false, method: 'error', message: errors.join('; ') }
    }

    if (deliveryItems.length === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryStatus: 'PENDING' },
      })
      return { success: false, method: 'manual', message: 'Nenhum link de entrega configurado nos produtos' }
    }

    // ── Enviar e-mail com os links ─────────────────────────────────────────
    let emailSent = false
    if (process.env.EMAIL_USER) {
      emailSent = await sendDeliveryEmail({
        to: customerEmail,
        customerName,
        orderId,
        items: deliveryItems,
      })
    }

    // ── Atualizar status do pedido ─────────────────────────────────────────
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: emailSent ? 'DELIVERED' : 'SENT',
        deliveryEmailSentAt: emailSent ? new Date() : undefined,
      },
    })

    return {
      success: true,
      method: emailSent ? 'email' : 'link',
      message: emailSent
        ? `E-mail enviado para ${customerEmail}`
        : 'Links prontos (e-mail não configurado)',
      driveLinks: deliveryItems.map((d) => d.link),
    }
  } catch (error: any) {
    console.error('[DELIVERY ERROR]', error)
    return { success: false, method: 'error', message: error.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legado — mantido por compatibilidade com chamadas antigas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use grantDrivePermission() diretamente.
 * Gera link de visualização e, se service account disponível, concede permissão pública (anyone).
 * Mantido apenas para não quebrar chamadas existentes.
 */
export async function generateDriveShareLink(fileId: string): Promise<string | null> {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
}
