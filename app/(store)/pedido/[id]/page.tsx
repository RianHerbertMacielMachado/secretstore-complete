'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle, Copy, Check, RefreshCw, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Tipos ──────────────────────────────────────────────────────────────────
type PixState = {
  pixQrCodeBase64: string | null
  pixCopiaECola: string | null
  pixExpiresAt: string | null
  paymentId: string | null
  paymentStatus: string
  error: string | null
  loading: boolean
}

type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | string

// ─── Contador regressivo ────────────────────────────────────────────────────
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setRemaining(Math.max(0, Math.floor(diff / 1000)))
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const expired = remaining === 0

  return (
    <span className={`font-mono font-bold ${expired ? 'text-red-400' : remaining < 300 ? 'text-yellow-400' : 'text-neon-pink'}`}>
      {expired ? 'Expirado' : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
    </span>
  )
}

// ─── Bloco PIX ──────────────────────────────────────────────────────────────
function PixPaymentBlock({ orderId }: { orderId: string }) {
  const [pix, setPix] = useState<PixState>({
    pixQrCodeBase64: null,
    pixCopiaECola: null,
    pixExpiresAt: null,
    paymentId: null,
    paymentStatus: 'PENDING',
    error: null,
    loading: true,
  })
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const paidRef = useRef(false)

  // Gerar PIX ao montar
  // Estratégia: primeiro consulta GET para ver se já existe PIX salvo no banco.
  // Se existir (cached), usa sem chamar MP. Se não existir, chama POST para gerar.
  // Isso evita race condition quando checkout e página disparam POST ao mesmo tempo.
  const generatePix = useCallback(async () => {
    setPix((prev) => ({ ...prev, loading: true, error: null }))
    try {
      // 1. Tentar recuperar PIX já existente (GET)
      const getRes = await fetch(`/api/payment/pix?orderId=${orderId}`)
      if (getRes.ok) {
        const getData = await getRes.json()
        // Se banco já tem copia-e-cola → usar sem chamar MP novamente
        if (getData.pixCopiaECola) {
          setPix({
            pixQrCodeBase64: getData.pixQrCodeBase64 ?? null,
            pixCopiaECola: getData.pixCopiaECola,
            pixExpiresAt: getData.pixExpiresAt ?? null,
            paymentId: getData.paymentId ?? null,
            paymentStatus: getData.paymentStatus,
            error: null,
            loading: false,
          })
          if (getData.paymentStatus === 'PAID') {
            setPaymentStatus('PAID')
            paidRef.current = true
          }
          return
        }
        // Se já está PAGO no banco
        if (getData.paymentStatus === 'PAID') {
          setPaymentStatus('PAID')
          paidRef.current = true
          setPix((prev) => ({ ...prev, loading: false }))
          return
        }
      }

      // 2. Não existe PIX → gerar via POST
      const res = await fetch('/api/payment/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX')
      setPix({
        pixQrCodeBase64: data.pixQrCodeBase64,
        pixCopiaECola: data.pixCopiaECola,
        pixExpiresAt: data.pixExpiresAt,
        paymentId: data.paymentId,
        paymentStatus: data.paymentStatus,
        error: null,
        loading: false,
      })
      if (data.paymentStatus === 'PAID') {
        setPaymentStatus('PAID')
        paidRef.current = true
      }
    } catch (err: any) {
      setPix((prev) => ({ ...prev, loading: false, error: err.message }))
    }
  }, [orderId])

  // Polling de status
  const checkStatus = useCallback(async () => {
    if (paidRef.current) return
    try {
      const res = await fetch(`/api/payment/pix?orderId=${orderId}`)
      const data = await res.json()
      if (data.paymentStatus === 'PAID' || data.paymentStatus === 'approved') {
        setPaymentStatus('PAID')
        paidRef.current = true
        if (pollingRef.current) clearInterval(pollingRef.current)
      } else {
        setPaymentStatus(data.paymentStatus || 'PENDING')
      }
    } catch {
      // silencioso
    }
  }, [orderId])

  useEffect(() => {
    generatePix()
  }, [generatePix])

  // Inicia polling após PIX gerado
  useEffect(() => {
    if (!pix.loading && !pix.error && !paidRef.current) {
      pollingRef.current = setInterval(checkStatus, 5000)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [pix.loading, pix.error, checkStatus])

  const handleCopy = async () => {
    if (!pix.pixCopiaECola) return
    try {
      await navigator.clipboard.writeText(pix.pixCopiaECola)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = pix.pixCopiaECola
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    toast.success('Código PIX copiado!')
    setTimeout(() => setCopied(false), 3000)
  }

  // ── Pago ──
  if (paymentStatus === 'PAID') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 mb-4"
        >
          <CheckCircle size={40} className="text-green-400" />
        </motion.div>
        <h2 className="font-gothic text-2xl font-bold text-green-400 mb-2">Pagamento Confirmado! 🎉</h2>
        <p className="text-white/60 text-sm mb-6">
          O link de acesso ao seu produto foi enviado para o seu e-mail automaticamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/conta/pedidos" className="btn-ghost py-3 px-6 rounded-xl text-sm">
            Ver Meus Pedidos
          </Link>
          <Link href="/" className="btn-neon-solid py-3 px-6 rounded-xl text-sm">
            Continuar Comprando
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Carregando ──
  if (pix.loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center gap-3 text-white/60">
          <div className="w-5 h-5 border-2 border-neon-pink/40 border-t-neon-pink rounded-full animate-spin" />
          Gerando QR Code PIX...
        </div>
      </div>
    )
  }

  // ── Erro ──
  if (pix.error) {
    const isLiveCredError =
      pix.error.includes('live credentials') ||
      pix.error.includes('produção não autorizadas') ||
      pix.error.includes('Unauthorized')
    const isNotConfigured =
      pix.error.includes('MP_NAO_CONFIGURADO') ||
      pix.error.includes('não configurado') ||
      pix.error.includes('MP_ACCESS_TOKEN')

    return (
      <div className="text-center py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-4">
          <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-red-300 text-sm font-medium mb-1">Erro ao gerar PIX</p>
          <p className="text-white/50 text-xs leading-relaxed">{pix.error}</p>
        </div>

        {/* Token de produção ainda não aprovado pelo MP */}
        {isLiveCredError && (
          <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-4 mb-4 text-left">
            <p className="text-yellow-300 font-semibold text-sm mb-2">⚠️ Conta MP não aprovada para produção</p>
            <p className="text-white/60 text-xs mb-3">
              Você está usando um token de produção (<code className="text-neon-pink">APP_USR-...</code>), mas a conta ainda precisa ser verificada pelo Mercado Pago.
            </p>
            <p className="text-yellow-400 font-semibold text-xs mb-2">✅ Solução: use o token de TESTE agora</p>
            <ol className="text-white/60 text-xs space-y-1.5 list-decimal list-inside">
              <li>Acesse <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener" className="text-neon-pink underline">MP Developers → Suas Aplicações</a></li>
              <li>Selecione sua app → aba <strong className="text-white/80">Credenciais de teste</strong></li>
              <li>Copie o token que começa com <code className="text-green-400">TEST-</code></li>
              <li>No Railway: substitua o valor de <code className="text-neon-pink">MP_ACCESS_TOKEN</code> pelo token <code className="text-green-400">TEST-...</code></li>
              <li>Redeploy automático após salvar</li>
            </ol>
            <p className="text-white/30 text-xs mt-3">Para produção real: complete a verificação da conta MP e volte a usar o token <code>APP_USR-...</code></p>
          </div>
        )}

        {/* MP não configurado */}
        {isNotConfigured && !isLiveCredError && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4 text-left">
            <p className="text-yellow-400 font-semibold text-sm mb-2">⚙️ Como configurar o PIX:</p>
            <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
              <li>Acesse <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener" className="text-neon-pink underline">MP Developers</a> e crie uma aplicação</li>
              <li>Em <strong className="text-white/80">Credenciais de teste</strong>, copie o token <code className="text-green-400">TEST-...</code></li>
              <li>No Railway: adicione <code className="text-neon-pink">MP_ACCESS_TOKEN</code> com esse valor</li>
              <li>Redeploy automático após salvar</li>
            </ol>
          </div>
        )}

        <button
          onClick={generatePix}
          className="btn-neon py-2 px-6 rounded-xl text-sm inline-flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    )
  }

  // ── QR Code e copia-e-cola ──
  return (
    <div className="space-y-5">
      {/* Temporizador */}
      {pix.pixExpiresAt && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock size={14} className="text-white/40" />
          <span className="text-white/40">Expira em:</span>
          <CountdownTimer expiresAt={pix.pixExpiresAt} />
        </div>
      )}

      {/* QR Code */}
      {pix.pixQrCodeBase64 && (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,0,127,0.2)]">
            <img
              src={`data:image/png;base64,${pix.pixQrCodeBase64}`}
              alt="QR Code PIX"
              className="w-52 h-52 block"
            />
          </div>
        </div>
      )}

      {/* Copia-e-cola */}
      {pix.pixCopiaECola && (
        <div>
          <p className="text-xs text-white/40 text-center mb-2">Ou copie o código abaixo:</p>
          <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-white/10">
            <div className="flex-1 bg-[#0a0a0a] px-3 py-3 font-mono text-xs text-white/70 truncate select-all">
              {pix.pixCopiaECola}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 flex items-center gap-1.5 text-xs font-semibold transition-all flex-shrink-0 ${
                copied
                  ? 'bg-green-500 text-black'
                  : 'bg-neon-pink hover:bg-neon-pink/80 text-black'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Status de polling */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0 animate-pulse" />
        <p className="text-yellow-400/80 text-xs">
          Aguardando confirmação do pagamento. Após confirmado, o link de acesso será enviado para seu email automaticamente.
        </p>
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/conta/pedidos" className="btn-ghost py-3 px-6 rounded-xl text-sm text-center flex-1">
          Ver Meus Pedidos
        </Link>
        <Link href="/" className="btn-neon py-3 px-6 rounded-xl text-sm text-center flex-1">
          Continuar Comprando
        </Link>
      </div>
    </div>
  )
}

// ─── Instruções para PayPal / PicPay ────────────────────────────────────────
function OtherMethodBlock({
  method,
  orderId,
}: {
  method: string
  orderId: string
}) {
  const instructions: Record<string, { icon: string; title: string; steps: string[] }> = {
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
        'Escaneie o código ou use o link de pagamento',
        'Confirme o pagamento no app',
        'A entrega será automática após confirmação',
      ],
    },
  }

  const info = instructions[method] || instructions.PAYPAL

  return (
    <>
      <div className="text-5xl mb-4 text-center">{info.icon}</div>
      <div className="text-left mb-6">
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
    </>
  )
}

// ─── Conteúdo principal ──────────────────────────────────────────────────────
function PedidoContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const method = searchParams.get('method') || 'PIX'

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d0d0d] border border-neon-pink/20 rounded-2xl p-8"
        style={{ boxShadow: '0 0 40px rgba(255,0,127,0.1)' }}
      >
        {method === 'PIX' ? (
          <>
            <div className="text-5xl mb-3">📱</div>
            <h1 className="font-gothic text-2xl font-bold text-white mb-2">Pagamento via PIX</h1>
            <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-white/40 mb-1">Número do Pedido</p>
              <p className="font-mono text-neon-pink font-bold text-sm">{params.id}</p>
            </div>
            <PixPaymentBlock orderId={params.id} />
          </>
        ) : (
          <>
            <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-white/40 mb-1">Número do Pedido</p>
              <p className="font-mono text-neon-pink font-bold text-sm">{params.id}</p>
            </div>
            <OtherMethodBlock method={method} orderId={params.id} />
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function PedidoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PedidoContent params={params} />
    </Suspense>
  )
}
