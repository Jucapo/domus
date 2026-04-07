/**
 * Title Case para UI (no muta datos almacenados).
 * Convierte también nombres guardados en MAYÚSCULAS (ej. "ARROZ PREMIUM" → "Arroz Premium").
 */
function titleWordSegment(segment) {
  const s = String(segment ?? '')
  if (!s) return s
  if (/\d/.test(s)) return s
  const letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '')
  if (!letters) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** Parte una palabra por / o - y aplica Title Case a cada trozo alfabético. */
function titleToken(word) {
  const w = String(word ?? '').trim()
  if (!w) return w
  if (/\d/.test(w)) return w
  if (w.includes('/') || w.includes('-')) {
    return w
      .split(/([/-])/)
      .map((part) => {
        if (part === '/' || part === '-') return part
        return titleWordSegment(part)
      })
      .join('')
  }
  return titleWordSegment(w)
}

export function toTitleCase(input) {
  const s = String(input ?? '').trim()
  if (!s) return ''

  return s
    .split(/\s+/)
    .map((w) => titleToken(w))
    .join(' ')
}
