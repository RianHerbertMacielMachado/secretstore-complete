'use client'

import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils/helpers'
import { Trash2, ShoppingBag, Tag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, coupon, applyCoupon, removeCoupon, getSubtotal, getDiscount, getTotal } = useCartStore()
  const [couponCode, setCouponCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsApplying(true)
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode.toUpperCase()}`)
      const data = await res.json()
      if (!res.ok || !data.valid) throw new Error(data.error || 'Cupom inválido')
      applyCoupon({ code: couponCode.toUpperCase(), discount: data.discount, type: data.discountType })
      toast.success(`Cupom aplicado! ${data.discountType === 'PERCENTAGE' ? data.discount + '% de desconto' : formatCurrency(data.discount) + ' de desconto'}`)
      setCouponCode('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsApplying(false)
    }
  }

  const subtotal = getSubtotal()
  const discount = getDiscount()
  const total = getTotal()

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-gothic text-3xl font-bold text-white mb-8">
          Carrinho <span className="text-neon-pink">({items.length})</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag size={64} className="text-white/10 mx-auto mb-6" />
            <h2 className="text-xl text-white/40 mb-4">Seu carrinho está vazio</h2>
            <Link href="/produtos" className="btn-neon-solid px-8 py-3 inline-block rounded-xl">
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Itens */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 bg-[#0d0d0d] border border-white/10 rounded-xl hover:border-neon-pink/20 transition-all"
                  >
                    {item.image && (
                      <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-neon-pink font-bold mt-1">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Resumo */}
            <div className="space-y-4">
              {/* Cupom */}
              <div className="p-5 bg-[#0d0d0d] border border-white/10 rounded-xl">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-neon-pink" /> Cupom de Desconto
                </h3>
                {coupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div>
                      <p className="text-green-400 font-mono text-sm font-bold">{coupon.code}</p>
                      <p className="text-green-400/60 text-xs">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.discount}% off` : `${formatCurrency(coupon.discount)} off`}
                      </p>
                    </div>
                    <button onClick={removeCoupon} className="text-white/30 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CUPOM10"
                      className="input-dark flex-1 font-mono text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplying}
                      className="btn-neon px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {isApplying ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="p-5 bg-[#0d0d0d] border border-white/10 rounded-xl space-y-3">
                <h3 className="text-white font-medium">Resumo</h3>
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
                <div className="divider-neon" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-neon-pink font-gothic">{formatCurrency(total)}</span>
                </div>

                <Link href="/checkout" className="w-full btn-neon-solid py-4 rounded-xl flex items-center justify-center gap-2 mt-2">
                  Finalizar Compra <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
