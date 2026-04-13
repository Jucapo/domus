/**
 * Lee PDFs de facturas Cañaveral (carpeta tmp-canal-invoices o ruta argv)
 * y genera INSERT en invoices + price_records con invoice_id.
 *
 * Si junto al PDF existe el XML electrónico (mismo nombre .xml, ej. fv....xml con
 * factura UBL embebida), las líneas se toman de ahí: el PDF a veces no refleja bien
 * ítems con descuento (p. ej. Gillette) y la suma no cuadraba con el total DIAN.
 *
 * Por defecto: período de gastos "Abril" = del 27 del mes anterior al 26 del mes nominal
 *   (ej. Abril 2026 → 2026-03-27 .. 2026-04-26), no el mes calendario.
 *
 * Uso:
 *   node scripts/parse-canal-invoices-to-sql.mjs
 *   node scripts/parse-canal-invoices-to-sql.mjs 2026 4
 *   node scripts/parse-canal-invoices-to-sql.mjs all
 *
 * Salida: supabase/canal_invoices.sql
 */
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HOUSEHOLD = '00000000-0000-0000-0000-000000000001'
const DEFAULT_SCAN = path.join(ROOT, 'tmp-canal-invoices')

function parseMoney(s) {
  const digits = String(s).replace(/\D/g, '')
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}

/** Alineado con factura Cañaveral: quitar * para matchear seed sin asteriscos */
function normKey(desc) {
  return String(desc)
    .replace(/\*/g, ' ')
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCaseDesc(s) {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= 80) return t
  return `${t.slice(0, 77)}...`
}

function parseCanalDate(text) {
  const m = text.match(/Fecha\s*:\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/i)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}

function parseCanalInvoiceRef(text) {
  const m = text.match(/VENTA:\s*([^\s\n]+)/i)
  return m ? m[1].trim() : null
}

function parseCanalTotal(text) {
  const m = text.match(/T\s+O\s+T\s+A\s+L\s+[\s.$]*\$?\s*([\d.,]+)/i)
  if (m) {
    const n = parseMoney(m[1])
    if (n > 0) return n
  }
  const m2 = text.match(/VALOR\s+A\s+PAGAR[^\d]*([\d.,]+)/i)
  if (m2) {
    const n = parseMoney(m2[1])
    if (n > 0) return n
  }
  return null
}

/** Línea B: código numérico o basura (ej. mango); cant UM precio total */
function parseLineB(b) {
  const bClean = b.replace(/\*+$/g, '').trim()
  let bm = bClean.match(
    /^\s*(\d+)\s+([\d.]+)\s+(\S+)\s+([\d.,]+)\s+([\d.,]+)(?:\s*D)?\s*$/,
  )
  if (bm) {
    return {
      barcodeRaw: bm[1],
      qty: parseFloat(bm[2]),
      um: bm[3],
      unitPriceRaw: parseMoney(bm[4]),
      total: parseMoney(bm[5]),
    }
  }
  bm = bClean.match(
    /^\s*\S+\s+([\d.]+)\s+(\S+)\s+([\d.,]+)\s+([\d.,]+)(?:\s*D)?\s*$/,
  )
  if (bm) {
    return {
      barcodeRaw: '',
      qty: parseFloat(bm[1]),
      um: bm[2],
      unitPriceRaw: parseMoney(bm[3]),
      total: parseMoney(bm[4]),
    }
  }
  return null
}

function parseCanalLineItems(text) {
  const items = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i]
    const b = lines[i + 1]
    const dm = a.match(/^\s*(\d+)\s+(.+)$/)
    if (!dm) continue
    const parsed = parseLineB(b)
    if (!parsed) continue
    const { barcodeRaw, qty, um, unitPriceRaw, total } = parsed
    const desc = titleCaseDesc(dm[2])
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

/**
 * Total COP por línea UBL: LineExtension + IVA de esa línea.
 * No sumar todos los cbc:TaxAmount del segmento: en DIAN el TaxSubtotal repite el mismo monto
 * y antes contábamos el IVA dos veces (suma de líneas >> PayableAmount).
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

/** Reparte COP enteros para que la suma de líneas coincida con TaxInclusive (IVA a nivel documento). */
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

/**
 * Factura UBL 2.1 (DIAN): una línea por <cac:InvoiceLine>.
 */
