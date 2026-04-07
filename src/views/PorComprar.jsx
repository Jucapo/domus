import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Check, Trash2, Search, Plus } from 'lucide-react'
import CategorySection from '../components/CategorySection'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { ALL_UNITS_MAP } from '../data/units'
import { useCategoryStore } from '../store/useCategoryStore'
import { useCategoryAccordion } from '../hooks/useCategoryAccordion'
import { CATEGORY_COLOR_PRODUCT_ACCENT_MAP } from '../data/category_styles'
import { toTitleCase } from '../lib/textCase'
import {
  buildProductMetaChips,
  productMetaChipClassName,
  productUnitSummaryLine,
  PRODUCT_DISPLAY_UNIT_CHIP_CLASS,
} from '../lib/productDisplay'

export default function PorComprar() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const allCategories = useCategoryStore((s) => s.categories)
  const markAsBought = useProductStore((s) => s.markAsBought)
  const removeFromShoppingList = useProductStore((s) => s.removeFromShoppingList)
  const addToShoppingList = useProductStore((s) => s.addToShoppingList)

  const products = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.inShoppingList,
      ),
    [allProducts, householdId],
  )

  const categoryMetaByName = useMemo(() => {
    const map = new Map()
    allCategories
      .filter((c) => c.householdId === householdId)
      .forEach((c) => map.set(c.name, { icon: c.icon || 'tag', color: c.color || 'indigo' }))
    return map
  }, [allCategories, householdId])

  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, search])

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
    'por-comprar',
  )

  const notOnShoppingList = useMemo(
    () =>
      allProducts
        .filter((p) => p.householdId === householdId && !p.inShoppingList)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allProducts, householdId],
  )

  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const pickerMatches = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    let list = notOnShoppingList
    if (q) {
      list = notOnShoppingList.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)),
      )
    }
    return list.slice(0, 50)
  }, [notOnShoppingList, pickerQuery])

  const handlePickProduct = async (productId) => {
    await addToShoppingList(productId)
    setPickerQuery('')
    setPickerOpen(false)
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">
          Por Comprar
        </h2>
        <p className="mt-0 text-sm text-slate-500 md:mt-0.5">
          Productos en la lista de compras &mdash; {products.length}{' '}
          {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      <div className="relative z-20 mb-4 md:mb-6">
        <label className="mb-1.5 block text-xs font-medium text-slate-600">
          Añadir producto a la lista (pendiente por comprar)
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            autoComplete="off"
            placeholder="Buscar en tu inventario…"
            value={pickerQuery}
            onChange={(e) => {
              setPickerQuery(e.target.value)
              setPickerOpen(true)
            }}
            onFocus={() => setPickerOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setPickerOpen(false), 180)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            aria-expanded={pickerOpen}
            aria-controls="por-comprar-picker-list"
            aria-autocomplete="list"
          />
          {pickerOpen && (
            <ul
              id="por-comprar-picker-list"
              role="listbox"
              className="absolute top-full right-0 left-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            >
              {pickerMatches.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-slate-500">
                  {notOnShoppingList.length === 0 ? (
                    <>
                      Todos tus productos ya están en la lista.{' '}
                      <Link
                        to="/gestion/productos"
                        className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
                      >
                        Crear producto
                      </Link>
                    </>
                  ) : (
                    'Ningún producto coincide.'
                  )}
                </li>
              ) : (
                pickerMatches.map((p) => (
                  <li key={p.id} role="option">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-indigo-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickProduct(p.id)}
                    >
                      <Plus size={14} className="shrink-0 text-indigo-500" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-medium">{toTitleCase(p.name)}</span>
                      {p.category ? (
                        <span className="shrink-0 text-xs text-slate-400">{p.category}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Al elegir un producto pasa a estado <span className="font-medium text-slate-600">pendiente por comprar</span>{' '}
          (mismo carrito que en Inventario).
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 md:py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <ShoppingCart size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">Lista vacía</p>
          <p className="mt-1 max-w-xs px-4 text-center text-xs text-slate-500">
            Usa el buscador de arriba para añadir productos del inventario, o márcalos desde{' '}
            <Link
              to="/"
              className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
            >
              Inventario
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-4 md:mb-6">
            <Search
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filtrar esta lista por nombre o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
          <div className="space-y-5 md:space-y-6">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                Ningún producto coincide con la búsqueda.
              </p>
            )}
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
            const unit = ALL_UNITS_MAP[product.displayUnit]
            const unitSummary = productUnitSummaryLine(product)
            return (
              <div
                key={product.id}
                className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-sm transition-shadow hover:shadow-md md:px-5 md:py-4 ${productAccent}`}
              >
                <div className="flex min-w-0 items-center gap-3 md:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 md:h-10 md:w-10">
                    <ShoppingCart size={16} className="text-amber-500 md:hidden" />
                    <ShoppingCart size={18} className="hidden text-amber-500 md:block" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      <span className="min-w-0 truncate text-sm font-medium text-slate-900 md:text-base">
                        {toTitleCase(product.name)}
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
                      {product.quantity > 0 && (
                        <span className="text-slate-400">
                          · En casa: {product.quantity}
                          {unit ? unit.abbreviation : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                  <button
                    onClick={() => removeFromShoppingList(product.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2"
                    title="Quitar de la lista sin comprar"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => markAsBought(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 md:gap-2 md:px-3"
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Comprado</span>
                  </button>
                </div>
              </div>
                  )
                })}
                </CategorySection>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
