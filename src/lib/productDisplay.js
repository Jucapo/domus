import { ALL_UNITS_MAP, formatProductUnit } from '../data/units'

/** Misma clase que en Inventario: marca + contenido del empaque */
export const PRODUCT_META_CHIP_CLASS =
  'inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700'

export function buildProductMetaChips(product) {
  const chips = []
  if (product.brand) chips.push({ key: 'brand', label: product.brand })
  if (product.barcode) chips.push({ key: 'barcode', label: product.barcode })
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
