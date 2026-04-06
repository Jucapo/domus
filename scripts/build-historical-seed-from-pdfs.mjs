/**
 * Lee facturas PDF (formato SIESA / Cañaveral) y genera SQL de products + price_records.
 * Uso: node scripts/build-historical-seed-from-pdfs.mjs "C:\\Users\\juanp\\Downloads"
 */
import fs from 'fs'
import path from 'path'
import { PDFParse } from 'pdf-parse'

const HOUSEHOLD = '00000000-0000-0000-0000-000000000001'
const PRODUCT_PREFIX = 'a1000001-0000-4000-8000-000000000'

/** Primer ID libre tras ...04a (hex) */
let nextProductHex = 0x4b

function nextProductId() {
  const id = `${PRODUCT_PREFIX}${nextProductHex.toString(16).padStart(3, '0')}`
  nextProductHex += 1
  return id
}

/** Montos COP en factura (enteros; separadores miles . o ,) → entero */
function parseMoney(s) {
  const digits = String(s).replace(/\D/g, '')
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}

function parseFecha(text) {
  const m = text.match(/Fecha\s*:\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/i)
  if (!m) return null
  const y = m[1]
  const mo = m[2].padStart(2, '0')
  const d = m[3].padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function guessCategory(desc) {
  const u = desc.toUpperCase()
  if (
    /BROCOLI|LECHUGA|PAPA|TOMATE|CEBOLLA|ZANAHORIA|PIMENTON|ESPINACA|CILANTRO|PEPINO|AJO|CHOCLO|CALABACIN|CHAMPINON|ESPINACA|REMOLACHA|ARVEJA|HABICHUELA|BRÓCOLI/.test(
      u,
    )
  )
    return 'Verduras'
  if (
    /UVA|LIMON|AGUACATE|NARANJA|MELON|SANDIA|UCHUVA|FRESA|MANDARINA|PLATANO|MANGO|PAPAYA|CHOCLO DULCE|LULO|MARACUY|KIWI|PERA|MANZANA|BANANO/.test(
      u,
    )
  )
    return 'Frutas'
  if (/QUESO|YOGUR|LECHE|CREMA|MANTEQUILLA|BEBIDA LAC|MOZAREL|CREMOSINO/.test(u)) return 'Lácteos'
  if (
    /JAMON|SALCHICHA|TOCINETA|PECHUGA|PERNIL|ATUN|HUEVO|CHORIZO|CAMARON|PAN BIMBO|RANCHERA|MORTADELA|SALAMI|POLLO|RES |CERDO|COSTILLA|PESCADO/.test(
      u,
    )
  )
    return 'Proteínas'
  if (/CERVEZA|COLA Y POLA|COCA|BEBIDA|AGUA CON|SODA|GASEOSA|AGUILA|CORONA/.test(u)) return 'Bebidas'
  if (/ACEITE|OLIVA|SOYA|GIRASOL/.test(u)) return 'Aceites'
  if (/PAN |TORTILLA|HOJA TAMAL|AREPA|ALMOJABANA/.test(u)) return 'Panadería'
  if (/JABON|DETERGENTE|CLORO|DESINFECT|LIMPIA|BOLSA FLEUR|P.H FAMILIA|TOALLA DES|PAPEL|SUAVIZANTE|LAVAPLATOS/.test(u))
    return 'Aseo hogar'
  if (/DENTAL|ENJUAGUE|MAQUINILLA|DESODORANTE|CREMA DENTAL|JABON PALM|PLAX|ORAL|COLGATE|PROTEX|GILLETTE/.test(u))
    return 'Cuidado personal'
  return 'Alacena'
}

function guessDisplayUnit(um) {
  const x = (um || '').toLowerCase()
  if (x === 'kg') return 'kg'
  if (x === 'und' || x === 'un') return 'unit'
  return 'unit'
}

function titleCaseDesc(s) {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= 80) return t
  return t.slice(0, 77) + '...'
}

