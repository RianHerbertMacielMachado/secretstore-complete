'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Copy, ExternalLink, Save, Settings, Webhook, Globe, LayoutGrid } from 'lucide-react'
import { FaDiscord } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface Props {
  configMap: Record<string, string>
  envStatus: Record<string, boolean>
  webhookBase: string
  discordUrl: string | null
  productsPerPage: number
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

const PAGE_OPTIONS = [
  { value: 15, label: '5×3 — 15 produtos por página', cols: 3 },
  { value: 20, label: '5×4 — 20 produtos por página', cols: 4 },
  { value: 25, label: '5×5 — 25 produtos por página', cols: 5 },
]

export default function AdminConfiguracoesClient({ configMap, envStatus, webhookBase, discordUrl: initialDiscordUrl, productsPerPage: initialPerPage }: Props) {
  const [siteForm, setSiteForm] = useState({
    store_name: configMap.store_name || configMap.site_name || 'DarkShop',
    store_subtitle: configMap.store_subtitle || 'Produtos digitais com estética gótica e entrega imediata',
    site_description: configMap.site_description || '',
  })
  const [discordUrl, setDiscordUrl] = useState(initialDiscordUrl || '')
  const [productsPerPage, setProductsPerPage] = useState<number>(initialPerPage || 15)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDiscord, setIsSavingDiscord] = useState(false)
  const [isSavingPagination, setIsSavingPagination] = useState(false)

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
      toast.success('Configurações salvas! Recarregue a loja para ver as mudanças.')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const saveDiscordUrl = async () => {
    setIsSavingDiscord(true)
    try {
      const res = await fetch('/api/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUrl: discordUrl || null, productsPerPage }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Link do Discord salvo!')
    } catch {
      toast.error('Erro ao salvar link do Discord')
    } finally {
      setIsSavingDiscord(false)
    }
  }

  const savePagination = async () => {
    setIsSavingPagination(true)
    try {
      const res = await fetch('/api/store-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUrl: discordUrl || null, productsPerPage }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Paginação salva!')
    } catch {
      toast.error('Erro ao salvar paginação')
    } finally {
      setIsSavingPagination(false)
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
            <label className="block text-xs text-white/50 mb-1.5">
              Nome da Loja
              <span className="ml-2 text-neon-pink/60">— aparece na navbar, hero e footer</span>
            </label>
            <input
              type="text"
              value={siteForm.store_name}
              onChange={(e) => setSiteForm({ ...siteForm, store_name: e.target.value })}
              className="input-dark"
              placeholder="DarkShop"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Subtítulo do Hero
              <span className="ml-2 text-neon-pink/60">— frase de destaque na página inicial</span>
            </label>
            <input
              type="text"
              value={siteForm.store_subtitle}
              onChange={(e) => setSiteForm({ ...siteForm, store_subtitle: e.target.value })}
              className="input-dark"
              placeholder="Produtos digitais com estética gótica e entrega imediata"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Descrição do Site (SEO)</label>
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

      {/* Paginação de Produtos */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-neon-pink/10 rounded-lg flex items-center justify-center">
            <LayoutGrid size={16} className="text-neon-pink" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Paginação de Produtos</h2>
            <p className="text-xs text-white/40">Quantidade de produtos exibidos por página nas listagens</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {PAGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                productsPerPage === opt.value
                  ? 'border-neon-pink/50 bg-neon-pink/5'
                  : 'border-white/10 bg-white/2 hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="productsPerPage"
                value={opt.value}
                checked={productsPerPage === opt.value}
                onChange={() => setProductsPerPage(opt.value)}
                className="accent-neon-pink"
              />
              {/* Mini grid preview */}
              <div className="flex gap-1 flex-shrink-0">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div key={row} className="flex flex-col gap-1">
                    {Array.from({ length: opt.cols }).map((_, col) => (
                      <div
                        key={col}
                        className={`w-3 h-3 rounded-sm ${
                          productsPerPage === opt.value ? 'bg-neon-pink/60' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  productsPerPage === opt.value ? 'text-neon-pink' : 'text-white'
                }`}>
                  {opt.label}
                </p>
                <p className="text-xs text-white/30">
                  Grade com 5 linhas × {opt.cols} colunas
                </p>
              </div>
              {productsPerPage === opt.value && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-neon-pink/20 text-neon-pink border border-neon-pink/30 rounded">
                  Ativo
                </span>
              )}
            </label>
          ))}
        </div>

        <button
          onClick={savePagination}
          disabled={isSavingPagination}
          className="btn-neon-solid px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Save size={16} />
          {isSavingPagination ? 'Salvando...' : 'Salvar Paginação'}
        </button>
      </div>

      {/* Discord */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(88,101,242,0.15)' }}>
            <FaDiscord size={18} style={{ color: '#5865F2' }} />
          </div>
          <div>
            <h2 className="text-white font-semibold">Discord da Loja</h2>
            <p className="text-xs text-white/40">Link do servidor Discord exibido no footer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Link de Convite do Discord
              <span className="ml-2 text-white/30">— deixe em branco para ocultar o ícone</span>
            </label>
            <input
              type="url"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              className="input-dark"
              placeholder="https://discord.gg/seuservidor"
            />
          </div>

          {discordUrl && (
            <div className="flex items-center gap-3 p-3 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg">
              <FaDiscord size={20} style={{ color: '#5865F2' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate">{discordUrl}</p>
                <p className="text-xs text-white/40">Ícone aparecerá no footer da loja</p>
              </div>
            </div>
          )}

          <button
            onClick={saveDiscordUrl}
            disabled={isSavingDiscord}
            className="btn-neon-solid px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Save size={16} />
            {isSavingDiscord ? 'Salvando...' : 'Salvar Link do Discord'}
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
