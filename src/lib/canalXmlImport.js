import { normalizeBarcode, buildBarcodeToProductIdMap } from './invoicePdfImport'

function titleCaseDesc(s) {
  const t = String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
  if (t.length <= 80) return t
  return `${t.slice(0, 77)}...`
}

/** Igual que en scripts/parse-canal-invoices-to-sql.mjs para matchear nombres. */
export function normKey(desc) {
  return String(desc)
    .replace(/\*/g, ' ')
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildNormNameToProductIdMap(products) {
  const map = new Map()
  for (const p of products) {
    const k = normKey(p.name)
    if (k && !map.has(k)) map.set(k, p.id)
  }
  return map
}

/**
 * Línea UBL: LineExtension + solo el TaxAmount del TaxTotal (no duplicar Subtotal DIAN).
 * Ver scripts/parse-canal-invoices-to-sql.mjs
 */
function ublLinePayableTotalCop(lineSegment) {
  const extM = lineSegment.match(/<cbc:LineExtensionAmount[^>]*>([\d.]+)</)
  if (!extM) return null
  let total = parseFloat(extM[1])
  const taxM = lineSegment.match(
    /<cac:TaxTotal>\s*<cbc:TaxAmount[^>]*>([\d.]+)<\/cbc:TaxAmount>/,
  )
  if (taxM) total += parseFloat(taxM[1])
  return Math.round(total)
}

function parseUblTaxInclusiveCop(innerInvoiceXml) {
  const lmt = innerInvoiceXml.match(
    /<cac:LegalMonetaryTotal>([\s\S]*?)<\/cac:LegalMonetaryTotal>/,
  )
  if (!lmt) return null
  const block = lmt[1]
  const m =
    block.match(/<cbc:TaxInclusiveAmount[^>]*>([\d.]+)<\/cbc:TaxInclusiveAmount>/) ||
    block.match(/<cbc:PayableAmount[^>]*>([\d.]+)<\/cbc:PayableAmount>/)
  if (!m) return null
  const n = Math.round(parseFloat(m[1]))
  return Number.isFinite(n) && n > 0 ? n : null
}

function allocateLineTotalsCop(rawTotals, target) {
  const sum = rawTotals.reduce((a, b) => a + b, 0)
  if (sum <= 0 || !target || target <= 0) return rawTotals
  const scaled = rawTotals.map((t) => (t * target) / sum)
  const floors = scaled.map((s) => Math.floor(s))
  let rem = target - floors.reduce((a, b) => a + b, 0)
  const frac = scaled.map((s, i) => ({ i, f: s - Math.floor(s) }))
  frac.sort((a, b) => b.f - a.f)
  const out = [...floors]
  for (let k = 0; k < rem && k < frac.length; k++) out[frac[k].i] += 1
  return out
}

function roundMoney2(n) {
  return Math.round(n * 100) / 100
}

function extractGtinFromItemBlock(itemBlock) {
  const sid = itemBlock.match(
    /<cac:SellersItemIdentification>[\s\S]*?<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/,
  )
  if (sid) {
    const d = normalizeBarcode(sid[1])
    if (d.length >= 8) return d
  }
  const std = itemBlock.match(
    /<cac:StandardItemIdentification>[\s\S]*?<cbc:ID[^>]*>([^<]+)<\/cbc:ID>/,
  )
  if (std) {
    const d = normalizeBarcode(std[1])
    if (d.length >= 8) return d
  }
  return ''
}

/**
 * Líneas desde factura UBL 2.1 (DIAN) embebida o directa.
 * @returns {{ desc: string, qty: number, total: number, barcodeRaw: string, um: string }[]}
 */
export function parseUblInvoiceLineItems(innerInvoiceXml) {
  const items = []
  const parts = innerInvoiceXml.split(/<cac:InvoiceLine>/)
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i].split(/<\/cac:InvoiceLine>/)[0]
    const qtyM = seg.match(/<cbc:InvoicedQuantity[^>]*>([\d.]+)</)
    if (!qtyM) continue
    const qty = parseFloat(qtyM[1])
    if (!Number.isFinite(qty) || qty <= 0) continue

    let desc = ''
    const itemM = seg.match(/<cac:Item>([\s\S]*?)<\/cac:Item>/)
    const itemBlock = itemM ? itemM[1] : seg
    const descM = itemBlock.match(/<cbc:Description>([^<]*)<\/cbc:Description>/)
    if (descM) desc = String(descM[1]).trim()

    const lineTotal = ublLinePayableTotalCop(seg)
    if (lineTotal == null || lineTotal <= 0) continue

    const gtin = extractGtinFromItemBlock(itemBlock)
    items.push({
      desc: titleCaseDesc(desc),
      qty,
      um: 'ubl',
      unitPrice: 0,
      total: lineTotal,
      barcodeRaw: gtin,
    })
  }

  const target = parseUblTaxInclusiveCop(innerInvoiceXml)
  const rawTotals = items.map((it) => it.total)
  const sumRaw = rawTotals.reduce((a, b) => a + b, 0)
  if (target && sumRaw > 0 && Math.abs(target - sumRaw) >= 1) {
    const alloc = allocateLineTotalsCop(rawTotals, target)
    for (let j = 0; j < items.length; j++) items[j].total = alloc[j]
  }

  for (let j = 0; j < items.length; j++) {
    const it = items[j]
    it.unitPrice = Math.max(0.01, roundMoney2(it.total / it.qty))
  }

  let sumRound = items.reduce((a, it) => a + Math.round(it.unitPrice * it.qty), 0)
  const want = target ?? sumRound
  if (items.length > 0 && want !== sumRound) {
    const last = items[items.length - 1]
    const rest = items.slice(0, -1).reduce((a, it) => a + Math.round(it.unitPrice * it.qty), 0)
    last.unitPrice = Math.max(0.01, roundMoney2((want - rest) / last.qty))
    sumRound = items.reduce((a, it) => a + Math.round(it.unitPrice * it.qty), 0)
    if (sumRound !== want && items.length > 1) {
      const fix = want - sumRound
      last.unitPrice = Math.max(0.01, roundMoney2(last.unitPrice + fix / last.qty))
    }
  }

  return items
}