function parseUblInvoiceLineItems(innerInvoiceXml) {
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

    items.push({
      desc: titleCaseDesc(desc),
      qty,
      um: 'ubl',
      unitPrice: 0,
      total: lineTotal,
      barcodeRaw: '',
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

/** Contenedor DIAN: Invoice dentro de CDATA, o archivo que ya es Invoice. */
function extractEmbeddedInvoiceXml(fileText) {
  const cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g
  let m
  while ((m = cdataRe.exec(fileText)) !== null) {
    if (/<Invoice[\s>]/.test(m[1])) return m[1]
  }
  if (/<Invoice[\s>]/.test(fileText)) return fileText
  return null
}

function companionUblXmlPath(pdfPath) {
  const sameName = pdfPath.replace(/\.pdf$/i, '.xml')
  if (fs.existsSync(sameName)) return sameName
  return null
}

function readLineItemsForPdf(pdfPath, pdfText) {
  const xmlPath = companionUblXmlPath(pdfPath)
  if (xmlPath) {
    try {
      const raw = fs.readFileSync(xmlPath, 'utf8')
      const inner = extractEmbeddedInvoiceXml(raw)
      if (inner) {
        const fromXml = parseUblInvoiceLineItems(inner)
        if (fromXml.length > 0) {
          const ublTotal = parseUblTaxInclusiveCop(inner)
          console.error(`  líneas UBL (${fromXml.length}): ${path.basename(xmlPath)}`)
          return { items: fromXml, ublInvoiceTotalCop: ublTotal }
        }
      }
    } catch (e) {
      console.error(`  XML ${path.basename(xmlPath)}: ${e.message} → uso PDF`)
    }
  }
  return { items: parseCanalLineItems(pdfText), ublInvoiceTotalCop: null }
}

function readSeedText() {
  const seedPath = path.join(ROOT, 'supabase', 'seed_invoices_from_pdfs.sql')
  return fs.readFileSync(seedPath, 'utf8')
}

function buildProductKeyToIdMap(seedText) {
  const map = new Map()
  const re = /\('(a1000001-0000-4000-8000-[0-9a-f]+)'.+?limit 1\),\s*'([^']+)'/g
  let m
  while ((m = re.exec(seedText)) !== null) {
    const key = normKey(m[2])
    if (!map.has(key)) map.set(key, m[1])
  }
  return map
}

/**
 * Filas `insert into products ... values` del seed (tienen subselect de categoría).
 */
function parseProductValueTuplesById(seedText) {
  const map = new Map()
  for (const line of seedText.split('\n')) {
    const t = line.trim()
    if (!t.includes('(select id from public.categories')) continue
    const m = t.match(/^\('(a1000001-0000-4000-8000-[0-9a-f]+)'/)
    if (!m) continue
    const tuple = t.replace(/,\s*$/, '').replace(/;\s*$/, '')
    map.set(m[1], tuple)
  }
  return map
}

function categoryNameFromProductTuple(tupleLine) {
  const cm = tupleLine.match(/and name = '([^']+)' limit 1/)
  return cm ? cm[1] : null
}

/** INSERT idempotente: categorías + productos usados en este archivo (DB sin semilla PDF al día). */
function buildEnsureReferencedProductsSql(usedIds, seedText) {
  const tupleById = parseProductValueTuplesById(seedText)
  const categories = new Set()
  const tuples = []
  for (const id of usedIds) {
    const tuple = tupleById.get(id)
    if (!tuple) {
      console.error(`  Aviso: producto ${id} no está en seed_invoices_from_pdfs.sql (ensure omitido)`)
      continue
    }
    const cat = categoryNameFromProductTuple(tuple)
    if (cat) categories.add(cat)
    tuples.push(tuple)
  }
  if (!tuples.length) return []

  const out = []
  out.push(
    '-- Asegurar categorías y productos referenciados (ON CONFLICT no-op) por si falta la última semilla PDF',
  )
  for (const name of [...categories].sort()) {
    out.push(`insert into public.categories (household_id, name)`)
    out.push(`select '${HOUSEHOLD}', '${sqlStr(name)}'`)
    out.push(`where not exists (`)
    out.push(`  select 1 from public.categories c`)
    out.push(`  where c.household_id = '${HOUSEHOLD}'`)
    out.push(`    and c.name = '${sqlStr(name)}'`)
    out.push(`);`)
    out.push('')
  }
  out.push(
    'insert into public.products (id, household_id, category_id, name, quantity, display_unit, content_amount, content_unit, brand, notes, visible_in_inventory) values',
  )
  out.push(tuples.map((t) => `  ${t}`).join(',\n'))
  out.push('on conflict (id) do nothing;')
  out.push('')
  return out
}

/** Texto factura ≠ nombre en seed (Cañaveral vs app) */
function manualProductId(desc) {
  const k = normKey(desc)
  if (k.includes('PAPA') && k.includes('2500') && (k.includes('LISTO') || k.includes('PARDA')))
    return 'a1000001-0000-4000-8000-000000000047'
  if (k.includes('COLGATE') && k.includes('SENSITIVE') && k.includes('73ML'))
    return 'a1000001-0000-4000-8000-000000000017'
  // UBL dice MAQUINA; seed dice Maquinilla
  if (k.includes('GILLETTE') && k.includes('VENUS')) {
    if (k.includes('REPUESTO')) {
      if (k.includes('MACH3')) return 'a1000001-0000-4000-8000-000000000016'
      return 'a1000001-0000-4000-8000-000000000013'
    }
    if (k.includes('MAQUINA') || k.includes('MAQUIN')) return 'a1000001-0000-4000-8000-000000000012'
  }
  if (k.includes('MACH3') && k.includes('REPUESTO')) return 'a1000001-0000-4000-8000-000000000016'
  // UBL texto completo; seed a veces truncado (NATU/SE vs NATU/SECR, L vs LATA)
  if (k.includes('JABON') && k.includes('PALM') && k.includes('PITAHAYA'))
    return 'a1000001-0000-4000-8000-000000000086'
  if (k.includes('CERVEZA') && k.includes('CLUB') && k.includes('COLOMBIA') && k.includes('DRDA'))
    return 'a1000001-0000-4000-8000-00000000008b'
  return null
}

function uuidFromInvoiceRef(ref) {
  const h = crypto.createHash('sha256').update(`canal|${ref}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(12, 15)}-8${h.slice(15, 18)}-${h.slice(18, 30)}`
}

/** Id estable por línea: re-ejecutar el mismo SQL no duplica filas (ON CONFLICT DO NOTHING). */
function uuidFromCanalPriceLine(ref, itemIndex, productId, unitPrice, qty) {
  const h = crypto
    .createHash('sha256')
    .update(`canal-line|${ref}|${itemIndex}|${productId}|${unitPrice}|${qty}`)
    .digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(12, 15)}-8${h.slice(15, 18)}-${h.slice(18, 30)}`
}

function sqlStr(s) {
  return String(s).replace(/'/g, "''")
}

function collectPdfs(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...collectPdfs(full))
    else if (name.toLowerCase().endsWith('.pdf')) out.push(full)
  }
  return out.sort()
}

async function extractPdfText(filePath) {
  const { PDFParse } = await import('pdf-parse')
  const buf = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: buf })
  const { text } = await parser.getText()
  await parser.destroy()
  return text
}

/**
 * Período de gastos nominal (ej. "Abril"): 27 mes anterior → 26 mes nominal (mismo año civil del mes nominal).
 * Abril Y → Y-03-27 .. Y-04-26 | Enero Y → (Y-1)-12-27 .. Y-01-26
 */
function gastoPeriodBounds(year, monthNominal) {
  if (monthNominal === 1) {
    return { start: `${year - 1}-12-27`, end: `${year}-01-26` }
  }
  const prev = monthNominal - 1
  return {
    start: `${year}-${String(prev).padStart(2, '0')}-27`,
    end: `${year}-${String(monthNominal).padStart(2, '0')}-26`,
  }
}

function inGastoPeriod(isoDate, start, end) {
  if (!isoDate) return false
  return isoDate >= start && isoDate <= end
}

async function main() {
  const scanDir = process.argv.find((a) => a.startsWith('--dir='))?.slice(6) || DEFAULT_SCAN

  let filterAll = false
  let year = 2026
  let monthNominal = 4
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--dir='))
  if (args[0] === 'all') {
    filterAll = true
  } else if (args[0] && args[1]) {
    year = parseInt(args[0], 10)
    monthNominal = parseInt(args[1], 10)
  }

  const period = filterAll ? null : gastoPeriodBounds(year, monthNominal)

  const pdfs = collectPdfs(scanDir)
  console.error(`PDFs Cañaveral: ${pdfs.length} en ${scanDir}`)
  if (!pdfs.length) {
    console.error('No hay PDFs. Extrae los ZIP en tmp-canal-invoices o pasa --dir=ruta')
    process.exit(1)
  }

  const seedText = readSeedText()
  const productKeyToId = buildProductKeyToIdMap(seedText)
  console.error(`Productos en seed: ${productKeyToId.size}`)

  const invoices = []
  for (const fp of pdfs) {
    try {
      const text = await extractPdfText(fp)
      if (!/CAÑAVERAL|CANAVERAL/i.test(text)) {
        console.error(`  skip (no Cañaveral): ${path.basename(fp)}`)
        continue
      }
      const date = parseCanalDate(text)
      const ref = parseCanalInvoiceRef(text)
      const pdfTotal = parseCanalTotal(text)
      const { items, ublInvoiceTotalCop } = readLineItemsForPdf(fp, text)
      const total = ublInvoiceTotalCop ?? pdfTotal
      if (!date || !ref) {
        console.error(`  skip (sin fecha/ref): ${path.basename(fp)}`)
        continue
      }
      if (!filterAll && !inGastoPeriod(date, period.start, period.end)) {
        console.error(`  skip (fuera de gastos ${period.start}..${period.end}): ${ref} ${date}`)
        continue
      }
      console.error(`  OK ${ref} ${date} items=${items.length} total=${total}`)
      invoices.push({ file: fp, ref, date, total, items })
    } catch (e) {
      console.error(`  ERROR ${path.basename(fp)}: ${e.message}`)
    }
  }

  invoices.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref))

  const lines = []
  lines.push('-- Facturas Cañaveral → invoices + price_records (invoice_id)')
  lines.push('-- Cada línea lleva id determinista + ON CONFLICT DO NOTHING (puedes re-ejecutar sin duplicar).')
  lines.push(`-- Generado: ${new Date().toISOString()}`)
  lines.push(
    filterAll
      ? '-- Filtro: todas las facturas en carpeta'
      : `-- Período gastos mes nominal ${year}-${String(monthNominal).padStart(2, '0')}: ${period.start} .. ${period.end}`,
  )
  lines.push('')
  lines.push('begin;')
  lines.push('')

  let skipItems = 0
  let insertItems = 0
  const usedProductIds = new Set()
  const invoiceBlocks = []

  for (const inv of invoices) {
    const invId = uuidFromInvoiceRef(inv.ref)
    const bl = []
    bl.push(`-- ${inv.ref} (${inv.date}) ${path.basename(inv.file)}`)
    bl.push(
      `INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('${invId}', '${HOUSEHOLD}', 'Cañaveral', '${inv.date}', ${inv.total ?? 'NULL'}) ON CONFLICT (id) DO NOTHING;`,
    )
    bl.push('')
    for (let itemIdx = 0; itemIdx < inv.items.length; itemIdx++) {
      const it = inv.items[itemIdx]
      const pid = manualProductId(it.desc) || productKeyToId.get(normKey(it.desc))
      if (!pid) {
        bl.push(`-- SKIP (sin producto): ${sqlStr(it.desc)}`)
        skipItems++
        continue
      }
      usedProductIds.add(pid)
      const q = Math.round(it.qty * 10000) / 10000
      const lineId = uuidFromCanalPriceLine(inv.ref, itemIdx, pid, it.unitPrice, q)
      bl.push(
        `INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('${lineId}', '${pid}', '${HOUSEHOLD}', ${it.unitPrice}, ${q}, 'Cañaveral', '${inv.date}', '${invId}') ON CONFLICT (id) DO NOTHING;`,
      )
      insertItems++
    }
    invoiceBlocks.push(bl.join('\n'))
  }

  lines.push(...buildEnsureReferencedProductsSql(usedProductIds, seedText))
  for (const block of invoiceBlocks) {
    lines.push(block)
    lines.push('')
  }

  lines.push('commit;')

  const outPath = path.join(ROOT, 'supabase', 'canal_invoices.sql')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.error(`\nEscrito: ${outPath}`)
  console.error(`Facturas: ${invoices.length} | líneas insertadas: ${insertItems} | sin match: ${skipItems}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
