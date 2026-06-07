/**
 * Parsers puros para texto extraído de PDFs de facturas (Cañaveral/SIESA, D1).
 *
 * No depende de pdf.js — se separa de `invoicePdfImport.ts` (que sí lo carga)
 * para poder testear estas funciones en Node sin DOM.
 */
import type {
  BatchLine,
  InvoiceSourceId,
  ISODateString,
  ParsedInvoiceItem,
  ParsedInvoicePayload,
  Product,
  UUID,
} from '../types'

/** Solo dígitos; vacío si no hay dígitos (no matchea). */
export function normalizeBarcode(raw: unknown): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  return d || ''
}

export function parseMoney(s: unknown): number {
  const digits = String(s).replace(/\D/g, '')
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}

export function parseInvoiceDate(text: string): ISODateString | null {
  const m = text.match(/Fecha\s*:\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/i)
  if (!m) return null
  const y = m[1]
  const mo = m[2].padStart(2, '0')
  const d = m[3].padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/** Total a pagar en COP (heurística; facturas Cañaveral / similares). */
export function parseInvoiceTotalCop(text: string): number | null {
  const patterns = [
    /VALOR\s+A\s+PAGAR[^\d]*([\d.,]+)/i,
    /TOTAL\s+(?:A\s+PAGAR|FACTURA|DOCUMENTO)[^\d]*([\d.,]+)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = parseMoney(m[1])
      if (n > 0) return n
    }
  }
  return null
}

export function guessStoreLabelFromPdfText(text: string): string {
  if (/CAÑAVERAL/i.test(text)) return 'Cañaveral'
  if (/\bD1\b|CARULLA|EXITO|ÉXITO/i.test(text)) return 'D1 / Carulla'
  return ''
}

function titleCaseDesc(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= 80) return t
  return `${t.slice(0, 77)}...`
}

/**
 * Formato SIESA / Cañaveral: línea A `n descripción`, línea B `código cant UM precioUnit total`.
 * El primer campo numérico de B se usa como código de barras / EAN para matchear inventario.
 */
export function parseCanalaveralStyleLineItems(text: string): ParsedInvoiceItem[] {
  const items: ParsedInvoiceItem[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i]
    const b = lines[i + 1]
    const dm = a.match(/^\s*(\d+)\s+(.+)$/)
    if (!dm) continue
    const bClean = b.replace(/\*+$/g, '').trim()
    const bm = bClean.match(
      /^\s*(\d+)\s+([\d.]+)\s+(\S+)\s+([\d.,]+)\s+([\d.,]+)(?:\s*D)?\s*$/,
    )
    if (!bm) continue
    const barcodeRaw = bm[1]
    const desc = titleCaseDesc(dm[2])
    const qty = parseFloat(bm[2])
    const um = bm[3]
    const unitPriceRaw = parseMoney(bm[4])
    const total = parseMoney(bm[5])
    if (!desc || Number.isNaN(qty) || qty <= 0 || total <= 0) continue
    let unitPrice = unitPriceRaw
    const implied = Math.round(total / qty)
    if (unitPrice <= 0) {
      unitPrice = implied
    } else if (implied > 0 && Math.abs(unitPrice - implied) / implied > 0.12) {
      unitPrice = implied
    }
    if (unitPrice <= 0) continue
    items.push({ desc, qty, um, unitPrice, total, barcodeRaw })
    i += 1
  }
  return items
}

export function parseLineItemsForSource(text: string, sourceId: InvoiceSourceId | string): ParsedInvoiceItem[] {
  if (sourceId === 'canalaveral') return parseCanalaveralStyleLineItems(text)
  if (sourceId === 'd1-carulla') return parseCanalaveralStyleLineItems(text)
  return parseCanalaveralStyleLineItems(text)
}

/** Mapa código normalizado → primer productId del hogar. */
export function buildBarcodeToProductIdMap(products: Product[]): Map<string, UUID> {
  const map = new Map<string, UUID>()
  for (const p of products) {
    const norm = normalizeBarcode(p.barcode)
    if (!norm || map.has(norm)) continue
    map.set(norm, p.id)
  }
  return map
}

/**
 * Construye las líneas del batch form a partir de los items parseados, intentando match por código de barras.
 */
export function parsedItemsToBatchLines(
  parsedItems: ParsedInvoiceItem[],
  barcodeMap: Map<string, UUID>,
  createBatchLine: () => BatchLine,
): BatchLine[] {
  return parsedItems.map((it) => {
    const line = createBatchLine()
    // Candidatos a matchear: los explícitos (UBL trae Sellers + Standard) o el
    // barcodeRaw normalizado. Se prueba contra el inventario en orden.
    const candidates = (
      it.barcodeCandidates && it.barcodeCandidates.length
        ? it.barcodeCandidates
        : [normalizeBarcode(it.barcodeRaw)]
    )
      .map((c) => normalizeBarcode(c))
      .filter(Boolean)
    let productId: UUID | '' = ''
    for (const c of candidates) {
      if (barcodeMap.has(c)) {
        productId = barcodeMap.get(c) as UUID
        break
      }
    }
    return {
      ...line,
      productId,
      quantity: String(it.qty),
      price: String(it.total),
      invoiceBarcode: candidates[0] || String(it.barcodeRaw || ''),
      invoiceDesc: it.desc,
    }
  })
}

export function parsePdfForBatchForm(text: string, sourceId: InvoiceSourceId | string): ParsedInvoicePayload {
  const items = parseLineItemsForSource(text, sourceId)
  const date = parseInvoiceDate(text)
  const invoiceTotal = parseInvoiceTotalCop(text)
  const storeGuess = guessStoreLabelFromPdfText(text)
  return { items, date, invoiceTotal, storeGuess }
}
