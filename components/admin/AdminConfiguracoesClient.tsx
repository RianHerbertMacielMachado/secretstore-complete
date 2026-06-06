'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Copy, ExternalLink, Save, Settings, Webhook, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  configMap: Record<string, string>
  envStatus: Record<string, boolean>
  webhookBase: string
}

function StatusRow({ label, configured, envVar }: { label: string; configured: boolean; envVar: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        {configured ? (
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
        ) : (
          <XCircle size={16} className="text-red-400/60 flex-shrink-0" />
        )}
        <div>
          <p className="text-sm text-white">{label}</p>
          <p className="text-xs text-white/30 font-mono">{envVar}</p>
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded border ${
        configured
          ? 'bg-green-500/10 text-green-400 border-green-500/20'
          : 'bg-red-500/10 text-red-400/70 border-red-500/20'
      }`}>
        {configured ? '✓ OK' : '✗ Faltando'}
      </span>
    </div>
  )
}

function WebhookRow({ label, url }: { label: string; url: string }) {
  const copy = () => {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada!')
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white mb-0.5">{label}</p>
        <p className="text-xs text-white/40 font-mono truncate">{url}</p>
      </div>
      <button
        onClick={copy}
        className="flex-shrink-0 p-1.5 text-white/30 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
        title="Copiar"
      >
        <Copy size={14} />
      </button>
    </div>
  )
}

export default function AdminConfiguracoesClient({ configMap, envStatus, webhookBase }: Props) {
  const [siteForm, setSiteForm] = useState({
    site_name: configMap.site_name || 'DarkShop',
    site_description: configMap.site_description || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      for (const [key, value] of Object.entries(siteForm)) {
        await fetch('/api/admin/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
      }
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const webhooks = [
    { label: 'Mercado Pago', url: `${webhookBase}/api/webhooks/mercadopago` },
    { label: 'PayPal', url: `${webhookBase}/api/webhooks/paypal` },
    { label: 'PicPay', url: `${webhookBase}/api/webhooks/picpay` },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-gothic text-2xl font-bold text-white">Configurações</h1>
        <p className="text-white/40 text-sm mt-1">Gerencie as configurações gerais da sua loja</p>
      </div>

      {/* Configurações do Site */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-neon-pink/10 rounded-lg flex items-center justify-center">
            <Globe size={16} className="text-neon-pink" />
          </div>
          <h2 className="text-white font-semibold">Configurações do Site</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nome da Loja</label>
            <input
              type="text"
              value={siteForm.site_name}
              onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })}
              className="input-dark"
              placeholder="DarkShop"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Descrição</label>
            <textarea
              value={siteForm.site_description}
              onChange={(e) => setSiteForm({ ...siteForm, site_description: e.target.value })}
              className="input-dark resize-none"
              rows={2}
              placeholder="Sua loja de produtos digitais premium"
            />
          </div>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="btn-neon-solid px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {/* Status das Integrações */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-neon-pink/10 rounded-lg flex items-center justify-center">
            <Settings size={16} className="text-neon-pink" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Status das Integrações</h2>
            <p className="text-xs text-white/40">Baseado nas variáveis de ambiente configuradas</p>
          </div>
        </div>

        <div>
          <StatusRow label="Google OAuth" configured={envStatus.google} envVar="GOOGLE_CLIENT_ID" />
          <StatusRow label="Discord OAuth" configured={envStatus.discord} envVar="DISCORD_CLIENT_ID" />
          <StatusRow label="Mercado Pago (PIX)" configured={envStatus.mp} envVar="MP_ACCESS_TOKEN" />
          <StatusRow label="PayPal" configured={envStatus.paypal} envVar="PAYPAL_CLIENT_ID" />
          <StatusRow label="PicPay" configured={envStatus.picpay} envVar="PICPAY_TOKEN" />
          <StatusRow label="Google Drive API" configured={envStatus.drive} envVar="GOOGLE_SERVICE_ACCOUNT_EMAIL" />
          <StatusRow label="Email (SMTP)" configured={envStatus.email} envVar="EMAIL_HOST" />
          <StatusRow label="Cloudinary" configured={envStatus.cloudinary} envVar="CLOUDINARY_CLOUD_NAME" />
        </div>

        <div className="mt-4 p-3 bg-neon-pink/5 border border-neon-pink/20 rounded-lg">
          <p className="text-xs text-neon-pink/80">
            💡 Configure as integrações faltando no{' '}
            <a href="/admin/guia-configuracao" className="underline hover:text-neon-pink">
              Guia de Configuração
            </a>
          </p>
        </div>
      </div>

      {/* URLs de Webhook */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-neon-pink/10 rounded-lg flex items-center justify-center">
            <Webhook size={16} className="text-neon-pink" />
          </div>
          <div>
            <h2 className="text-white font-semibold">URLs dos Webhooks</h2>
            <p className="text-xs text-white/40">Configure essas URLs nos painéis de pagamento</p>
          </div>
        </div>

        {webhooks.map((w) => (
          <WebhookRow key={w.label} {...w} />
        ))}

        <p className="text-xs text-white/30 mt-4">
          ⚠️ Certifique-se de que a variável <code className="text-neon-pink/60">NEXTAUTH_URL</code> está apontando para seu domínio de produção.
        </p>
      </div>

      {/* Link para Guia */}
      <div className="bg-gradient-to-r from-neon-pink/10 to-transparent border border-neon-pink/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium">Precisa de ajuda para configurar?</h3>
          <p className="text-white/40 text-sm mt-0.5">Siga nosso guia passo a passo com 12 tutoriais completos</p>
        </div>
        <a
          href="/admin/guia-configuracao"
          className="btn-neon-solid px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0 ml-4"
        >
          <ExternalLink size={16} />
          Ver Guia
        </a>
      </div>
    </div>
  )
}
