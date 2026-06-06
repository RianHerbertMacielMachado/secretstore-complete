'use client'

import StoreLayout from '@/components/layouts/StoreLayout'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils/helpers'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Lock, CreditCard, QrCode, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'

type PaymentMethod = 'PIX' | 'PAYPAL' | 'PICPAY'

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, getTotal, getSubtotal, getDiscount, coupon, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  })

  const total = getTotal()
  const subtotal = getSubtotal()
  const discount = getDiscount()

  const handleCheckout = async () => {
    if (!session) {
      toast.error('Faça login para continuar')
      router.push('/auth/login')
      return
    }
    if (items.length === 0) {
      toast.error('Carrinho vazio')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          couponCode: coupon?.code,
          paymentMethod,
          customerEmail: formData.email,
          customerName: formData.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar pedido')

      clearCart()
      router.push(`/pedido/${data.orderId}?method=${paymentMethod}`)
      toast.success('Pedido criado! Complete o pagamento.')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar pedido')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-white/40 mb-4">Seu carrinho está vazio</p>
          <Link href="/produtos" className="btn-neon-solid px-8 py-3 inline-block rounded-xl">
            Voltar à Loja
          </Link>
        </div>
      </StoreLayout>
    )
  }

  return (
    <StoreLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Lock size={20} className="text-neon-pink" />
          <h1 className="font-gothic text-3xl font-bold text-white">Checkout Seguro</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Esquerda: Dados e Pagamento */}
          <div className="space-y-6">
            {/* Dados do comprador */}
            <div className="p-6 bg-[#0d0d0d] border border-white/10 rounded-xl">
              <h2 className="text-white font-semibold mb-4">Seus Dados</h2>
              {session ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neon-pink/5 border border-neon-pink/20 rounded-lg">
                  <p className="text-white/70 text-sm mb-3">Faça login para continuar com o checkout</p>
                  <Link href="/auth/login" className="btn-neon-solid py-2 px-6 rounded-lg text-sm inline-block">
                    Entrar / Cadastrar
                  </Link>
                </div>
              )}
            </div>

            {/* Método de pagamento */}
            <div className="p-6 bg-[#0d0d0d] border border-white/10 rounded-xl">
              <h2 className="text-white font-semibold mb-4">Método de Pagamento</h2>
              <div className="space-y-3">
                {[
                  {
                    id: 'PIX' as PaymentMethod,
                    label: 'PIX',
                    description: 'Pagamento instantâneo via QR Code',
                    icon: <QrCode size={20} />,
                    badge: 'Recomendado',
                  },
                  {
                    id: 'PAYPAL' as PaymentMethod,
                    label: 'PayPal',
                    description: 'Pague com sua conta PayPal',
                    icon: <CreditCard size={20} />,
                  },
                  {
                    id: 'PICPAY' as PaymentMethod,
                    label: 'PicPay',
                    description: 'Pague pelo app PicPay',
                    icon: <Smartphone size={20} />,
                  },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === method.id
                        ? 'border-neon-pink bg-neon-pink/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`${paymentMethod === method.id ? 'text-neon-pink' : 'text-white/40'}`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{method.label}</span>
                        {method.badge && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{method.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.id ? 'border-neon-pink' : 'border-white/20'
                    }`}>
                      {paymentMethod === method.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-neon-pink" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direita: Resumo */}
          <div className="space-y-4">
            <div className="p-6 bg-[#0d0d0d] border border-white/10 rounded-xl sticky top-24">
              <h2 className="text-white font-semibold mb-4">Resumo do Pedido</h2>

              {/* Itens */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.name}</p>
                      <p className="text-xs text-white/40">Qtd: {item.quantity}</p>
                    </div>
                    <span className="text-neon-pink text-sm font-medium">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="divider-neon mb-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Desconto</span>
                    <span className="text-green-400">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white font-semibold text-lg">Total</span>
                  <span className="text-2xl font-bold text-neon-pink font-gothic">{formatCurrency(total)}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={isLoading || !session}
                className="w-full btn-neon-solid py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Finalizar Pedido
                  </>
                )}
              </motion.button>

              <p className="text-center text-xs text-white/30 mt-3">
                🔒 Pagamento 100% seguro e criptografado
              </p>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
