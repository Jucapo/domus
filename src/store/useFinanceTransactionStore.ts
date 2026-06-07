import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { FinanceTransaction, TransactionType, UUID } from '../types'
import type { Tables } from '../types'

function mapRow(row: Tables<'finance_transactions'>): FinanceTransaction {
  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type as TransactionType,
    date: row.tx_date,
    accountId: row.account_id,
    toAccountId: row.to_account_id || null,
    categoryId: row.category_id || null,
    amount: Number(row.amount),
    currency: row.currency || 'COP',
    amountSecondary: row.amount_secondary != null ? Number(row.amount_secondary) : null,
    currencySecondary: row.currency_secondary || null,
    note: row.note || '',
    tags: row.tags || '',
    invoiceId: row.invoice_id || null,
  }
}

export type AddTransactionInput = Pick<
  FinanceTransaction,
  'householdId' | 'type' | 'accountId' | 'amount'
> &
  Partial<Omit<FinanceTransaction, 'id' | 'householdId' | 'type' | 'accountId' | 'amount'>>

export type UpdateTransactionInput = Partial<Omit<FinanceTransaction, 'id' | 'householdId'>>

interface FinanceTransactionState {
  transactions: FinanceTransaction[]
  loading: boolean
  fetchTransactions: (householdId: UUID) => Promise<void>
  addTransaction: (
    tx: AddTransactionInput,
  ) => Promise<{ data: FinanceTransaction | null; error: unknown }>
  updateTransaction: (
    txId: UUID,
    updates: UpdateTransactionInput,
  ) => Promise<{ error: unknown }>
  deleteTransaction: (txId: UUID) => Promise<{ error: unknown }>
}

export const useFinanceTransactionStore = create<FinanceTransactionState>((set) => ({
  transactions: [],
  loading: false,

  fetchTransactions: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('tx_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ transactions: data.map(mapRow) })
    }
    set({ loading: false })
  },

  addTransaction: async (tx) => {
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        household_id: tx.householdId,
        type: tx.type,
        tx_date: tx.date || undefined,
        account_id: tx.accountId,
        to_account_id: tx.toAccountId || null,
        category_id: tx.categoryId || null,
        amount: tx.amount,
        currency: tx.currency || 'COP',
        amount_secondary: tx.amountSecondary ?? null,
        currency_secondary: tx.currencySecondary || null,
        note: tx.note || '',
        tags: tx.tags || '',
        invoice_id: tx.invoiceId || null,
      })
      .select()
      .single()

    if (!error && data) {
      const mapped = mapRow(data)
      set((state) => ({ transactions: [mapped, ...state.transactions] }))
      return { data: mapped, error: null }
    }
    return { data: null, error }
  },

  updateTransaction: async (txId, updates) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.date !== undefined) dbUpdates.tx_date = updates.date
    if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId
    if (updates.toAccountId !== undefined) dbUpdates.to_account_id = updates.toAccountId || null
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency
    if (updates.amountSecondary !== undefined) dbUpdates.amount_secondary = updates.amountSecondary ?? null
    if (updates.currencySecondary !== undefined) dbUpdates.currency_secondary = updates.currencySecondary || null
    if (updates.note !== undefined) dbUpdates.note = updates.note
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.invoiceId !== undefined) dbUpdates.invoice_id = updates.invoiceId || null

    const { error } = await supabase
      .from('finance_transactions')
      .update(dbUpdates)
      .eq('id', txId)

    if (!error) {
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === txId ? { ...t, ...updates } : t,
        ),
      }))
    }
    return { error }
  },

  deleteTransaction: async (txId) => {
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', txId)

    if (!error) {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== txId),
      }))
    }
    return { error }
  },
}))
