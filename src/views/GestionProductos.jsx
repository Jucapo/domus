import { useState, useMemo, useEffect } from 'react'
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
import CategorySection from '../components/CategorySection'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { useCategoryAccordion } from '../hooks/useCategoryAccordion'
import {
  BASE_UNITS,
  PACKAGE_UNITS,
  isPackageUnit,
  showsAnchorStockLink,
  ALL_UNITS_MAP,
  packageContentRowLabel,
} from '../data/units'
import { CATEGORY_COLOR_PRODUCT_ACCENT_MAP } from '../data/category_styles'
import {
  buildProductMetaChips,
  productMetaChipClassName,
  productUnitSummaryLine,
  PRODUCT_DISPLAY_UNIT_CHIP_CLASS,
} from '../lib/productDisplay'

/** Etiqueta en el select de medida del contenido del empaque */
function contentUnitSelectLabel(u) {
  return u.id === 'unit' ? 'unidad(es)' : u.label
}

/** Unidades que se guardan en linked_units_per_package: las de «Unidad(es) por …» arriba */
function linkedUnitsPerPackageFromForm(form) {
  if (!showsAnchorStockLink(form.displayUnit) || !form.linkedProductId) return null
  if (form.contentUnit !== 'unit') return null
  const n = parseFloat(String(form.contentAmount ?? '').replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

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
    barcode: '',
    linkedProductId: '',
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
    barcode: '',
    linkedProductId: '',
  })
  const [search, setSearch] = useState('')

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())),
  )

  const categoryNames = useMemo(() => {
    const counts = new Map()
    for (const p of filtered) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
      if (diff !== 0) return diff
      return a.localeCompare(b)
    })
  }, [filtered])

  const { toggleCategory, isCategoryCollapsed } = useCategoryAccordion(
    householdId,
    'gestion-productos',
  )

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      categoryId: product.categoryId,
      displayUnit: product.displayUnit,
      brand: product.brand || '',
      contentAmount:
        product.contentAmount != null && product.contentAmount !== ''
          ? String(product.contentAmount)
          : product.linkedUnitsPerPackage != null
            ? String(product.linkedUnitsPerPackage)
            : '',
      contentUnit: product.contentUnit || '',
      imageUrl: product.imageUrl || '',
      notes: product.notes || '',
      barcode: product.barcode || '',
      linkedProductId: product.linkedProductId || '',
    })
  }

  const confirmEdit = (productId) => {
    const trimmed = editForm.name.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    if (showsAnchorStockLink(editForm.displayUnit) && editForm.linkedProductId) {
      if (linkedUnitsPerPackageFromForm(editForm) == null) return
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
      barcode: editForm.barcode.trim(),
      linkedProductId:
        showsAnchorStockLink(editForm.displayUnit) && editForm.linkedProductId
          ? editForm.linkedProductId
          : null,
      linkedUnitsPerPackage: linkedUnitsPerPackageFromForm(editForm),
    })
    setEditingId(null)
  }

  const handleCreate = async () => {
    const trimmed = createForm.name.trim()
    if (!trimmed || !createForm.categoryId) return
    if (showsAnchorStockLink(createForm.displayUnit) && createForm.linkedProductId) {
      if (linkedUnitsPerPackageFromForm(createForm) == null) return
    }
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
      barcode: createForm.barcode.trim(),
      linkedProductId:
        showsAnchorStockLink(createForm.displayUnit) && createForm.linkedProductId
          ? createForm.linkedProductId
          : null,
      linkedUnitsPerPackage: linkedUnitsPerPackageFromForm(createForm),
    })
    setCreateForm({
      name: '',
      categoryId: '',
      quantity: 0,
      displayUnit: 'unit',
      brand: '',
      contentAmount: '',
      contentUnit: '',
      imageUrl: '',
      notes: '',
      barcode: '',
      linkedProductId: '',
    })
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
            <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">
              Productos
            </h2>
            <p className="mt-0 text-sm text-slate-500 md:mt-0.5">
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
            products={products}
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
          placeholder="Buscar por nombre, categoría, marca o código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
      </div>

      <div className="space-y-5 md:space-y-6">
        {categoryNames.map((category) => {
          const categoryProducts = filtered
            .filter((p) => p.category === category)
            .sort((a, b) => a.name.localeCompare(b.name))
          const meta = categoryMetaByName.get(category) || { icon: 'tag', color: 'slate' }
          const productAccent =
            CATEGORY_COLOR_PRODUCT_ACCENT_MAP[meta.color] || 'border-l-4 border-l-slate-500'

          return (
            <CategorySection
              key={category}
              categoryName={category}
              productCount={categoryProducts.length}
              meta={meta}
              isCollapsed={isCategoryCollapsed(category)}
              onToggle={() => toggleCategory(category)}
            >
              {categoryProducts.map((product) => {
                const isEditing = editingId === product.id

                if (isEditing) {
                  return (
                    <EditForm
                      key={product.id}
                      product={product}
                      form={editForm}
                      setForm={setEditForm}
                      categories={categories}
                      products={products}
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
                    linkedProductName={
                      product.linkedProductId
                        ? products.find((x) => x.id === product.linkedProductId)?.name
                        : null
                    }
                    accentClass={productAccent}
                    onEdit={() => startEdit(product)}
                    onDelete={() => handleDelete(product)}
                    onToggleVisibility={() =>
                      updateProduct(product.id, {
                        visibleInInventory: product.visibleInInventory === false,
                      })
                    }
                  />
                )
              })}
            </CategorySection>
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

function ProductCard({
  product,
  linkedProductName,
  onEdit,
  onDelete,
  onToggleVisibility,
  accentClass = '',
}) {
  const unit = ALL_UNITS_MAP[product.displayUnit]
  const unitSummary = productUnitSummaryLine(product)

  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-sm transition-shadow hover:shadow-md md:px-4 md:py-3 ${accentClass}`}
    >
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
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                {product.name}
              </span>
              {buildProductMetaChips(product).map((chip) => (
                <span
                  key={`${product.id}:${chip.key}`}
                  className={productMetaChipClassName(chip.key)}
                >
                  {chip.label}
                </span>
              ))}
            </div>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
              {unitSummary ? (
                <span className={PRODUCT_DISPLAY_UNIT_CHIP_CLASS}>{unitSummary}</span>
              ) : null}
              <span className="text-slate-400">
                · Stock: {product.quantity}
                {unit && (
                  <span className="ml-0.5 text-slate-400">{unit.abbreviation}</span>
                )}
              </span>
            </p>
            {linkedProductName && (
              <p className="mt-0.5 text-[10px] text-indigo-600">
                Compras: +
                {product.linkedUnitsPerPackage ?? product.contentAmount ?? '…'}{' '}
                en «{linkedProductName}» por cada{' '}
                {unit?.abbreviation || 'ud'} registrada
              </p>
            )}
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

function LinkedStockFields({ form, setForm, products, categoryId, excludeProductId }) {
  const [query, setQuery] = useState('')
  const [anchorEnabled, setAnchorEnabled] = useState(() => Boolean(form.linkedProductId))

  useEffect(() => {
    setQuery('')
  }, [categoryId])

  const packLabel = ALL_UNITS_MAP[form.displayUnit]?.label?.toLowerCase() || 'empaque'

  const pool = useMemo(() => {
    return products.filter(
      (p) =>
        !p.linkedProductId &&
        (!excludeProductId || p.id !== excludeProductId) &&
        categoryId &&
        p.categoryId === categoryId,
    )
  }, [products, excludeProductId, categoryId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = pool
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)),
      )
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [pool, query])

  const linkNotInPool =
    Boolean(form.linkedProductId) && !pool.some((p) => p.id === form.linkedProductId)
  const selectedName = form.linkedProductId
    ? products.find((p) => p.id === form.linkedProductId)?.name
    : null

  return (
    <div className="mt-3 rounded-lg border border-indigo-100 bg-white/80 p-3">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={anchorEnabled}
          onChange={(e) => {
            const on = e.target.checked
            setAnchorEnabled(on)
            if (!on) {
              setForm({ ...form, linkedProductId: '' })
              setQuery('')
            }
          }}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30"
        />
        <span>
          <span className="text-sm font-medium text-slate-800">
            Anclar el stock a otro producto individual
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
            Elige el producto base (misma categoría). La cantidad de unidades por {packLabel} es la que
            indicaste arriba en «{packageContentRowLabel(form.displayUnit)}».
          </span>
        </span>
      </label>

      {anchorEnabled && (
        <div className="mt-3 border-t border-indigo-100/90 pt-3">
          <p className="mb-2 text-[11px] text-slate-500">
            Se listan solo productos de la <span className="font-medium text-slate-600">misma categoría</span>.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                Producto base
              </label>
              {!categoryId ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
                  Elige primero la <strong>categoría</strong> del producto arriba para poder anclar el stock.
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por nombre o marca…"
                      className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-8 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      autoComplete="off"
                    />
                  </div>
                  {linkNotInPool && selectedName && (
                    <p className="mt-1.5 text-[11px] text-amber-800">
                      El anclaje actual apunta a «{selectedName}», que no está en esta categoría. Elige
                      uno de la lista o ajusta la categoría.
                    </p>
                  )}
                  <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, linkedProductId: '' })}
                      className={`w-full border-b border-slate-100 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                        !form.linkedProductId ? 'bg-indigo-50/80 font-medium text-indigo-900' : 'text-slate-700'
                      }`}
                    >
                      Sin producto base seleccionado
                    </button>
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm({ ...form, linkedProductId: p.id })}
                        className={`w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50 ${
                          form.linkedProductId === p.id
                            ? 'bg-indigo-50/90 font-medium text-indigo-900'
                            : 'text-slate-800'
                        }`}
                      >
                        <span>{p.name}</span>
                        {p.brand ? (
                          <span className="text-slate-500"> · {p.brand}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                  {pool.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      No hay otros productos en esta categoría disponibles como base (o todos ya están
                      anclados a otro empaque).
                    </p>
                  )}
                  {pool.length > 0 && filtered.length === 0 && query.trim() !== '' && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Ningún nombre o marca coincide. Prueba otro término.
                    </p>
                  )}
                </>
              )}
            </div>
            {form.linkedProductId ? (
              <p className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-[11px] text-indigo-900">
                Se sumará al producto base la cantidad de{' '}
                <strong>
                  {form.contentAmount || '…'} unidad(es)
                </strong>{' '}
                por cada {packLabel} (la misma cifra de arriba).
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function CreateForm({ form, setForm, categories, products, onConfirm, onCancel, navigate }) {
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
            setForm({
              ...form,
              categoryId: e.target.value,
              linkedProductId: '',
            })
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
              const stillPack = isPackageUnit(val)
              const anchorOk = showsAnchorStockLink(val)
              setForm({
                ...form,
                displayUnit: val,
                contentAmount: stillPack ? form.contentAmount : '',
                contentUnit: stillPack ? form.contentUnit : '',
                linkedProductId: stillPack && anchorOk ? form.linkedProductId : '',
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
        <>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            {packageContentRowLabel(form.displayUnit)}:
          </span>
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
            onChange={(e) => {
              const v = e.target.value
              setForm({
                ...form,
                contentUnit: v,
                ...(v !== 'unit' ? { linkedProductId: '' } : {}),
              })
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Seleccionar medida…</option>
            {BASE_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {contentUnitSelectLabel(u)}
              </option>
            ))}
          </select>
        </div>
        {showsAnchorStockLink(form.displayUnit) &&
          (form.contentUnit === 'unit' || Boolean(form.linkedProductId)) && (
          <LinkedStockFields
            key={form.categoryId || '_'}
            form={form}
            setForm={setForm}
            products={products}
            categoryId={form.categoryId}
          />
        )}
        </>
      )}

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showOptional ? 'Ocultar detalles' : 'Más detalles (marca, código de barras, foto...)'}
      </button>

      {showOptional && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Marca</label>
            <input type="text" placeholder="Ej: Alquería, Diana..." value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Código de barras <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="EAN / UPC"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className={inputClass}
            />
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

function EditForm({ product, form, setForm, categories, products, onConfirm, onCancel, navigate }) {
  const [showOptional, setShowOptional] = useState(
    Boolean(form.brand || form.imageUrl || form.notes || form.linkedProductId || form.barcode),
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
            setForm({
              ...form,
              categoryId: e.target.value,
              linkedProductId: '',
            })
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
            const stillPack = isPackageUnit(val)
            const anchorOk = showsAnchorStockLink(val)
            setForm({
              ...form,
              displayUnit: val,
              contentAmount: stillPack ? form.contentAmount : '',
              contentUnit: stillPack ? form.contentUnit : '',
              linkedProductId: stillPack && anchorOk ? form.linkedProductId : '',
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
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              {packageContentRowLabel(form.displayUnit)}:
            </span>
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
              onChange={(e) => {
                const v = e.target.value
                setForm({
                  ...form,
                  contentUnit: v,
                  ...(v !== 'unit' ? { linkedProductId: '' } : {}),
                })
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Seleccionar medida…</option>
              {BASE_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {contentUnitSelectLabel(u)}
                </option>
              ))}
            </select>
          </div>
          {showsAnchorStockLink(form.displayUnit) &&
            (form.contentUnit === 'unit' || Boolean(form.linkedProductId)) && (
            <LinkedStockFields
              key={`${product.id}-${form.categoryId || '_'}`}
              form={form}
              setForm={setForm}
              products={products}
              categoryId={form.categoryId}
              excludeProductId={product.id}
            />
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
      >
        {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showOptional ? 'Ocultar detalles' : 'Más detalles (marca, código de barras, foto...)'}
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
              Código de barras <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="EAN / UPC"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
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
