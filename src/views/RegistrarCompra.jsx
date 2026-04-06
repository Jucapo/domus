import { useState, useMemo, useRef } from 'react'
import { Plus, Trash2, Search, ShoppingBag, ClipboardList, X, FileUp } from 'lucide-react'
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
import {
  formatPrice,
  parseMoneyPositive,
  newBatchLine,
  StoreField,
  paidToUnitPrice,
} from './preciosShared'
import { E_INVOICE_PDF_SOURCES } from '../data/invoiceSources'

export default function RegistrarCompra() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const pendingProducts = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.pendingRegistration,
      ),
    [allProducts, householdId],
  )

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Registrar compra</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Registra precio y stock de lo que compraste (lista por registrar o factura completa).
            </p>
          </div>
          {pendingProducts.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
              {pendingProducts.length} por registrar
            </span>
          )}
        </div>
      </div>
      <PendingRegistrationPanel householdId={householdId} products={pendingProducts} />
    </div>
  )
}

function PendingRegistrationPanel({ householdId, products }) {
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

  const [showBatchForm, setShowBatchForm] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchPdfSourceId, setBatchPdfSourceId] = useState('canalaveral')
  const [pdfImportStatus, setPdfImportStatus] = useState({ type: 'idle', message: '' })
  const batchPdfInputRef = useRef(null)
  const [batchForm, setBatchForm] = useState(() => ({
    store: '',
    date: new Date().toISOString().split('T')[0],
    invoiceTotal: '',
    lines: [newBatchLine()],
  }))

  const startForm = (product) => {
    setActiveFormId(product.id)
    setShowBatchForm(false)
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

  const batchLinesSum = useMemo(() => {
    let sum = 0
    for (const line of batchForm.lines) {
      const p = parseMoneyPositive(line.price)
      if (p != null) sum += p
    }
    return Math.round(sum)
  }, [batchForm.lines])

  const invoiceTotalParsed = parseMoneyPositive(batchForm.invoiceTotal)
  const invoiceMatchesLines =
    invoiceTotalParsed != null && batchLinesSum === Math.round(invoiceTotalParsed)

  const addBatchLine = () => {
    setBatchForm((prev) => ({ ...prev, lines: [...prev.lines, newBatchLine()] }))
  }

  const removeBatchLine = (lineId) => {
    setBatchForm((prev) => {
      if (prev.lines.length <= 1) {
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.id === lineId ? { ...newBatchLine(), id: l.id } : l,
          ),
        }
      }
      return { ...prev, lines: prev.lines.filter((l) => l.id !== lineId) }
    })
  }

  const updateBatchLine = (lineId, patch) => {
    setBatchForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    }))
  }

  const handleBatchPdfChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const looksPdf =
      file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
    if (!looksPdf) {
      setPdfImportStatus({ type: 'error', message: 'El archivo debe ser un PDF.' })
      return
    }
    setPdfImportStatus({ type: 'loading', message: 'Leyendo PDF…' })
    try {
      const {
        buildBarcodeToProductIdMap,
        extractPdfText,
        parsePdfForBatchForm,
        parsedItemsToBatchLines,
      } = await import('../lib/invoicePdfImport')
      const text = await extractPdfText(file)
      const parsed = parsePdfForBatchForm(text, batchPdfSourceId)
      if (parsed.items.length === 0) {
        setPdfImportStatus({
          type: 'error',
          message:
            'No se reconocieron líneas en este PDF. Prueba otra cadena o completa la factura a mano.',
        })
        return
      }
      const barcodeMap = buildBarcodeToProductIdMap(householdProducts)
      const lines = parsedItemsToBatchLines(parsed.items, barcodeMap, newBatchLine)
      const matched = lines.filter((l) => l.productId).length
      setBatchForm((prev) => ({
        ...prev,
        date: parsed.date || prev.date,
        invoiceTotal:
          parsed.invoiceTotal != null ? String(parsed.invoiceTotal) : prev.invoiceTotal,
        store:
          !prev.store.trim() && parsed.storeGuess ? parsed.storeGuess : prev.store,
        lines,
      }))
      setPdfImportStatus({
        type: 'ok',
        message: `${parsed.items.length} líneas · ${matched} con producto por código de barras · el resto, elige producto manualmente`,
      })
    } catch (err) {
      setPdfImportStatus({
        type: 'error',
        message: err?.message ? String(err.message) : 'No se pudo leer el PDF.',
      })
    }
  }

  const handleBatchSubmit = async (e) => {
    e.preventDefault()
    if (!batchForm.store.trim() || batchSaving) return

    const validLines = []
    for (const line of batchForm.lines) {
      if (!line.productId) continue
      const qty = parseFloat(String(line.quantity).replace(',', '.'))
      const unitPrice = paidToUnitPrice(line.price, line.quantity)
      const lineTotal = parseMoneyPositive(line.price)
      if (!unitPrice || !qty || qty <= 0 || lineTotal == null) continue
      validLines.push({ productId: line.productId, qty, unitPrice, lineTotal })
    }

    if (validLines.length === 0) return

    const sumRounded = Math.round(validLines.reduce((a, l) => a + l.lineTotal, 0))
    if (
      invoiceTotalParsed != null &&
      sumRounded !== Math.round(invoiceTotalParsed) &&
      !window.confirm(
        `La suma de las líneas (${formatPrice(sumRounded)}) no coincide con el total de la factura (${formatPrice(invoiceTotalParsed)}). ¿Guardar de todos modos?`,
      )
    ) {
      return
    }

    setBatchSaving(true)
    try {
      for (const line of validLines) {
        const p = householdProducts.find((x) => x.id === line.productId)
        if (!p) continue
        await addRecord({
          productId: line.productId,
          householdId,
          price: line.unitPrice,
          quantity: line.qty,
          store: batchForm.store.trim(),
          date: batchForm.date,
        })
        if (p.pendingRegistration) {
          await completeRegistration(line.productId, Math.max(1, Math.round(line.qty)))
        } else {
          await addInventoryFromPurchase(line.productId, line.qty)
        }
      }
      setBatchForm((prev) => ({
        store: prev.store,
        date: prev.date,
        invoiceTotal: '',
        lines: [newBatchLine()],
      }))
      setPdfImportStatus({ type: 'idle', message: '' })
      setShowBatchForm(false)
    } finally {
      setBatchSaving(false)
    }
  }

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
            setShowBatchForm(!showBatchForm)
            setActiveFormId(null)
            setPdfImportStatus({ type: 'idle', message: '' })
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          <ShoppingBag size={15} />
          Registrar factura
        </button>
      </div>

      {showBatchForm && (
        <form
          onSubmit={handleBatchSubmit}
          className="rounded-xl border border-violet-200 bg-violet-50/30 p-3 md:p-4"
        >
          <p className="mb-1 text-sm font-medium text-slate-700">
            Registrar varios productos de una factura
          </p>
          <p className="mb-4 text-xs text-slate-500">
            Una fila por producto. La suma de &ldquo;Total línea&rdquo; debe coincidir con el total de la
            factura (opcional pero recomendado). Puedes adjuntar el PDF: se rellenan cantidad y total por
            línea; el producto solo se enlaza si el código de barras del PDF coincide con uno de tu
            inventario (el nombre en la factura puede ser distinto).
          </p>

          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-violet-100 bg-white/90 p-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Formato de la factura (PDF)
              </label>
              <select
                value={batchPdfSourceId}
                onChange={(e) => setBatchPdfSourceId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {E_INVOICE_PDF_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                ref={batchPdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleBatchPdfChange}
              />
              <button
                type="button"
                disabled={pdfImportStatus.type === 'loading'}
                onClick={() => batchPdfInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-60"
              >
                <FileUp size={16} />
                {pdfImportStatus.type === 'loading' ? 'Leyendo…' : 'Adjuntar factura PDF'}
              </button>
            </div>
            {pdfImportStatus.type !== 'idle' ? (
              <p
                className={`text-xs sm:flex-1 sm:min-w-[200px] ${
                  pdfImportStatus.type === 'error'
                    ? 'text-red-600'
                    : pdfImportStatus.type === 'ok'
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                }`}
              >
                {pdfImportStatus.message}
              </p>
            ) : null}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fecha</label>
              <input
                type="date"
                value={batchForm.date}
                onChange={(e) => setBatchForm({ ...batchForm, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <StoreField
                label="Lugar de compra"
                value={batchForm.store}
                onChange={(v) => setBatchForm({ ...batchForm, store: v })}
                datalistId="batch-invoice-stores"
                historyStores={allStores}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Total factura (COP, opcional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Total del ticket"
                value={batchForm.invoiceTotal}
                onChange={(e) => setBatchForm({ ...batchForm, invoiceTotal: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-violet-100 bg-white/80">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2 pl-3">Producto</th>
                  <th className="w-28 px-2 py-2">Cantidad</th>
                  <th className="w-36 px-2 py-2">Total línea (COP)</th>
                  <th className="w-12 px-2 py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {batchForm.lines.map((line) => {
                  const p = householdProducts.find((x) => x.id === line.productId)
                  const u = p ? ALL_UNITS_MAP[p.displayUnit] : null
                  return (
                    <tr key={line.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2 pl-3 align-middle">
                        <select
                          value={line.productId}
                          onChange={(e) => updateBatchLine(line.id, { productId: e.target.value })}
                          className="w-full max-w-[280px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none md:max-w-none"
                        >
                          <option value="">Seleccionar…</option>
                          {householdProducts.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name}
                              {prod.category ? ` (${prod.category})` : ''}
                              {prod.pendingRegistration ? ' · por registrar' : ''}
                            </option>
                          ))}
                        </select>
                        {(line.invoiceDesc || line.invoiceBarcode) && (
                          <p className="mt-1 max-w-md text-[10px] leading-snug text-slate-500">
                            {line.invoiceDesc ? (
                              <span className="block truncate" title={line.invoiceDesc}>
                                Factura: {line.invoiceDesc}
                              </span>
                            ) : null}
                            {line.invoiceBarcode ? (
                              <span>
                                Código: {line.invoiceBarcode}
                                {!line.productId ? ' · sin match en inventario' : ''}
                              </span>
                            ) : null}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => updateBatchLine(line.id, { quantity: e.target.value })}
                            className="w-full min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          {u ? (
                            <span className="shrink-0 text-[10px] text-slate-400">{u.abbreviation}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="$"
                          value={line.price}
                          onChange={(e) => updateBatchLine(line.id, { price: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 pr-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => removeBatchLine(line.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                          title="Quitar línea"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addBatchLine}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
            >
              <Plus size={16} />
              Agregar línea
            </button>

            <div className="flex flex-col gap-1 text-sm sm:items-end">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-slate-600">Suma líneas:</span>
                <span className="font-semibold text-slate-900">{formatPrice(batchLinesSum)}</span>
                {invoiceTotalParsed != null ? (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">Factura:</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(Math.round(invoiceTotalParsed))}
                    </span>
                  </>
                ) : null}
              </div>
              {invoiceTotalParsed != null ? (
                <p
                  className={`text-xs font-medium ${
                    invoiceMatchesLines ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {invoiceMatchesLines
                    ? '✓ Coincide con el total de la factura'
                    : `Diferencia: ${formatPrice(batchLinesSum - Math.round(invoiceTotalParsed))}`}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Indica el total de la factura arriba para comprobar que cuadra.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-violet-100 pt-4">
            <button
              type="button"
              onClick={() => setShowBatchForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={batchSaving}
              className="min-w-[140px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {batchSaving ? 'Guardando…' : 'Guardar todo'}
            </button>
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
            Cuando marques un producto como &ldquo;Comprado&rdquo; en la lista de compras, aparecerá
            aquí. También puedes usar &ldquo;Registrar factura&rdquo; para cargar varios productos del
            mismo ticket.
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      </div>
                      <StoreField
                        label="Lugar de compra"
                        value={form.store}
                        onChange={(v) => setForm({ ...form, store: v })}
                        datalistId={`pending-row-store-${product.id}`}
                        historyStores={allStores}
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveFormId(null)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="min-w-[120px] rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
