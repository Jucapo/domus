/**
 * Re-parsea facturas PDF para extraer barcode → descripción,
 * cruza con los product_ids del seed y genera UPDATE SQL.
 *
 * Uso: node scripts/extract-barcodes-from-pdfs.mjs ["C:\\ruta\\a\\pdfs"]
 * Resultado: supabase/update_barcodes.sql
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const PRODUCT_PREFIX = 'a1000001-0000-4000-8000-000000000'

function normKey(desc) {
  return desc
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9*]+/g, ' ')
    .trim()
}

function titleCaseDesc(s) {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= 80) return t
  return t.slice(0, 77) + '...'
}

function parseLineItemsWithBarcode(text) {
  const items = []
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
    const barcode = bm[1]
    const desc = titleCaseDesc(dm[2])
    const qty = parseFloat(bm[2], 10)
    const total = parseInt(String(bm[5]).replace(/\D/g, ''), 10)
    if (!desc || Number.isNaN(qty) || qty <= 0 || total <= 0) continue
    items.push({ barcode, desc })
    i += 1
  }
  return items
}

function buildProductKeyToIdMap() {
  const seedPath = path.join(ROOT, 'supabase', 'seed_invoices_from_pdfs.sql')
  const seedText = fs.readFileSync(seedPath, 'utf8')

  const map = new Map()
  // Match product ID then skip to "limit 1)," and capture the name after it
  const re = /\('(a1000001-0000-4000-8000-[0-9a-f]+)'.+?limit 1\),\s*'([^']+)'/g
  let m
  while ((m = re.exec(seedText)) !== null) {
    const id = m[1]
    const name = m[2]
    const key = normKey(name)
    if (!map.has(key)) {
      map.set(key, id)
    }
  }
  console.error(`  Regex matches: ${map.size} unique keys`)
  return map
}

async function extractTextFromPdf(filePath) {
  const { PDFParse } = await import('pdf-parse')
  const buf = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: buf })
  const { text } = await parser.getText()
  await parser.destroy()
  return text
}

async function main() {
  const dir = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Downloads')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('f-') && f.endsWith('.pdf'))
    .map((f) => path.join(dir, f))
    .sort()

  console.error(`Encontrados ${files.length} PDFs en ${dir}`)

  const productKeyToId = buildProductKeyToIdMap()
  console.error(`Productos en seed: ${productKeyToId.size}`)

  /** barcode → Set<productId> */
  const barcodeToIds = new Map()
  /** productId → Set<barcode> */
  const idToBarcodes = new Map()

  let parsed = 0
  for (const f of files) {
    try {
      const text = await extractTextFromPdf(f)
      const items = parseLineItemsWithBarcode(text)
      for (const it of items) {
        const key = normKey(it.desc)
        const pid = productKeyToId.get(key)
        if (!pid) continue

        if (!barcodeToIds.has(it.barcode)) barcodeToIds.set(it.barcode, new Set())
        barcodeToIds.get(it.barcode).add(pid)

        if (!idToBarcodes.has(pid)) idToBarcodes.set(pid, new Set())
        idToBarcodes.get(pid).add(it.barcode)
      }
      parsed++
    } catch (e) {
      console.error('Error', path.basename(f), e.message)
    }
  }

  console.error(`PDFs parseados: ${parsed}`)
  console.error(`Productos con barcode: ${idToBarcodes.size}`)

  const lines = []
  lines.push('-- Barcodes extraídos de facturas PDF Cañaveral')
  lines.push(`-- Generado: ${new Date().toISOString()}`)
  lines.push(`-- Productos con barcode: ${idToBarcodes.size}`)
  lines.push('')
  lines.push('begin;')
  lines.push('')

  const sorted = [...idToBarcodes.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  for (const [pid, barcodes] of sorted) {
    const barcodesArr = [...barcodes].sort()
    const primary = barcodesArr[0]
    const comment = barcodesArr.length > 1
      ? ` -- also seen: ${barcodesArr.slice(1).join(', ')}`
      : ''
    lines.push(
      `UPDATE public.products SET barcode = '${primary}' WHERE id = '${pid}' AND (barcode IS NULL OR barcode = '');${comment}`,
    )
  }

  lines.push('')
  lines.push('commit;')

  const outPath = path.join(ROOT, 'supabase', 'update_barcodes.sql')
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.error(`\nEscrito: ${outPath}`)

  console.error('\n--- Resumen de barcodes ambiguos (mismo barcode → multiples productos) ---')
  for (const [bc, ids] of barcodeToIds) {
    if (ids.size > 1) {
      console.error(`  Barcode ${bc} → ${[...ids].join(', ')}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
