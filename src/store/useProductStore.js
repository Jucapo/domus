import { create } from 'zustand'
import { supabase } from '../lib/supabase'

function mapRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    categoryId: row.category_id,
    category: row.categories?.name || '',
    name: row.name,
    quantity: row.quantity,
    displayUnit: row.display_unit,
    contentAmount: row.content_amount ? Number(row.content_amount) : null,
    contentUnit: row.content_unit || null,
    inShoppingList: row.in_shopping_list,
    pendingRegistration: row.pending_registration,
    visibleInInventory: row.visible_in_inventory,
    brand: row.brand,
    imageUrl: row.image_url,
    notes: row.notes,
  }
}

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  fetchProducts: async (householdId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('household_id', householdId)
      .order('name')

    if (!error && data) {
      set({ products: data.map(mapRow) })
    }
    set({ loading: false })
  },

  addProduct: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        household_id: product.householdId,
        category_id: product.categoryId || null,
        name: product.name,
        quantity: product.quantity ?? 0,
        display_unit: product.displayUnit || 'unit',
        content_amount: product.contentAmount || null,
        content_unit: product.contentUnit || null,
        brand: product.brand || '',
        image_url: product.imageUrl || '',
        notes: product.notes || '',
        visible_in_inventory: product.visibleInInventory ?? true,
      })
      .select('*, categories(name)')
      .single()

    if (!error && data) {
      set((state) => ({ products: [...state.products, mapRow(data)] }))
    }
    return { data: data ? mapRow(data) : null, error }
  },

  updateProduct: async (productId, updates) => {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity
    if (updates.displayUnit !== undefined) dbUpdates.display_unit = updates.displayUnit
    if (updates.contentAmount !== undefined) dbUpdates.content_amount = updates.contentAmount || null
    if (updates.contentUnit !== undefined) dbUpdates.content_unit = updates.contentUnit || null
    if (updates.inShoppingList !== undefined) dbUpdates.in_shopping_list = updates.inShoppingList
    if (updates.pendingRegistration !== undefined) dbUpdates.pending_registration = updates.pendingRegistration
    if (updates.visibleInInventory !== undefined) dbUpdates.visible_in_inventory = updates.visibleInInventory
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select('*, categories(name)')
      .single()

    if (!error && data) {
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? mapRow(data) : p)),
      }))
    }
    return { error }
  },

  deleteProduct: async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) {
      set((state) => ({ products: state.products.filter((p) => p.id !== productId) }))
    }
    return { error }
  },

  increment: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return
    const newQty = product.quantity + 1
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)),
    }))
    await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
  },

  decrement: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return
    const newQty = Math.max(0, product.quantity - 1)
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)),
    }))
    await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
  },

  toggleShoppingList: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return
    const newVal = !product.inShoppingList
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, inShoppingList: newVal } : p)),
    }))
    await supabase.from('products').update({ in_shopping_list: newVal }).eq('id', productId)
  },

  removeFromShoppingList: async (productId) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, inShoppingList: false } : p)),
    }))
    await supabase.from('products').update({ in_shopping_list: false }).eq('id', productId)
  },

  markAsBought: async (productId) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, inShoppingList: false, pendingRegistration: true } : p,
      ),
    }))
    await supabase
      .from('products')
      .update({ in_shopping_list: false, pending_registration: true })
      .eq('id', productId)
  },

  completeRegistration: async (productId, quantity) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return
    const newQty = product.quantity + quantity
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, quantity: newQty, pendingRegistration: false } : p,
      ),
    }))
    await supabase
      .from('products')
      .update({ quantity: newQty, pending_registration: false })
      .eq('id', productId)
  },

  skipRegistration: async (productId) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, pendingRegistration: false } : p,
      ),
    }))
    await supabase.from('products').update({ pending_registration: false }).eq('id', productId)
  },
}))
