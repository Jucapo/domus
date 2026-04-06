import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

const BUCKET = 'product-images'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 800,
  useWebWorker: true,
}

export async function uploadProductImage(file) {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS)

  const ext = compressed.type === 'image/png' ? 'png' : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: compressed.type,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteProductImage(url) {
  if (!url || !url.includes(BUCKET)) return
  const path = url.split(`${BUCKET}/`).pop()
  if (path) {
    await supabase.storage.from(BUCKET).remove([path])
  }
}
