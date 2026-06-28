'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  required?: boolean
  className?: string
}

export function ImageUpload({ value, onChange, label = 'Imagem', required = false, className = '' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')
      onChange(data.url)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        const msg = rejection.errors[0]?.code === 'file-too-large'
          ? 'Arquivo muito grande. Máximo de 5MB.'
          : rejection.errors[0]?.code === 'file-invalid-type'
          ? 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.'
          : 'Arquivo inválido.'
        setError(msg)
        toast.error(msg)
        return
      }
      if (acceptedFiles[0]) uploadFile(acceptedFiles[0])
    },
    [] // eslint-disable-line
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs text-white/60 mb-1">
          {label} {required && <span className="text-neon-pink">*</span>}
        </label>
      )}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-red-500/80 rounded-lg text-white hover:bg-red-500 transition-colors"
              title="Remover imagem"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              {...getRootProps()}
              className="cursor-pointer p-1.5 bg-black/70 rounded-lg text-white/70 hover:text-white"
              title="Substituir imagem"
            >
              <input {...getInputProps()} />
              <Upload size={14} />
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            relative rounded-xl border-2 border-dashed transition-all cursor-pointer
            ${isDragActive
              ? 'border-neon-pink bg-neon-pink/10 scale-[1.01]'
              : 'border-white/20 bg-white/3 hover:border-neon-pink/50 hover:bg-white/5'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
            {isUploading ? (
              <>
                <Loader2 size={28} className="text-neon-pink animate-spin" />
                <p className="text-sm text-white/50">Enviando imagem...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center">
                  {isDragActive ? (
                    <Upload size={22} className="text-neon-pink" />
                  ) : (
                    <ImageIcon size={22} className="text-neon-pink/60" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/70">
                    {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-white/30 mt-1">JPG, PNG, WEBP, GIF — máx. 5MB</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────────
// MultiImageUpload — Para múltiplas imagens de produto
// ────────────────────────────────────────────────────────────────────────────────

interface MultiImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
}

export function MultiImageUpload({ images, onChange, label = 'Imagens do Produto' }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload')
    return data.url
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const msg = rejectedFiles[0].errors[0]?.code === 'file-too-large'
          ? 'Arquivo muito grande. Máximo de 5MB por arquivo.'
          : 'Formato não suportado. Use JPG, PNG, WEBP ou GIF.'
        setError(msg)
        toast.error(msg)
        return
      }
      setIsUploading(true)
      setError(null)
      try {
        const uploaded = await Promise.all(acceptedFiles.map(uploadFile))
        const validUrls = uploaded.filter(Boolean) as string[]
        onChange([...images, ...validUrls])
        if (validUrls.length > 0) toast.success(`${validUrls.length} imagem(ns) adicionada(s)!`)
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
      } finally {
        setIsUploading(false)
      }
    },
    [images, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  })

  const removeImage = (idx: number) => {
    const next = [...images]
    next.splice(idx, 1)
    onChange(next)
  }

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    const next = [...images]
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-white/60">{label}</label>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          rounded-xl border-2 border-dashed transition-all cursor-pointer
          ${isDragActive
            ? 'border-neon-pink bg-neon-pink/10 scale-[1.01]'
            : 'border-white/20 bg-white/3 hover:border-neon-pink/50 hover:bg-white/5'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-6 px-4 gap-2">
          {isUploading ? (
            <>
              <Loader2 size={24} className="text-neon-pink animate-spin" />
              <p className="text-sm text-white/50">Enviando imagens...</p>
            </>
          ) : (
            <>
              <Upload size={22} className={isDragActive ? 'text-neon-pink' : 'text-neon-pink/50'} />
              <p className="text-sm text-white/60">
                {isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
              </p>
              <p className="text-xs text-white/30">Múltiplos arquivos • JPG, PNG, WEBP, GIF • máx. 5MB cada</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="group relative rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-square">
              <img src={url} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-1 right-1">
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 bg-red-500/80 rounded-md text-white hover:bg-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'up')}
                      className="p-1 bg-black/70 rounded-md text-white/70 hover:text-white text-xs"
                      title="Mover para cima"
                    >←</button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 'down')}
                      className="p-1 bg-black/70 rounded-md text-white/70 hover:text-white text-xs"
                      title="Mover para baixo"
                    >→</button>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 text-xs text-white/50 bg-black/50 px-1 rounded">
                  #{idx + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
