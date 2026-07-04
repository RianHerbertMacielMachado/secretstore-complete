'use client'

import { useState } from 'react'
import {
  Save, Gift, Copy, Check, Eye, EyeOff, ExternalLink, Clock,
  Zap, Crown, ChevronDown, ChevronUp, Palette, LayoutTemplate,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PopupDesign = 'classic' | 'minimal' | 'bold'

interface PopupColors {
  accentColor: string
  textColor: string
  bgColor: string
  timerBg: string
}

interface PopupConfig {
  enabled: boolean
  discount: string
  code: string
  expiryHours: string
  ctaText: string
  ctaLink: string
  delaySeconds: string
  design: PopupDesign
  colors: PopupColors
}

const DEFAULT_COLORS: PopupColors = {
  accentColor: '#dc2626',
  textColor:   '#ffffff',
  bgColor:     '#0d0d0d',
  timerBg:     '#1f1f1f',
}

// ─── Previews dos 3 designs ───────────────────────────────────────────────────

function PreviewClassic({ config }: { config: PopupConfig }) {
  const c = config.colors
  return (
    <div className="w-64 rounded-2xl overflow-hidden shadow-xl border border-white/10 flex flex-col" style={{ background: c.bgColor }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: c.accentColor }}>
        <div className="flex items-center gap-1.5">
          <Crown size={12} className="text-white/80" />
          <span className="text-white text-[11px] font-bold tracking-widest uppercase">Oferta Especial</span>
        </div>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">
            <ChevronDown size={10} className="text-white/60" />
          </div>
          <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center">
            <span className="text-white/60 text-[10px]">✕</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        <div className="text-center">
          <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Desconto exclusivo</p>
          <p className="font-black leading-none" style={{ fontSize: '2.2rem', color: c.textColor }}>
            {config.discount || '15'}%&nbsp;<span className="text-white text-2xl">OFF</span>
          </p>
          <p className="text-white/40 text-[10px] mt-0.5">Use o código abaixo na sua compra</p>
        </div>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-white/20" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="font-mono font-bold text-white text-sm tracking-widest">{config.code || 'CUPOM15'}</span>
          <Copy size={13} className="text-white/40" />
        </div>
        <div className="flex justify-center gap-1.5">
          {['08', '45', '22'].map((v, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-8 rounded-md flex items-center justify-center" style={{ background: c.timerBg }}>
                <span className="text-white font-bold text-sm tabular-nums">{v}</span>
              </div>
              <span className="text-white/30 text-[8px] mt-0.5 block">{['HRS','MIN','SEG'][i]}</span>
            </div>
          ))}
        </div>
        <div className="text-center font-bold py-2 rounded-lg text-white text-xs tracking-widest uppercase" style={{ background: c.accentColor }}>
          {config.ctaText || 'RESGATAR OFERTA'}
        </div>
      </div>
    </div>
  )
}

function PreviewMinimal({ config }: { config: PopupConfig }) {
  const c = config.colors
  return (
    <div className="w-56 rounded-xl overflow-hidden shadow-xl flex flex-col" style={{ background: c.bgColor, border: `1.5px solid ${c.accentColor}40` }}>
      <div className="h-1" style={{ background: c.accentColor }} />
      <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: c.accentColor }}>
            <Zap size={8} className="text-white" fill="white" />
          </div>
          <span className="text-white text-[11px] font-semibold tracking-wider">OFERTA</span>
        </div>
        <div className="flex gap-1">
          <ChevronDown size={13} className="text-white/40" />
          <span className="text-white/40 text-xs">✕</span>
        </div>
      </div>
      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-black text-3xl leading-none" style={{ color: c.accentColor }}>
            {config.discount || '15'}%
          </span>
          <div>
            <p className="text-white font-bold text-lg leading-none">OFF</p>
            <p className="text-white/40 text-[9px]">no seu pedido</p>
          </div>
        </div>
        <div className="h-px" style={{ background: `${c.accentColor}20` }} />
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md" style={{ background: `${c.accentColor}12`, border: `1px solid ${c.accentColor}30` }}>
          <span className="font-mono text-white font-bold text-xs tracking-widest">{config.code || 'CUPOM15'}</span>
          <Copy size={11} className="text-white/40" />
        </div>
        <div className="flex items-center gap-1 justify-center">
          <span className="text-white/30 text-[9px] uppercase tracking-wider">Expira:</span>
          <span className="font-mono text-white/60 text-xs font-bold">08:45:22</span>
        </div>
        <div className="text-center font-bold py-2 rounded-lg text-white text-xs tracking-widest uppercase" style={{ background: c.accentColor }}>
          {config.ctaText || 'RESGATAR OFERTA'}
        </div>
      </div>
    </div>
  )
}

