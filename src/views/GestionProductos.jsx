import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Image,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  PackagePlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/ImageUploader'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { ALL_UNITS, BASE_UNITS, PACKAGE_UNITS, isPackageUnit, ALL_UNITS_MAP, formatProductUnit } from '../data/units'
import { CATEGORY_ICON_MAP, CATEGORY_COLOR_MAP } from '../data/category_styles'

export default function GestionProductos() {
  const navigate = useNavigate()
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)

  const allProducts = useProductStore((s) => s.products)
  const updateProduct = useProductStore((s) => s.updateProduct)
  const deleteProduct = useProductStore((s) => s.deleteProduct)
  const addProduct = useProductStore((s) => s.addProduct)

  const allCategories = useCategoryStore((s) => s.categories)
  const categories = useMemo(
    () => allCategories.filter((c) => c.householdId === householdId),
    [allCategories, householdId],
  )

  const categoryMetaByName = useMemo(() => {
    const map = new Map()
    categories.forEach((c) => map.set(c.name, { icon: c.icon || 'tag', color: c.color || 'indigo' }))
    return map
  }, [categories])

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId),
    [allProducts, householdId],
  )

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    categoryId: '',
    quantity: 0,
    displayUnit: 'unit',
    brand: '',
    contentAmount: '',
    contentUnit: '',
    imageUrl: '',
    notes: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    categoryId: '',
    displayUnit: 'unit',
    brand: '',
    contentAmount: '',
    contentUnit: '',
    imageUrl: '',
    notes: '',
  })
  const [search, setSearch] = useState('')

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())),
  )

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      categoryId: product.categoryId,
      displayUnit: product.displayUnit,
      brand: product.brand || '',
      contentAmount: product.contentAmount || '',
      contentUnit: product.contentUnit || '',
      imageUrl: product.imageUrl || '',
      notes: product.notes || '',
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
      categoryId: editForm.categoryId,
      displayUnit: editForm.displayUnit,
      brand: editForm.brand.trim(),
      contentAmount: editForm.contentAmount ? parseFloat(editForm.contentAmount) : null,
      contentUnit: editForm.contentUnit || null,
      imageUrl: editForm.imageUrl.trim(),
      notes: editForm.notes.trim(),
    })
    setEditingId(null)
  }

  const handleCreate = async () => {
    const trimmed = createForm.name.trim()
    if (!trimmed || !createForm.categoryId) return
    await addProduct({
      householdId,
      name: trimmed,
      categoryId: createForm.categoryId,
      quantity: createForm.quantity,
      displayUnit: createForm.displayUnit,
      brand: createForm.brand.trim(),
      contentAmount: createForm.contentAmount ? parseFloat(createForm.contentAmount) : null,
      contentUnit: createForm.contentUnit || null,
      imageUrl: createForm.imageUrl.trim(),
      notes: createForm.notes.trim(),
    })
    setCreateForm({ name: '', categoryId: '', quantity: 0, displayUnit: 'unit', brand: '', contentAmount: '', contentUnit: '', imageUrl: '', notes: '' })
    setShowCreateForm(false)
  }

  const handleDelete = (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}" del inventario?`)) return
    deleteProduct(product.id)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
              Productos
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {products.length}{' '}
              {products.length === 1 ? 'producto' : 'productos'} en el hogar
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 md:px-4 md:py-2.5"
        >
          <PackagePlus size={16} />
          <span className="hidden sm:inline">Agregar producto</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 md:p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Nuevo producto</p>
          <CreateForm
            form={createForm}
            setForm={setCreateForm}
            categories={categories}
            onConfirm={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            navigate={navigate}
          />
        </div>
      )}

      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o marca..."
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
              <EditForm
                key={product.id}
                product={product}
                form={editForm}
                setForm={setEditForm}
                categories={categories}
                onConfirm={() => confirmEdit(product.id)}
                onCancel={() => setEditingId(null)}
                navigate={navigate}
              />
            )
          }

          return (
            <ProductCard
              key={product.id}
              product={product}
              categoryMetaByName={categoryMetaByName}
              onEdit={() => startEdit(product)}
              onDelete={() => handleDelete(product)}
              onToggleVisibility={() =>
                updateProduct(product.id, { visibleInInventory: product.visibleInInventory === false })
              }
            />
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

function ProductCard({ product, onEdit, onDelete, onToggleVisibility, categoryMetaByName }) {
  const unit = ALL_UNITS_MAP[product.displayUnit]
  const hasExtras = product.brand || product.notes
  const meta = categoryMetaByName?.get(product.category) || null
  const CatIcon = meta ? (CATEGORY_ICON_MAP[meta.icon] || CATEGORY_ICON_MAP.tag) : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4 md:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Image size={16} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {product.name}
              {product.brand && (
                <span className="ml-1.5 font-normal text-slate-400">
                  — {product.brand}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              {meta ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
                    CATEGORY_COLOR_MAP[meta.color] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {CatIcon ? <CatIcon size={12} /> : null}
                  {product.category}
                </span>
              ) : (
                product.category
              )}
              <span className="mx-1.5 text-slate-300">·</span>
              {formatProductUnit(product)}
              <span className="mx-1.5 text-slate-300">·</span>
              Stock: {product.quantity}
            </p>
            {product.notes && (
              <p className="mt-0.5 truncate text-xs text-slate-400 italic">
                {product.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onToggleVisibility}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              product.visibleInInventory !== false
                ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                : 'text-amber-500 hover:bg-amber-50'
            }`}
            title={product.visibleInInventory !== false ? 'Ocultar del inventario' : 'Mostrar en inventario'}
          >
            {product.visibleInInventory !== false ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateForm({ form, setForm, categories, onConfirm, onCancel, navigate }) {
  const [showOptional, setShowOptional] = useState(false)

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
          placeholder="Nombre del producto"
          className={inputClass}
        />
        <select
          value={form.categoryId}
          onChange={(e) => {
            if (e.target.value === '__create__') {
              navigate('/gestion/categorias')
              return
            }
            setForm({ ...form, categoryId: e.target.value })
          }}
          className={inputClass}
        >
          <option value="" disabled>Categoría</option>
          {categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          <option value="__create__">+ Crear categoría</option>
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            placeholder="Cant."
            className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={form.displayUnit}
            onChange={(e) => {
              const val = e.target.value
              setForm({
                ...form,
                displayUnit: val,
                contentAmount: isPackageUnit(val) ? form.contentAmount : '',
                contentUnit: isPackageUnit(val) ? form.contentUnit : '',
              })
            }}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <optgroup label="Medida directa">
              {BASE_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </optgroup>
            <optgroup label="Empaques">
              {PACKAGE_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {isPackageUnit(form.displayUnit) && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Contenido por {ALL_UNITS_MAP[form.displayUnit]?.label?.toLowerCase() || 'empaque'}:</span>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Cantidad"
            value={form.contentAmount}
            onChange={(e) => setForm({ ...form, contentAmount: e.target.value })}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={form.contentUnit}
            onChange={(e) => setForm({ ...form, contentUnit: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Unidad</option>
            {BASE_UNITS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showOptional ? 'Ocultar detalles' : 'Más detalles (marca, foto, notas...)'}
      </button>

      {showOptional && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Marca</label>
            <input type="text" placeholder="Ej: Alquería, Diana..." value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Foto</label>
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Comentario</label>
            <input type="text" placeholder="Notas adicionales..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <X size={14} />
          Cancelar
        </button>
        <button onClick={onConfirm} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
          <Check size={14} />
          Guardar
        </button>
      </div>
    </>
  )
}

function EditForm({ product, form, setForm, categories, onConfirm, onCancel, navigate }) {
  const [showOptional, setShowOptional] = useState(
    Boolean(form.brand || form.imageUrl || form.notes),
  )

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none'

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 md:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder="Nombre"
          className={inputClass}
        />
        <select
          value={form.categoryId}
          onChange={(e) => {
            if (e.target.value === '__create__') {
              navigate('/gestion/categorias')
              return
            }
            setForm({ ...form, categoryId: e.target.value })
          }}
          className={inputClass}
        >
          {categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          {!categories.some((c) => c.id === form.categoryId) && (
            <option value={form.categoryId}>
              {form.categoryId} (sin categoría)
            </option>
          )}
          <option value="__create__">+ Crear categoría</option>
        </select>
        <select
          value={form.displayUnit}
          onChange={(e) => {
            const val = e.target.value
            setForm({
              ...form,
              displayUnit: val,
              contentAmount: isPackageUnit(val) ? form.contentAmount : '',
              contentUnit: isPackageUnit(val) ? form.contentUnit : '',
            })
          }}
          className={inputClass}
        >
          <optgroup label="Medida directa">
            {BASE_UNITS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </optgroup>
          <optgroup label="Empaques">
            {PACKAGE_UNITS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </optgroup>
        </select>
      </div>

      {isPackageUnit(form.displayUnit) && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Contenido por {ALL_UNITS_MAP[form.displayUnit]?.label?.toLowerCase() || 'empaque'}:</span>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Cantidad"
            value={form.contentAmount}
            onChange={(e) => setForm({ ...form, contentAmount: e.target.value })}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={form.contentUnit}
            onChange={(e) => setForm({ ...form, contentUnit: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Unidad</option>
            {BASE_UNITS.map((u) => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showOptional ? 'Ocultar detalles' : 'Más detalles (marca, foto, notas...)'}
      </button>

      {showOptional && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Marca
            </label>
            <input
              type="text"
              placeholder="Ej: Alquería, Diana..."
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Foto
            </label>
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Comentario
            </label>
            <input
              type="text"
              placeholder="Notas adicionales..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <X size={14} />
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Check size={14} />
          Guardar
        </button>
      </div>
    </div>
  )
}
