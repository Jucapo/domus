import { create } from 'zustand'
import { MOCK_PRICE_RECORDS } from '../data/mock'

export const usePriceStore = create((set) => ({
  records: MOCK_PRICE_RECORDS,

  addRecord: (record) =>
    set((state) => ({
      records: [
        ...state.records,
        { ...record, id: `price-${Date.now()}` },
      ],
    })),

  deleteRecord: (recordId) =>
    set((state) => ({
      records: state.records.filter((r) => r.id !== recordId),
    })),
}))
