'use client'

import { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Save, Image as ImageIcon, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageUpload } from '@/components/shared/ImageUpload'

interface HeroBgImage {
  id: string
  image: string
  sortOrder: number
  isActive: boolean
}

interface Props {
  images: HeroBgImage[]
  interval: number
}

export default function AdminHeroBgClient({ images: init, interval: initInterval }: Props) {
  const [images, setImages] = useState(init)
  const [interval, setInterval] = useState(initInterval)
  const [newImage, setNewImage] = useState('')
  const [newOrder, setNewOrder] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSavingInterval, setIsSavingInterval] = useState(false)

  const saveInterval = async () => {
    setIsSavingInterval(true)
    try {
      const res = await fetch('/api/admin/hero-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Intervalo salvo!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSavingInterval(false)
    }
  }

  const addImage = async () => {
    if (!newImage.trim()) { toast.error('Selecione uma imagem'); return }
    setIsAdding(true)
    try {
      const res = await fetch('/api/admin/hero-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newImage, sortOrder: newOrder, isActive: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImages(prev => [...prev, data.image])
      setNewImage('')
      setNewOrder(0)
      setShowAddForm(false)
      toast.success('Imagem adicionada!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsAdding(false)
    }
  }

  const toggleActive = async (img: HeroBgImage) => {
    try {
      const res = await fetch(`/api/admin/hero-bg/${img.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !img.isActive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImages(prev => prev.map(i => i.id === img.id ? data.image : i))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const deleteImage = async (id: string) => {
    if (!confirm('Remover esta imagem de fundo?')) return
    try {
      const res = await fetch(`/api/admin/hero-bg/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      setImages(prev => prev.filter(i => i.id !== id))
      toast.success('Imagem removida!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const activeCount = images.filter(i => i.isActive).length

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ImageIcon size={26} className="text-neon-pink" />
            Fundo do Hero
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Imagens de fundo do banner principal da loja. Com mais de uma, alternam em slideshow.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Adicionar Imagem
        </button>
      </div>

      {/* Intervalo de troca */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={16} className="text-neon-pink" />
          Intervalo do Slideshow
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="number"
              min={1}
              max={60}
              value={interval}
              onChange={e => setInterval(parseInt(e.target.value) || 5)}
              className="input-dark w-full pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              segundos
            </span>
          </div>
          <button
            onClick={saveInterval}
            disabled={isSavingInterval}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {isSavingInterval ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <p className="text-xs text-white/25 mt-2">
          {activeCount <= 1
            ? 'Adicione pelo menos 2 imagens ativas para o slideshow funcionar.'
            : `${activeCount} imagens ativas — troca a cada ${interval}s`}
        </p>
      </div>

      {/* Formulário de nova imagem */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6"
          >
            <h3 className="font-semibold text-white mb-4">Nova Imagem de Fundo</h3>
            <ImageUpload
              label="Imagem de Fundo do Hero"
              value={newImage}
              onChange={url => setNewImage(url)}
            />
            <p className="text-xs text-white/30 mt-1 mb-4">
              Recomendado: 1920×1080px · JPG/PNG · proporção 16:9 funciona melhor
            </p>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <label className="block text-xs text-white/50 mb-1">Ordem</label>
                <input
                  type="number"
                  value={newOrder}
                  onChange={e => setNewOrder(parseInt(e.target.value) || 0)}
                  className="input-dark w-full"
                  min={0}
                />
              </div>
              <div className="flex gap-3 flex-1 justify-end">
                <button onClick={() => setShowAddForm(false)} className="btn-outline px-5">
                  Cancelar
                </button>
                <button onClick={addImage} disabled={isAdding} className="btn-primary px-5">
                  {isAdding ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de imagens */}
      {images.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
          <p>Nenhuma imagem cadastrada</p>
          <p className="text-sm mt-1">Sem imagem, o hero exibe o gradiente padrão.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...images].sort((a, b) => a.sortOrder - b.sortOrder).map(img => (
            <motion.div
              key={img.id}
              layout
              className={`relative rounded-xl overflow-hidden border transition-colors ${
                img.isActive ? 'border-white/15' : 'border-white/5 opacity-50'
              }`}
            >
              {/* Preview */}
              <div className="h-36 bg-white/5">
                <img
                  src={img.image}
                  alt="Fundo hero"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                />
              </div>
              {/* Barra inferior */}
              <div className="bg-[#0d0d0d] px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-white/40">Ordem: {img.sortOrder}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(img)}
                    className={`p-1.5 rounded transition-colors ${
                      img.isActive
                        ? 'text-green-400 hover:bg-green-400/10'
                        : 'text-white/30 hover:bg-white/5'
                    }`}
                    title={img.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {img.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {/* Badge status */}
              <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded font-medium ${
                img.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
              }`}>
                {img.isActive ? 'Ativa' : 'Inativa'}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
