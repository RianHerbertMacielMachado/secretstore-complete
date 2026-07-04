'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Copy, Check, Gift } from 'lucide-react'

interface PopupConfig {
  enabled: boolean
  discount: string
  code: string
  expiryHours: number
  ctaText: string
  ctaLink: string
  delaySeconds: number
}

const STORAGE_KEY = 'ss_popup_expiry'

/**
 * CouponPopup — Popup flutuante com ícone de presente (canto inferior direito)
 * - Ícone aparece após `delaySeconds` segundos
 * - O temporizador persiste via localStorage (não reinicia no reload)
 * - O código é copiado com um clique
 * - O popup fecha ao clicar fora ou no X
 */
export default function CouponPopup({ config }: { config: PopupConfig }) {
  const [isVisible, setIsVisible] = useState(false)    // mostra o ícone flutuante
  const [isOpen, setIsOpen] = useState(false)          // modal aberto
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const delayRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializa (ou lê) o timestamp de expiração do localStorage
  const initExpiry = useCallback(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(STORAGE_KEY)
    const now = Date.now()

    let expiryTs: number

    if (stored) {
      expiryTs = parseInt(stored, 10)
      // Se já expirou, reseta
      if (now >= expiryTs) {
        const newExpiry = now + config.expiryHours * 3600 * 1000
        localStorage.setItem(STORAGE_KEY, String(newExpiry))
        expiryTs = newExpiry
      }
    } else {
      // Primeira visita — grava o timestamp de expiração
      expiryTs = now + config.expiryHours * 3600 * 1000
      localStorage.setItem(STORAGE_KEY, String(expiryTs))
    }

    return expiryTs
  }, [config.expiryHours])

  // Atualiza o countdown a cada segundo
  const tick = useCallback((expiryTs: number) => {
    const remaining = expiryTs - Date.now()
    if (remaining <= 0) {
      setExpired(true)
      setTimeLeft({ h: 0, m: 0, s: 0 })
      return
    }
    const totalSeconds = Math.floor(remaining / 1000)
    setTimeLeft({
      h: Math.floor(totalSeconds / 3600),
      m: Math.floor((totalSeconds % 3600) / 60),
      s: totalSeconds % 60,
    })
  }, [])

  useEffect(() => {
    if (!config.enabled || !config.code) return

    const expiryTs = initExpiry()
    if (!expiryTs) return

    // Verifica se já expirou na inicialização
    if (Date.now() >= expiryTs) {
      setExpired(false) // reseta para nova sessão
    }

    // Tick imediato
    tick(expiryTs)

    // Inicia countdown
    timerRef.current = setInterval(() => tick(expiryTs), 1000)

    // Mostra o ícone após delay
    delayRef.current = setTimeout(() => {
      setIsVisible(true)
    }, (config.delaySeconds || 0) * 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (delayRef.current) clearTimeout(delayRef.current)
    }
  }, [config.enabled, config.code, config.delaySeconds, initExpiry, tick])

  const copyCode = async () => {
    if (!config.code) return
    try {
      await navigator.clipboard.writeText(config.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback para dispositivos antigos
      const el = document.createElement('textarea')
      el.value = config.code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!config.enabled || !config.code || !isVisible) return null

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      {/* Ícone flutuante — caixinha de presente */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="Ver cupom especial"
        style={{ filter: 'drop-shadow(0 0 16px rgba(220,38,38,0.6))' }}
      >
        <div className="relative w-16 h-16 bg-gradient-to-br from-red-700 to-red-500 rounded-2xl flex items-center justify-center shadow-xl border border-red-400/30 animate-bounce-slow transition-transform group-hover:scale-110 group-active:scale-95">
          <Gift size={30} className="text-white drop-shadow-sm" />
          {/* Badge de desconto */}
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-red-600 font-black text-xs leading-none">
              {config.discount}%
            </span>
          </div>
          {/* Pulso animado */}
          <div className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-20" />
        </div>
      </button>

      {/* Overlay do modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #141414 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header colorido */}
            <div className="relative bg-gradient-to-r from-red-800 to-red-600 py-4 px-6 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
              <div className="flex justify-center mb-1">
                <Gift size={28} className="text-white" />
              </div>
              <span className="text-white font-black text-xs tracking-[0.2em] uppercase opacity-90">
                ✦ OFERTA ESPECIAL ✦
              </span>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              {/* Percentual */}
              <div className="mb-1">
                <span
                  className="font-black text-white leading-none"
                  style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)' }}
                >
                  <span className="text-red-500">{config.discount}%</span> OFF
                </span>
              </div>
              <p className="text-white/50 text-sm mb-5">
                Use o código abaixo na sua compra
              </p>

              {/* Código copiável */}
              <button
                onClick={copyCode}
                className="w-full bg-white/5 border border-dashed border-white/25 rounded-xl py-3 px-4 flex items-center justify-between mb-2 hover:border-white/40 hover:bg-white/8 transition-all group"
                aria-label="Copiar código do cupom"
              >
                <span className="font-mono font-black text-white text-xl tracking-[0.3em] flex-1 text-left">
                  {config.code}
                </span>
                <div className={`ml-2 transition-all ${copied ? 'text-green-400' : 'text-white/40 group-hover:text-white/70'}`}>
                  {copied ? <Check size={20} /> : <Copy size={18} />}
                </div>
              </button>
              <p className="text-white/30 text-xs mb-5">
                {copied ? '✓ Código copiado!' : 'Toque para copiar o código'}
              </p>

              {/* Countdown */}
              {!expired && timeLeft && (
                <div className="mb-5">
                  <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
                    Expira em
                  </p>
                  <div className="flex justify-center gap-2">
                    {[
                      { v: timeLeft.h, l: 'HRS' },
                      { v: timeLeft.m, l: 'MIN' },
                      { v: timeLeft.s, l: 'SEG' },
                    ].map(({ v, l }, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-white/10 border border-white/10 rounded-lg w-14 h-12 flex items-center justify-center">
                          <span className="text-white font-black text-xl tabular-nums">
                            {pad(v)}
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px] mt-1 block tracking-wider">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expired && (
                <p className="text-white/40 text-sm mb-5">Este cupom expirou para esta sessão.</p>
              )}

              {/* CTA */}
              <a
                href={config.ctaLink}
                onClick={() => setIsOpen(false)}
                className="block w-full bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-widest uppercase shadow-lg shadow-red-900/40"
              >
                {config.ctaText}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Estilos da animação do ícone */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
