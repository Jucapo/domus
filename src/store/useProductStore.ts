import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Product, Tables, UUID } from '../types'

type ProductRowWithCategory = Tables<'products'> & {
  categories?: { name: string } | null
}

function mapRow(row: ProductRowWithCategory): Product {
  return {
    id: row.id,
    householdId: row.household_id,
    categoryId: row.category_id,
    category: row.categories?.name || '',
    name: row.name,
    quantity: row.quantity,
    displayUnit: row.display_unit,
    contentAmount: row.content_amount != null ? Number(row.content_amount) : null,
    contentUnit: row.content_unit || null,
    inShoppingList: row.in_shopping_list,
    pendingRegistration: row.pending_registration,
    visibleInInventory: row.visible_in_inventory,
    brand: row.brand,
    imageUrl: row.image_url,
    notes: row.notes,
    linkedProductId: row.linked_product_id || null,
    linkedUnitsPerPackage:
      row.linked_units_per_package != null ? Number(row.linked_units_per_package) : null,
    barcode:
      row.barcode != null && String(row.barcode).trim() !== ''
        ? String(row.barcode).trim()
        : '',
  }
}

/** Input para crear producto: todos opcionales excepto identificadores y nombre. */
export type AddProductInput = Pick<Product, 'householdId' | 'name'> &
  Partial<Omit<Product, 'id' | 'category' | 'householdId' | 'name'>>

export type UpdateProductInput = Partial<Omit<Product, 'id' | 'householdId' | 'category'>>

interface ProductState {
  products: Product[]
  loading: boolean

  fetchProducts: (householdId: UUID) => Promise<void>
  addProduct: (product: AddProductInput) => Promise<{ data: Product | null; error: unknown }>
  updateProduct: (productId: UUID, updates: UpdateProductInput) => Promise<{ error: unknown }>
  deleteProduct: (productId: UUID) => Promise<{ error: unknown }>

  /** Suma stock por una compra. Respeta anclaje a producto base. */
  addInventoryFromPurchase: (productId: UUID, purchaseQty: number) => Promise<{ error: unknown }>
  /** Revierte con la misma lógica de redondeo y anclaje. */
  subtractInventoryFromPurchase: (productId: UUID, purchaseQty: number) => Promise<{ error: unknown }>
  /** Ajusta stock cuando cambia la cantidad de una compra ya registrada. */
  applyPurchaseQuantityDelta: (
    productId: UUID,
    oldPurchaseQty: number,
    newPurchaseQty: number,
  ) => Promise<{ error: unknown }>

  increment: (productId: UUID) => Promise<void>
  decrement: (productId: UUID) => Promise<void>

