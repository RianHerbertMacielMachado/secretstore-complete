'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

function PedidoContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const method = searchParams.get('method') || 'PIX'

  const instructions: Record<string, { icon: string; title: string; steps: string[] }> = {
    PIX: {
      icon: '📱',
      title: 'Pagamento via PIX',
      steps: [
        'Abra o app do seu banco ou carteira digital',
        'Selecione a opção "Pagar com PIX"',
        'Escaneie o QR Code ou cole a chave PIX',
        'Confirme o pagamento',
        'Aguarde a confirmação automática (instantânea)',
      ],
    },
    PAYPAL: {
      icon: '💙',
      title: 'Pagamento via PayPal',
      steps: [
        'Clique no botão abaixo para ir ao PayPal',
        'Faça login na sua conta PayPal',
        'Revise os detalhes e confirme o pagamento',
        'Retorne para confirmar seu pedido',
        'A entrega será automática após confirmação',
      ],
    },
    PICPAY: {
      icon: '💚',
      title: 'Pagamento via PicPay',
      steps: [
        'Abra o app do PicPay no seu celular',
        'Toque em "Pagar" e depois em "QR Code"',
        'Escaneie o código ou use o link',
        'Confirme o pagamento no app',
        'A entrega será automática após confirmação',
      ],
    },
  }

  const info = instructions[method] || instructions.PIX

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0d0d0d] border border-neon-pink/20 rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(255,0,127,0.1)' }}
        >
          <div className="text-5xl mb-4">{info.icon}</div>
          <h1 className="font-gothic text-2xl font-bold text-white mb-2">{info.title}</h1>
          
          <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-xl p-4 mb-6">
            <p className="text-xs text-white/40 mb-1">Número do Pedido</p>
            <p className="font-mono text-neon-pink font-bold">{params.id}</p>
          </div>

          <div className="text-left mb-8">
            <h3 className="text-white font-semibold mb-4 text-center">Como finalizar o pagamento:</h3>
            <ol className="space-y-3">
              {info.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neon-pink/20 border border-neon-pink/40 rounded-full flex items-center justify-center text-neon-pink text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-white/70 text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <p className="text-yellow-400/80 text-sm">
              ⏱️ Aguardando confirmação do pagamento. Após confirmado, o link de acesso será enviado para seu email automaticamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/conta/pedidos" className="btn-ghost py-3 px-6 rounded-xl text-sm">
              Ver Meus Pedidos
            </Link>
            <Link href="/" className="btn-neon py-3 px-6 rounded-xl text-sm">
              Continuar Comprando
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function PedidoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PedidoContent params={params} />
    </Suspense>
  )
}