function parseLineItems(text) {
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
    const desc = titleCaseDesc(dm[2])
    const qty = parseFloat(bm[2], 10)
    const um = bm[3]
    const unitPriceRaw = parseMoney(bm[4])
    const total = parseMoney(bm[5])
    if (!desc || Number.isNaN(qty) || qty <= 0 || total <= 0) continue
    // Precio unitario (× kg, × ud, etc.); si difiere del total/cantidad, preferir total/cantidad
    let unitPrice = unitPriceRaw
    const implied = Math.round(total / qty)
    if (unitPrice <= 0) {
      unitPrice = implied
    } else if (implied > 0 && Math.abs(unitPrice - implied) / implied > 0.12) {
      unitPrice = implied
    }
    if (unitPrice <= 0) continue
    items.push({ desc, qty, um, unitPrice, total })
    i += 1
  }
  return items
}

function sqlStr(s) {
  return String(s).replace(/'/g, "''")
}

async function parsePdf(filePath) {
  const buf = fs.readFileSync(filePath)
  const parser = new PDFParse({ data: buf })
  const { text } = await parser.getText()
  await parser.destroy()
  const date = parseFecha(text)
  const store = /CAÑAVERAL/i.test(text) ? 'Cañaveral' : 'Otro'
  const items = parseLineItems(text)
  return { filePath, date, store, items, text }
}

async function main() {
  const dir = process.argv[2] || path.join(process.env.USERPROFILE || '', 'Downloads')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('f-') && f.endsWith('.pdf'))
    .map((f) => path.join(dir, f))
    .sort()

  console.error(`Encontrados ${files.length} PDFs en ${dir}`)

  const allRows = []
  for (const f of files) {
    try {
      const r = await parsePdf(f)
      if (!r.date) console.error('Sin fecha:', f)
      if (r.items.length === 0) console.error('Sin ítems:', f)
      allRows.push(r)
    } catch (e) {
      console.error('Error', f, e.message)
    }
  }

  /** Mapa descripción normalizada -> product_id */
  const productByKey = new Map()
  /** product_id -> { desc, category } */
  const productMeta = new Map()

  const priceRows = []

  function normKey(desc) {
    return desc
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^A-Z0-9*]+/g, ' ')
      .trim()
  }

  for (const inv of allRows) {
    if (!inv.date) continue
    const store = inv.store === 'Otro' ? 'Cañaveral' : inv.store
    for (const it of inv.items) {
      const key = normKey(it.desc)
      let pid = productByKey.get(key)
      if (!pid) {
        pid = nextProductId()
        productByKey.set(key, pid)
        productMeta.set(pid, {
          desc: it.desc,
          category: guessCategory(it.desc),
          displayUnit: guessDisplayUnit(it.um),
        })
      }
      const q = Math.round(it.qty * 10000) / 10000
      priceRows.push({
        productId: pid,
        price: it.unitPrice,
        quantity: q > 0 ? q : 1,
        store,
        date: inv.date,
      })
    }
  }

  const productIds = [...productMeta.keys()]
  const lines = []
  lines.push('-- Generado por scripts/build-historical-seed-from-pdfs.mjs — facturas Cañaveral históricas')
  lines.push(`-- Productos nuevos: ${productIds.length} | Registros de precio: ${priceRows.length}`)
  lines.push('')
  lines.push('insert into public.products (id, household_id, category_id, name, quantity, display_unit, content_amount, content_unit, brand, notes, visible_in_inventory) values')

  const pchunks = productIds.map((pid, idx) => {
    const m = productMeta.get(pid)
    const cat = sqlStr(m.category)
    const name = sqlStr(m.desc)
    const du = sqlStr(m.displayUnit)
    const comma = idx < productIds.length - 1 ? ',' : ''
    return `('${pid}', '${HOUSEHOLD}', (select id from public.categories where household_id = '${HOUSEHOLD}' and name = '${cat}' limit 1), '${name}', 0, '${du}', null, null, '', 'Importado factura PDF', true)${comma}`
  })
  lines.push(...pchunks)
  lines.push(';')
  lines.push('')
  lines.push('insert into public.price_records (product_id, household_id, price, quantity, store, recorded_date) values')

  const prLines = priceRows.map(
    (r, idx) =>
      `('${r.productId}', '${HOUSEHOLD}', ${r.price}, ${r.quantity}, '${sqlStr(r.store)}', '${r.date}')${idx < priceRows.length - 1 ? ',' : ''}`,
  )
  lines.push(...prLines)
  lines.push(';')

  const out = path.join(process.cwd(), 'supabase', 'seed_invoices_historical_from_pdfs.sql')
  fs.writeFileSync(out, lines.join('\n'), 'utf8')
  console.error('Escrito:', out)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
