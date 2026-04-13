import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { usePriceStore } from '../store/usePriceStore'
import {
  formatPrice,
  formatDate,
  newBatchLine,
  paidToUnitPrice,
  parseMoneyPositive,
  StoreField,
} from './preciosShared'
import { toTitleCase } from '../lib/textCase'
import { AlertDialog, ConfirmDialog } from '../components/AppDialogs'
import { ALL_UNITS_MAP } from '../data/units'

const STORE_CHIP_FALLBACK = [
  'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80',
  'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200/80',
  'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
  'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/80',
]

function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function storeChipClasses(store) {
  const raw = String(store || '').trim()
  if (!raw) return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
  const low = raw.toLowerCase()
  if (low.includes('cañaveral') || low.includes('canalaveral')) {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
  }
  if (/\bd1\b/.test(low) || low.includes('carulla') || low.includes('éxito') || low.includes('exito')) {
    return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80'
  }
  const i = hashString(raw) % STORE_CHIP_FALLBACK.length
  return STORE_CHIP_FALLBACK[i]
}

function lineDraftFromRecord(line) {
  return {
    key: line.id,
    recordId: line.id,
    productId: line.productId,
    quantity: String(line.quantity),
    lineTotal: String(Math.round(line.price * line.quantity)),
    forThirdParty: line.forThirdParty === true,
  }
}

function emptyLineDraft() {
  const nl = newBatchLine()
  return {
    key: nl.id,
    recordId: null,
    productId: '',
    quantity: '1',
    lineTotal: '',
    forThirdParty: false,
  }
}

