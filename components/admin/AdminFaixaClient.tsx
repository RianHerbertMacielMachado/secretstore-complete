'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Save, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

interface TickerItem {
  id: string
  text: string
  sortOrder: number
  isActive: boolean
}

interface TickerSettings {
  enabled: boolean
  speed: string   // 'slow' | 'medium' | 'fast'
  color: string   // hex color
}

interface Props {
  items: TickerItem[]
  settings: TickerSettings
}

export default function AdminFaixaClient({ items: init, settings: initSettings }: Props) {
  const [items, setItems] = useState(init)
  const [settings, setSettings] = useState(initSettings)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TickerItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [form, setForm] = useState({ text: '', sortOrder: 0, isActive: true })

  const resetForm = () => {
    setForm({ text: '', sortOrder: 0, isActive: true })
    setEditing(null)
  }

  const openEdit = (item: TickerItem) => {
    setEditing(item)
    setForm({ text: item.text, sortOrder: item.sortOrder, isActive: item.isActive })
    setShowForm(true)
  }

  // Salva configurações globais do ticker
  const saveSettings = async () => {
    setIsSavingSettings(true)
    try {
      const res = await fetch('/api/admin/ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Erro ao salvar configurações')
      toast.success('Configurações salvas!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Submit de novo item ou edição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) { toast.error('Texto é obrigatório'); return }

    setIsLoading(true)
    try {
      const url = editing ? `/api/admin/ticker/${editing.id}` : '/api/admin/ticker'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      if (editing) {
        setItems((prev) => prev.map((i) => (i.id === editing.id ? data.item : i)))
        toast.success('Item atualizado!')
      } else {
        setItems((prev) => [...prev, data.item])
        toast.success('Item adicionado!')
      }
      setShowForm(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este aviso da faixa?')) return
    try {
      const res = await fetch(`/api/admin/ticker/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Item removido!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleActive = async (item: TickerItem) => {
    try {
      const res = await fetch(`/api/admin/ticker/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Preview da faixa com itens ativos
  const activeItems = items.filter((i) => i.isActive)
  const previewText = activeItems.length > 0
    ? activeItems.map((i) => i.text).join('   ///   ')
    : 'Adicione itens para visualizar a faixa aqui...'

  const speedMap: Record<string, number> = { slow: 60, medium: 35, fast: 20 }
  const animDuration = speedMap[settings.speed] || 35

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Faixa do Topo</h1>
          <p className="text-white/40 text-sm mt-1">
            Textos informativos animados exibidos acima do navbar
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Adicionar Texto
        </button>
      </div>

      {/* Preview da faixa */}
      {settings.enabled && activeItems.length > 0 && (
        <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
          <div className="bg-black/60 px-3 py-1.5 text-xs text-white/30 border-b border-white/10">
            Preview da faixa
          </div>
          <div className="bg-[#111] py-2.5 overflow-hidden">
            <div
              className="whitespace-nowrap inline-block"
              style={{
                animation: `ticker-scroll ${animDuration}s linear infinite`,
                color: settings.color,
              }}
            >
              {previewText}&nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;{previewText}&nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;
            </div>
          </div>
          <style>{`
            @keyframes ticker-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      )}

      {/* Configurações globais */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-pink" />
          Configurações Globais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Toggle ativo */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Status da Faixa</label>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            >
              <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-neon-pink' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'left-7' : 'left-1'}`} />
              </div>
              <span className={`text-sm font-medium ${settings.enabled ? 'text-green-400' : 'text-white/40'}`}>
                {settings.enabled ? 'Ativada' : 'Desativada'}
              </span>
            </div>
          </div>

          {/* Velocidade */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Velocidade</label>
            <select
              value={settings.speed}
              onChange={(e) => setSettings({ ...settings, speed: e.target.value })}
              className="input-dark w-full"
            >
              <option value="slow">Lenta</option>
              <option value="medium">Média</option>
              <option value="fast">Rápida</option>
            </select>
          </div>

          {/* Cor do texto */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Cor do Texto</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={settings.color}
                onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                className="input-dark flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className="btn-primary mt-4 flex items-center gap-2"
        >
          <Save size={16} />
          {isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Formulário de item */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                {editing ? 'Editar Aviso' : 'Novo Texto na Faixa'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Texto <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Ex: USE NEWCUSTOMER PARA 15% DE DESCONTO"
                  className="input-dark w-full uppercase"
                  required
                />
                <p className="text-xs text-white/30 mt-1">Os textos são separados por /// automaticamente</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="input-dark w-full"
                    min={0}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.isActive ? 'bg-neon-pink' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-sm text-white/70">Visível</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                  {isLoading ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Adicionar à Faixa'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="btn-outline px-6">
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de itens */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Nenhum texto na faixa</p>
          <p className="text-sm mt-1">Adicione avisos, promoções e informações para seus clientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/40 mb-3">
            Textos Cadastrados ({items.length})
          </h3>
          {items
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => (
              <motion.div
                key={item.id}
                layout
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-white/20 transition-colors"
              >
                <MessageSquare size={14} className="text-neon-pink/60 flex-shrink-0" />
                <span className={`flex-1 text-sm ${item.isActive ? 'text-white' : 'text-white/30 line-through'}`}>
                  {item.text}
                </span>
                <span className="text-xs text-white/25 px-2">#{item.sortOrder}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(item)}
                    className={`p-1.5 rounded transition-colors ${item.isActive ? 'text-green-400 hover:bg-green-400/10' : 'text-white/30 hover:bg-white/5'}`}
                    title={item.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  )
}
