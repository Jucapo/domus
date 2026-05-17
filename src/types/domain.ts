/**
 * Tipos de dominio de Domus.
 *
 * Forma camelCase tal como la usan los stores Zustand y la UI (después de mapRow).
 * Para los tipos snake_case del schema SQL ver `./supabase.ts` (autogenerado).
 */

export type UUID = string
export type ISODateString = string // 'YYYY-MM-DD'
export type ISOTimestampString = string // 'YYYY-MM-DDTHH:mm:ss.sssZ'

// ============================================================================
// Households / Profiles
// ============================================================================

export interface Household {
  id: UUID
  name: string
}

export interface Profile {
  id: UUID
  name: string
  email: string
  currentHouseholdId: UUID
}

// ============================================================================
// Categories
// ============================================================================

export type CategoryColor =
  | 'indigo'
  | 'slate'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'orange'
  | 'teal'
  | 'pink'
  | 'lime'
  | 'cyan'
  | 'fuchsia'
  | (string & {})

export interface Category {
  id: UUID
  householdId: UUID
  name: string
  icon: string
  color: CategoryColor
}

// ============================================================================
// Products
// ============================================================================

/** Cómo se vende el producto. Ver src/data/units.js (BASE_UNITS, PACKAGE_UNITS). */
export type DisplayUnit =
  | 'unit'
  | 'kg'
  | 'g'
  | 'l'
  | 'ml'
  | 'pack'
  | 'box'
  | 'bag'
  | 'panal'
  | 'docena'
  | (string & {})

export interface Product {
  id: UUID
  householdId: UUID
  categoryId: UUID | null
  /** Nombre denormalizado de la categoría (viene del join). */
  category: string
  name: string
  /** Stock entero. Las compras se redondean al sumar/restar. */
  quantity: number
  displayUnit: DisplayUnit
  /** Tamaño del empaque (ej. 500 para "500ml"). */
  contentAmount: number | null
  /** Unidad del contenido del empaque. */
  contentUnit: string | null
  inShoppingList: boolean
  pendingRegistration: boolean
  visibleInInventory: boolean
  brand: string
  imageUrl: string
  notes: string
  /** Producto base al que este producto suma stock (para empaques). */
  linkedProductId: UUID | null
  /** Cuántas unidades del producto base equivale comprar 1 de este (ej. 6 yogures por paquete). */
  linkedUnitsPerPackage: number | null
  /** Código de barras EAN/UPC. Vacío si no tiene. */
  barcode: string
}

// ============================================================================
// Invoices
// ============================================================================

export interface Invoice {
  id: UUID
  householdId: UUID
  store: string
  invoiceDate: ISODateString
  /** Total declarado en la factura. Puede no coincidir con suma de líneas (mismatch). */
  totalCop: number | null
  createdAt: ISOTimestampString
  lines: InvoiceLine[]
}

/** Línea de una factura — proyección de un price_record dentro de la factura. */
export interface InvoiceLine {
  id: UUID
  productId: UUID
  price: number
  quantity: number
  store: string
  date: ISODateString
  forThirdParty: boolean
}

// ============================================================================
// Price Records
// ============================================================================

export interface PriceRecord {
  id: UUID
  productId: UUID
  householdId: UUID
  /** Precio unitario en COP. */
  price: number
  quantity: number
  store: string
  date: ISODateString
  invoiceId: UUID | null
  forThirdParty: boolean
}

// ============================================================================
// Importación de facturas (parsers PDF/XML)
// ============================================================================

export interface ParsedInvoiceItem {
  desc: string
  qty: number
  /** Unidad de medida tal como viene en la factura (ej. "UND", "KG", "ubl"). */
  um: string
  /** Precio unitario en COP (puede ser 0 si solo tenemos el total). */
  unitPrice: number
  /** Total de la línea en COP. */
  total: number
  /** Código de barras tal como vino (sin normalizar). */
  barcodeRaw: string
}

export interface ParsedInvoicePayload {
  items: ParsedInvoiceItem[]
  date: ISODateString | null
  invoiceTotal: number | null
  storeGuess?: string
  error?: string | null
}

/** Línea del formulario de "Registrar factura" — antes de persistir. */
export interface BatchLine {
  id: string
  productId: UUID | ''
  quantity: string
  price: string
  invoiceBarcode?: string
  invoiceDesc?: string
  forThirdParty?: boolean
}

// ============================================================================
// Fuentes de facturas soportadas
// ============================================================================

export type InvoiceSourceId = 'canalaveral' | 'd1-carulla'

export interface InvoiceSource {
  id: InvoiceSourceId
  label: string
  primary: boolean
}
