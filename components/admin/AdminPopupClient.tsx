'use client'

import { useState } from 'react'
import { Save, Gift, Copy, Eye, ExternalLink, Clock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface PopupConfig {
  enabled: boolean
  discount: string
  code: string
  expiryHours: string
  ctaText: string
  ctaLink: string
  delaySeconds: string
}

interface Props {
  config: PopupConfig
}

export default function AdminPopupClient({ config: initConfig }: Props) {
  const [config, setConfig] = useState(initConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift size={28} className="text-neon-pink" />
            Popup de Cupom
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Configure o popup de presente com cupom de desconto para visitantes
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <Eye size={16} />
            {showPreview ? 'Ocultar' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Preview do popup */}
      {showPreview && (
        <div className="mb-8 rounded-xl border border-white/10 overflow-hidden">
          <div className="bg-black/60 px-3 py-1.5 text-xs text-white/30 border-b border-white/10">
            Preview do modal (aparência real no site)
          </div>
          <div className="bg-[#111] p-8 flex justify-center">
            <div className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Badge */}
              <div className="bg-gradient-to-r from-red-700 to-red-500 py-3 px-6 text-center">
                <span className="text-white font-bold text-sm tracking-widest uppercase">
                  ✦ OFERTA ESPECIAL ✦
                </span>
              </div>
              {/* Body */}
              <div className="p-6 text-center">
                <div className="text-5xl font-black text-white mb-1">
                  <span className="text-red-500">{config.discount}%</span> OFF
                </div>
                <p className="text-white/50 text-sm mb-5">Use o código abaixo na sua compra</p>

                {/* Código */}
                <div className="bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 flex items-center justify-between mb-4">
                  <span className="font-mono font-bold text-white text-lg tracking-widest">
                    {config.code || 'CUPOM123'}
                  </span>
                  <Copy size={16} className="text-white/40" />
                </div>
                <p className="text-white/30 text-xs mb-5">Toque para copiar o código</p>

                {/* Contador */}
                <div className="flex justify-center gap-3 mb-5">
                  {['00', '24', '00'].map((v, i) => (
                    <div key={i} className="text-center">
                      <div className="bg-white/10 rounded-lg w-12 h-12 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{v}</span>
                      </div>
                      <span className="text-white/30 text-xs mt-1 block">
                        {['HRS', 'MIN', 'SEG'][i]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">
                  {config.ctaText || 'RESGATAR OFERTA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurações */}
      <div className="space-y-6">
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
                {config.enabled ? 'O ícone de presente aparece para visitantes' : 'Nenhum popup será exibido'}
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
              <label className="block text-sm font-medium text-white/70 mb-1">
                Percentual de Desconto (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.discount}
                  onChange={(e) => setConfig({ ...config, discount: e.target.value })}
                  className="input-dark w-full pr-8"
                  min={1} max={99} placeholder="15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Código do Cupom
              </label>
              <div className="relative">
                <Copy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={config.code}
                  onChange={(e) => setConfig({ ...config, code: e.target.value.toUpperCase() })}
                  className="input-dark w-full pl-9 font-mono tracking-wider uppercase"
                  placeholder="EX: PROMO15"
                />
              </div>
            </div>
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
              <label className="block text-sm font-medium text-white/70 mb-1">
                Expiração do Cupom (horas)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.expiryHours}
                  onChange={(e) => setConfig({ ...config, expiryHours: e.target.value })}
                  className="input-dark w-full pr-14"
                  min={1} placeholder="24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">horas</span>
              </div>
              <p className="text-xs text-white/30 mt-1">
                Conta a partir da 1ª visita do usuário (via localStorage)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Delay para exibir ícone (segundos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.delaySeconds}
                  onChange={(e) => setConfig({ ...config, delaySeconds: e.target.value })}
                  className="input-dark w-full pr-12"
                  min={0} placeholder="3"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">seg</span>
              </div>
              <p className="text-xs text-white/30 mt-1">
                Tempo após carregamento da página para o ícone aparecer
              </p>
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
              <label className="block text-sm font-medium text-white/70 mb-1">
                Texto do Botão
              </label>
              <input
                type="text"
                value={config.ctaText}
                onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                className="input-dark w-full"
                placeholder="RESGATAR OFERTA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Link de Destino
              </label>
              <div className="relative">
                <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={config.ctaLink}
                  onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })}
                  className="input-dark w-full pl-9"
                  placeholder="/produtos ou https://..."
                />
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
    </div>
  )
}