function PreviewBold({ config }: { config: PopupConfig }) {
  const c = config.colors
  return (
    <div className="w-72 rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ background: c.bgColor, border: `2px solid ${c.accentColor}` }}>
      <div className="relative px-4 pt-3 pb-2.5 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${c.accentColor}, ${c.accentColor}cc)` }}>
        <Gift size={16} className="text-white" />
        <span className="text-white font-black text-[11px] tracking-[0.2em] uppercase">✦ OFERTA ESPECIAL ✦</span>
        <div className="flex gap-1">
          <div className="w-5 h-5 bg-black/20 rounded-full flex items-center justify-center">
            <ChevronDown size={10} className="text-white/80" />
          </div>
          <div className="w-5 h-5 bg-black/20 rounded-full flex items-center justify-center">
            <span className="text-white/80 text-[9px]">✕</span>
          </div>
        </div>
      </div>
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div className="text-center">
          <div className="font-black leading-none" style={{ fontSize: '3rem', color: c.textColor }}>
            {config.discount || '15'}%<span className="text-white text-xl font-black ml-1">OFF</span>
          </div>
          <p className="text-white/50 text-[10px] mt-0.5 tracking-wide">Desconto exclusivo para você</p>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-dashed" style={{ borderColor: `${c.accentColor}50`, background: `${c.accentColor}10` }}>
          <div>
            <p className="text-white/30 text-[8px] uppercase tracking-widest">Código</p>
            <span className="font-mono font-black text-white text-base tracking-widest">{config.code || 'CUPOM15'}</span>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${c.accentColor}20` }}>
            <Copy size={13} className="text-white/60" />
          </div>
        </div>
        <div className="flex justify-center gap-1.5">
          {['08', '45', '22'].map((v, i) => (
            <div key={i} className="text-center">
              <div className="w-[50px] h-10 rounded-lg border flex items-center justify-center" style={{ background: c.timerBg, borderColor: `${c.accentColor}30` }}>
                <span className="text-white font-black text-xl tabular-nums">{v}</span>
              </div>
              <span className="text-white/30 text-[8px] mt-0.5 block tracking-wider">{['HRS','MIN','SEG'][i]}</span>
            </div>
          ))}
        </div>
        <div
          className="text-center font-black py-3 rounded-xl text-white text-xs tracking-widest uppercase"
          style={{ background: c.accentColor, boxShadow: `0 6px 20px ${c.accentColor}50` }}
        >
          {config.ctaText || 'RESGATAR OFERTA'}
        </div>
      </div>
    </div>
  )
}

// ─── Seletor visual de design ─────────────────────────────────────────────────

const DESIGNS: { id: PopupDesign; label: string; desc: string; icon: typeof Crown }[] = [
  { id: 'classic', label: 'Clássico',  desc: 'Cabeçalho colorido + timer em blocos',  icon: Crown },
  { id: 'minimal', label: 'Minimal',   desc: 'Linha fina, clean e discreto',           icon: Zap   },
  { id: 'bold',    label: 'Impactante', desc: 'Grande e chamativo, sem sutileza',      icon: Gift  },
]

// ─── Color Picker Row ─────────────────────────────────────────────────────────

function ColorRow({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-white/70 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer overflow-hidden shadow-inner"
          title={value}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 -ml-1 -mt-1 cursor-pointer border-0 bg-transparent"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-dark w-28 text-sm font-mono"
          placeholder="#dc2626"
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminPopupClient({ config: initConfig }: { config: PopupConfig }) {
  const [config, setConfig] = useState<PopupConfig>({
    ...initConfig,
    design: initConfig.design || 'classic',
    colors: { ...DEFAULT_COLORS, ...initConfig.colors },
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const setColor = (key: keyof PopupColors) => (val: string) =>
    setConfig(prev => ({ ...prev, colors: { ...prev.colors, [key]: val } }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/popup-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Configurações do popup salvas!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift size={28} className="text-neon-pink" />
            Popup de Cupom
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Configure o popup flutuante de cupom no canto inferior direito da loja
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="btn-outline flex items-center gap-2 text-sm"
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
        </button>
      </div>

      <div className={`flex gap-8 ${showPreview ? 'flex-col lg:flex-row' : ''}`}>

        {/* ── Formulário ──────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-neon-pink" />
              Status do Popup
            </h2>
            <div
              className="flex items-center gap-4 cursor-pointer w-fit"
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            >
              <div className={`w-14 h-7 rounded-full transition-colors relative ${config.enabled ? 'bg-neon-pink' : 'bg-white/20'}`}>
                <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full transition-transform ${config.enabled ? 'left-8' : 'left-1.5'}`} />
              </div>
              <div>
                <span className={`text-base font-medium ${config.enabled ? 'text-green-400' : 'text-white/40'}`}>
                  {config.enabled ? 'Popup Ativado' : 'Popup Desativado'}
                </span>
                <p className="text-xs text-white/30 mt-0.5">
                  {config.enabled ? 'Popup visível no canto inferior direito' : 'Nenhum popup será exibido'}
                </p>
              </div>
            </div>
          </div>

          {/* Oferta */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Gift size={18} className="text-neon-pink" />
              Dados da Oferta
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Percentual de Desconto (%)</label>
                <div className="relative">
                  <input type="number" value={config.discount}
                    onChange={(e) => setConfig({ ...config, discount: e.target.value })}
                    className="input-dark w-full pr-8" min={1} max={99} placeholder="15" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Código do Cupom</label>
                <div className="relative">
                  <Copy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="text" value={config.code}
                    onChange={(e) => setConfig({ ...config, code: e.target.value.toUpperCase() })}
                    className="input-dark w-full pl-9 font-mono tracking-wider uppercase" placeholder="EX: PROMO15" />
                </div>
              </div>
            </div>
          </div>

          {/* Design */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <LayoutTemplate size={18} className="text-neon-pink" />
              Design do Popup
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DESIGNS.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setConfig({ ...config, design: id })}
                  className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    config.design === id
                      ? 'border-neon-pink bg-neon-pink/10'
                      : 'border-white/10 bg-white/3 hover:border-white/25'
                  }`}
                >
                  {config.design === id && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-neon-pink rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <Icon size={20} className={config.design === id ? 'text-neon-pink' : 'text-white/50'} />
                  <div>
                    <p className={`font-semibold text-sm ${config.design === id ? 'text-white' : 'text-white/70'}`}>{label}</p>
                    <p className="text-white/40 text-xs mt-0.5 leading-snug">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cores */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Palette size={18} className="text-neon-pink" />
              Cores do Popup
            </h2>
            <div className="space-y-4">
              <ColorRow label="Cor de destaque (cabeçalho, botão, bordas)" value={config.colors.accentColor} onChange={setColor('accentColor')} />
              <ColorRow label="Cor do texto do desconto" value={config.colors.textColor} onChange={setColor('textColor')} />
              <ColorRow label="Cor de fundo do card" value={config.colors.bgColor} onChange={setColor('bgColor')} />
              <ColorRow label="Cor de fundo do timer" value={config.colors.timerBg} onChange={setColor('timerBg')} />
              <button
                onClick={() => setConfig(prev => ({ ...prev, colors: DEFAULT_COLORS }))}
                className="text-xs text-white/30 hover:text-white/60 transition-colors mt-1"
              >
                ↺ Restaurar cores padrão
              </button>
            </div>
          </div>

          {/* Temporização */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-neon-pink" />
              Temporização
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Expiração do Cupom (horas)</label>
                <div className="relative">
                  <input type="number" value={config.expiryHours}
                    onChange={(e) => setConfig({ ...config, expiryHours: e.target.value })}
                    className="input-dark w-full pr-14" min={1} placeholder="24" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">horas</span>
                </div>
                <p className="text-xs text-white/30 mt-1">Conta a partir da 1ª visita do usuário (via localStorage)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Delay para exibir popup (segundos)</label>
                <div className="relative">
                  <input type="number" value={config.delaySeconds}
                    onChange={(e) => setConfig({ ...config, delaySeconds: e.target.value })}
                    className="input-dark w-full pr-12" min={0} placeholder="3" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">seg</span>
                </div>
                <p className="text-xs text-white/30 mt-1">Tempo após carregamento para o popup aparecer</p>
              </div>
            </div>
          </div>

          {/* Botão CTA */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-neon-pink" />
              Botão de Ação (CTA)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Texto do Botão</label>
                <input type="text" value={config.ctaText}
                  onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                  className="input-dark w-full" placeholder="RESGATAR OFERTA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Link de Destino</label>
                <div className="relative">
                  <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="text" value={config.ctaLink}
                    onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })}
                    className="input-dark w-full pl-9" placeholder="/produtos ou https://..." />
                </div>
              </div>
            </div>
          </div>

          {/* Salvar */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar Configurações do Popup'}
          </button>
        </div>

        {/* ── Preview live ─────────────────────────────────────────────────── */}
        {showPreview && (
          <aside className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-3 text-center">
                Preview em tempo real
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-5">

                {/* Design ativo */}
                <div>
                  <p className="text-[10px] text-white/20 text-center mb-2 uppercase tracking-widest">
                    Design selecionado: <span className="text-white/50">{DESIGNS.find(d => d.id === config.design)?.label}</span>
                  </p>
                  {config.design === 'classic' && <PreviewClassic config={config} />}
                  {config.design === 'minimal' && <PreviewMinimal config={config} />}
                  {config.design === 'bold'    && <PreviewBold    config={config} />}
                </div>

                {/* Mini previews dos outros designs */}
                <div className="w-full">
                  <p className="text-[10px] text-white/20 uppercase tracking-widest mb-3 text-center">
                    Outros designs (com as mesmas cores)
                  </p>
                  <div className="flex flex-col gap-3 items-center">
                    {config.design !== 'classic' && (
                      <div className="transform scale-75 origin-top">
                        <p className="text-[9px] text-white/20 text-center mb-1 -mt-2">Clássico</p>
                        <PreviewClassic config={config} />
                      </div>
                    )}
                    {config.design !== 'minimal' && (
                      <div className="transform scale-75 origin-top">
                        <p className="text-[9px] text-white/20 text-center mb-1 -mt-2">Minimal</p>
                        <PreviewMinimal config={config} />
                      </div>
                    )}
                    {config.design !== 'bold' && (
                      <div className="transform scale-75 origin-top">
                        <p className="text-[9px] text-white/20 text-center mb-1 -mt-2">Impactante</p>
                        <PreviewBold config={config} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
