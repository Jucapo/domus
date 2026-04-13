/**
 * Parsea facturas D1 (PDFs extraídos de ZIPs DIAN) y genera:
 * 1. UPDATE barcodes (EAN-13) para productos existentes
 * 2. INSERT invoices + price_records para historial de compras
 *
 * Uso: node scripts/parse-d1-invoices.mjs
 * Resultado: supabase/d1_barcodes_and_invoices.sql
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HOUSEHOLD = '00000000-0000-0000-0000-000000000001'
const D1_DIR = path.join(ROOT, 'tmp-d1-invoices')

/** UUID fijos por número de factura (invoices.id es tipo uuid, no texto) */
const D1_INVOICE_UUID = {
  F1G0233095: 'f1b02330-9500-4000-8000-000000000001',
  F1G0234440: 'f1b02344-4000-4000-8000-000000000002',
  F1G0245612: 'f1b02456-1200-4000-8000-000000000003',
  F2G0214680: 'f2b02146-8000-4000-8000-000000000004',
  F2G0217086: 'f2b02170-8600-4000-8000-000000000005',
  G1F282905: 'a1b28290-5004-4000-8000-000000000006',
}

function parseMoney(s) {
  const digits = String(s).replace(/[.\s]/g, '').replace(',', '.')
  const n = parseFloat(digits)
  return Number.isFinite(n) ? Math.round(n) : 0
}

function normKey(desc) {
  return desc
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9*]+/g, ' ')
    .trim()
}

function buildProductKeyToIdMap() {
  const seedPath = path.join(ROOT, 'supabase', 'seed_invoices_from_pdfs.sql')
  const seedText = fs.readFileSync(seedPath, 'utf8')
  const map = new Map()
  const re = /\('(a1000001-0000-4000-8000-[0-9a-f]+)'.+?limit 1\),\s*'([^']+)'/g
  let m
  while ((m = re.exec(seedText)) !== null) {
    const key = normKey(m[2])
    if (!map.has(key)) map.set(key, m[1])
  }
  return map
}

/** Manual mapping for D1 EAN-13 barcodes to product IDs
 *  (D1 descriptions are truncated and don't match seed names) */
