import { useState, useMemo } from 'react'
import { Plus, Minus, Search, PackagePlus, ShoppingCart } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { UNITS } from '../data/mock'

const unitMap = Object.fromEntries(UNITS.map((u) => [u.id, u]))

export default function Inventario() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const increment = useProductStore((s) => s.increment)
  const decrement = useProductStore((s) => s.decrement)
  const addProduct = useProductStore((s) => s.addProduct)
  const toggleShoppingList = useProductStore((s) => s.toggleShoppingList)

  const allCategories = useCategoryStore((s) => s.categories)
  const householdCategories = useMemo(
    () =>
      allCategories
        .filter((c) => c.householdId === householdId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allCategories, householdId],
  )

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId),
    [allProducts, householdId],
  )

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    quantity: 1,
    unit: 'unit',
  })

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  const categories = [...new Set(filtered.map((p) => p.category))].sort()

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newProduct.name.trim() || !newProduct.category) return
    addProduct({ ...newProduct, householdId })
    setNewProduct({ name: '', category: '', quantity: 1, unit: 'unit' })
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
            Inventario
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {products.length} productos en el hogar
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 md:px-4 md:py-2.5"
        >
          <PackagePlus size={16} />
          <span className="hidden sm:inline">Agregar producto</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:mb-6 md:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="" disabled>
                Categoría
              </option>
              {householdCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <select
                value={newProduct.unit}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unit: e.target.value })
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4 md:mb-6">
        <Search
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
      </div>

      <div className="space-y-5 md:space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 md:mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {filtered
                .filter((p) => p.category === category)
                .map((product) => {
                  const unit = unitMap[product.unit]
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition-shadow hover:shadow-md md:px-5 md:py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3 md:gap-4">
                        <button
                          onClick={() => toggleShoppingList(product.id)}
                          title={
                            product.inShoppingList
                              ? 'Quitar de la lista de compras'
                              : 'Agregar a la lista de compras'
                          }
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            product.inShoppingList
                              ? 'border-amber-300 bg-amber-50 text-amber-600'
                              : 'border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400'
                          }`}
                        >
                          <ShoppingCart size={14} />
                        </button>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 md:text-base">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {unit && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-400">
                                {unit.label}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 md:gap-3">
                        <button
                          onClick={() => decrement(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Minus size={14} />
                        </button>
                        <span
                          className={`min-w-[2.5rem] text-center text-sm font-semibold ${
                            product.quantity === 0
                              ? 'text-red-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {product.quantity}
                          {unit && (
                            <span className="ml-0.5 text-xs font-normal text-slate-400">
                              {unit.abbreviation}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => increment(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No se encontraron productos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
