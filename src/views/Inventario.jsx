import { useState, useMemo } from 'react'
import { Plus, Minus, Search, PackagePlus, ShoppingCart, Package, ChevronDown, ChevronUp } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import CategorySection from '../components/CategorySection'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { useCategoryAccordion } from '../hooks/useCategoryAccordion'
import {
  BASE_UNITS,
  PACKAGE_UNITS,
  isPackageUnit,
  ALL_UNITS_MAP,
  packageContentRowLabel,
} from '../data/units'
import {
  buildProductMetaChips,
  productUnitSummaryLine,
  PRODUCT_META_CHIP_CLASS,
} from '../lib/productDisplay'
import { CATEGORY_COLOR_PRODUCT_ACCENT_MAP } from '../data/category_styles'

/** Hay stock si la cantidad es mayor que cero (cualquier unidad de medida). */
function productHasStock(product) {
  const q = Number(product.quantity)
  return Number.isFinite(q) && q > 0
}

function InventoryProductRow({
  product,
  productAccent,
  onDecrement,
  onIncrement,
  onToggleShopping,
}) {
  const unit = ALL_UNITS_MAP[product.displayUnit]
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between md:px-5 md:py-4 ${productAccent}`}
    >
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Package size={18} className="text-slate-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span className="min-w-0 truncate text-sm font-medium text-slate-900 md:text-base">
              {product.name}
            </span>
            {buildProductMetaChips(product).map((chip) => (
              <span key={`${product.id}:${chip.key}`} className={PRODUCT_META_CHIP_CLASS}>
                {chip.label}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-400">
              {productUnitSummaryLine(product)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto md:gap-3">
        <button
          type="button"
          onClick={() => onDecrement(product.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Minus size={14} />
        </button>
        <span
          className={`min-w-[2.5rem] text-center text-sm font-semibold ${
            product.quantity === 0 ? 'text-red-500' : 'text-slate-900'
          }`}
        >
          {product.quantity}
          {unit && (
            <span className="ml-0.5 text-xs font-normal text-slate-400">{unit.abbreviation}</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => onIncrement(product.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => onToggleShopping(product.id)}
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
      </div>
    </div>
  )
}

export default function Inventario() {
  const navigate = useNavigate()
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

  const categoryMetaByName = useMemo(() => {
    const map = new Map()
    householdCategories.forEach((c) => {
      map.set(c.name, { icon: c.icon || 'tag', color: c.color || 'indigo' })
    })
    return map
  }, [householdCategories])

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId && p.visibleInInventory !== false),
    [allProducts, householdId],
  )

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    quantity: 1,
    displayUnit: 'unit',
    brand: '',
    contentAmount: '',
    contentUnit: '',
    imageUrl: '',
    notes: '',
    barcode: '',
  })
  const [showOptional, setShowOptional] = useState(false)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  const categories = useMemo(() => {
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
    'inventory',
  )

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newProduct.name.trim() || !newProduct.categoryId) return
    addProduct({
      ...newProduct,
      householdId,
      contentAmount: newProduct.contentAmount ? parseFloat(newProduct.contentAmount) : null,
      contentUnit: newProduct.contentUnit || null,
      barcode: newProduct.barcode.trim(),
    })
    setNewProduct({
      name: '',
      categoryId: '',
      quantity: 1,
      displayUnit: 'unit',
      brand: '',
      contentAmount: '',
      contentUnit: '',
      imageUrl: '',
      notes: '',
      barcode: '',
    })
    setShowOptional(false)
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
              value={newProduct.categoryId}
              onChange={(e) => {
                if (e.target.value === '__create__') {
                  navigate('/gestion/categorias')
                  return
                }
                setNewProduct({ ...newProduct, categoryId: e.target.value })
              }}
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="" disabled>
                Categoría
              </option>
              {householdCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__create__">+ Crear categoría</option>
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
                value={newProduct.displayUnit}
                onChange={(e) => {
                  const val = e.target.value
                  setNewProduct({
                    ...newProduct,
                    displayUnit: val,
                    contentAmount: isPackageUnit(val) ? newProduct.contentAmount : '',
                    contentUnit: isPackageUnit(val) ? newProduct.contentUnit : '',
                  })
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
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
            {isPackageUnit(newProduct.displayUnit) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  {packageContentRowLabel(newProduct.displayUnit)}:
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Cant."
                  value={newProduct.contentAmount}
                  onChange={(e) => setNewProduct({ ...newProduct, contentAmount: e.target.value })}
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                <select
                  value={newProduct.contentUnit}
                  onChange={(e) => setNewProduct({ ...newProduct, contentUnit: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="">Seleccionar medida…</option>
                  {BASE_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showOptional ? 'Ocultar detalles' : 'Más detalles (marca, código de barras, foto...)'}
          </button>

          {showOptional && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                placeholder="Marca"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Código de barras (opcional)"
                value={newProduct.barcode}
                onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Foto</label>
                <ImageUploader
                  value={newProduct.imageUrl}
                  onChange={(url) => setNewProduct({ ...newProduct, imageUrl: url })}
                />
              </div>
              <input
                type="text"
                placeholder="Notas adicionales"
                value={newProduct.notes}
                onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          )}
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
        {categories.map((category) => {
          const sorted = filtered
            .filter((p) => p.category === category)
            .sort((a, b) => a.name.localeCompare(b.name))
          const inStock = sorted.filter(productHasStock)
          const outOfStock = sorted.filter((p) => !productHasStock(p))
          const meta = categoryMetaByName.get(category) || { icon: 'tag', color: 'slate' }
          const productAccent =
            CATEGORY_COLOR_PRODUCT_ACCENT_MAP[meta.color] || 'border-l-4 border-l-slate-500'

          return (
            <CategorySection
              key={category}
              categoryName={category}
              productCount={sorted.length}
              meta={meta}
              isCollapsed={isCategoryCollapsed(category)}
              onToggle={() => toggleCategory(category)}
            >
              {inStock.map((product) => (
                <InventoryProductRow
                  key={product.id}
                  product={product}
                  productAccent={productAccent}
                  onDecrement={decrement}
                  onIncrement={increment}
                  onToggleShopping={toggleShoppingList}
                />
              ))}
              {inStock.length > 0 && outOfStock.length > 0 && (
                <div
                  className="flex items-center gap-3 py-1"
                  role="separator"
                  aria-label="Productos sin existencias"
                >
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="shrink-0 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                    Sin existencias
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              {outOfStock.map((product) => (
                <InventoryProductRow
                  key={product.id}
                  product={product}
                  productAccent={productAccent}
                  onDecrement={decrement}
                  onIncrement={increment}
                  onToggleShopping={toggleShoppingList}
                />
              ))}
            </CategorySection>
          )
        })}

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