const D1_BARCODE_TO_PRODUCT = {
  '7700304648115': 'a1000001-0000-4000-8000-000000000001', // Toalla cocina triple
  '7700304568796': 'a1000001-0000-4000-8000-000000000002', // Cera autobrillante
  '7700304251087': 'a1000001-0000-4000-8000-000000000003', // Perlas de fragancia
  '7700304783755': 'a1000001-0000-4000-8000-000000000004', // Quitamanchas líquido
  '7700304755011': 'a1000001-0000-4000-8000-000000000005', // Detergente líquido
  '7700304507962': 'a1000001-0000-4000-8000-000000000006', // Suavizante Bonaropa
  '7700304178179': 'a1000001-0000-4000-8000-000000000007', // Desengrasante Brilla
  '7700304345373': 'a1000001-0000-4000-8000-000000000008', // Detergente para prendas
  '7700304716890': 'a1000001-0000-4000-8000-000000000009', // Servilleta de lujo
  '7700304018901': 'a1000001-0000-4000-8000-00000000000a', // Set esponja borrador
  '7700304528806': 'a1000001-0000-4000-8000-00000000000b', // Lavaplatos líquido
  '7708276719659': 'a1000001-0000-4000-8000-00000000000c', // Toalla desinfectante
  '7500435129947': 'a1000001-0000-4000-8000-00000000000d', // Desodorante hombre
  '7700304061921': 'a1000001-0000-4000-8000-00000000000e', // Pañuelo facial
  '7700304349944': 'a1000001-0000-4000-8000-00000000000f', // Jabón líquido Aveeno
  '7700304549979': 'a1000001-0000-4000-8000-000000000018', // Agua con gas maracuyá
  '7700304925797': 'a1000001-0000-4000-8000-000000000019', // Agua con gas limón
  '7700304230532': 'a1000001-0000-4000-8000-00000000001a', // Agua con gas limonada
  '7702004016614': 'a1000001-0000-4000-8000-00000000001b', // Cola y Pola
  '7700304095032': 'a1000001-0000-4000-8000-00000000001d', // Soda Izots
  '7702511003695': 'a1000001-0000-4000-8000-000000000021', // Arroz integral Diana
  '7700304808632': 'a1000001-0000-4000-8000-000000000022', // Penne Delizaire 500g
  '7700304570119': 'a1000001-0000-4000-8000-000000000023', // Salsa negra Zev
  '7700304395293': 'a1000001-0000-4000-8000-000000000024', // Lenteja El Estío 500g
  '7700304503100': 'a1000001-0000-4000-8000-000000000025', // Mezcla divertida Nut
  '7700304797981': 'a1000001-0000-4000-8000-000000000026', // Salsa de soya Zev
  '7700304002610': 'a1000001-0000-4000-8000-000000000028', // Aceite de oliva extra virgen
  '7700304004645': 'a1000001-0000-4000-8000-000000000028', // Aceite oliva (variant desc)
  '7702001158058': 'a1000001-0000-4000-8000-00000000002a', // Queso parmesano Alpina
  '7700304378074': 'a1000001-0000-4000-8000-00000000002b', // Crema de leche larga vida
  '7700304331321': 'a1000001-0000-4000-8000-000000000030', // Pan Arabe Backerei
  '7700304268009': 'a1000001-0000-4000-8000-000000000031', // Tortillas finas hierbas
  '7700304483266': 'a1000001-0000-4000-8000-000000000032', // Tortilla integral
  '7700304456659': 'a1000001-0000-4000-8000-000000000034', // Salchicha parrilla
  '7700304704507': 'a1000001-0000-4000-8000-000000000035', // Salchicha super perro
  '7701101356098': 'a1000001-0000-4000-8000-000000000036', // Jamón Pietran
  '7700304000449': 'a1000001-0000-4000-8000-000000000037', // Duopack atún en agua
  '7700304719808': 'a1000001-0000-4000-8000-000000000038', // Huevo de codorniz
  '91':             'a1000001-0000-4000-8000-00000000003e', // Brócoli
  '7700304761777': 'a1000001-0000-4000-8000-00000000003f', // Cebolla larga 500g
  '7700304332717': 'a1000001-0000-4000-8000-000000000040', // Uva verde sin semilla
  // D1 "MANGO VARIEDAD" (PLU 60): en muchas BD ya no existe ...041 (Mango genérico); usar MANGO GRUESO
  '60':             'a1000001-0000-4000-8000-00000000008e',
  '7700304525782': 'a1000001-0000-4000-8000-000000000005', // Detergente líquido (variant)
  '7700304410446': 'a1000001-0000-4000-8000-000000000006', // Suavizante (variant)
  // F1G0233095 y otras facturas (antes SKIP sin producto en semilla)
  '7702870476536': 'a1000001-0000-4000-8000-000000000190', // Sevedol extrafuerte
  '7700304484546': 'a1000001-0000-4000-8000-000000000191', // Quitamanchas blanca
  '7700304509980': 'a1000001-0000-4000-8000-000000000192', // Limpiavidrios Brilla
  '7708276719017': 'a1000001-0000-4000-8000-000000000193', // Detergente oxígeno activo A
  '7702425535497': 'a1000001-0000-4000-8000-000000000194', // Paño reutilizable Duet
  '7700304324538': 'a1000001-0000-4000-8000-000000000195', // Toallitas húmedas
  '7700304233939': 'a1000001-0000-4000-8000-000000000196', // Jabón espumoso antibacterial
  '7700304165636': 'a1000001-0000-4000-8000-000000000197', // Arveja verde congelada
  '7707166411857': 'a1000001-0000-4000-8000-000000000198', // Frijol Duba rojo 500g
  '7700304271665': 'a1000001-0000-4000-8000-000000000199', // Tomate cherry 250g
  '7709994411207': 'a1000001-0000-4000-8000-00000000019a', // Agua Inn limonada 1.7L
  '7700304934744': 'a1000001-0000-4000-8000-00000000019b', // Bolsa papelera Tidy
  '7708276719697': 'a1000001-0000-4000-8000-00000000019c', // Jabón de barra líquido
  '7700304058440': 'a1000001-0000-4000-8000-00000000019d', // Arroz económico Alba
  '7707110100370': 'a1000001-0000-4000-8000-00000000019e', // Champiñón 250g
}

/** Cabecera de ítem D1: nº línea + EAN/PLU (solo dígitos) + descripción */
function isD1ItemHeaderLine(line) {
  return /^\d{1,3}\s+(\d{6,}|\d{2,3})\s+/.test(line.trim())
}

