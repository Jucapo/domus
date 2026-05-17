import * as pdfjs from 'pdfjs-dist'
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type {
  BatchLine,
  InvoiceSourceId,
  ISODateString,
  ParsedInvoiceItem,
  ParsedInvoicePayload,
  Product,
  UUID,
} from '../types'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

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
    const norm = normalizeBarcode(it.barcodeRaw)
    const productId = norm && barcodeMap.has(norm) ? (barcodeMap.get(norm) as UUID) : ''
    return {
      ...line,
      productId,
      quantity: String(it.qty),
      price: String(it.total),
      invoiceBarcode: norm || String(it.barcodeRaw || ''),
      invoiceDesc: it.desc,
    }
  })
}

function textContentToLines(textContent: TextContent): string {
  const raw = textContent.items
    .filter((x): x is TextItem => !!x && typeof x === 'object' && 'str' in x && !!(x as TextItem).str)
    .map((x) => ({
      str: x.str,
      y: x.transform[5],
      x: x.transform[4],
    }))
  raw.sort((a, b) => b.y - a.y || a.x - b.x)
  const out: string[] = []
  let buf: string[] = []
  let currentY: number | null = null
  const eps = 4
  for (const it of raw) {
    if (currentY === null || Math.abs(it.y - currentY) < eps) {
      buf.push(it.str)
      currentY = it.y
    } else {
      out.push(buf.join(' ').trim())
      buf = [it.str]
      currentY = it.y
    }
  }
  if (buf.length) out.push(buf.join(' ').trim())
  return out.join('\n')
}

export interface ExtractPdfTextOptions {
  onProgress?: (pct0to100: number) => void
}

/**
 * Extrae texto del PDF con saltos de línea aproximados (navegador).
 */
export async function extractPdfText(file: File, options: ExtractPdfTextOptions = {}): Promise<string> {
  const { onProgress } = options
  let lastPct = -1
  const report = (pct: number) => {
    const p = Math.min(100, Math.max(0, Math.round(pct)))
    if (p === lastPct) return
    lastPct = p
    onProgress?.(p)
  }

  report(0)
  const buf = await file.arrayBuffer()
  report(3)

  const loadingTask = pdfjs.getDocument({ data: buf })
  loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      report(3 + (loaded / total) * 27)
    }
  }

  const doc = await loadingTask.promise
  const numPages = doc.numPages
  if (numPages === 0) {
    await doc.destroy().catch(() => {})
    report(100)
    return ''
  }

  report(32)
  const parts: string[] = []
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    parts.push(textContentToLines(tc))
    report(32 + (i / numPages) * 66)
  }

  report(99)
  await doc.destroy().catch(() => {})
  report(100)
  return parts.join('\n\n')
}

export function parsePdfForBatchForm(text: string, sourceId: InvoiceSourceId | string): ParsedInvoicePayload {
  const items = parseLineItemsForSource(text, sourceId)
  const date = parseInvoiceDate(text)
  const invoiceTotal = parseInvoiceTotalCop(text)
  const storeGuess = guessStoreLabelFromPdfText(text)
  return { items, date, invoiceTotal, storeGuess }
}
