import { create } from 'zustand'
import { MOCK_PRODUCTS } from '../data/mock'

export const useProductStore = create((set) => ({
  products: MOCK_PRODUCTS,

  increment: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, quantity: p.quantity + 1 } : p,
      ),
    })),

  decrement: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p,
      ),
    })),

  toggleShoppingList: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, inShoppingList: !p.inShoppingList } : p,
      ),
    })),

  removeFromShoppingList: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, inShoppingList: false } : p,
      ),
    })),

  markAsBought: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, inShoppingList: false, pendingRegistration: true }
          : p,
      ),
    })),

  completeRegistration: (productId, quantity) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              quantity: p.quantity + quantity,
              pendingRegistration: false,
            }
          : p,
      ),
    })),

  skipRegistration: (productId) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, pendingRegistration: false }
          : p,
      ),
    })),

  addProduct: (product) =>
    set((state) => ({
      products: [
        ...state.products,
        {
          ...product,
          id: `prod-${Date.now()}`,
          inShoppingList: false,
          pendingRegistration: false,
        },
      ],
    })),

  updateProduct: (productId, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p,
      ),
    })),

  deleteProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    })),

  updateCategoryName: (householdId, oldName, newName) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.householdId === householdId && p.category === oldName
          ? { ...p, category: newName }
          : p,
      ),
    })),
}))