/**
 * Último token numérico tipo importe COP en la línea (columna DTO / VR TOTAL al final del desglose).
 * Solo tokens que son solo dígitos/puntos/comas, para no mezclar códigos de barras.
 */
function lastMoneyAmountInLine(line) {
  const tokens = line.trim().split(/\s+/).filter((t) => /^[\d.,]+$/.test(t))
  if (!tokens.length) return null
  return parseMoney(tokens[tokens.length - 1])
}

/**
 * D1 (cabeceras en PDF): fila UND trae CANT y columnas tipo VR UNI / INC y VR BASE; el total que cuadra
 * con el pie de la factura es el de **VR TOTAL** (a veces tras DTO), en la línea siguiente al UND.
 * Ej. Cola: `12 UND 22.200,00 18.655,00` luego `… 1.680 23.880,00` → total línea = 23.880 (último importe).
 * Si no hay línea de desglose, se usa el primer importe del UND (suele coincidir con VR TOTAL en líneas sin IVA).
 */
function parseD1LineItems(text) {
  const items = []
  const lines = text.split(/\r?\n/).map(l => l.replace(/\t+/g, ' ').trim())

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]
    const itemMatch = line.match(/^(\d+)\s+(\d{2,16})\s+(.+)$/)
    if (!itemMatch) continue

    const barcode = itemMatch[2]
    const descRaw = itemMatch[3].trim()

    const undLine = lines[i + 1]
    const qtyMatch = undLine.match(/^(\d+)\s+UND\s+([\d.,]+)\s+([\d.,]+)/)
    if (!qtyMatch) continue

    const qty = parseInt(qtyMatch[1], 10)
    const afterUnd = lines[i + 2]
    const hasDesglose =
      afterUnd &&
      !isD1ItemHeaderLine(afterUnd) &&
      !/^(\d+)\s+UND\s/.test(afterUnd)

    const dtoVrTotal = hasDesglose ? lastMoneyAmountInLine(afterUnd) : null
    const totalLine =
      dtoVrTotal != null && dtoVrTotal > 0 ? dtoVrTotal : parseMoney(qtyMatch[2])

    if (qty <= 0 || totalLine <= 0) continue

    const unitPrice = Math.round(totalLine / qty)

    items.push({
      barcode,
      desc: descRaw.replace(/\s+/g, ' ').slice(0, 80),
      qty,
      unitPrice,
      total: totalLine,
    })
  }
  return items
}

function parseD1InvoiceNumber(text) {
  // The number appears after the last "N:" on the header line
  const matches = [...text.matchAll(/N:\s*([A-Z0-9]+[A-Z]\d+)/gi)]
  if (matches.length) return matches[matches.length - 1][1]
  // Fallback: look for pattern like G1F282905 or F1G0233095
  const m = text.match(/([A-Z]\d[A-Z]\d{6,}|[A-Z]\d[A-Z]\d{6,})/i)
  return m ? m[1] : null
}

function parseD1Date(text) {
  const m = text.match(/FECHA:\s*(\d{4}-\d{2}-\d{2})/i)
  return m ? m[1] : null
}

function parseD1Total(text) {
  // D1 PDFs show "TOTAL: NNN.NNN,NN NNN.NNN,NN" (duplicated)
  const allTotals = [...text.matchAll(/TOTAL:\s*([\d.,]+)/gi)]
  for (const m of allTotals.reverse()) {
    const v = parseMoney(m[1])
    if (v > 1000) return v
  }
  return null
}

function sqlStr(s) {
  return String(s).replace(/'/g, "''")
}

async function extractPdfText(filePath) {
  const { PDFParse } = await import('pdf-parse')
  const buf = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: buf })
  const { text } = await parser.getText()
  await parser.destroy()
  return text
}

