import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS, CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP } from '../data/category_styles'

export default function GestionCategorias() {
  const navigate = useNavigate()
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const fetchProducts = useProductStore((s) => s.fetchProducts)

  const allCategories = useCategoryStore((s) => s.categories)
  const addCategory = useCategoryStore((s) => s.addCategory)
  const renameCategory = useCategoryStore((s) => s.renameCategory)
  const deleteCategory = useCategoryStore((s) => s.deleteCategory)
  const updateCategoryStyle = useCategoryStore((s) => s.updateCategoryStyle)

  const categories = useMemo(
    () => allCategories.filter((c) => c.householdId === householdId),
    [allCategories, householdId],
  )

  const allProducts = useProductStore((s) => s.products)
  const productCountByCategory = useMemo(() => {
    const counts = {}
    allProducts
      .filter((p) => p.householdId === householdId)
      .forEach((p) => {
        counts[p.category] = (counts[p.category] || 0) + 1
      })
    return counts
  }, [allProducts, householdId])

  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('tag')
  const [newColor, setNewColor] = useState('indigo')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingIcon, setEditingIcon] = useState('tag')
  const [editingColor, setEditingColor] = useState('indigo')

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()))
      return
    addCategory({ householdId, name: trimmed, icon: newIcon, color: newColor })
    setNewName('')
    setNewIcon('tag')
    setNewColor('indigo')
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setEditingIcon(cat.icon || 'tag')
    setEditingColor(cat.color || 'indigo')
  }

  const confirmEdit = (cat) => {
    const trimmed = editingName.trim()
    if (!trimmed || trimmed === cat.name) {
      setEditingId(null)
      return
    }
    if (
      categories.some(
        (c) =>
          c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setEditingId(null)
      return
    }
    renameCategory(cat.id, trimmed)
    updateCategoryStyle(cat.id, { icon: editingIcon, color: editingColor })
    if (householdId) fetchProducts(householdId)
    setEditingId(null)
  }

  const saveStyleOnly = (cat, updates) => {
    updateCategoryStyle(cat.id, updates)
  }

  const handleDelete = (cat) => {
    const count = productCountByCategory[cat.name] || 0
    if (count > 0) {
      alert(
        `No puedes eliminar "${cat.name}" porque tiene ${count} producto(s) asociado(s). Mueve los productos a otra categoría primero.`,
      )
      return
    }
    deleteCategory(cat.id)
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
            Categorías
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {categories.length}{' '}
            {categories.length === 1 ? 'categoría' : 'categorías'} en el hogar
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          type="text"
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const idx = CATEGORY_ICON_OPTIONS.findIndex((o) => o.id === newIcon)
            const next = CATEGORY_ICON_OPTIONS[(idx + 1) % CATEGORY_ICON_OPTIONS.length]
            setNewIcon(next.id)
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          title="Cambiar icono"
        >
          {(() => {
            const Icon = CATEGORY_ICON_MAP[newIcon]
            return Icon ? <Icon size={18} /> : null
          })()}
        </button>
        <button
          type="button"
          onClick={() => {
            const idx = CATEGORY_COLOR_OPTIONS.findIndex((o) => o.id === newColor)
            const next = CATEGORY_COLOR_OPTIONS[(idx + 1) % CATEGORY_COLOR_OPTIONS.length]
            setNewColor(next.id)
          }}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border ${CATEGORY_COLOR_MAP[newColor] || 'border-slate-200 bg-slate-50 text-slate-600'}`}
          title="Cambiar color"
        >
          <span className="h-4 w-4 rounded-full bg-white/50" />
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </form>

      <details className="mb-5 rounded-xl border border-slate-200 bg-white px-3 py-3 md:px-4">
        <summary className="cursor-pointer select-none text-sm font-medium text-slate-700">
          Selector de iconos y colores
          <span className="ml-2 text-xs font-normal text-slate-400">(opcional)</span>
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Iconos</p>
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
              {CATEGORY_ICON_OPTIONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNewIcon(id)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                    newIcon === id ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  title={label}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Colores</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_OPTIONS.map(({ id, label, className }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNewColor(id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold ${className} ${
                    newColor === id ? 'ring-2 ring-indigo-500/20' : ''
                  }`}
                  title={label}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      <div className="space-y-1.5">
        {categories
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((cat) => {
            const count = productCountByCategory[cat.name] || 0
            const isEditing = editingId === cat.id

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 md:px-4 md:py-3"
              >
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEdit(cat)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 rounded border border-indigo-300 px-2 py-1 text-sm focus:outline-none"
                  />
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        CATEGORY_COLOR_MAP[cat.color] || 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                      title="Icono y color"
                    >
                      {(() => {
                        const Icon = CATEGORY_ICON_MAP[cat.icon || 'tag']
                        return Icon ? <Icon size={16} /> : null
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {cat.name}
                      </p>
                    <p className="text-xs text-slate-400">
                      {count} {count === 1 ? 'producto' : 'productos'}
                    </p>
                    </div>
                  </div>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = CATEGORY_ICON_OPTIONS.findIndex((o) => o.id === editingIcon)
                          const next = CATEGORY_ICON_OPTIONS[(idx + 1) % CATEGORY_ICON_OPTIONS.length]
                          setEditingIcon(next.id)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Cambiar icono"
                      >
                        {(() => {
                          const Icon = CATEGORY_ICON_MAP[editingIcon]
                          return Icon ? <Icon size={14} /> : null
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = CATEGORY_COLOR_OPTIONS.findIndex((o) => o.id === editingColor)
                          const next = CATEGORY_COLOR_OPTIONS[(idx + 1) % CATEGORY_COLOR_OPTIONS.length]
                          setEditingColor(next.id)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Cambiar color"
                      >
                        <span className={`h-3 w-3 rounded-full border ${CATEGORY_COLOR_MAP[editingColor] || 'border-slate-200 bg-slate-50'}`} />
                      </button>
                      <button
                        onClick={() => confirmEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const currIcon = cat.icon || 'tag'
                          const idx = CATEGORY_ICON_OPTIONS.findIndex((o) => o.id === currIcon)
                          const next = CATEGORY_ICON_OPTIONS[(idx + 1) % CATEGORY_ICON_OPTIONS.length]
                          saveStyleOnly(cat, { icon: next.id })
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Cambiar icono"
                      >
                        {(() => {
                          const Icon = CATEGORY_ICON_MAP[cat.icon || 'tag']
                          return Icon ? <Icon size={14} /> : null
                        })()}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currColor = cat.color || 'indigo'
                          const idx = CATEGORY_COLOR_OPTIONS.findIndex((o) => o.id === currColor)
                          const next = CATEGORY_COLOR_OPTIONS[(idx + 1) % CATEGORY_COLOR_OPTIONS.length]
                          saveStyleOnly(cat, { color: next.id })
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Cambiar color"
                      >
                        <span className={`h-3 w-3 rounded-full border ${CATEGORY_COLOR_MAP[cat.color] || 'border-slate-200 bg-slate-50'}`} />
                      </button>
                      <button
                        onClick={() => startEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

        {categories.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No hay categorías creadas aún.
          </p>
        )}
      </div>
    </div>
  )
}
