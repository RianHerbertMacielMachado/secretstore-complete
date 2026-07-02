'use client'

import { useState } from 'react'
import {
  FlaskConical, QrCode, Mail, Link2, FolderOpen, UserCheck,
  CheckCircle2, XCircle, Copy, Check, Loader2, AlertTriangle,
  CreditCard, Smartphone,
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface TestResult {
  success: boolean
  message?: string
  error?: string
  detail?: string | null
}

// ─── Modal de Erro Flutuante ─────────────────────────────────────────────────
function ErrorModal({
  result,
  onClose,
}: {
  result: TestResult
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const fullText = [
    result.success ? null : `ERRO: ${result.error}`,
    result.message ? `INFO: ${result.message}` : null,
    result.detail ? `\nDETALHES:\n${result.detail}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = fullText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl"
        style={{
          background: result.success ? '#0a1a0a' : '#1a0a0a',
          borderColor: result.success ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
          boxShadow: result.success
            ? '0 0 40px rgba(34,197,94,0.15)'
            : '0 0 40px rgba(239,68,68,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-5 border-b"
          style={{ borderColor: result.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}
        >
          {result.success ? (
            <CheckCircle2 size={22} className="text-green-400 flex-shrink-0" />
          ) : (
            <XCircle size={22} className="text-red-400 flex-shrink-0" />
          )}
          <h3 className={`font-bold text-base ${result.success ? 'text-green-300' : 'text-red-300'}`}>
            {result.success ? 'Teste bem-sucedido' : 'Erro no teste'}
          </h3>
          <button
            onClick={onClose}
            className="ml-auto text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Mensagem principal */}
          <p className="text-white/80 text-sm leading-relaxed">
            {result.success ? result.message : result.error}
          </p>

          {/* Detalhe técnico */}
          {result.detail && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Detalhes técnicos</p>
              <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {result.detail}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 p-4 border-t"
          style={{ borderColor: result.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}
        >
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              copied
                ? 'bg-green-500 text-black'
                : 'bg-white/10 hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar erro'}
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de Seção ───────────────────────────────────────────────────────────
function TestCard({
  icon: Icon,
  title,
  description,
  color,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden">
      <div className={`p-5 border-b border-white/10 flex items-center gap-3`}>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-white/40 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Indicador de resultado inline ──────────────────────────────────────────
function InlineResult({ result }: { result: TestResult | null }) {
  if (!result) return null
  return (
    <div
      className={`flex items-start gap-2 mt-3 p-3 rounded-xl text-sm ${
        result.success
          ? 'bg-green-500/10 border border-green-500/25 text-green-300'
          : 'bg-red-500/10 border border-red-500/25 text-red-300'
      }`}
    >
      {result.success ? (
        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle size={16} className="flex-shrink-0 mt-0.5" />
      )}
      <span className="leading-relaxed">
        {result.success ? result.message : result.error}
      </span>
    </div>
  )
}

// ─── Botão de teste ──────────────────────────────────────────────────────────
function TestButton({
  loading,
  onClick,
  children,
}: {
  loading: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-neon-pink hover:bg-neon-pink/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:shadow-[0_0_20px_rgba(255,0,127,0.5)]"
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <FlaskConical size={15} />
      )}
      {loading ? 'Testando...' : children}
    </button>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function TestesAdminPage() {
  const [modal, setModal] = useState<TestResult | null>(null)

  // Estados de loading
  const [loadingPix,    setLoadingPix]    = useState(false)
  const [loadingEmail,  setLoadingEmail]  = useState(false)
  const [loadingLink,   setLoadingLink]   = useState(false)
  const [loadingFolder, setLoadingFolder] = useState(false)
  const [loadingGrant,  setLoadingGrant]  = useState(false)
  const [loadingPaypal, setLoadingPaypal] = useState(false)
  const [loadingPicpay, setLoadingPicpay] = useState(false)

  // Resultados inline
  const [resultPix,    setResultPix]    = useState<TestResult | null>(null)
  const [resultEmail,  setResultEmail]  = useState<TestResult | null>(null)
  const [resultLink,   setResultLink]   = useState<TestResult | null>(null)
  const [resultFolder, setResultFolder] = useState<TestResult | null>(null)
  const [resultGrant,  setResultGrant]  = useState<TestResult | null>(null)
  const [resultPaypal, setResultPaypal] = useState<TestResult | null>(null)
  const [resultPicpay, setResultPicpay] = useState<TestResult | null>(null)

  // Campos de formulário
  const [emailTo,        setEmailTo]        = useState('')
  const [directLinkUrl,  setDirectLinkUrl]  = useState('')
  const [sharedFolderUrl,setSharedFolderUrl]= useState('')
  const [grantUrl,       setGrantUrl]       = useState('')
  const [grantEmail,     setGrantEmail]     = useState('')

  // ── Runner genérico ────────────────────────────────────────────────────────
  async function runTest(
    body: Record<string, string>,
    setLoading: (v: boolean) => void,
    setResult: (v: TestResult | null) => void
  ) {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const result: TestResult = {
        success: data.success ?? false,
        message: data.message,
        error: data.error,
        detail: data.detail ?? null,
      }
      setResult(result)
      // Abre modal sempre (sucesso ou erro)
      setModal(result)
    } catch (err: any) {
      const r: TestResult = {
        success: false,
        error: err.message || 'Erro de conexão com o servidor',
        detail: null,
      }
      setResult(r)
      setModal(r)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-neon-pink/15 rounded-xl border border-neon-pink/30">
          <FlaskConical size={22} className="text-neon-pink" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Painel de Testes</h1>
          <p className="text-white/40 text-sm">Valide integrações antes de ir para produção</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/25 rounded-xl">
        <AlertTriangle size={17} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-300/80 text-sm leading-relaxed">
          Todos os testes são executados com as variáveis de ambiente atuais do servidor. 
          Erros completos serão exibidos em modal flutuante com opção de copiar.
        </p>
      </div>

      {/* ── 1. Teste de PIX ─────────────────────────────────────────────────── */}
      <TestCard
        icon={QrCode}
        title="Teste de Pagamento PIX"
        description="Verifica se o token Mercado Pago está configurado e válido"
        color="bg-green-500/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Verifica a variável <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">MP_ACCESS_TOKEN</code> ou{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">MP_TEST_TOKEN</code> e tenta se comunicar com a API do Mercado Pago.
        </p>
        <TestButton
          loading={loadingPix}
          onClick={() => runTest({ action: 'test_pix' }, setLoadingPix, setResultPix)}
        >
          Testar Conexão com MP
        </TestButton>
        <InlineResult result={resultPix} />
      </TestCard>

      {/* ── 2. Teste de E-mail ───────────────────────────────────────────────── */}
      <TestCard
        icon={Mail}
        title="Teste de Envio de E-mail"
        description="Envia um e-mail de entrega de teste para verificar o SMTP"
        color="bg-blue-500/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Usa as variáveis{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">EMAIL_USER</code>,{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">EMAIL_PASS</code> e{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">EMAIL_HOST</code> para enviar um e-mail de entrega de exemplo.
        </p>
        <div className="mb-4">
          <label className="block text-xs text-white/40 mb-1.5">E-mail de destino do teste</label>
          <input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="seu@email.com"
            className="input-dark w-full max-w-xs"
          />
        </div>
        <TestButton
          loading={loadingEmail}
          onClick={() => runTest({ action: 'test_email', to: emailTo }, setLoadingEmail, setResultEmail)}
        >
          Enviar E-mail de Teste
        </TestButton>
        <InlineResult result={resultEmail} />
      </TestCard>

      {/* ── 3. Teste de Link Direto ──────────────────────────────────────────── */}
      <TestCard
        icon={Link2}
        title="Teste de Link Direto (Drive)"
        description="Valida se a URL do Google Drive está correta e o ID pode ser extraído"
        color="bg-purple-500/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Extrai o ID do arquivo/pasta do Google Drive e confirma o link de entrega que será enviado ao cliente.
          Método: <span className="text-purple-300 font-semibold">LINK</span>.
        </p>
        <div className="mb-4">
          <label className="block text-xs text-white/40 mb-1.5">URL do Google Drive</label>
          <input
            type="url"
            value={directLinkUrl}
            onChange={(e) => setDirectLinkUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="input-dark w-full"
          />
        </div>
        <TestButton
          loading={loadingLink}
          onClick={() => runTest({ action: 'test_direct_link', url: directLinkUrl }, setLoadingLink, setResultLink)}
        >
          Testar Link Direto
        </TestButton>
        <InlineResult result={resultLink} />
      </TestCard>

      {/* ── 4. Teste de Pasta Compartilhada ─────────────────────────────────── */}
      <TestCard
        icon={FolderOpen}
        title="Teste de Pasta Compartilhada"
        description="Valida URL de pasta compartilhada do Google Drive"
        color="bg-orange-500/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Verifica a URL da pasta e retorna o link de acesso. O cliente recebe o link e acessa com as permissões
          já configuradas na pasta. Método: <span className="text-orange-300 font-semibold">SHARED_FOLDER</span>.
        </p>
        <div className="mb-4">
          <label className="block text-xs text-white/40 mb-1.5">URL da Pasta Compartilhada</label>
          <input
            type="url"
            value={sharedFolderUrl}
            onChange={(e) => setSharedFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="input-dark w-full"
          />
        </div>
        <TestButton
          loading={loadingFolder}
          onClick={() => runTest({ action: 'test_shared_folder', url: sharedFolderUrl }, setLoadingFolder, setResultFolder)}
        >
          Testar Pasta Compartilhada
        </TestButton>
        <InlineResult result={resultFolder} />
      </TestCard>

      {/* ── 5. Teste de Conceder Permissão ───────────────────────────────────── */}
      <TestCard
        icon={UserCheck}
        title="Teste de Conceder Permissão"
        description="Testa o service account do Google para dar acesso individual a um e-mail"
        color="bg-cyan-500/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Usa o Service Account configurado nas variáveis{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> e{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">GOOGLE_PRIVATE_KEY</code> para conceder permissão de leitura.
          Método: <span className="text-cyan-300 font-semibold">GRANT_PERMISSION</span>.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">URL do arquivo/pasta no Drive</label>
            <input
              type="url"
              value={grantUrl}
              onChange={(e) => setGrantUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="input-dark w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">E-mail para conceder acesso</label>
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="input-dark w-full"
            />
          </div>
        </div>
        <TestButton
          loading={loadingGrant}
          onClick={() =>
            runTest(
              { action: 'test_grant_permission', url: grantUrl, email: grantEmail },
              setLoadingGrant,
              setResultGrant
            )
          }
        >
          Testar Concessão de Permissão
        </TestButton>
        <InlineResult result={resultGrant} />
      </TestCard>

      {/* ── 6. Teste de PayPal ───────────────────────────────────────────── */}
      <TestCard
        icon={CreditCard}
        title="Teste de Pagamento PayPal"
        description="Verifica se as credenciais do PayPal estão configuradas e válidas"
        color="bg-blue-600/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Testa as variáveis{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">PAYPAL_CLIENT_ID</code> e{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">PAYPAL_CLIENT_SECRET</code>{' '}
          obtendo um access token OAuth no ambiente configurado em{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">PAYPAL_MODE</code>{' '}
          (sandbox ou live).
        </p>
        <TestButton
          loading={loadingPaypal}
          onClick={() => runTest({ action: 'test_paypal' }, setLoadingPaypal, setResultPaypal)}
        >
          Testar Credenciais PayPal
        </TestButton>
        <InlineResult result={resultPaypal} />
      </TestCard>

      {/* ── 7. Teste de PicPay ───────────────────────────────────────────── */}
      <TestCard
        icon={Smartphone}
        title="Teste de Pagamento PicPay"
        description="Verifica se o token do PicPay está configurado e consegue acessar a API"
        color="bg-green-600/20"
      >
        <p className="text-white/50 text-sm mb-4">
          Testa a variável{' '}
          <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">PICPAY_TOKEN</code>{' '}
          (ou <code className="text-neon-pink bg-neon-pink/10 px-1 py-0.5 rounded text-xs">PICPAY_SELLER_TOKEN</code>)
          fazendo uma requisição real à API do PicPay para validar o acesso.
        </p>
        <TestButton
          loading={loadingPicpay}
          onClick={() => runTest({ action: 'test_picpay' }, setLoadingPicpay, setResultPicpay)}
        >
          Testar Token PicPay
        </TestButton>
        <InlineResult result={resultPicpay} />
      </TestCard>

      {/* Modal flutuante de resultado */}
      {modal && <ErrorModal result={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
