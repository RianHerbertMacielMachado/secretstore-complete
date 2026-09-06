'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao enviar. Tente novamente.')
        return
      }

      setEnviado(true)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,0,127,0.08) 0%, black 70%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Voltar */}
        <div className="mb-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-neon-pink transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao login
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl text-neon-pink">✝</span>
            <span className="font-gothic text-2xl font-bold text-white">
              SECRET<span className="text-neon-pink">STORE</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-8"
          style={{ boxShadow: '0 0 40px rgba(255,0,127,0.08)' }}
        >
          {!enviado ? (
            /* ── Formulário ── */
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-neon-pink" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Esqueceu sua senha?</h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Digite o email cadastrado na sua conta e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    Email cadastrado
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="input-dark pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full btn-neon-solid py-3 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-white/30 mt-6">
                Lembrou a senha?{' '}
                <Link href="/auth/login" className="text-neon-pink hover:text-neon-rose transition-colors">
                  Entrar
                </Link>
              </p>
            </>
          ) : (
            /* ── Sucesso ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-3">Email enviado!</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                Se o email <strong className="text-white">{email}</strong> estiver cadastrado,
                você receberá as instruções para redefinir sua senha em instantes.
              </p>
              <p className="text-white/40 text-xs mb-6">
                O link expira em <strong className="text-white/60">1 hora</strong>. Verifique também sua caixa de spam.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { setEnviado(false); setEmail('') }}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-all"
                >
                  Enviar para outro email
                </button>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 px-4 text-center text-sm text-white/50 hover:text-neon-pink transition-colors"
                >
                  Voltar ao login
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
