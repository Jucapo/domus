export const BASE_UNITS = [
  { id: 'unit', label: 'Unidad', abbreviation: 'ud' },
  { id: 'g', label: 'Gramos', abbreviation: 'g' },
  { id: 'kg', label: 'Kilogramos', abbreviation: 'kg' },
  { id: 'lb', label: 'Libras', abbreviation: 'lb' },
  { id: 'ml', label: 'Mililitros', abbreviation: 'ml' },
  { id: 'l', label: 'Litros', abbreviation: 'L' },
]

export const PACKAGE_UNITS = [
  { id: 'bag', label: 'Bolsa', abbreviation: 'bolsa' },
  { id: 'bottle', label: 'Botella', abbreviation: 'bot' },
  { id: 'box', label: 'Caja', abbreviation: 'caja' },
  { id: 'can', label: 'Lata', abbreviation: 'lata' },
  { id: 'jar', label: 'Tarro', abbreviation: 'tarro' },
  { id: 'roll', label: 'Rollo', abbreviation: 'rollo' },
  { id: 'pack', label: 'Paquete', abbreviation: 'paq' },
  { id: 'dozen', label: 'Docena', abbreviation: 'doc' },
]

export const ALL_UNITS = [...BASE_UNITS, ...PACKAGE_UNITS]

const PACKAGE_IDS = new Set(PACKAGE_UNITS.map((u) => u.id))
export const isPackageUnit = (unitId) => PACKAGE_IDS.has(unitId)

export const ALL_UNITS_MAP = Object.fromEntries(ALL_UNITS.map((u) => [u.id, u]))

export function formatProductUnit(product) {
  const du = ALL_UNITS_MAP[product.displayUnit]
  if (!du) return ''
  if (product.contentAmount && product.contentUnit) {
    const cu = ALL_UNITS_MAP[product.contentUnit]
    return `${du.label} (${product.contentAmount}${cu?.abbreviation || product.contentUnit} c/u)`
  }
  return du.label
}

/**
 * Etiqueta del bloque "cantidad + unidad del contenido" cuando se vende por empaque.
 * P. ej. paquete → unidad(es) por paquete; botella → contenido por botella.
 */
export function packageContentRowLabel(displayUnitId) {
  switch (displayUnitId) {
    case 'pack':
      return 'Unidad(es) por paquete'
    case 'box':
      return 'Unidad(es) por caja'
    case 'bag':
      return 'Contenido por bolsa'
    case 'dozen':
      return 'Unidades por docena'
    case 'roll':
      return 'Contenido por rollo'
    default: {
      const du = ALL_UNITS_MAP[displayUnitId]
      if (!du) return 'Contenido por empaque'
      return `Contenido por ${du.label.toLowerCase()}`
    }
  }
}
