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
          icon: c.icon || 'tag',
          color: c.color || 'indigo',
        })),
      })
    }
    set({ loading: false })
  },

  addCategory: async (category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        household_id: category.householdId,
        name: category.name,
        icon: category.icon || 'tag',
        color: category.color || 'indigo',
      })
      .select()
      .single()

    if (!error && data) {
      set((state) => ({
        categories: [
          ...state.categories,
          {
            id: data.id,
            householdId: data.household_id,
            name: data.name,
            icon: data.icon || 'tag',
            color: data.color || 'indigo',
          },
        ],
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

  updateCategoryStyle: async (categoryId, updates) => {
    const dbUpdates = {}
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (Object.keys(dbUpdates).length === 0) return { error: null }

    const { error } = await supabase
      .from('categories')
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