/** Lista de facturas guardadas (ticket agrupado). Usada dentro de Historial compras → pestaña Facturas. */
export default function FacturasListSection() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const invoices = useInvoiceStore((s) => s.invoices)
  const loading = useInvoiceStore((s) => s.loading)
  const fetchInvoices = useInvoiceStore((s) => s.fetchInvoices)
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice)
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice)
  const fetchPriceRecords = usePriceStore((s) => s.fetchRecords)
  const addRecord = usePriceStore((s) => s.addRecord)
  const updateRecord = usePriceStore((s) => s.updateRecord)
  const deleteRecord = usePriceStore((s) => s.deleteRecord)

  const allProducts = useProductStore((s) => s.products)
  const subtractInventoryFromPurchase = useProductStore((s) => s.subtractInventoryFromPurchase)
  const addInventoryFromPurchase = useProductStore((s) => s.addInventoryFromPurchase)
  const applyPurchaseQuantityDelta = useProductStore((s) => s.applyPurchaseQuantityDelta)
  const completeRegistration = useProductStore((s) => s.completeRegistration)
  const allRecords = usePriceStore((s) => s.records)

  const productNameById = useMemo(() => {
    const m = new Map()
    for (const p of allProducts) {
      if (p.householdId === householdId) m.set(p.id, p.name)
    }
    return m
  }, [allProducts, householdId])

  const householdProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.householdId === householdId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allProducts, householdId],
  )

  const allStores = useMemo(() => {
    const set = new Set(
      allRecords.filter((r) => r.householdId === householdId).map((r) => r.store),
    )
    return [...set].sort()
  }, [allRecords, householdId])

  useEffect(() => {
    if (householdId) {
      fetchInvoices(householdId)
      fetchPriceRecords(householdId)
    }
  }, [householdId, fetchInvoices, fetchPriceRecords])

  const [expandedId, setExpandedId] = useState(null)
  const [fullEditInvoiceId, setFullEditInvoiceId] = useState(null)
  const [fullEdit, setFullEdit] = useState({
    store: '',
    invoiceDate: '',
    totalCop: '',
    lines: [],
  })
  const [savingFullEdit, setSavingFullEdit] = useState(false)
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null)
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '' })

  const startFullEdit = (inv) => {
    setExpandedId(inv.id)
    setFullEditInvoiceId(inv.id)
    setFullEdit({
      store: inv.store,
      invoiceDate: inv.invoiceDate,
      totalCop: inv.totalCop != null ? String(Math.round(inv.totalCop)) : '',
      lines: inv.lines.map(lineDraftFromRecord),
    })
  }

  const cancelFullEdit = () => {
    setFullEditInvoiceId(null)
  }

  const updateLine = (key, patch) => {
    setFullEdit((f) => ({
      ...f,
      lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    }))
  }

  const removeLine = (key) => {
    setFullEdit((f) => ({
      ...f,
      lines: f.lines.length <= 1 ? f.lines : f.lines.filter((l) => l.key !== key),
    }))
  }

  const addLine = () => {
    setFullEdit((f) => ({ ...f, lines: [...f.lines, emptyLineDraft()] }))
  }

  const confirmDeleteInvoice = async () => {
    const invoiceId = deleteInvoiceId
    if (!invoiceId) return
    setDeleteInvoiceId(null)
    const { error } = await deleteInvoice(invoiceId)
    if (error) {
      setAlertDialog({
        open: true,
        title: 'No se pudo eliminar',
        message: error.message ? String(error.message) : 'Inténtalo de nuevo.',
      })
      return
    }
    if (householdId) await fetchPriceRecords(householdId)
    if (expandedId === invoiceId) setExpandedId(null)
    if (fullEditInvoiceId === invoiceId) setFullEditInvoiceId(null)
  }

  const saveFullEdit = async () => {
    const invId = fullEditInvoiceId
    if (!invId || !householdId) return
    const inv = invoices.find((i) => i.id === invId)
    if (!inv) return

    const store = fullEdit.store.trim()
    if (!store) {
      setAlertDialog({
        open: true,
        title: 'Lugar',
        message: 'Indica el lugar de compra.',
      })
      return
    }

    const validated = []
    for (const d of fullEdit.lines) {
      const qty = parseFloat(String(d.quantity).replace(',', '.'))
      const unitPrice = paidToUnitPrice(d.lineTotal, d.quantity)
      const lineTot = parseMoneyPositive(d.lineTotal)
      if (!d.productId || !unitPrice || !qty || qty <= 0 || lineTot == null) {
        setAlertDialog({
          open: true,
          title: 'Líneas',
          message: 'Cada línea necesita producto, cantidad válida y total de línea (COP).',
        })
        return
      }
      validated.push({ ...d, qty, unitPrice, lineTot })
    }

    if (validated.length === 0) {
      setAlertDialog({
        open: true,
        title: 'Líneas',
        message: 'Debe quedar al menos una línea válida.',
      })
      return
    }

    const draftRecordIds = new Set(validated.filter((d) => d.recordId).map((d) => d.recordId))
    const origById = new Map(inv.lines.map((l) => [l.id, l]))

    setSavingFullEdit(true)
    try {
      const totalParsed =
        fullEdit.totalCop.trim() === ''
          ? null
          : Number(String(fullEdit.totalCop).replace(',', '.'))
      const totalCop =
        totalParsed != null && Number.isFinite(totalParsed) ? Math.round(totalParsed) : null

      const { error: hdrErr } = await updateInvoice(invId, {
        store,
        invoiceDate: fullEdit.invoiceDate,
        totalCop,
      })
      if (hdrErr) {
        setAlertDialog({
          open: true,
          title: 'Factura',
          message: hdrErr.message ? String(hdrErr.message) : 'No se pudo actualizar la cabecera.',
        })
        return
      }

      for (const orig of inv.lines) {
        if (!draftRecordIds.has(orig.id)) {
          const { error: subErr } = await subtractInventoryFromPurchase(
            orig.productId,
            orig.quantity,
          )
          if (subErr) {
            setAlertDialog({
              open: true,
              title: 'Inventario',
              message: subErr.message
                ? String(subErr.message)
                : 'Error al revertir stock de una línea eliminada.',
            })
            return
          }
          const { error: delErr } = await deleteRecord(orig.id)
          if (delErr) {
            setAlertDialog({
              open: true,
              title: 'Registros',
              message: delErr.message ? String(delErr.message) : 'Error al borrar una línea.',
            })
            return
          }
        }
      }

      const productsNow = () => useProductStore.getState().products

      for (const d of validated) {
        if (!d.recordId) {
          const { error: recErr } = await addRecord({
            productId: d.productId,
            householdId,
            price: d.unitPrice,
            quantity: d.qty,
            store,
            date: fullEdit.invoiceDate,
            invoiceId: invId,
            forThirdParty: d.forThirdParty,
          })
          if (recErr) {
            setAlertDialog({
              open: true,
              title: 'Precio',
              message: recErr.message ? String(recErr.message) : 'Error al crear línea.',
            })
            return
          }
          const p = productsNow().find((x) => x.id === d.productId)
          if (p?.pendingRegistration) {
            const { error: e2 } = await completeRegistration(
              d.productId,
              Math.max(1, Math.round(d.qty)),
            )
            if (e2) {
              setAlertDialog({
                open: true,
                title: 'Inventario',
                message: e2.message ? String(e2.message) : 'Error al actualizar inventario.',
              })
              return
            }
          } else {
            const { error: e2 } = await addInventoryFromPurchase(d.productId, d.qty)
            if (e2) {
              setAlertDialog({
                open: true,
                title: 'Inventario',
                message: e2.message ? String(e2.message) : 'Error al actualizar inventario.',
              })
              return
            }
          }
          continue
        }

        const orig = origById.get(d.recordId)
        if (!orig) continue

        if (orig.productId !== d.productId) {
          const { error: e1 } = await subtractInventoryFromPurchase(orig.productId, orig.quantity)
          if (e1) {
            setAlertDialog({
              open: true,
              title: 'Inventario',
              message: e1.message ? String(e1.message) : 'Error al ajustar stock (cambio de producto).',
            })
            return
          }
          const { error: e2 } = await updateRecord(d.recordId, {
            productId: d.productId,
            price: d.unitPrice,
            quantity: d.qty,
            store,
            date: fullEdit.invoiceDate,
            forThirdParty: d.forThirdParty,
          })
          if (e2) {
            setAlertDialog({
              open: true,
              title: 'Precio',
              message: e2.message ? String(e2.message) : 'Error al actualizar la línea.',
            })
            return
          }
          const p = productsNow().find((x) => x.id === d.productId)
          if (p?.pendingRegistration) {
            const { error: e3 } = await completeRegistration(
              d.productId,
              Math.max(1, Math.round(d.qty)),
            )
            if (e3) {
              setAlertDialog({
                open: true,
                title: 'Inventario',
                message: e3.message ? String(e3.message) : 'Error al sumar stock al nuevo producto.',
              })
              return
            }
          } else {
            const { error: e3 } = await addInventoryFromPurchase(d.productId, d.qty)
            if (e3) {
              setAlertDialog({
                open: true,
                title: 'Inventario',
                message: e3.message ? String(e3.message) : 'Error al sumar stock al nuevo producto.',
              })
              return
            }
          }
        } else {
          if (Number(orig.quantity) !== d.qty) {
            const { error: e1 } = await applyPurchaseQuantityDelta(
              d.productId,
              orig.quantity,
              d.qty,
            )
            if (e1) {
              setAlertDialog({
                open: true,
                title: 'Inventario',
                message: e1.message ? String(e1.message) : 'Error al ajustar cantidad en inventario.',
              })
              return
            }
          }
          const { error: e2 } = await updateRecord(d.recordId, {
            price: d.unitPrice,
            quantity: d.qty,
            store,
            date: fullEdit.invoiceDate,
            forThirdParty: d.forThirdParty,
          })
          if (e2) {
            setAlertDialog({
              open: true,
              title: 'Precio',
              message: e2.message ? String(e2.message) : 'Error al actualizar la línea.',
            })
            return
          }
        }
      }

      await fetchInvoices(householdId)
      await fetchPriceRecords(householdId)
      setFullEditInvoiceId(null)
    } finally {
      setSavingFullEdit(false)
    }
  }

  const linesSum = (inv) =>
    Math.round(inv.lines.reduce((a, l) => a + l.price * l.quantity, 0))

  const INVOICE_SUM_TOLERANCE = 10

  const batchLinesSum = useMemo(() => {
    let sum = 0
    for (const line of fullEdit.lines) {
      const p = parseMoneyPositive(line.lineTotal)
      if (p != null) sum += p
    }
    return Math.round(sum)
  }, [fullEdit.lines])

  return (
    <div>
      <ConfirmDialog
        open={deleteInvoiceId != null}
        title="Eliminar factura"
        message="Se borrarán todas las líneas de esta factura del histórico de precios y se revertirá el inventario que se sumó al registrarla. Esta acción no se puede deshacer."
        confirmLabel="Eliminar factura"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setDeleteInvoiceId(null)}
        onConfirm={confirmDeleteInvoice}
      />
      <AlertDialog
        open={alertDialog.open}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ open: false, title: '', message: '' })}
      />

      <p className="mb-4 text-xs text-slate-500">
        Tickets que guardaste con <span className="font-medium text-slate-700">Registrar factura</span>{' '}
        en{' '}
        <Link
          to="/registrar-compra"
          className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
        >
          Registrar compra
        </Link>
        . Las compras producto por producto están en la pestaña{' '}
        <span className="font-medium text-slate-700">Registros individuales</span>.
      </p>

      {loading && invoices.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Cargando…</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Aún no hay facturas guardadas. En{' '}
          <Link
            to="/registrar-compra"
            className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
          >
            Registrar compra
          </Link>{' '}
          abre <span className="font-medium text-slate-700">Registrar factura</span> y pulsa &ldquo;Guardar
          todo&rdquo;.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {invoices.map((inv) => {
            const open = expandedId === inv.id
            const fullEditOpen = fullEditInvoiceId === inv.id
            const sum = linesSum(inv)
            const total = inv.totalCop != null ? Math.round(inv.totalCop) : null
            const delta = total != null ? Math.abs(sum - total) : 0
            const mismatch = total != null && delta > INVOICE_SUM_TOLERANCE
            const displayAmount = total != null ? total : sum
            const n = inv.lines.length
            const productosLabel = n === 1 ? '1 producto' : `${n} productos`

            return (
              <div
                key={inv.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : inv.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="shrink-0 text-slate-400">
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatDate(inv.invoiceDate)}
                      </span>
                      <span
                        className={`inline-flex max-w-[min(100%,14rem)] items-center truncate rounded-full px-2.5 py-0.5 text-xs font-semibold ${storeChipClasses(inv.store)}`}
                        title={toTitleCase(inv.store) || 'Sin lugar'}
                      >
                        {toTitleCase(inv.store) || 'Sin lugar'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{productosLabel}</p>
                    {mismatch ? (
                      <p
                        className="mt-0.5 text-xs text-amber-700"
                        title="El total guardado del ticket se compara con la suma de precio×cantidad de cada línea importada."
                      >
                        No cuadra: suma de líneas {formatPrice(sum)} vs total del ticket{' '}
                        {formatPrice(total)} (Δ {formatPrice(delta)})
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    <p className="text-lg font-bold leading-tight tracking-tight text-slate-900 tabular-nums">
                      {formatPrice(displayAmount)}
                    </p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {fullEditOpen ? (
                      <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-3 md:p-4">
                        <p className="mb-3 text-sm font-medium text-slate-700">
                          Editar factura (mismo formato que al registrar)
                        </p>
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Fecha
                            </label>
                            <input
                              type="date"
                              value={fullEdit.invoiceDate}
                              onChange={(e) =>
                                setFullEdit((f) => ({ ...f, invoiceDate: e.target.value }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2">
                            <StoreField
                              label="Lugar de compra"
                              value={fullEdit.store}
                              onChange={(v) => setFullEdit((f) => ({ ...f, store: v }))}
                              datalistId={`invoice-edit-stores-${inv.id}`}
                              historyStores={allStores}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Total factura (COP, opcional)
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={fullEdit.totalCop}
                              onChange={(e) =>
                                setFullEdit((f) => ({ ...f, totalCop: e.target.value }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-violet-100 bg-white/80">
                          <table className="w-full min-w-[720px] border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <th className="px-2 py-2 pl-3">Producto</th>
                                <th className="w-28 px-2 py-2">Cantidad</th>
                                <th className="w-36 px-2 py-2">Total línea (COP)</th>
                                <th className="w-[7.5rem] px-2 py-2 text-center normal-case" title="No suma en Gastos del mes">
                                  Tercero
                                </th>
                                <th className="w-12 px-2 py-2 pr-3" />
                              </tr>
                            </thead>
                            <tbody>
                              {fullEdit.lines.map((line) => {
                                const p = householdProducts.find((x) => x.id === line.productId)
                                const u = p ? ALL_UNITS_MAP[p.displayUnit] : null
                                return (
                                  <tr key={line.key} className="border-b border-slate-100 last:border-0">
                                    <td className="px-2 py-2 pl-3 align-middle">
                                      <select
                                        value={line.productId}
                                        onChange={(e) =>
                                          updateLine(line.key, { productId: e.target.value })
                                        }
                                        className="w-full max-w-[280px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none md:max-w-none"
                                      >
                                        <option value="">Seleccionar…</option>
                                        {householdProducts.map((prod) => (
                                          <option key={prod.id} value={prod.id}>
                                            {toTitleCase(prod.name)}
                                            {prod.category ? ` (${prod.category})` : ''}
                                            {prod.pendingRegistration ? ' · por registrar' : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-2 py-2 align-middle">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="0.001"
                                          step="any"
                                          value={line.quantity}
                                          onChange={(e) =>
                                            updateLine(line.key, { quantity: e.target.value })
                                          }
                                          className="w-full min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {u ? (
                                          <span className="shrink-0 text-[10px] text-slate-400">
                                            {u.abbreviation}
                                          </span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="px-2 py-2 align-middle">
                                      <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="$"
                                        value={line.lineTotal}
                                        onChange={(e) =>
                                          updateLine(line.key, { lineTotal: e.target.value })
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td className="px-2 py-2 align-middle text-center">
                                      <input
                                        type="checkbox"
                                        checked={line.forThirdParty === true}
                                        onChange={(e) =>
                                          updateLine(line.key, { forThirdParty: e.target.checked })
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        title="Para tercero: no suma en gastos del mes"
                                        aria-label="Para tercero"
                                      />
                                    </td>
                                    <td className="px-2 py-2 pr-3 text-right align-middle">
                                      <button
                                        type="button"
                                        onClick={() => removeLine(line.key)}
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

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
                          >
                            <Plus size={16} />
                            Agregar línea
                          </button>
                          <p className="text-xs text-slate-500">
                            Suma líneas:{' '}
                            <span className="font-semibold text-slate-800">
                              {formatPrice(batchLinesSum)}
                            </span>
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-violet-100 pt-4">
                          <button
                            type="button"
                            onClick={cancelFullEdit}
                            disabled={savingFullEdit}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveFullEdit()}
                            disabled={savingFullEdit}
                            className="min-w-[140px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                          >
                            {savingFullEdit ? 'Guardando…' : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startFullEdit(inv)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil size={14} />
                            Editar factura
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteInvoiceId(inv.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            Eliminar factura
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-100">
                          <table className="w-full min-w-[480px] border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase text-slate-500">
                                <th className="px-3 py-2">Producto</th>
                                <th className="px-3 py-2">Cant.</th>
                                <th className="px-3 py-2">P. unit.</th>
                                <th className="px-3 py-2">Total línea</th>
                                <th className="px-3 py-2 text-center text-[10px] font-semibold normal-case">
                                  Tercero
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {inv.lines.map((line) => {
                                const name = productNameById.get(line.productId) || 'Producto'
                                const lineTotal = line.price * line.quantity
                                return (
                                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                                    <td className="px-3 py-2 text-slate-800">{toTitleCase(name)}</td>
                                    <td className="px-3 py-2 text-slate-600">{line.quantity}</td>
                                    <td className="px-3 py-2 text-slate-600">{formatPrice(line.price)}</td>
                                    <td className="px-3 py-2 font-medium text-slate-900">
                                      {formatPrice(Math.round(lineTotal))}
                                    </td>
                                    <td className="px-3 py-2 text-center text-xs text-slate-500">
                                      {line.forThirdParty ? 'Sí' : '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
