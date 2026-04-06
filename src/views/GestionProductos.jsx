import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { UNITS } from '../data/mock'

export default function GestionProductos() {
  const navigate = useNavigate()
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)

  const allProducts = useProductStore((s) => s.products)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const deleteProduct = useProductStore((s) => s.deleteProduct)

  const allCategories = useCategoryStore((s) => s.categories)
  const categories = useMemo(
    () => allCategories.filter((c) => c.householdId === householdId),
    [allCategories, householdId],
  )

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId),
    [allProducts, householdId],
  )

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    unit: 'unit',
  })
  const [search, setSearch] = useState('')

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
    })
  }

  const confirmEdit = (productId) => {
    const trimmed = editForm.name.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    updateProduct(productId, {
      name: trimmed,
      category: editForm.category,
      unit: editForm.unit,
    })
    setEditingId(null)
  }

  const handleDelete = (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}" del inventario?`)) return
    deleteProduct(product.id)
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 md:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
            Editar productos
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {products.length}{' '}
            {products.length === 1 ? 'producto' : 'productos'} en el hogar
          </p>
        </div>
      </div>

      <div className="relative mb-5">
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

      <div className="space-y-2">
        {filtered.map((product) => {
          const isEditing = editingId === product.id

          if (isEditing) {
            return (
              <div
                key={product.id}
                className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 md:p-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    autoFocus
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEdit(product.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    placeholder="Nombre"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {categories
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    {!categories.some(
                      (c) => c.name === editForm.category,
                    ) && (
                      <option value={editForm.category}>
                        {editForm.category} (sin categoría)
                      </option>
                    )}
                  </select>
                  <select
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unit: e.target.value })
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                  <button
                    onClick={() => confirmEdit(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Check size={14} />
                    Guardar
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {product.name}
                </p>
                <p className="text-xs text-slate-500">
                  {product.category}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {UNITS.find((u) => u.id === product.unit)?.label ||
                    product.unit}
                  <span className="mx-1.5 text-slate-300">·</span>
                  Stock: {product.quantity}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(product)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No se encontraron productos.
          </p>
        )}
      </div>
    </div>
  )
}
