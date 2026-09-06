'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const errorMessages: Record<string, string> = {
  Configuration: 'Erro de configuração do servidor. Contate o suporte.',
  AccessDenied: 'Acesso negado. Você não tem permissão para entrar.',
  Verification: 'O link de verificação expirou ou já foi utilizado.',
  OAuthSignin: 'Erro ao iniciar login social. Tente novamente.',
  OAuthCallback: 'Erro no retorno do login social. Verifique se o aplicativo está configurado corretamente.',
  OAuthCreateAccount: 'Não foi possível criar sua conta. Tente outro método de login.',
  EmailCreateAccount: 'Não foi possível criar sua conta com este email.',
  Callback: 'Erro no processo de autenticação. Tente novamente.',
  OAuthAccountNotLinked: 'Este email já está cadastrado com outro método de login.',
  SessionRequired: 'Você precisa estar logado para acessar esta página.',
  OAuthNotConfigured: 'Este método de login não está disponível no momento.',
  Default: 'Ocorreu um erro durante o login. Tente novamente.',
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') ?? 'Default'
  const message = errorMessages[error] ?? errorMessages.Default

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,0,127,0.08) 0%, black 70%)' }}
    >
      <div className="w-full max-w-md text-center">
        <div className="bg-[#0d0d0d] border border-red-500/30 rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(255,0,0,0.08)' }}
        >
          {/* Ícone de erro */}
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">✕</span>
          </div>

          <h1 className="text-xl font-bold text-white mb-2">Erro de Autenticação</h1>
          <p className="text-white/60 text-sm mb-2">{message}</p>

          {error === 'OAuthCallback' || error === 'OAuthSignin' ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 text-left">
              <p className="text-yellow-400 text-xs font-medium mb-1">Como resolver:</p>
              <ul className="text-white/50 text-xs space-y-1 list-disc list-inside">
                <li>Verifique se o <strong className="text-white/70">Redirect URI</strong> no painel do Discord/Google está correto</li>
                <li>O redirect deve ser: <code className="text-neon-pink text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback/discord</code></li>
                <li>Certifique-se que <code className="text-neon-pink text-xs">DISCORD_CLIENT_ID</code> e <code className="text-neon-pink text-xs">DISCORD_CLIENT_SECRET</code> estão configurados</li>
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-3 px-4 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 rounded-xl text-white text-sm font-medium transition-all duration-200"
            >
              Voltar ao Login
            </Link>
            <Link
              href="/"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              Ir para a loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
