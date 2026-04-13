/**
 * Genera supabase/reload_purchases_d1_and_canal.sql = reset hogar + d1_barcodes_and_invoices + canal_invoices
 * Ejecutar tras actualizar los dos SQL generados:
 *   node scripts/build-reload-purchases-sql.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const HOUSEHOLD = '00000000-0000-0000-0000-000000000001'

const d1Path = path.join(ROOT, 'supabase', 'd1_barcodes_and_invoices.sql')
const canalPath = path.join(ROOT, 'supabase', 'canal_invoices.sql')
const outPath = path.join(ROOT, 'supabase', 'reload_purchases_d1_and_canal.sql')

/** Contenido entre la primera línea `begin;` y la primera `commit;` (excluidas ambas). */
function transactionBody(sql) {
  const lines = sql.split(/\r?\n/)
  const out = []
  let afterBegin = false
  for (const line of lines) {
    const t = line.trim().toLowerCase()
    if (!afterBegin) {
      if (t === 'begin;' || t === 'begin') afterBegin = true
      continue
    }
    if (t === 'commit;' || t === 'commit') break
    out.push(line)
  }
  return out.join('\n').replace(/^\n+/, '').replace(/\n+$/, '')
}

const d1body = transactionBody(fs.readFileSync(d1Path, 'utf8'))
const canalbody = transactionBody(fs.readFileSync(canalPath, 'utf8'))

const header = `-- =============================================================================
-- Recarga única: borra compras del hogar + D1 (barcodes + facturas) + Cañaveral
-- =============================================================================
-- Hogar (cambia el UUID si no usas la semilla beta):
--   ${HOUSEHOLD}
--
-- Regenerar este archivo cuando actualices los SQL generados:
--   node scripts/build-reload-purchases-sql.mjs
-- =============================================================================

begin;

delete from public.price_records where household_id = '${HOUSEHOLD}';
delete from public.invoices where household_id = '${HOUSEHOLD}';

-- === D1: barcodes EAN-13 + facturas + líneas ===

`

const combined = `${header}${d1body}

-- === Cañaveral: categorías/productos si faltan + facturas + líneas ===

${canalbody}

commit;
`

fs.writeFileSync(outPath, combined, 'utf8')
console.error(`Escrito: ${outPath}`)
