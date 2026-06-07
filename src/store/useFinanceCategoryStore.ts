import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { FinanceCategory, FinanceCategoryKind, UUID } from '../types'
import type { Tables } from '../types'

function mapRow(row: Tables<'finance_categories'>): FinanceCategory {
  return {
    id: row.id,
    householdId: row.household_id,
    parentId: row.parent_id || null,
    name: row.name,
    kind: row.kind as FinanceCategoryKind,
    icon: row.icon || 'tag',
    color: row.color || 'indigo',
    sortOrder: row.sort_order ?? 0,
  }
}

export type AddFinanceCategoryInput = Pick<
  FinanceCategory,
  'householdId' | 'name' | 'kind'
> &
  Partial<Omit<FinanceCategory, 'id' | 'householdId' | 'name' | 'kind'>>

export type UpdateFinanceCategoryInput = Partial<
  Omit<FinanceCategory, 'id' | 'householdId'>
>

interface FinanceCategoryState {
  categories: FinanceCategory[]
  loading: boolean
  fetchCategories: (householdId: UUID) => Promise<void>
  addCategory: (
    category: AddFinanceCategoryInput,
  ) => Promise<{ data: FinanceCategory | null; error: unknown }>
  updateCategory: (
    categoryId: UUID,
    updates: UpdateFinanceCategoryInput,
  ) => Promise<{ error: unknown }>
  deleteCategory: (categoryId: UUID) => Promise<{ error: unknown }>
}

export const useFinanceCategoryStore = create<FinanceCategoryState>((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order')
      .order('name')

    if (!error && data) {
      set({ categories: data.map(mapRow) })
    }
    set({ loading: false })
  },

  addCategory: async (category) => {
    const { data, error } = await supabase
      .from('finance_categories')
      .insert({
        household_id: category.householdId,
        parent_id: category.parentId || null,
        name: category.name,
        kind: category.kind,
        icon: category.icon || 'tag',
        color: category.color || 'indigo',
        sort_order: category.sortOrder ?? 0,
      })
      .select()
      .single()

    if (!error && data) {
      const mapped = mapRow(data)
      set((state) => ({ categories: [...state.categories, mapped] }))
      return { data: mapped, error: null }
    }
    return { data: null, error }
  },

  updateCategory: async (categoryId, updates) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId || null
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.kind !== undefined) dbUpdates.kind = updates.kind
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder

    const { error } = await supabase
      .from('finance_categories')
      .update(dbUpdates)
      .eq('id', categoryId)

    if (!error) {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c,
        ),
      }))
    }
    return { error }
  },

  deleteCategory: async (categoryId) => {
    const { error } = await supabase
      .from('finance_categories')
      .delete()
      .eq('id', categoryId)

    if (!error) {
      set((state) => ({
        // El FK on delete cascade borra subcategorías; reflejarlo en memoria.
        categories: state.categories.filter(
          (c) => c.id !== categoryId && c.parentId !== categoryId,
        ),
      }))
    }
    return { error }
  },
}))