  toggleShoppingList: (productId: UUID) => Promise<void>
  removeFromShoppingList: (productId: UUID) => Promise<void>
  addToShoppingList: (productId: UUID) => Promise<void>
  markAsBought: (productId: UUID) => Promise<void>
  completeRegistration: (productId: UUID, quantity: number) => Promise<{ error: unknown }>
  skipRegistration: (productId: UUID) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
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
      set({ products: (data as ProductRowWithCategory[]).map(mapRow) })
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
        linked_product_id: product.linkedProductId || null,
        linked_units_per_package: product.linkedUnitsPerPackage ?? null,
        barcode: product.barcode?.trim() ? product.barcode.trim() : null,
      })
      .select('*, categories(name)')
      .single()

    if (!error && data) {
      const mapped = mapRow(data as ProductRowWithCategory)
      set((state) => ({ products: [...state.products, mapped] }))
      return { data: mapped, error: null }
    }
    return { data: null, error }
  },

  updateProduct: async (productId, updates) => {
    const dbUpdates: Record<string, unknown> = {}
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
    if (updates.linkedProductId !== undefined) dbUpdates.linked_product_id = updates.linkedProductId || null
    if (updates.linkedUnitsPerPackage !== undefined) {
      dbUpdates.linked_units_per_package =
        updates.linkedUnitsPerPackage != null ? updates.linkedUnitsPerPackage : null
    }
    if (updates.barcode !== undefined) {
      dbUpdates.barcode = updates.barcode?.trim() ? updates.barcode.trim() : null
    }

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select('*, categories(name)')
      .single()

    if (!error && data) {
      const mapped = mapRow(data as ProductRowWithCategory)
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? mapped : p)),
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

  addInventoryFromPurchase: async (productId, purchaseQty) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return { error: null }
    const qty = Math.max(1, Math.round(Number(purchaseQty)))

    if (product.linkedProductId && product.linkedUnitsPerPackage && product.linkedUnitsPerPackage > 0) {
      const linked = get().products.find((p) => p.id === product.linkedProductId)
      if (linked) {
        const add = Math.round(qty * product.linkedUnitsPerPackage)
        const newLinkedQty = linked.quantity + add
        const { error } = await supabase
          .from('products')
          .update({ quantity: newLinkedQty })
          .eq('id', linked.id)
        if (!error) {
          set((state) => ({
            products: state.products.map((p) =>
              p.id === linked.id ? { ...p, quantity: newLinkedQty } : p,
            ),
          }))
        }
        return { error }
      }
    }

    const newQty = product.quantity + qty
    const { error } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
    if (!error) {
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)),
      }))
    }
    return { error }
  },

  subtractInventoryFromPurchase: async (productId, purchaseQty) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return { error: new Error('Producto no encontrado') }
    const qty = Math.max(1, Math.round(Number(purchaseQty)))

    if (product.linkedProductId && product.linkedUnitsPerPackage && product.linkedUnitsPerPackage > 0) {
      const linked = get().products.find((p) => p.id === product.linkedProductId)
      if (linked) {
        const sub = Math.round(qty * product.linkedUnitsPerPackage)
        const newLinkedQty = Math.max(0, linked.quantity - sub)
        const { error } = await supabase
          .from('products')
          .update({ quantity: newLinkedQty })
          .eq('id', linked.id)
        if (!error) {
          set((state) => ({
            products: state.products.map((p) =>
              p.id === linked.id ? { ...p, quantity: newLinkedQty } : p,
            ),
          }))
        }
        return { error }
      }
    }

    const newQty = Math.max(0, product.quantity - qty)
    const { error } = await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
    if (!error) {
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)),
      }))
    }
    return { error }
  },

  applyPurchaseQuantityDelta: async (productId, oldPurchaseQty, newPurchaseQty) => {
    const oldQ = Math.max(1, Math.round(Number(oldPurchaseQty)))
    const newQ = Math.max(1, Math.round(Number(newPurchaseQty)))
    const d = newQ - oldQ
    if (d === 0) return { error: null }
    if (d > 0) return get().addInventoryFromPurchase(productId, d)
    return get().subtractInventoryFromPurchase(productId, -d)
  },

  increment: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return

    if (product.linkedProductId && product.linkedUnitsPerPackage && product.linkedUnitsPerPackage > 0) {
      const linked = get().products.find((p) => p.id === product.linkedProductId)
      if (linked) {
        const delta = Math.round(product.linkedUnitsPerPackage)
        const newQty = linked.quantity + delta
        set((state) => ({
          products: state.products.map((p) => (p.id === linked.id ? { ...p, quantity: newQty } : p)),
        }))
        await supabase.from('products').update({ quantity: newQty }).eq('id', linked.id)
        return
      }
    }

    const newQty = product.quantity + 1
    set((state) => ({
      products: state.products.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)),
    }))
    await supabase.from('products').update({ quantity: newQty }).eq('id', productId)
  },

  decrement: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product) return

    if (product.linkedProductId && product.linkedUnitsPerPackage && product.linkedUnitsPerPackage > 0) {
      const linked = get().products.find((p) => p.id === product.linkedProductId)
      if (linked) {
        const delta = Math.round(product.linkedUnitsPerPackage)
        const newQty = Math.max(0, linked.quantity - delta)
        set((state) => ({
          products: state.products.map((p) => (p.id === linked.id ? { ...p, quantity: newQty } : p)),
        }))
        await supabase.from('products').update({ quantity: newQty }).eq('id', linked.id)
        return
      }
    }

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

  addToShoppingList: async (productId) => {
    const product = get().products.find((p) => p.id === productId)
    if (!product || product.inShoppingList) return
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, inShoppingList: true } : p,
      ),
    }))
    await supabase.from('products').update({ in_shopping_list: true }).eq('id', productId)
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
    if (!product) return { error: new Error('Producto no encontrado') }

    const inv = await get().addInventoryFromPurchase(productId, quantity)
    if (inv?.error) return { error: inv.error }

    const { error } = await supabase
      .from('products')
      .update({ pending_registration: false })
      .eq('id', productId)

    if (!error) {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, pendingRegistration: false } : p,
        ),
      }))
    }
    return { error }
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