/** Contenedor DIAN: Invoice dentro de CDATA, o XML que ya es Invoice. */
export function extractEmbeddedInvoiceXml(fileText) {
  const cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g
  let m
  while ((m = cdataRe.exec(fileText)) !== null) {
    if (/<Invoice[\s>]/.test(m[1])) return m[1]
  }
  if (/<Invoice[\s>]/.test(fileText)) return fileText
  return null
}

function parseUblIssueDate(inner) {
  const m = inner.match(/<cbc:IssueDate>([^<]+)<\/cbc:IssueDate>/)
  return m ? m[1].trim() : null
}

function parseUblPayableAmountCop(inner) {
  return parseUblTaxInclusiveCop(inner)
}

/**
 * Texto del archivo XML electrónico → metadatos + ítems alineados con el parser PDF (Cañaveral).
 */
export function parseElectronicInvoiceXmlForBatch(xmlText) {
  const inner = extractEmbeddedInvoiceXml(xmlText)
  if (!inner) {
    return { items: [], date: null, invoiceTotal: null, error: 'No se encontró factura UBL (Invoice) en el XML.' }
  }
  const items = parseUblInvoiceLineItems(inner)
  if (items.length === 0) {
    return {
      items: [],
      date: null,
      invoiceTotal: null,
      error: 'El XML no contiene líneas de factura reconocibles (InvoiceLine).',
    }
  }
  return {
    items,
    date: parseUblIssueDate(inner),
    invoiceTotal: parseUblPayableAmountCop(inner),
    error: null,
  }
}

/**
 * Si no hubo match por código de barras, intenta por nombre normalizado (exacto).
 */
export function applyNameFallbackToBatchLines(lines, products) {
  const nameMap = buildNormNameToProductIdMap(products)
  return lines.map((line) => {
    if (line.productId) return line
    const desc = line.invoiceDesc || ''
    const nk = normKey(desc)
    const pid = nk && nameMap.has(nk) ? nameMap.get(nk) : ''
    return pid ? { ...line, productId: pid } : line
  })
}

export { buildBarcodeToProductIdMap }
