import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Palette } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS, CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP } from '../data/category_styles'
import { AlertDialog } from '../components/AppDialogs'

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

  /** null | { mode:'new', icon, color } | { mode:'edit', cat, icon, color, syncWithNameEdit: boolean } */
  const [styleModal, setStyleModal] = useState(null)
  const [modalTab, setModalTab] = useState('icons')
  const [blockAlert, setBlockAlert] = useState({ open: false, message: '' })

  useEffect(() => {
    if (!styleModal) return
    const onKey = (e) => {
      if (e.key === 'Escape') setStyleModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [styleModal])

  const openStyleModalNew = () => {
    setModalTab('icons')
    setStyleModal({ mode: 'new', icon: newIcon, color: newColor })
  }

  const openStyleModalEdit = (cat) => {
    setModalTab('icons')
    const syncing = editingId === cat.id
    setStyleModal({
      mode: 'edit',
      cat,
      icon: syncing ? editingIcon : cat.icon || 'tag',
      color: syncing ? editingColor : cat.color || 'indigo',
      syncWithNameEdit: syncing,
    })
  }

  const applyStyleModal = () => {
    if (!styleModal) return
    if (styleModal.mode === 'new') {
      setNewIcon(styleModal.icon)
      setNewColor(styleModal.color)
    } else if (styleModal.syncWithNameEdit) {
      setEditingIcon(styleModal.icon)
      setEditingColor(styleModal.color)
    } else {
      updateCategoryStyle(styleModal.cat.id, { icon: styleModal.icon, color: styleModal.color })
    }
    setStyleModal(null)
  }

  const updateModalIcon = (id) => {
    setStyleModal((s) => (s ? { ...s, icon: id } : s))
  }

  const updateModalColor = (id) => {
    setStyleModal((s) => (s ? { ...s, color: id } : s))
  }

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
    if (!trimmed) {
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
    const nameChanged = trimmed !== cat.name
    if (nameChanged) {
      renameCategory(cat.id, trimmed)
    }
    updateCategoryStyle(cat.id, { icon: editingIcon, color: editingColor })
    if (householdId) fetchProducts(householdId)
    setEditingId(null)
  }

  const handleDelete = (cat) => {
    const count = productCountByCategory[cat.name] || 0
    if (count > 0) {
      setBlockAlert({
        open: true,
        message: `No puedes eliminar "${cat.name}" porque tiene ${count} producto(s) asociado(s). Mueve los productos a otra categoría primero.`,
      })
      return
    }
    deleteCategory(cat.id)
  }

  return (
    <div>
      <AlertDialog
        open={blockAlert.open}
        title="No se puede eliminar"
        message={blockAlert.message}
        onClose={() => setBlockAlert({ open: false, message: '' })}
      />
      <div className="mb-6 flex items-center gap-3 md:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">
            Categorías
          </h2>
          <p className="mt-0 text-sm text-slate-500 md:mt-0.5">
            {categories.length}{' '}
            {categories.length === 1 ? 'categoría' : 'categorías'} en el hogar
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mb-5 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={openStyleModalNew}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Palette size={18} className="text-indigo-600" />
          <span className="hidden sm:inline">Icono y color</span>
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </form>

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
                        onClick={() => openStyleModalEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"
                        title="Icono y color"
                      >
                        <Palette size={16} />
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
                        onClick={() => openStyleModalEdit(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"
                        title="Icono y color"
                      >
                        <Palette size={16} />
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

      {styleModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-style-modal-title"
          onClick={() => setStyleModal(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 id="category-style-modal-title" className="text-base font-semibold text-slate-900">
                {styleModal.mode === 'new' ? 'Nueva categoría' : 'Estilo de categoría'}
              </h3>
              <button
                type="button"
                onClick={() => setStyleModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-slate-100 px-2 pt-2">
              <button
                type="button"
                onClick={() => setModalTab('icons')}
                className={`flex-1 rounded-t-lg py-2.5 text-sm font-medium transition-colors ${
                  modalTab === 'icons'
                    ? 'border-b-2 border-indigo-600 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Iconos
              </button>
              <button
                type="button"
                onClick={() => setModalTab('colors')}
                className={`flex-1 rounded-t-lg py-2.5 text-sm font-medium transition-colors ${
                  modalTab === 'colors'
                    ? 'border-b-2 border-indigo-600 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Color
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {modalTab === 'icons' && (
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {CATEGORY_ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateModalIcon(opt.id)}
                      className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${
                        styleModal.icon === opt.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      title={opt.label}
                    >
                      <opt.Icon size={20} />
                    </button>
                  ))}
                </div>
              )}

              {modalTab === 'colors' && (
                <div className="grid grid-cols-9 gap-1.5">
                  {CATEGORY_COLOR_OPTIONS.map(({ id, className }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateModalColor(id)}
                      aria-label={`Color ${id}`}
                      title={id}
                      className={`aspect-square min-h-0 rounded-md border transition-transform hover:scale-105 ${className} ${
                        styleModal.color === id
                          ? 'z-10 scale-105 ring-2 ring-slate-900/45 ring-offset-2'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setStyleModal(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyStyleModal}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
