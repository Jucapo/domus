/**
 * Facturas electrónicas en PDF (las que llegan al correo).
 * Alcance acotado: solo estos formatos → parsers específicos por cadena (viable vs. PDF genérico).
 *
 * Próximo paso técnico típico: pdf.js → texto → `parseCanalaveralPdfText` / `parseD1CarullaPdfText`.
 */
export const E_INVOICE_PDF_SOURCES = [
  {
    id: 'canalaveral',
    label: 'Cañaveral',
    primary: true,
  },
  {
    id: 'd1-carulla',
    label: 'D1 / Carulla',
    primary: false,
  },
]

/** Etiquetas de “Lugar” alineadas con las cadenas anteriores (botones rápidos en compras). */
export const STORE_QUICK_PICK_LABELS = E_INVOICE_PDF_SOURCES.map((s) => s.label)

export function invoiceSourceByLabel(label) {
  const t = String(label || '').trim()
  return E_INVOICE_PDF_SOURCES.find((s) => s.label === t) ?? null
}
