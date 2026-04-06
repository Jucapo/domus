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
  X,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { usePriceStore } from '../store/usePriceStore'
import { UNITS } from '../data/mock'

const unitMap = Object.fromEntries(UNITS.map((u) => [u.id, u]))

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

const TABS = [
  { id: 'pending', label: 'Por registrar' },
  { id: 'history', label: 'Historial' },
]

export default function Precios() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)

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
  const completeRegistration = useProductStore((s) => s.completeRegistration)
  const skipRegistration = useProductStore((s) => s.skipRegistration)
  const addRecord = usePriceStore((s) => s.addRecord)
  const allRecords = usePriceStore((s) => s.records)

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

  const startForm = (product) => {
    setActiveFormId(product.id)
    setForm({
      quantity: '1',
      price: '',
      store: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const handleSubmit = (e, product) => {
    e.preventDefault()
    const quantity = parseInt(form.quantity) || 0
    const price = parseFloat(form.price)
    if (quantity <= 0 || !price || price <= 0 || !form.store.trim()) return

    addRecord({
      productId: product.id,
      householdId,
      price,
      store: form.store.trim(),
      date: form.date,
    })
    completeRegistration(product.id, quantity)
    setActiveFormId(null)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 md:py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <ClipboardList size={24} className="text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-slate-700">
          No hay compras por registrar
        </p>
        <p className="mt-1 max-w-xs px-4 text-center text-xs text-slate-500">
          Cuando marques un producto como &ldquo;Comprado&rdquo; en la lista de
          compras, aparecerá aquí para que registres precio y cantidad.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {products.map((product) => {
        const unit = unitMap[product.unit]
        const isFormOpen = activeFormId === product.id

        return (
          <div
            key={product.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-5 md:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <ClipboardList size={16} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 md:text-base">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {product.category}
                    {unit && (
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-400">
                        {unit.label}
                      </span>
                    )}
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
                        min="1"
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
                      Precio pagado
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
    </div>
  )
}

function HistoryTab({ householdId }) {
  const allProducts = useProductStore((s) => s.products)
  const allRecords = usePriceStore((s) => s.records)

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

  const categories = [...new Set(filtered.map((p) => p.category))].sort()

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
        {categories.map((category) => {
          const categoryProducts = filtered.filter(
            (p) => p.category === category,
          )
          return (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 md:mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryProducts.map((product) => {
                  const records = recordsByProduct[product.id] || []
                  const isExpanded = expandedId === product.id
                  const latest = records[0]
                  const previous = records[1]
                  const unit = unitMap[product.unit]

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
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        onClick={() => toggle(product.id)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 md:px-5 md:py-4"
                      >
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
                            <span className="ml-1.5 text-slate-400">
                              {records.length}{' '}
                              {records.length === 1 ? 'registro' : 'registros'}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {latest ? (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatPrice(latest.price)}
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
              </div>
            </div>
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

function ExpandedHistory({ product, records, householdId }) {
  const addRecord = usePriceStore((s) => s.addRecord)
  const deleteRecord = usePriceStore((s) => s.deleteRecord)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    price: '',
    store: '',
    date: new Date().toISOString().split('T')[0],
  })

  const handleAdd = (e) => {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (!price || price <= 0 || !form.store.trim()) return
    addRecord({
      productId: product.id,
      householdId,
      price,
      store: form.store.trim(),
      date: form.date,
    })
    setForm({
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
          onClick={() => setShowForm(!showForm)}
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              type="number"
              step="any"
              min="0"
              placeholder="Precio"
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
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {formatPrice(record.price)}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{record.store}</span>
                  <span className="text-slate-300">·</span>
                  {formatDate(record.date)}
                </p>
              </div>
              <button
                onClick={() => deleteRecord(record.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
