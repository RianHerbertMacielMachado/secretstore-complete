'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'

type Status = 'loading' | 'valid' | 'invalid' | 'success'

export default function RedefinirSenhaPage() {
  const params   = useParams()
  const router   = useRouter()
  const token    = params.token as string

  const [status,          setStatus         ] = useState<Status>('loading')
  const [tokenError,      setTokenError      ] = useState('')
  const [password,        setPassword        ] = useState('')
  const [confirmPassword, setConfirmPassword ] = useState('')
  const [showPass,        setShowPass        ] = useState(false)
  const [showConfirm,     setShowConfirm     ] = useState(false)
  const [isLoading,       setIsLoading       ] = useState(false)

  // Valida o token ao carregar a página
  useEffect(() => {
    if (!token) { setStatus('invalid'); setTokenError('Token não encontrado.'); return }

    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setStatus('valid')
        } else {
          setStatus('invalid')
          setTokenError(data.error || 'Link inválido ou expirado.')
        }
      })
      .catch(() => {
        setStatus('invalid')
        setTokenError('Erro ao validar o link. Tente novamente.')
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setIsLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao redefinir senha.')
        if (res.status === 400 && data.error?.includes('expirado')) {
          setStatus('invalid')
          setTokenError(data.error)
        }
        return
      }

      setStatus('success')
      toast.success('Senha redefinida com sucesso!')
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Força da senha
  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 6)  score++
    if (pwd.length >= 10) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    if (score <= 1) return { level: 1, label: 'Fraca',  color: 'bg-red-500'    }
    if (score <= 2) return { level: 2, label: 'Razoável', color: 'bg-yellow-500' }
    if (score <= 3) return { level: 3, label: 'Boa',    color: 'bg-blue-500'   }
    return             { level: 4, label: 'Forte', color: 'bg-green-500'  }
  }

  const strength = getPasswordStrength(password)

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

          {/* ── Carregando ── */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 size={40} className="text-neon-pink animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">Validando seu link...</p>
            </div>
          )}

          {/* ── Token inválido / expirado ── */}
          {status === 'invalid' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Link inválido</h2>
              <p className="text-white/50 text-sm mb-6">{tokenError}</p>
              <Link
                href="/auth/esqueceu-senha"
                className="inline-block w-full py-3 px-4 text-center btn-neon-solid rounded-xl text-sm"
              >
                Solicitar novo link
              </Link>
            </motion.div>
          )}

          {/* ── Formulário ── */}
          {status === 'valid' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-neon-pink" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Criar nova senha</h1>
                <p className="text-white/50 text-sm">
                  Escolha uma senha segura para sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova senha */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="input-dark pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Barra de força */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.level ? strength.color : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-white/40">
                        Força: <span className="text-white/70">{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className={`input-dark pl-10 pr-10 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-500/50 focus:border-red-500'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-400 mt-1">✓ As senhas coincidem</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full btn-neon-solid py-3 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar nova senha'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Sucesso ── */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Senha redefinida!</h2>
              <p className="text-white/60 text-sm mb-6">
                Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full py-3 px-4 text-center btn-neon-solid rounded-xl text-sm"
              >
                Ir para o login agora
              </Link>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  )
}
