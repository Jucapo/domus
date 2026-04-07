import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { usePriceStore } from '../store/usePriceStore'
import { formatPrice, formatDate } from './preciosShared'
import { toTitleCase } from '../lib/textCase'

/** Registros de compra hechos producto por producto (sin factura agrupada). */
export default function IndividualPurchasesHistory() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const allRecords = usePriceStore((s) => s.records)
  const updateRecord = usePriceStore((s) => s.updateRecord)
  const deleteRecord = usePriceStore((s) => s.deleteRecord)
  const fetchRecords = usePriceStore((s) => s.fetchRecords)

  const productNameById = useMemo(() => {
    const m = new Map()
    for (const p of allProducts) {
      if (p.householdId === householdId) m.set(p.id, p.name)
    }
    return m
  }, [allProducts, householdId])

  const individualRecords = useMemo(() => {
    return allRecords
      .filter((r) => r.householdId === householdId && !r.invoiceId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  }, [allRecords, householdId])

  const [tableSearch, setTableSearch] = useState('')

  const filteredRecords = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return individualRecords
    return individualRecords.filter((r) => {
      const name = productNameById.get(r.productId) || ''
      const store = r.store || ''
      const hay = [
        name,
        store,
        r.date,
        formatDate(r.date),
        String(r.quantity),
        String(r.price),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [individualRecords, tableSearch, productNameById])

  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (!editingId) return
    const stillVisible = filteredRecords.some((r) => r.id === editingId)
    if (!stillVisible) setEditingId(null)
  }, [filteredRecords, editingId])
  const [editForm, setEditForm] = useState({
    price: '',
    quantity: '',
    store: '',
    date: '',
  })

  const startEdit = (r) => {
    setEditingId(r.id)
    setEditForm({
      price: String(r.price),
      quantity: String(r.quantity),
      store: r.store,
      date: r.date,
    })
  }

  const saveEdit = async (recordId) => {
    const qty = parseFloat(String(editForm.quantity).replace(',', '.'))
    const unitPrice = parseFloat(String(editForm.price).replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      window.alert('Cantidad y precio unitario deben ser válidos.')
      return
    }
    const { error } = await updateRecord(recordId, {
      price: unitPrice,
      quantity: qty,
      store: editForm.store.trim(),
      date: editForm.date,
    })
    if (!error) {
      setEditingId(null)
      if (householdId) await fetchRecords(householdId)
    }
  }

  const handleDelete = async (recordId) => {
    if (!window.confirm('¿Eliminar este registro de compra del historial?')) return
    const { error } = await deleteRecord(recordId)
    if (!error && householdId) await fetchRecords(householdId)
  }

  if (individualRecords.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
        <p className="font-medium text-slate-700">Aún no hay registros individuales</p>
        <p className="mt-2 max-w-md mx-auto text-xs">
          Los guardas desde{' '}
          <Link
            to="/registrar-compra"
            className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
          >
            Registrar compra
          </Link>{' '}
          al pulsar <span className="font-medium text-slate-700">Registrar</span> en un producto (no
          como parte de <span className="font-medium">Registrar factura</span>).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          placeholder="Buscar por producto, lugar, fecha…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          autoComplete="off"
        />
      </div>

      <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 bg-white [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase text-slate-500">
            <th className="px-3 py-2 pl-4">Producto</th>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Lugar</th>
            <th className="px-3 py-2">Cant.</th>
            <th className="px-3 py-2">P. unit.</th>
            <th className="px-3 py-2">Total línea</th>
            <th className="px-3 py-2 pr-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((r) => {
            const name = productNameById.get(r.productId) || 'Producto'
            const lineTotal = r.price * r.quantity
            const editing = editingId === r.id

            return (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 pl-4 font-medium text-slate-900">{toTitleCase(name)}</td>
                {editing ? (
                  <>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                        className="w-full min-w-[9rem] rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={editForm.store}
                        onChange={(e) => setEditForm((f) => ({ ...f, store: e.target.value }))}
                        className="w-full min-w-[8rem] rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editForm.price}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatPrice(
                        Math.round(
                          (parseFloat(editForm.price) || 0) * (parseFloat(editForm.quantity) || 0),
                        ),
                      )}
                    </td>
                    <td className="px-3 py-2 pr-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => saveEdit(r.id)}
                        className="mr-1 rounded bg-violet-600 px-2 py-1 text-xs font-medium text-white hover:bg-violet-700"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-slate-600">{formatDate(r.date)}</td>
                    <td className="px-3 py-2 text-slate-600">{toTitleCase(r.store) || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{r.quantity}</td>
                    <td className="px-3 py-2 text-slate-600">{formatPrice(r.price)}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {formatPrice(Math.round(lineTotal))}
                    </td>
                    <td className="px-3 py-2 pr-4">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          title="Editar"
                          aria-label="Editar"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          title="Eliminar"
                          aria-label="Eliminar"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
          {filteredRecords.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                Ningún registro coincide con la búsqueda.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </div>
  )
}
