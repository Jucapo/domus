import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  ShoppingBag,
  X,
  Pencil,
} from 'lucide-react'
import CategorySection from '../components/CategorySection'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { usePriceStore } from '../store/usePriceStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { useCategoryAccordion } from '../hooks/useCategoryAccordion'
import { ALL_UNITS_MAP } from '../data/units'
import { CATEGORY_COLOR_PRODUCT_ACCENT_MAP } from '../data/category_styles'
import {
  buildProductMetaChips,
  productUnitSummaryLine,
  PRODUCT_META_CHIP_CLASS,
} from '../lib/productDisplay'

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Total pagado en la compra → precio unitario (por kg, ud, etc.) */
function paidToUnitPrice(paid, quantityRaw) {
  const paidN = parseFloat(String(paid).replace(',', '.'))
  const qty = parseFloat(String(quantityRaw).replace(',', '.'))
  if (!paidN || paidN <= 0 || !qty || qty <= 0) return null
  return paidN / qty
}

const TABS = [
  { id: 'pending', label: 'Por registrar' },
  { id: 'history', label: 'Historial' },
]

export default function Precios() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const allCategories = useCategoryStore((s) => s.categories)

  const pendingProducts = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.pendingRegistration,
      ),
    [allProducts, householdId],
  )

  const [activeTab, setActiveTab] = useState(
    pendingProducts.length > 0 ? 'pending' : 'history',
  )

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
          Precios
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Registra y compara los precios de tus compras
        </p>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 md:mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingProducts.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                {pendingProducts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'pending' ? (
        <PendingTab householdId={householdId} products={pendingProducts} />
      ) : (
        <HistoryTab householdId={householdId} />
      )}
    </div>
  )
}

