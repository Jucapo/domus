import { create } from 'zustand'
import { supabase } from '../lib/supabase'

function mapRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    householdId: row.household_id,
    price: Number(row.price),
    quantity: Number(row.quantity ?? 1),
    store: row.store,
    date: row.recorded_date,
    invoiceId: row.invoice_id || null,
  }
}

export const usePriceStore = create((set) => ({
  records: [],
  loading: false,

  fetchRecords: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('price_records')
      .select('*')
      .eq('household_id', householdId)
      .order('recorded_date', { ascending: false })

    if (!error && data) {
      set({ records: data.map(mapRow) })
    }
    set({ loading: false })
  },

  addRecord: async (record) => {
    const { data, error } = await supabase
      .from('price_records')
      .insert({
        product_id: record.productId,
        household_id: record.householdId,
        price: record.price,
        quantity: record.quantity ?? 1,
        store: record.store,
        recorded_date: record.date,
        invoice_id: record.invoiceId ?? null,
      })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({ records: [mapRow(data), ...state.records] }))
    }
    return { error }
  },

  updateRecord: async (recordId, record) => {
    const { data, error } = await supabase
      .from('price_records')
      .update({
        price: record.price,
        quantity: record.quantity ?? 1,
        store: record.store,
        recorded_date: record.date,
      })
      .eq('id', recordId)
      .select()
      .single()

    if (!error && data) {
      const updated = mapRow(data)
      set((state) => ({
        records: state.records.map((r) => (r.id === recordId ? updated : r)),
      }))
    }
    return { error }
  },

  deleteRecord: async (recordId) => {
    const { error } = await supabase.from('price_records').delete().eq('id', recordId)
    if (!error) {
      set((state) => ({ records: state.records.filter((r) => r.id !== recordId) }))
    }
    return { error }
  },
}))
