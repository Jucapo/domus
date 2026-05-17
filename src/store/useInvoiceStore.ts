import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useProductStore } from './useProductStore'
import { usePriceStore } from './usePriceStore'
import type { Invoice, InvoiceLine, ISODateString, Tables, UUID } from '../types'

type InvoiceRowWithLines = Tables<'invoices'> & {
  price_records?: Tables<'price_records'>[] | null
}

/** Más reciente primero: fecha de factura, luego creación, luego id. */
function compareInvoicesByDateDesc(a: Invoice, b: Invoice): number {
  const d = String(b.invoiceDate).localeCompare(String(a.invoiceDate))
  if (d !== 0) return d
  const c = String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  if (c !== 0) return c
  return String(b.id).localeCompare(String(a.id))
}

function mapInvoiceRow(row: InvoiceRowWithLines): Invoice {
  const lines: InvoiceLine[] = (row.price_records || [])
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((r) => ({
      id: r.id,
      productId: r.product_id,
      price: Number(r.price),
      quantity: Number(r.quantity ?? 1),
      store: r.store,
      date: r.recorded_date,
      forThirdParty: r.for_third_party === true,
    }))
  return {
    id: row.id,
    householdId: row.household_id,
    store: row.store,
    invoiceDate: row.invoice_date,
    totalCop: row.total_cop != null ? Number(row.total_cop) : null,
    createdAt: row.created_at,
    lines,
  }
}

export interface CreateInvoiceInput {
  householdId: UUID
  store: string
  invoiceDate: ISODateString
  totalCop: number | null
}

export interface UpdateInvoiceInput {
  store?: string
  invoiceDate?: ISODateString
  totalCop?: number | null
}

export interface DeleteInvoiceOptions {
  /** Si es false, asume que el inventario no se sumó (rollback de "Registrar factura"). */
  revertInventory?: boolean
}

interface InvoiceState {
  invoices: Invoice[]
  loading: boolean
  fetchInvoices: (householdId: UUID) => Promise<void>
  createInvoice: (input: CreateInvoiceInput) => Promise<{ data: Invoice | null; error: unknown }>
  updateInvoice: (invoiceId: UUID, updates: UpdateInvoiceInput) => Promise<{ error: unknown }>
  deleteInvoice: (invoiceId: UUID, options?: DeleteInvoiceOptions) => Promise<{ error: unknown }>
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  loading: false,

  fetchInvoices: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        household_id,
        store,
        invoice_date,
        total_cop,
        created_at,
        price_records (
          id,
          product_id,
          price,
          quantity,
          store,
          recorded_date,
          for_third_party
        )
      `,
      )
      .eq('household_id', householdId)
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({
        invoices: (data as InvoiceRowWithLines[]).map(mapInvoiceRow).sort(compareInvoicesByDateDesc),
      })
    }
    set({ loading: false })
  },

  createInvoice: async ({ householdId, store, invoiceDate, totalCop }) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        household_id: householdId,
        store: store ?? '',
        invoice_date: invoiceDate,
        total_cop: totalCop != null ? totalCop : null,
      })
      .select()
      .single()

    if (error || !data) {
      return { data: null, error }
    }
    const inv = mapInvoiceRow({ ...data, price_records: [] })
    set((state) => ({
      invoices: [...state.invoices, inv].sort(compareInvoicesByDateDesc),
    }))
    return { data: inv, error: null }
  },

  updateInvoice: async (invoiceId, { store, invoiceDate, totalCop }) => {
    const updates: Record<string, unknown> = {}
    if (store !== undefined) updates.store = store
    if (invoiceDate !== undefined) updates.invoice_date = invoiceDate
    if (totalCop !== undefined) updates.total_cop = totalCop

    const { error } = await supabase.from('invoices').update(updates).eq('id', invoiceId)

    if (!error) {
      set((state) => ({
        invoices: state.invoices.map((i) => {
          if (i.id !== invoiceId) return i
          return {
            ...i,
            ...(store !== undefined && { store }),
            ...(invoiceDate !== undefined && { invoiceDate }),
            ...(totalCop !== undefined && { totalCop }),
          }
        }),
      }))
      return { error: null }
    }
    return { error }
  },

  /**
   * Borra la factura y sus price_records, y revierte el inventario añadido al crearla.
   */
  deleteInvoice: async (invoiceId, options = {}) => {
    const { revertInventory = true } = options
    const inv = get().invoices.find((i) => i.id === invoiceId)
    const lines = inv?.lines ? [...inv.lines] : []

    if (revertInventory) {
      for (const line of lines) {
        const { error: invErr } = await useProductStore
          .getState()
          .subtractInventoryFromPurchase(line.productId, line.quantity)
        if (invErr) return { error: invErr }
      }
    }

    const { error: delRecErr } = await supabase
      .from('price_records')
      .delete()
      .eq('invoice_id', invoiceId)
    if (delRecErr) return { error: delRecErr }

    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    if (!error) {
      set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== invoiceId),
      }))
      usePriceStore.setState((state) => ({
        records: state.records.filter((r) => r.invoiceId !== invoiceId),
      }))
    }
    return { error }
  },
}))
