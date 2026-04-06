import { useState, useRef } from 'react'
import { Camera, Link, X, Loader2, Image } from 'lucide-react'
import { uploadProductImage } from '../lib/storage'

export default function ImageUploader({ value, onChange, className = '' }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [error, setError] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const publicUrl = await uploadProductImage(file)
      onChange(publicUrl)
    } catch (err) {
      setError('Error al subir la imagen')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleUrlConfirm = () => {
    const trimmed = urlDraft.trim()
    if (trimmed) {
      onChange(trimmed)
      setUrlDraft('')
      setShowUrlInput(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    setShowUrlInput(false)
    setUrlDraft('')
    setError(null)
  }

  if (value) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src={value}
          alt="Producto"
          className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {uploading ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-indigo-300 bg-indigo-50">
          <Loader2 size={20} className="animate-spin text-indigo-400" />
        </div>
      ) : showUrlInput ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleUrlConfirm() }
              if (e.key === 'Escape') setShowUrlInput(false)
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Foto</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Link size={14} />
            <span className="hidden sm:inline">URL</span>
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
