/**
 * Helpers compartidos para persistir compras (price_record + actualización
 * de inventario respetando productos linkeados y pending_registration).
 *
 * Unifica la lógica que antes vivía duplicada en:
 *  - RegistrarCompra.tsx → persistSinglePurchase (pendientes + registro individual)
 *  - FacturasListSection.tsx → saveFullEdit (líneas nuevas al editar factura)
 *
 * Cada función devuelve `{ ok, errorMessage? }` para que el caller decida
 * cómo mostrar el error (AlertDialog con su propio título/contexto).
 */
import { useProductStore } from '../store/useProductStore'
import { usePriceStore } from '../store/usePriceStore'
import { paidToUnitPrice } from '../views/preciosShared'
import type { Product, UUID } from '../types'

export interface PurchaseFormFields {
  /** Cantidad en string (admite "1.5", "1,5"). */
  quantity: string
  /** Total pagado por la línea (en string). */
  price: string
  store: string
  /** YYYY-MM-DD */
  date: string
  forThirdParty?: boolean
}

export interface RecordPurchaseResult {
  ok: boolean
  /** Mensaje técnico del error (sin contexto UI). El caller arma el AlertDialog. */
  errorMessage?: string
  /** Etapa donde falló — útil para elegir el título del dialog. */
  failedAt?: 'record' | 'inventory'
}

export interface RecordPurchaseOptions {
  product: Product
  householdId: UUID
  fields: PurchaseFormFields
  /** Si la línea viene de una factura, su id. */
  invoiceId?: UUID | null
}

/**
 * Persiste una línea de compra: crea el price_record + actualiza stock
 * (respeta `pending_registration` y `linked_product_id`).
 *
 * No muestra UI; devuelve resultado para que el caller arme el dialog.
 */
export async function recordPurchaseLine({
  product,
  householdId,
  fields,
  invoiceId = null,
}: RecordPurchaseOptions): Promise<RecordPurchaseResult> {
  const unitPrice = paidToUnitPrice(fields.price, fields.quantity)
  if (!unitPrice || !fields.store.trim()) {
    return { ok: false, errorMessage: 'Faltan datos: total, cantidad o lugar.' }
  }
  const qty = parseFloat(String(fields.quantity).replace(',', '.')) || 1

  const { addRecord } = usePriceStore.getState()
  const { completeRegistration, addInventoryFromPurchase } = useProductStore.getState()

  const { error: recErr } = await addRecord({
    productId: product.id,
    householdId,
    price: unitPrice,
    quantity: qty,
    store: fields.store.trim(),
    date: fields.date,
    invoiceId,
    forThirdParty: fields.forThirdParty === true,
  })
  if (recErr) {
    return {
      ok: false,
      failedAt: 'record',
      errorMessage: (recErr as Error)?.message,
    }
  }

  const qInv = Math.max(1, Math.round(qty))
  if (product.pendingRegistration) {
    const { error: regErr } = await completeRegistration(product.id, qInv)
    if (regErr) {
      return {
        ok: false,
        failedAt: 'inventory',
        errorMessage: (regErr as Error)?.message,
      }
    }
  } else {
    const { error: invErr } = await addInventoryFromPurchase(product.id, qty)
    if (invErr) {
      return {
        ok: false,
        failedAt: 'inventory',
        errorMessage: (invErr as Error)?.message,
      }
    }
  }

  return { ok: true }
}

/**
 * Reverso de una línea de compra: borra el price_record + revierte el stock.
 * Útil al eliminar una línea de una factura editada.
 */
export interface RevertPurchaseLineOptions {
  recordId: UUID
  productId: UUID
  /** Cantidad original con la que se sumó al stock al crear el record. */
  quantity: number
}

export async function revertPurchaseLine({
  recordId,
  productId,
  quantity,
}: RevertPurchaseLineOptions): Promise<RecordPurchaseResult> {
  const { subtractInventoryFromPurchase } = useProductStore.getState()
  const { deleteRecord } = usePriceStore.getState()

  const { error: subErr } = await subtractInventoryFromPurchase(productId, quantity)
  if (subErr) {
    return {
      ok: false,
      failedAt: 'inventory',
      errorMessage: (subErr as Error)?.message,
    }
  }
  const { error: delErr } = await deleteRecord(recordId)
  if (delErr) {
    return {
      ok: false,
      failedAt: 'record',
      errorMessage: (delErr as Error)?.message,
    }
  }
  return { ok: true }
}
