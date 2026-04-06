import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('name')

    if (!error && data) {
      set({
        categories: data.map((c) => ({
          id: c.id,
          householdId: c.household_id,
          name: c.name,
        })),
      })
    }
    set({ loading: false })
  },

  addCategory: async (category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ household_id: category.householdId, name: category.name })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({
        categories: [...state.categories, { id: data.id, householdId: data.household_id, name: data.name }],
      }))
    }
    return { error }
  },

  renameCategory: async (categoryId, newName) => {
    const { error } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', categoryId)

    if (!error) {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, name: newName } : c,
        ),
      }))
    }
    return { error }
  },

  deleteCategory: async (categoryId) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (!error) {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
      }))
    }
    return { error }
  },
}))
