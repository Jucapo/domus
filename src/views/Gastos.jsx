import { useState, useMemo } from 'react'
import {
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Receipt,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { usePriceStore } from '../store/usePriceStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { ALL_UNITS_MAP } from '../data/units'
import { CATEGORY_ICON_MAP, CATEGORY_COLOR_SURFACE_MAP } from '../data/category_styles'

const MONTH_ABBR = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
]

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price)
}

function getPeriodForDate(date) {
  const d = new Date(date)
  if (d.getDate() >= 27) {
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 27),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 26),
    }
  }
  return {
    start: new Date(d.getFullYear(), d.getMonth() - 1, 27),
    end: new Date(d.getFullYear(), d.getMonth(), 26),
  }
}

function shiftPeriod(period, offset) {
  const s = period.start
  const newStart = new Date(s.getFullYear(), s.getMonth() + offset, 27)
  const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 26)
  return { start: newStart, end: newEnd }
}

function formatPeriodLabel(period) {
  const s = period.start
  const e = period.end
  const sMonth = MONTH_ABBR[s.getMonth()]
  const eMonth = MONTH_ABBR[e.getMonth()]
  const sYear = s.getFullYear()
  const eYear = e.getFullYear()
  if (sYear === eYear) {
    return `27 ${sMonth} – 26 ${eMonth} ${eYear}`
  }
  return `27 ${sMonth} ${sYear} – 26 ${eMonth} ${eYear}`
}

function dateInPeriod(dateStr, period) {
  const d = new Date(dateStr + 'T12:00:00')
  return d >= period.start && d <= new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate(), 23, 59, 59)
}

export default function Gastos() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const allRecords = usePriceStore((s) => s.records)
  const allCategories = useCategoryStore((s) => s.categories)

  const products = useMemo(
    () => allProducts.filter((p) => p.householdId === householdId),
    [allProducts, householdId],
  )

  const householdRecords = useMemo(
    () => allRecords.filter((r) => r.householdId === householdId),
    [allRecords, householdId],
  )

  const currentPeriod = useMemo(() => getPeriodForDate(new Date()), [])
  const [periodOffset, setPeriodOffset] = useState(0)

  const activePeriod = useMemo(
    () => (periodOffset === 0 ? currentPeriod : shiftPeriod(currentPeriod, periodOffset)),
    [currentPeriod, periodOffset],
  )

  const oldestRecordDate = useMemo(() => {
    if (householdRecords.length === 0) return null
    return householdRecords.reduce((oldest, r) =>
      r.date < oldest.date ? r : oldest,
    ).date
  }, [householdRecords])

  const canGoBack = useMemo(() => {
    if (!oldestRecordDate) return false
    const prevPeriod = shiftPeriod(activePeriod, -1)
    return new Date(oldestRecordDate + 'T12:00:00') <= new Date(prevPeriod.end.getFullYear(), prevPeriod.end.getMonth(), prevPeriod.end.getDate(), 23, 59, 59)
  }, [oldestRecordDate, activePeriod])

  const canGoForward = periodOffset < 0

  const periodRecords = useMemo(
    () => householdRecords.filter((r) => dateInPeriod(r.date, activePeriod)),
    [householdRecords, activePeriod],
  )

  const productMap = useMemo(() => {
    const map = {}
    products.forEach((p) => { map[p.id] = p })
    return map
  }, [products])

  const categoryMetaById = useMemo(() => {
    const map = new Map()
    allCategories
      .filter((c) => c.householdId === householdId)
      .forEach((c) => map.set(c.id, { icon: c.icon || 'tag', color: c.color || 'indigo', name: c.name }))
    return map
  }, [allCategories, householdId])

  const { categoryData, grandTotal } = useMemo(() => {
    const catMap = {}
    let total = 0

    periodRecords.forEach((r) => {
      const product = productMap[r.productId]
      if (!product) return

      const catName = product.category || 'Sin categoría'
      const catId = product.categoryId || '__none__'

      if (!catMap[catId]) {
        catMap[catId] = { id: catId, name: catName, total: 0, products: {} }
      }

      if (!catMap[catId].products[r.productId]) {
        const unit = ALL_UNITS_MAP[product.displayUnit]
        catMap[catId].products[r.productId] = {
          id: r.productId,
          name: product.name,
          unit: unit?.abbreviation || product.displayUnit,
          unitLabel: unit?.label || product.displayUnit,
          total: 0,
          quantity: 0,
          records: 0,
        }
      }

      catMap[catId].products[r.productId].total += r.price
      catMap[catId].products[r.productId].quantity += (r.quantity ?? 1)
      catMap[catId].products[r.productId].records += 1
      catMap[catId].total += r.price
      total += r.price
    })

    const sorted = Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .map((cat) => ({
        ...cat,
        products: Object.values(cat.products).sort((a, b) => b.total - a.total),
      }))

    return { categoryData: sorted, grandTotal: total }
  }, [periodRecords, productMap])

  const [expandedCategories, setExpandedCategories] = useState(new Set())

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
          Gastos
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Resumen de gastos por periodo
        </p>
      </div>

      <div className="mb-5 flex items-center justify-between gap-2 md:mb-6">
        <button
          onClick={() => setPeriodOffset((o) => o - 1)}
          disabled={!canGoBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronsLeft size={18} />
        </button>

        <div className="flex min-w-0 items-center justify-center gap-2 rounded-full bg-indigo-50 px-4 py-2 md:px-5">
          <CalendarDays size={16} className="shrink-0 text-indigo-500" />
          <span className="truncate text-sm font-semibold text-slate-800">
            {formatPeriodLabel(activePeriod)}
          </span>
        </div>

        <button
          onClick={() => setPeriodOffset((o) => o + 1)}
          disabled={!canGoForward}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronsRight size={18} />
        </button>
      </div>

      {periodRecords.length > 0 && (
        <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-4 md:mb-6 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Total del periodo
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            {formatPrice(grandTotal)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {periodRecords.length} {periodRecords.length === 1 ? 'registro' : 'registros'} en {categoryData.length} {categoryData.length === 1 ? 'categoría' : 'categorías'}
          </p>
        </div>
      )}

      {categoryData.length > 0 ? (
        <div className="space-y-2">
          {categoryData.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id)
            const percentage = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0
            const meta = categoryMetaById.get(cat.id) || { icon: 'tag', color: 'slate' }
            const Icon = CATEGORY_ICON_MAP[meta.icon] || CATEGORY_ICON_MAP.tag

            return (
              <div
                key={cat.id}
                className={`overflow-hidden rounded-xl border shadow-sm ${CATEGORY_COLOR_SURFACE_MAP[meta.color] || 'bg-slate-50/60 border-slate-200'}`}
              >
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/30 md:px-5"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/60">
                      <Icon size={16} className="text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {cat.name}
                      </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 md:w-28">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{percentage}%</span>
                    </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {formatPrice(cat.total)}
                    </p>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 md:px-5">
                    <div className="space-y-2">
                      {cat.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {prod.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {prod.quantity} {prod.unit}
                              <span className="mx-1.5 text-slate-300">·</span>
                              {prod.records} {prod.records === 1 ? 'compra' : 'compras'}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-slate-700">
                            {formatPrice(prod.total)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 md:py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
            <Receipt size={24} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            No hay gastos en este periodo
          </p>
          <p className="mt-1 max-w-xs px-4 text-center text-xs text-slate-500">
            Cuando registres compras desde &ldquo;Por registrar&rdquo; en Precios, el resumen aparecerá aquí.
          </p>
        </div>
      )}
    </div>
  )
}
