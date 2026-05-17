import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { PriceRecord, Tables, UUID } from '../types'

function mapRow(row: Tables<'price_records'>): PriceRecord {
  return {
    id: row.id,
    productId: row.product_id,
    householdId: row.household_id,
    price: Number(row.price),
    quantity: Number(row.quantity ?? 1),
    store: row.store,
    date: row.recorded_date,
    invoiceId: row.invoice_id || null,
    forThirdParty: row.for_third_party === true,
  }
}

export interface AddPriceRecordInput {
  productId: UUID
  householdId: UUID
  price: number
  quantity?: number
  store: string
  date: string
  invoiceId?: UUID | null
  forThirdParty?: boolean
}

export interface UpdatePriceRecordInput {
  productId?: UUID
  price: number
  quantity?: number
  store: string
  date: string
  forThirdParty?: boolean
}

interface PriceState {
  records: PriceRecord[]
  loading: boolean
  fetchRecords: (householdId: UUID) => Promise<void>
  addRecord: (record: AddPriceRecordInput) => Promise<{ error: unknown }>
  updateRecord: (recordId: UUID, record: UpdatePriceRecordInput) => Promise<{ error: unknown }>
  deleteRecord: (recordId: UUID) => Promise<{ error: unknown }>
}

export const usePriceStore = create<PriceState>((set) => ({
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
        for_third_party: record.forThirdParty === true,
      })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({ records: [mapRow(data), ...state.records] }))
    }
    return { error }
  },

  updateRecord: async (recordId, record) => {
    const payload: Record<string, unknown> = {
      price: record.price,
      quantity: record.quantity ?? 1,
      store: record.store,
      recorded_date: record.date,
    }
    if (record.forThirdParty !== undefined) {
      payload.for_third_party = record.forThirdParty === true
    }
    if (record.productId !== undefined) {
      payload.product_id = record.productId
    }
    const { data, error } = await supabase
      .from('price_records')
      .update(payload)
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