async function main() {
  const folders = fs.readdirSync(D1_DIR).filter(f =>
    fs.statSync(path.join(D1_DIR, f)).isDirectory()
  )

  console.error(`D1 invoice folders: ${folders.length}`)

  const productKeyToId = buildProductKeyToIdMap()
  console.error(`Products in seed: ${productKeyToId.size}`)

  const allInvoices = []

  for (const folder of folders) {
    const pdfs = fs.readdirSync(path.join(D1_DIR, folder)).filter(f => f.endsWith('.pdf'))
    if (!pdfs.length) continue

    const pdfPath = path.join(D1_DIR, folder, pdfs[0])
    try {
      const text = await extractPdfText(pdfPath)
      const invoiceNum = parseD1InvoiceNumber(text)
      const date = parseD1Date(text)
      const total = parseD1Total(text)
      const items = parseD1LineItems(text)
      console.error(`  ${folder}: ${invoiceNum} ${date} total=${total} items=${items.length}`)
      allInvoices.push({ folder, invoiceNum, date, total, items })
    } catch (e) {
      console.error(`  ERROR ${folder}: ${e.message}`)
    }
  }

  /** barcode EAN → product description from D1 */
  const barcodeToDesc = new Map()
  /** barcode EAN → Set<productId> */
  const barcodeToProductId = new Map()

  for (const inv of allInvoices) {
    for (const it of inv.items) {
      if (!barcodeToDesc.has(it.barcode)) barcodeToDesc.set(it.barcode, it.desc)

      // Try manual map first, then normKey
      const manualPid = D1_BARCODE_TO_PRODUCT[it.barcode]
      const key = normKey(it.desc)
      const seedPid = productKeyToId.get(key)
      const pid = manualPid || seedPid

      if (pid && !barcodeToProductId.has(it.barcode)) {
        barcodeToProductId.set(it.barcode, pid)
      }
    }
  }

  console.error(`\nBarcodes matched to products: ${barcodeToProductId.size}`)
  console.error(`Barcodes total unique: ${barcodeToDesc.size}`)

  const lines = []
  lines.push('-- D1 invoices: barcodes EAN-13 + facturas + price_records')
  lines.push(`-- Generado: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('begin;')
  lines.push('')

  lines.push('-- === BARCODES EAN-13 ===')
  const sorted = [...barcodeToProductId.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  for (const [barcode, pid] of sorted) {
    // No pisar con PLU corto de balanza (ej. 60 mango, 91 brócoli); solo EAN largos
    if (/^\d+$/.test(barcode) && barcode.length < 8) continue
    lines.push(
      `UPDATE public.products SET barcode = '${barcode}' WHERE id = '${pid}' AND (barcode IS NULL OR barcode = '');`
    )
  }

  lines.push('')
  lines.push('-- === FACTURAS D1 ===')

  for (const inv of allInvoices) {
    if (!inv.date || !inv.invoiceNum) continue
    const invId = D1_INVOICE_UUID[inv.invoiceNum]
    if (!invId) {
      console.error(`  SKIP invoice (sin UUID fijo): ${inv.invoiceNum}`)
      continue
    }

    lines.push('')
    lines.push(`-- Factura D1 ${inv.invoiceNum} (${inv.date})`)
    lines.push(
      `INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('${invId}', '${HOUSEHOLD}', 'D1', '${inv.date}', ${inv.total || 'NULL'}) ON CONFLICT (id) DO NOTHING;`
    )

    lines.push('')
    lines.push(`-- Price records for ${inv.invoiceNum}`)
    for (const it of inv.items) {
      const manualPid = D1_BARCODE_TO_PRODUCT[it.barcode]
      const key = normKey(it.desc)
      const seedPid = productKeyToId.get(key)
      const pid = manualPid || seedPid
      if (!pid) {
        lines.push(`-- SKIP (no product match): ${it.desc} [${it.barcode}]`)
        continue
      }
      lines.push(
        `INSERT INTO public.price_records (product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('${pid}', '${HOUSEHOLD}', ${it.unitPrice}, ${it.qty}, 'D1', '${inv.date}', '${invId}');`
      )
    }
  }

  lines.push('')
  lines.push("-- === FIX MANGO GRUESO barcode ===")
  lines.push("UPDATE public.products SET barcode = '005168' WHERE id = 'a1000001-0000-4000-8000-00000000008e';")

  lines.push('')
  lines.push('commit;')

  const unmatched = []
  for (const inv of allInvoices) {
    for (const it of inv.items) {
      const key = normKey(it.desc)
      if (!productKeyToId.has(key) && !D1_BARCODE_TO_PRODUCT[it.barcode]) {
        unmatched.push(`${it.barcode} ${it.desc}`)
      }
    }
  }
  const uniqueUnmatched = [...new Set(unmatched)]
  if (uniqueUnmatched.length) {
    console.error(`\n--- Productos D1 sin match en seed (${uniqueUnmatched.length}) ---`)
    for (const u of uniqueUnmatched) console.error(`  ${u}`)
  }

  const outPath = path.join(ROOT, 'supabase', 'd1_barcodes_and_invoices.sql')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.error(`\nEscrito: ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
