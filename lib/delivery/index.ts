/**
 * Sistema de entrega automática de produtos digitais
 * Suporta: Google Drive (link direto ou service account) + Email
 */

import { prisma } from '@/lib/prisma'
import { sendDeliveryEmail } from '@/lib/email/mailer'

export interface DeliveryResult {
  success: boolean
  method: string
  message: string
  driveLinks?: string[]
}

/**
 * Processa entrega automática após pagamento confirmado
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
    const customerName = order.customerName || order.user?.name || 'Cliente'

    // Coletar todos os links de download dos itens
    const driveLinks: Array<{ name: string; link: string; method: string }> = []

    for (const item of order.items) {
      if (item.product?.driveLink) {
        driveLinks.push({
          name: item.product.name,
          link: item.product.driveLink,
          method: item.product.driveDeliveryMethod || 'LINK',
        })
      }
    }

    if (driveLinks.length === 0) {
      // Sem links configurados — marcar como entregue manualmente
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryStatus: 'PENDING' },
      })
      return { success: false, method: 'manual', message: 'Nenhum link de entrega configurado nos produtos' }
    }

    // Tentar enviar email com os links
    let emailSent = false
    if (customerEmail && process.env.EMAIL_USER) {
      emailSent = await sendDeliveryEmail({
        to: customerEmail,
        customerName,
        orderId,
        items: driveLinks,
      })
    }

    // Atualizar status do pedido
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
      message: emailSent ? `Email enviado para ${customerEmail}` : 'Links prontos para entrega manual',
      driveLinks: driveLinks.map((d) => d.link),
    }
  } catch (error: any) {
    console.error('[DELIVERY ERROR]', error)
    return { success: false, method: 'error', message: error.message }
  }
}

/**
 * Gera link temporário compartilhado do Google Drive via Service Account
 * Necessita: GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY no .env
 */
export async function generateDriveShareLink(fileId: string): Promise<string | null> {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!serviceAccountEmail || !privateKey) {
      // Retorna link de visualização direto se não tem service account
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    }

    // JWT para autenticação com Google API
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }

    // Criar JWT token (implementação simplificada via Web Crypto API)
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))
    const unsigned = `${header}.${body}`

    // Assinar com chave privada RSA
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

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(unsigned)
    )

    const sigBytes = new Uint8Array(signature)
    let sigBinary = ''
    for (let i = 0; i < sigBytes.length; i++) sigBinary += String.fromCharCode(sigBytes[i])
    const jwt = `${unsigned}.${btoa(sigBinary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`

    // Trocar JWT por access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    if (!tokenResponse.ok) {
      return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    }

    const { access_token } = await tokenResponse.json()

    // Criar permissão de leitura temporária (24h)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'anyone', role: 'reader', expirationTime: new Date(Date.now() + 86400000).toISOString() }),
    })

    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
  } catch (error) {
    console.error('[DRIVE SHARE]', error)
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
  }
}
