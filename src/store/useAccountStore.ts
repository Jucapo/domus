import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Account, AccountType, UUID } from '../types'
import type { Tables } from '../types'

function mapRow(row: Tables<'finance_accounts'>): Account {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    type: row.type as AccountType,
    currency: row.currency || 'COP',
    initialBalance: Number(row.initial_balance ?? 0),
    icon: row.icon || 'wallet',
    color: row.color || 'indigo',
    isFavorite: row.is_favorite === true,
    archived: row.archived === true,
    sortOrder: row.sort_order ?? 0,
  }
}

export type AddAccountInput = Pick<Account, 'householdId' | 'name'> &
  Partial<Omit<Account, 'id' | 'householdId' | 'name'>>

export type UpdateAccountInput = Partial<Omit<Account, 'id' | 'householdId'>>

interface AccountState {
  accounts: Account[]
  loading: boolean
  fetchAccounts: (householdId: UUID) => Promise<void>
  addAccount: (account: AddAccountInput) => Promise<{ data: Account | null; error: unknown }>
  updateAccount: (accountId: UUID, updates: UpdateAccountInput) => Promise<{ error: unknown }>
  deleteAccount: (accountId: UUID) => Promise<{ error: unknown }>
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  loading: false,

  fetchAccounts: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order')
      .order('name')

    if (!error && data) {
      set({ accounts: data.map(mapRow) })
    }
    set({ loading: false })
  },

  addAccount: async (account) => {
    const { data, error } = await supabase
      .from('finance_accounts')
      .insert({
        household_id: account.householdId,
        name: account.name,
        type: account.type || 'cash',
        currency: account.currency || 'COP',
        initial_balance: account.initialBalance ?? 0,
        icon: account.icon || 'wallet',
        color: account.color || 'indigo',
        is_favorite: account.isFavorite ?? false,
        archived: account.archived ?? false,
        sort_order: account.sortOrder ?? 0,
      })
      .select()
      .single()

    if (!error && data) {
      const mapped = mapRow(data)
      set((state) => ({ accounts: [...state.accounts, mapped] }))
      return { data: mapped, error: null }
    }
    return { data: null, error }
  },

  updateAccount: async (accountId, updates) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency
    if (updates.initialBalance !== undefined) dbUpdates.initial_balance = updates.initialBalance
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
    if (updates.archived !== undefined) dbUpdates.archived = updates.archived
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder

    const { error } = await supabase
      .from('finance_accounts')
      .update(dbUpdates)
      .eq('id', accountId)

    if (!error) {
      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === accountId ? { ...a, ...updates } : a,
        ),
      }))
    }
    return { error }
  },

  deleteAccount: async (accountId) => {
    const { error } = await supabase
      .from('finance_accounts')
      .delete()
      .eq('id', accountId)

    if (!error) {
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
      }))
    }
    return { error }
  },
}))
