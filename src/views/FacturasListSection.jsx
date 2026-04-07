import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useInvoiceStore } from '../store/useInvoiceStore'
import { usePriceStore } from '../store/usePriceStore'
import { formatPrice, formatDate } from './preciosShared'

/** Lista de facturas guardadas (ticket agrupado). Usada dentro de Historial compras → pestaña Facturas. */
export default function FacturasListSection() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const invoices = useInvoiceStore((s) => s.invoices)
  const loading = useInvoiceStore((s) => s.loading)
  const fetchInvoices = useInvoiceStore((s) => s.fetchInvoices)
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice)
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice)
  const fetchPriceRecords = usePriceStore((s) => s.fetchRecords)

  const allProducts = useProductStore((s) => s.products)

  const productNameById = useMemo(() => {
    const m = new Map()
    for (const p of allProducts) {
      if (p.householdId === householdId) m.set(p.id, p.name)
    }
    return m
  }, [allProducts, householdId])

  useEffect(() => {
    if (householdId) fetchInvoices(householdId)
  }, [householdId, fetchInvoices])

  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ store: '', invoiceDate: '', totalCop: '' })

  const startEdit = (inv) => {
    setEditingId(inv.id)
    setEditForm({
      store: inv.store,
      invoiceDate: inv.invoiceDate,
      totalCop: inv.totalCop != null ? String(Math.round(inv.totalCop)) : '',
    })
  }

  const saveEdit = async (invoiceId) => {
    const total =
      editForm.totalCop.trim() === ''
        ? null
        : Number(String(editForm.totalCop).replace(',', '.'))
    const { error } = await updateInvoice(invoiceId, {
      store: editForm.store.trim(),
      invoiceDate: editForm.invoiceDate,
      totalCop: total != null && Number.isFinite(total) ? total : null,
    })
    if (!error) {
      setEditingId(null)
    }
  }

  const handleDelete = async (invoiceId) => {
    if (
      !window.confirm(
        '¿Eliminar esta factura del listado? Los precios guardados en el histórico no se borran; solo se quita el agrupamiento.',
      )
    ) {
      return
    }
    const { error } = await deleteInvoice(invoiceId)
    if (!error && householdId) {
      await fetchPriceRecords(householdId)
    }
    if (expandedId === invoiceId) setExpandedId(null)
  }

  const linesSum = (inv) =>
    Math.round(inv.lines.reduce((a, l) => a + l.price * l.quantity, 0))

  return (
    <div>
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
            const editing = editingId === inv.id
            const sum = linesSum(inv)
            const total = inv.totalCop != null ? Math.round(inv.totalCop) : null
            const mismatch = total != null && sum !== total

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
                  <span className="text-slate-400">
                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(inv.invoiceDate)} · {inv.store || 'Sin lugar'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inv.lines.length} línea{inv.lines.length === 1 ? '' : 's'} · Suma líneas{' '}
                      {formatPrice(sum)}
                      {total != null ? ` · Total factura ${formatPrice(total)}` : ''}
                      {mismatch ? (
                        <span className="text-amber-600"> · revisar total</span>
                      ) : null}
                    </p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {editing ? (
                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Lugar
                          </label>
                          <input
                            value={editForm.store}
                            onChange={(e) => setEditForm((f) => ({ ...f, store: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={editForm.invoiceDate}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, invoiceDate: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                            value={editForm.totalCop}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, totalCop: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => saveEdit(inv.id)}
                            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(inv)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Editar datos del ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Quitar agrupación
                        </button>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full min-w-[480px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase text-slate-500">
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Cant.</th>
                            <th className="px-3 py-2">P. unit.</th>
                            <th className="px-3 py-2">Total línea</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.lines.map((line) => {
                            const name = productNameById.get(line.productId) || 'Producto'
                            const lineTotal = line.price * line.quantity
                            return (
                              <tr key={line.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-3 py-2 text-slate-800">{name}</td>
                                <td className="px-3 py-2 text-slate-600">{line.quantity}</td>
                                <td className="px-3 py-2 text-slate-600">{formatPrice(line.price)}</td>
                                <td className="px-3 py-2 font-medium text-slate-900">
                                  {formatPrice(Math.round(lineTotal))}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
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
