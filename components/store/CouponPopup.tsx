'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Copy, Check, Crown, Zap, Gift, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PopupDesign = 'classic' | 'minimal' | 'bold'

export interface PopupColors {
  // Usados pelos três designs
  accentColor: string      // cor principal (fundo header, botão CTA, bordas)
  textColor: string        // cor do texto do desconto
  bgColor: string          // cor de fundo do card
  timerBg: string          // cor de fundo das células do timer
}

export interface PopupConfig {
  enabled: boolean
  discount: string
  code: string
  expiryHours: number
  ctaText: string
  ctaLink: string
  delaySeconds: number
  design: PopupDesign
  colors: PopupColors
}

const STORAGE_KEY = 'ss_popup_expiry'

const DEFAULT_COLORS: PopupColors = {
  accentColor: '#dc2626',
  textColor: '#ffffff',
  bgColor: '#0d0d0d',
  timerBg: '#1f1f1f',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

// ─── Design 1: Classic ── inspirado na referência (BrunX Mods) ───────────────

function ClassicPopup({
  config, timeLeft, expired, copied, isCollapsed,
  onCopy, onCta, onClose, onToggleCollapse,
}: RenderProps) {
  const { colors } = config

  return (
    <div
      className="w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
      style={{ background: colors.bgColor }}
    >
      {/* Cabeçalho */}
      <div
        className="relative flex items-center justify-between px-4 py-3"
        style={{ background: colors.accentColor }}
      >
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-white/80" />
          <span className="text-white text-xs font-bold tracking-[0.18em] uppercase opacity-90">
            Oferta Especial
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label={isCollapsed ? 'Expandir' : 'Minimizar'}
          >
            {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Corpo — colapsa quando minimizado */}
      {!isCollapsed && (
        <div className="p-4 flex flex-col gap-3">
          {/* Desconto */}
          <div className="text-center">
            <p className="text-white/40 text-[11px] uppercase tracking-widest mb-0.5">
              Desconto exclusivo
            </p>
            <p className="font-black leading-none" style={{ fontSize: '2.8rem', color: colors.textColor }}>
              {config.discount}%{' '}
              <span className="text-white text-3xl">OFF</span>
            </p>
            <p className="text-white/40 text-xs mt-1">Use o código abaixo na sua compra</p>
          </div>

          {/* Código copiável */}
          <button
            onClick={onCopy}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed transition-all group"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <span className="font-mono font-black text-white text-base tracking-[0.25em]">
              {config.code}
            </span>
            <div className={`ml-2 transition-all ${copied ? 'text-green-400' : 'text-white/40 group-hover:text-white/70'}`}>
              {copied ? <Check size={16} /> : <Copy size={15} />}
            </div>
          </button>
          <p className="text-white/30 text-[11px] text-center -mt-1">
            {copied ? '✓ Código copiado!' : 'Toque para copiar'}
          </p>

          {/* Timer */}
          {!expired && timeLeft && (
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest text-center mb-1.5">
                Expira em
              </p>
              <div className="flex justify-center gap-1.5">
                {[{ v: timeLeft.h, l: 'HRS' }, { v: timeLeft.m, l: 'MIN' }, { v: timeLeft.s, l: 'SEG' }].map(({ v, l }, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="w-[52px] h-10 rounded-lg flex items-center justify-center"
                      style={{ background: colors.timerBg }}
                    >
                      <span className="text-white font-black text-lg tabular-nums">{pad(v)}</span>
                    </div>
                    <span className="text-white/30 text-[9px] mt-0.5 block tracking-wider">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={config.ctaLink}
            onClick={onCta}
            className="block w-full text-center font-bold py-3 rounded-xl text-white text-sm tracking-widest uppercase transition-opacity hover:opacity-90 active:scale-[.98]"
            style={{ background: colors.accentColor }}
          >
            {config.ctaText}
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Design 2: Minimal ── linha fina, clean, discreto ────────────────────────

function MinimalPopup({
  config, timeLeft, expired, copied, isCollapsed,
  onCopy, onCta, onClose, onToggleCollapse,
}: RenderProps) {
  const { colors } = config

  return (
    <div
      className="w-64 rounded-xl overflow-hidden shadow-xl flex flex-col"
      style={{
        background: colors.bgColor,
        border: `1.5px solid ${colors.accentColor}40`,
      }}
    >
      {/* Linha colorida no topo */}
      <div className="h-1 w-full" style={{ background: colors.accentColor }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: colors.accentColor }}>
            <Zap size={10} className="text-white" fill="white" />
          </div>
          <span className="text-white text-xs font-semibold tracking-wide">OFERTA</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggleCollapse} className="text-white/40 hover:text-white/80 transition-colors p-0.5">
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-0.5">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Desconto inline */}
          <div className="flex items-baseline gap-2">
            <span className="font-black text-4xl leading-none" style={{ color: colors.accentColor }}>
              {config.discount}%
            </span>
            <div>
              <p className="text-white font-bold text-lg leading-none">OFF</p>
              <p className="text-white/40 text-[10px] leading-tight mt-0.5">no seu pedido</p>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px" style={{ background: `${colors.accentColor}20` }} />

          {/* Código */}
          <button
            onClick={onCopy}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all group"
            style={{ background: `${colors.accentColor}12`, border: `1px solid ${colors.accentColor}30` }}
          >
            <span className="font-mono text-white font-bold text-sm tracking-[0.2em]">
              {config.code}
            </span>
            <div className={`transition-colors ${copied ? 'text-green-400' : 'group-hover:text-white text-white/40'}`}>
              {copied ? <Check size={14} /> : <Copy size={13} />}
            </div>
          </button>
          <p className="text-white/25 text-[10px] text-center -mt-2">
            {copied ? '✓ Copiado!' : 'Clique para copiar'}
          </p>

          {/* Timer compacto */}
          {!expired && timeLeft && (
            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Expira:</span>
              <span className="font-mono text-white/70 text-xs font-bold">
                {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
              </span>
            </div>
          )}

          {/* CTA */}
          <a
            href={config.ctaLink}
            onClick={onCta}
            className="block w-full text-center font-bold py-2.5 rounded-lg text-white text-xs tracking-widest uppercase transition-opacity hover:opacity-90"
            style={{ background: colors.accentColor }}
          >
            {config.ctaText}
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Design 3: Bold ── grande, impactante, sem sutileza ──────────────────────

function BoldPopup({
  config, timeLeft, expired, copied, isCollapsed,
  onCopy, onCta, onClose, onToggleCollapse,
}: RenderProps) {
  const { colors } = config

  return (
    <div
      className="w-80 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      style={{ background: colors.bgColor, border: `2px solid ${colors.accentColor}` }}
    >
      {/* Header com gradiente forte */}
      <div
        className="relative px-5 pt-4 pb-3"
        style={{ background: `linear-gradient(135deg, ${colors.accentColor}, ${colors.accentColor}cc)` }}
      >
        <div className="flex items-center justify-between">
          <Gift size={20} className="text-white" />
          <span className="text-white font-black text-sm tracking-[0.2em] uppercase">
            ✦ OFERTA ESPECIAL ✦
          </span>
          <div className="flex gap-1">
            <button onClick={onToggleCollapse} className="w-6 h-6 bg-black/20 rounded-full flex items-center justify-center text-white/80 hover:text-white">
              {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button onClick={onClose} className="w-6 h-6 bg-black/20 rounded-full flex items-center justify-center text-white/80 hover:text-white">
              <X size={12} />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-5 pt-4 pb-5 flex flex-col gap-3.5">
          {/* Desconto grande */}
          <div className="text-center">
            <div
              className="inline-flex items-baseline gap-1 leading-none font-black"
              style={{ fontSize: '3.5rem', color: colors.textColor }}
            >
              {config.discount}%
              <span className="text-white text-2xl font-black">OFF</span>
            </div>
            <p className="text-white/50 text-xs mt-1 tracking-wide">
              Desconto exclusivo para você
            </p>
          </div>

          {/* Código com fundo destacado */}
          <button
            onClick={onCopy}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed transition-all group"
            style={{ borderColor: `${colors.accentColor}50`, background: `${colors.accentColor}10` }}
          >
            <div>
              <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5 text-left">Código do cupom</p>
              <span className="font-mono font-black text-white text-lg tracking-[0.3em]">
                {config.code}
              </span>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${copied ? 'bg-green-500' : 'group-hover:bg-white/10'}`}
              style={copied ? {} : { background: `${colors.accentColor}20` }}
            >
              {copied ? <Check size={16} className="text-white" /> : <Copy size={15} className="text-white/60" />}
            </div>
          </button>
          <p className="text-white/25 text-[10px] text-center -mt-2">
            {copied ? '✓ Código copiado com sucesso!' : 'Toque para copiar o código'}
          </p>

          {/* Timer com células grandes */}
          {!expired && timeLeft && (
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest text-center mb-2">
                Esta oferta expira em
              </p>
              <div className="flex justify-center gap-2">
                {[{ v: timeLeft.h, l: 'HRS' }, { v: timeLeft.m, l: 'MIN' }, { v: timeLeft.s, l: 'SEG' }].map(({ v, l }, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="w-[58px] h-12 rounded-xl flex items-center justify-center border"
                      style={{ background: colors.timerBg, borderColor: `${colors.accentColor}30` }}
                    >
                      <span className="text-white font-black text-2xl tabular-nums">{pad(v)}</span>
                    </div>
                    <span className="text-white/30 text-[9px] mt-0.5 block tracking-widest">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={config.ctaLink}
            onClick={onCta}
            className="block w-full text-center font-black py-3.5 rounded-xl text-white text-sm tracking-widest uppercase shadow-lg transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[.98]"
            style={{
              background: colors.accentColor,
              boxShadow: `0 8px 24px ${colors.accentColor}50`,
            }}
          >
            {config.ctaText}
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface TimeLeft { h: number; m: number; s: number }

interface RenderProps {
  config: PopupConfig
  timeLeft: TimeLeft | null
  expired: boolean
  copied: boolean
  isCollapsed: boolean
  onCopy: () => void
  onCta: () => void
  onClose: () => void
  onToggleCollapse: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CouponPopup({ config }: { config: PopupConfig }) {
  const [isVisible, setIsVisible]       = useState(false)
  const [isCollapsed, setIsCollapsed]   = useState(true)
  const [isClosed, setIsClosed]         = useState(false)
  const [copied, setCopied]             = useState(false)
  const [timeLeft, setTimeLeft]         = useState<TimeLeft | null>(null)
  const [expired, setExpired]           = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const delayRef = useRef<NodeJS.Timeout | null>(null)

  const colors: PopupColors = {
    ...DEFAULT_COLORS,
    ...config.colors,
  }
  const configWithColors = { ...config, colors }

  // ── Inicializa / lê expiração do localStorage ──────────────────────────────
  const initExpiry = useCallback(() => {
    if (typeof window === 'undefined') return undefined
    const stored = localStorage.getItem(STORAGE_KEY)
    const now = Date.now()
    let expiryTs: number
    if (stored) {
      expiryTs = parseInt(stored, 10)
      if (now >= expiryTs) {
        expiryTs = now + config.expiryHours * 3600 * 1000
        localStorage.setItem(STORAGE_KEY, String(expiryTs))
      }
    } else {
      expiryTs = now + config.expiryHours * 3600 * 1000
      localStorage.setItem(STORAGE_KEY, String(expiryTs))
    }
    return expiryTs
  }, [config.expiryHours])

  // ── Tick do countdown ──────────────────────────────────────────────────────
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
    tick(expiryTs)
    timerRef.current = setInterval(() => tick(expiryTs), 1000)
    delayRef.current = setTimeout(() => setIsVisible(true), (config.delaySeconds || 0) * 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (delayRef.current) clearTimeout(delayRef.current)
    }
  }, [config.enabled, config.code, config.delaySeconds, initExpiry, tick])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const copyCode = async () => {
    if (!config.code) return
    try {
      await navigator.clipboard.writeText(config.code)
    } catch {
      const el = document.createElement('textarea')
      el.value = config.code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!config.enabled || !config.code || !isVisible || isClosed) return null

  const renderProps: RenderProps = {
    config: configWithColors,
    timeLeft,
    expired,
    copied,
    isCollapsed,
    onCopy: copyCode,
    onCta: () => setIsClosed(true),
    onClose: () => setIsClosed(true),
    onToggleCollapse: () => setIsCollapsed(p => !p),
  }

  const design = config.design || 'classic'

  return (
    <>
      {/* Widget flutuante fixo — canto inferior direito, SEM overlay */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          filter: `drop-shadow(0 8px 32px ${colors.accentColor}40)`,
          animation: 'popup-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        {/* Estado minimizado: caixinha de presente compacta */}
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="relative group flex items-center justify-center rounded-2xl shadow-2xl transition-transform hover:scale-110 active:scale-95"
            style={{
              width: 64,
              height: 64,
              background: colors.accentColor,
              boxShadow: `0 8px 32px ${colors.accentColor}60`,
            }}
            aria-label="Abrir oferta especial"
          >
            {/* Ícone presente */}
            <Gift size={28} className="text-white drop-shadow" />

            {/* Badge com % de desconto */}
            <span
              className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-1 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg border-2 border-white/20"
              style={{ background: colors.bgColor || '#0d0d0d', color: colors.accentColor }}
            >
              {config.discount}%
            </span>

            {/* Pulso animado */}
            <span
              className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: colors.accentColor }}
            />
          </button>
        ) : (
          /* Estado expandido: card completo do design escolhido */
          <>
            {design === 'classic' && <ClassicPopup {...renderProps} />}
            {design === 'minimal' && <MinimalPopup {...renderProps} />}
            {design === 'bold'    && <BoldPopup    {...renderProps} />}
          </>
        )}
      </div>

      <style>{`
        @keyframes popup-slide-in {
          from { opacity: 0; transform: translateY(24px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
