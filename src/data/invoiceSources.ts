import type { InvoiceSource } from '../types'

/**
 * Facturas electrónicas en PDF (las que llegan al correo).
 * Alcance acotado: solo estos formatos → parsers específicos por cadena.
 */
export const E_INVOICE_PDF_SOURCES: InvoiceSource[] = [
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

/** Etiquetas de "Lugar" alineadas con las cadenas anteriores (botones rápidos en compras). */
export const STORE_QUICK_PICK_LABELS: string[] = E_INVOICE_PDF_SOURCES.map((s) => s.label)

export function invoiceSourceByLabel(label: string | null | undefined): InvoiceSource | null {
  const t = String(label || '').trim()
  return E_INVOICE_PDF_SOURCES.find((s) => s.label === t) ?? null
}
