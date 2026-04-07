import { create } from 'zustand'
import { supabase } from '../lib/supabase'

function mapInvoiceRow(row) {
  const lines = (row.price_records || [])
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((r) => ({
    id: r.id,
    productId: r.product_id,
    price: Number(r.price),
    quantity: Number(r.quantity ?? 1),
    store: r.store,
    date: r.recorded_date,
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

export const useInvoiceStore = create((set) => ({
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
          recorded_date
        )
      `,
      )
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ invoices: data.map(mapInvoiceRow) })
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
    set((state) => ({ invoices: [inv, ...state.invoices] }))
    return { data: inv, error: null }
  },

  updateInvoice: async (invoiceId, { store, invoiceDate, totalCop }) => {
    const updates = {}
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
   * Quita el vínculo en price_records y borra la cabecera.
   * Los registros de precio se conservan (siguen en histórico).
   */
  deleteInvoice: async (invoiceId) => {
    await supabase.from('price_records').update({ invoice_id: null }).eq('invoice_id', invoiceId)

    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    if (!error) {
      set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== invoiceId),
      }))
    }
    return { error }
  },
}))