function PendingTab({ householdId, products }) {
  const allProducts = useProductStore((s) => s.products)
  const completeRegistration = useProductStore((s) => s.completeRegistration)
  const addInventoryFromPurchase = useProductStore((s) => s.addInventoryFromPurchase)
  const skipRegistration = useProductStore((s) => s.skipRegistration)
  const addRecord = usePriceStore((s) => s.addRecord)
  const allRecords = usePriceStore((s) => s.records)

  const householdProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.householdId === householdId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allProducts, householdId],
  )

  const allStores = useMemo(() => {
    const set = new Set(
      allRecords
        .filter((r) => r.householdId === householdId)
        .map((r) => r.store),
    )
    return [...set].sort()
  }, [allRecords, householdId])

  const [activeFormId, setActiveFormId] = useState(null)
  const [form, setForm] = useState({
    quantity: '1',
    price: '',
    store: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    productId: '',
    quantity: '1',
    price: '',
    store: '',
    date: new Date().toISOString().split('T')[0],
  })

  const startForm = (product) => {
    setActiveFormId(product.id)
    setShowManualForm(false)
    setForm({
      quantity: '1',
      price: '',
      store: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const handleSubmit = (e, product) => {
    e.preventDefault()
    const unitPrice = paidToUnitPrice(form.price, form.quantity)
    if (!unitPrice || !form.store.trim()) return
    const qty = parseFloat(String(form.quantity).replace(',', '.')) || 1

    addRecord({
      productId: product.id,
      householdId,
      price: unitPrice,
      quantity: qty,
      store: form.store.trim(),
      date: form.date,
    })
    completeRegistration(product.id, Math.max(1, Math.round(qty)))
    setActiveFormId(null)
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    const unitPrice = paidToUnitPrice(manualForm.price, manualForm.quantity)
    if (!manualForm.productId || !unitPrice || !manualForm.store.trim()) return
    const qty = parseFloat(String(manualForm.quantity).replace(',', '.')) || 1

    addRecord({
      productId: manualForm.productId,
      householdId,
      price: unitPrice,
      quantity: qty,
      store: manualForm.store.trim(),
      date: manualForm.date,
    })

    await addInventoryFromPurchase(manualForm.productId, qty)

    setManualForm({ productId: '', quantity: '1', price: '', store: '', date: new Date().toISOString().split('T')[0] })
    setShowManualForm(false)
  }

  const selectedManualProduct = householdProducts.find((p) => p.id === manualForm.productId)
  const manualUnit = selectedManualProduct ? ALL_UNITS_MAP[selectedManualProduct.displayUnit] : null

  const allCategories = useCategoryStore((s) => s.categories)
  const categoryMetaByName = useMemo(() => {
    const map = new Map()
    allCategories
      .filter((c) => c.householdId === householdId)
      .forEach((c) => map.set(c.name, { icon: c.icon || 'tag', color: c.color || 'indigo' }))
    return map
  }, [allCategories, householdId])

  const [pendingSearch, setPendingSearch] = useState('')
  const filteredPending = useMemo(() => {
    const q = pendingSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, pendingSearch])

  const pendingCategoryNames = useMemo(() => {
    const counts = new Map()
    for (const p of filteredPending) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => {
      const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0)
      if (diff !== 0) return diff
      return a.localeCompare(b)
    })
  }, [filteredPending])

  const { toggleCategory: togglePendingCategory, isCategoryCollapsed: isPendingCategoryCollapsed } =
    useCategoryAccordion(householdId, 'precios-pending')

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowManualForm(!showManualForm)
            setActiveFormId(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <ShoppingBag size={15} />
          Registrar compra
        </button>
      </div>

      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="rounded-xl border border-violet-200 bg-violet-50/30 p-3 md:p-4"
        >
          <p className="mb-3 text-sm font-medium text-slate-700">Registrar compra manual</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Producto</label>
              <select
                value={manualForm.productId}
                onChange={(e) => setManualForm({ ...manualForm, productId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="" disabled>Seleccionar producto...</option>
                {householdProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.category ? ` (${p.category})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Cantidad comprada</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {manualUnit && (
                  <span className="shrink-0 text-xs text-slate-400">{manualUnit.abbreviation}</span>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Total pagado (COP)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="$"
                value={manualForm.price}
                onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Lugar de compra</label>
              <input
                type="text"
                placeholder="Tienda"
                value={manualForm.store}
                onChange={(e) => setManualForm({ ...manualForm, store: e.target.value })}
                list="manual-stores"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {allStores.length > 0 && (
                <datalist id="manual-stores">
                  {allStores.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fecha</label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 md:py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <ClipboardList size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            No hay compras por registrar
          </p>
          <p className="mt-1 max-w-xs px-4 text-center text-xs text-slate-500">
            Cuando marques un producto como &ldquo;Comprado&rdquo; en la lista de
            compras, aparecerá aquí. También puedes usar el botón
            &ldquo;Registrar compra&rdquo; para agregar una compra manual.
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
          <div className="space-y-5 md:space-y-6">
            {filteredPending.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                Ningún producto coincide con la búsqueda.
              </p>
            )}
            {pendingCategoryNames.map((category) => {
              const categoryProducts = filteredPending
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
                  isCollapsed={isPendingCategoryCollapsed(category)}
                  onToggle={() => togglePendingCategory(category)}
                >
                  {categoryProducts.map((product) => {
            const unit = ALL_UNITS_MAP[product.displayUnit]
            const isFormOpen = activeFormId === product.id

            return (
              <div
                key={product.id}
                className={`overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-sm ${productAccent}`}
              >
                <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-5 md:py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <ClipboardList size={16} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                        <span className="min-w-0 truncate text-sm font-medium text-slate-900 md:text-base">
                          {product.name}
                        </span>
                        {buildProductMetaChips(product).map((chip) => (
                          <span
                            key={`${product.id}:${chip.key}`}
                            className={PRODUCT_META_CHIP_CLASS}
                          >
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
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => skipRegistration(product.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2 md:text-sm"
                      title="Omitir registro"
                    >
                      <X size={14} />
                      <span className="hidden md:inline text-slate-500">Omitir</span>
                    </button>
                    {!isFormOpen && (
                      <button
                        onClick={() => startForm(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 md:px-3"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Registrar</span>
                      </button>
                    )}
                  </div>
                </div>

                {isFormOpen && (
                  <form
                    onSubmit={(e) => handleSubmit(e, product)}
                    className="border-t border-slate-100 bg-slate-50/50 px-3 py-3 md:px-5 md:py-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Cantidad comprada
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="number"
                            min="0.001"
                            step="any"
                            value={form.quantity}
                            onChange={(e) =>
                              setForm({ ...form, quantity: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          {unit && (
                            <span className="shrink-0 text-xs text-slate-400">
                              {unit.abbreviation}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Total pagado (COP)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="$"
                          value={form.price}
                          onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Guardamos precio por unidad (total ÷ cantidad)
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Lugar de compra
                        </label>
                        <input
                          type="text"
                          placeholder="Tienda"
                          value={form.store}
                          onChange={(e) =>
                            setForm({ ...form, store: e.target.value })
                          }
                          list="global-stores"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        {allStores.length > 0 && (
                          <datalist id="global-stores">
                            {allStores.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveFormId(null)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </form>
                )}
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

function HistoryTab({ householdId }) {
  const allProducts = useProductStore((s) => s.products)
  const allRecords = usePriceStore((s) => s.records)
  const allCategories = useCategoryStore((s) => s.categories)

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId),
    [allProducts, householdId],
  )

  const recordsByProduct = useMemo(() => {
    const map = {}
    allRecords
      .filter((r) => r.householdId === householdId)
      .forEach((r) => {
        if (!map[r.productId]) map[r.productId] = []
        map[r.productId].push(r)
      })
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => b.date.localeCompare(a.date)),
    )
    return map
  }, [allRecords, householdId])

  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  const historyCategoryNames = useMemo(() => {
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

  const categoryMetaByName = useMemo(() => {
    const map = new Map()
    allCategories
      .filter((c) => c.householdId === householdId)
      .forEach((c) => map.set(c.name, { icon: c.icon || 'tag', color: c.color || 'indigo' }))
    return map
  }, [allCategories, householdId])

  const { toggleCategory: toggleHistoryCategory, isCategoryCollapsed: isHistoryCategoryCollapsed } =
    useCategoryAccordion(householdId, 'precios-history')

  const toggle = (id) => setExpandedId(expandedId === id ? null : id)

  return (
    <>
      <div className="relative mb-4 md:mb-6">
        <Search
          size={16}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
      </div>

      <div className="space-y-5 md:space-y-6">
        {historyCategoryNames.map((category) => {
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
              isCollapsed={isHistoryCategoryCollapsed(category)}
              onToggle={() => toggleHistoryCategory(category)}
            >
              {categoryProducts.map((product) => {
                  const records = recordsByProduct[product.id] || []
                  const isExpanded = expandedId === product.id
                  const latest = records[0]
                  const previous = records[1]
                  const unit = ALL_UNITS_MAP[product.displayUnit]

                  let trend = null
                  if (latest && previous) {
                    const diff = latest.price - previous.price
                    if (diff > 0) trend = 'up'
                    else if (diff < 0) trend = 'down'
                    else trend = 'same'
                  }

                  return (
                    <div
                      key={product.id}
                      className={`overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-sm ${productAccent}`}
                    >
                      <button
                        onClick={() => toggle(product.id)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 md:px-5 md:py-4"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <span className="min-w-0 truncate text-sm font-medium text-slate-900 md:text-base">
                              {product.name}
                            </span>
                            {buildProductMetaChips(product).map((chip) => (
                              <span
                                key={`${product.id}:${chip.key}`}
                                className={PRODUCT_META_CHIP_CLASS}
                              >
                                {chip.label}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-400">
                              {productUnitSummaryLine(product)}
                            </span>
                            <span className="ml-1.5 text-slate-400">
                              · {records.length}{' '}
                              {records.length === 1 ? 'registro' : 'registros'}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {latest ? (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatPrice(latest.price)}
                                {unit && (
                                  <span className="font-normal text-slate-500">
                                    {' '}
                                    / {unit.abbreviation}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center justify-end gap-1 text-xs">
                                {trend === 'up' && (
                                  <span className="flex items-center gap-0.5 text-red-500">
                                    <TrendingUp size={12} />
                                    Subió
                                  </span>
                                )}
                                {trend === 'down' && (
                                  <span className="flex items-center gap-0.5 text-emerald-500">
                                    <TrendingDown size={12} />
                                    Bajó
                                  </span>
                                )}
                                {trend === 'same' && (
                                  <span className="flex items-center gap-0.5 text-slate-400">
                                    <Minus size={12} />
                                    Igual
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Sin registros
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <ExpandedHistory
                          product={product}
                          records={records}
                          householdId={householdId}
                        />
                      )}
                    </div>
                  )
                })}
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
    </>
  )
}

function lineTotalPaid(record) {
  const p = Number(record.price)
  const q = Number(record.quantity ?? 1)
  if (!Number.isFinite(p) || !Number.isFinite(q)) return ''
  const t = p * q
  const rounded = Math.round(t * 100) / 100
  return String(rounded % 1 === 0 ? Math.round(rounded) : rounded)
}

function ExpandedHistory({ product, records, householdId }) {
  const addRecord = usePriceStore((s) => s.addRecord)
  const updateRecord = usePriceStore((s) => s.updateRecord)
  const deleteRecord = usePriceStore((s) => s.deleteRecord)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    quantity: '1',
    price: '',
    store: '',
    date: new Date().toISOString().split('T')[0],
  })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    quantity: '1',
    price: '',
    store: '',
    date: '',
  })

  const startEdit = (record) => {
    setShowForm(false)
    setEditingId(record.id)
    setEditForm({
      quantity: String(record.quantity ?? 1),
      price: lineTotalPaid(record),
      store: record.store,
      date: record.date,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editingId) return
    const unitPrice = paidToUnitPrice(editForm.price, editForm.quantity)
    if (!unitPrice || !editForm.store.trim()) return
    const qty = parseFloat(String(editForm.quantity).replace(',', '.')) || 1
    updateRecord(editingId, {
      price: unitPrice,
      quantity: qty,
      store: editForm.store.trim(),
      date: editForm.date,
    })
    setEditingId(null)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const unitPrice = paidToUnitPrice(form.price, form.quantity)
    if (!unitPrice || !form.store.trim()) return
    const qty = parseFloat(String(form.quantity).replace(',', '.')) || 1
    addRecord({
      productId: product.id,
      householdId,
      price: unitPrice,
      quantity: qty,
      store: form.store.trim(),
      date: form.date,
    })
    setForm({
      quantity: '1',
      price: '',
      store: '',
      date: new Date().toISOString().split('T')[0],
    })
    setShowForm(false)
  }

  const stores = [...new Set(records.map((r) => r.store))].sort()

  const stats = useMemo(() => {
    if (records.length === 0) return null
    const prices = records.map((r) => r.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      cheapestStore: records.reduce((best, r) =>
        r.price < best.price ? r : best,
      ).store,
    }
  }, [records])

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-3 pb-4 md:px-5">
      {stats && (
        <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4 md:py-4">
          <p className="col-span-full -mb-1 text-center text-[10px] text-slate-400">
            Precio por unidad (
            {ALL_UNITS_MAP[product.displayUnit]?.abbreviation || product.displayUnit})
          </p>
          <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Mínimo
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatPrice(stats.min)}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Máximo
            </p>
            <p className="text-sm font-semibold text-red-500">
              {formatPrice(stats.max)}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Promedio
            </p>
            <p className="text-sm font-semibold text-slate-700">
              {formatPrice(stats.avg)}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Más barato en
            </p>
            <p className="truncate text-sm font-semibold text-indigo-600">
              {stats.cheapestStore}
            </p>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Registros
        </p>
        <button
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={12} />
          Registrar precio
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-3 rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              type="number"
              min="0.001"
              step="any"
              placeholder="Cant."
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Total COP"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div>
              <input
                type="text"
                placeholder="Lugar de compra"
                value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                list={`stores-hist-${product.id}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {stores.length > 0 && (
                <datalist id={`stores-hist-${product.id}`}>
                  {stores.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No hay registros de precio. Agrega el primero.
        </p>
      ) : (
        <div className="space-y-1.5">
          {records.map((record) => {
            const isEditing = editingId === record.id
            const unit = ALL_UNITS_MAP[product.displayUnit]

            if (isEditing) {
              return (
                <form
                  key={record.id}
                  onSubmit={handleEditSubmit}
                  className="rounded-lg border border-indigo-200 bg-white p-3 shadow-sm"
                >
                  <p className="mb-2 text-xs font-medium text-slate-600">Editar registro</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                        Cantidad
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={editForm.quantity}
                          onChange={(e) =>
                            setEditForm({ ...editForm, quantity: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        {unit && (
                          <span className="shrink-0 text-xs text-slate-400">{unit.abbreviation}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                        Total pagado (COP)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                        Lugar
                      </label>
                      <input
                        type="text"
                        value={editForm.store}
                        onChange={(e) =>
                          setEditForm({ ...editForm, store: e.target.value })
                        }
                        list={`stores-hist-${product.id}`}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, date: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-2 lg:col-span-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Precio por unidad = total ÷ cantidad (igual que al registrar)
                  </p>
                </form>
              )
            }

            return (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatPrice(record.price)}
                    {unit && (
                      <span className="font-normal text-slate-500">
                        {' '}
                        / {unit.abbreviation}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Compra: {Number(record.quantity)}{' '}
                    {unit?.abbreviation || ''} · Total {formatPrice(record.price * record.quantity)}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{record.store}</span>
                    <span className="text-slate-300">·</span>
                    {formatDate(record.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingId === record.id) setEditingId(null)
                      deleteRecord(record.id)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
