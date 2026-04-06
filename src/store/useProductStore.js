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

  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, { ...product, id: `prod-${Date.now()}` }],
    })),
}))
