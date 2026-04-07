import { ALL_UNITS_MAP, formatProductUnit } from '../data/units'

const CHIP_BASE =
  'inline-flex max-w-full items-center truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold'

/**
 * Color fijo por tipo de dato: marca, código de barras (COD:), cantidad/unidad del empaque.
 * @param {'brand' | 'barcode' | 'content' | string} key
 */
export function productMetaChipClassName(key) {
  switch (key) {
    case 'brand':
      return `${CHIP_BASE} border-amber-200/90 bg-amber-50 text-amber-900`
    case 'barcode':
      return `${CHIP_BASE} border-cyan-200/90 bg-cyan-50 text-cyan-900`
    case 'content':
      return `${CHIP_BASE} border-violet-200/90 bg-violet-50 text-violet-800`
    default:
      return `${CHIP_BASE} border-slate-200 bg-slate-50 text-slate-700`
  }
}

/** Unidad de venta (ej. Kilogramos): línea bajo el nombre; distinta a marca/COD/contenido. */
export const PRODUCT_DISPLAY_UNIT_CHIP_CLASS = `${CHIP_BASE} border-emerald-200/90 bg-emerald-50 text-emerald-800`

export function buildProductMetaChips(product) {
  const chips = []
  if (product.brand) chips.push({ key: 'brand', label: product.brand })
  if (product.barcode) {
    const bc = String(product.barcode).trim()
    if (bc) chips.push({ key: 'barcode', label: `COD: ${bc}` })
  }
  if (product.contentAmount && product.contentUnit) {
    const cu = ALL_UNITS_MAP[product.contentUnit]
    chips.push({
      key: 'content',
      label: `${product.contentAmount}${cu?.abbreviation || product.contentUnit}`,
    })
  }
  return chips
}

/** Segunda línea tipo Inventario: unidad de venta / empaque (sin repetir ml si ya va en chip) */
export function productUnitSummaryLine(product) {
  const du = ALL_UNITS_MAP[product.displayUnit]
  if (!du) return ''
  if (product.contentAmount && product.contentUnit) return du.label
  return formatProductUnit(product)
}
