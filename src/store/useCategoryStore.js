import { create } from 'zustand'
import { MOCK_CATEGORIES } from '../data/mock'

export const useCategoryStore = create((set) => ({
  categories: MOCK_CATEGORIES,

  addCategory: (category) =>
    set((state) => ({
      categories: [
        ...state.categories,
        { ...category, id: `cat-${Date.now()}` },
      ],
    })),

  renameCategory: (categoryId, newName) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === categoryId ? { ...c, name: newName } : c,
      ),
    })),

  deleteCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    })),
}))
