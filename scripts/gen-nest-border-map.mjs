import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(__dirname, '../src/data/category_styles.js'), 'utf8')
const colorBlock = src.slice(
  src.indexOf('export const CATEGORY_COLOR_OPTIONS'),
  src.indexOf('export const CATEGORY_ICON_MAP'),
)
const colorIds = [...colorBlock.matchAll(/\{ id: '([^']+)', className:/g)].map((m) => m[1])

function hueFromId(id) {
  return id.replace(/-(50|100|200|300)$/, '')
}

const lines = colorIds.map((id) => {
  const hue = hueFromId(id)
  return `  '${id}': 'border-l-4 border-l-${hue}-500',`
})

const out = `export const CATEGORY_COLOR_PRODUCT_ACCENT_MAP = Object.freeze({\n${lines.join('\n')}\n})\n`
fs.writeFileSync(path.join(__dirname, '../src/data/_nest_border_map.txt'), out)
console.log('count', colorIds.length)
