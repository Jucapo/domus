import { useMemo } from 'react'
import { STORE_QUICK_PICK_LABELS } from '../data/invoiceSources'

export function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Total pagado en la compra → precio unitario (por kg, ud, etc.) */
export function paidToUnitPrice(paid, quantityRaw) {
  const paidN = parseFloat(String(paid).replace(',', '.'))
  const qty = parseFloat(String(quantityRaw).replace(',', '.'))
  if (!paidN || paidN <= 0 || !qty || qty <= 0) return null
  return paidN / qty
}

export function parseMoneyPositive(raw) {
  const n = parseFloat(String(raw ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function mergeStoreDatalistOptions(historyStores) {
  const set = new Set()
  STORE_QUICK_PICK_LABELS.forEach((s) => set.add(s))
  for (const s of historyStores || []) {
    const t = String(s || '').trim()
    if (t) set.add(t)
  }
  const favorites = STORE_QUICK_PICK_LABELS.filter((f) => set.has(f))
  const rest = [...set]
    .filter((s) => !STORE_QUICK_PICK_LABELS.includes(s))
    .sort((a, b) => a.localeCompare(b))
  return [...favorites, ...rest]
}

export function newBatchLine() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId: '',
    quantity: '1',
    price: '',
    /** Código leído del PDF (normalizado a dígitos); ayuda si no hay match en inventario. */
    invoiceBarcode: '',
    /** Nombre en la factura (puede diferir del producto). */
    invoiceDesc: '',
    /** No suma en gastos del mes / presupuesto. */
    forThirdParty: false,
  }
}

export function StoreField({ label, value, onChange, datalistId, historyStores }) {
  const options = useMemo(() => mergeStoreDatalistOptions(historyStores), [historyStores])
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {STORE_QUICK_PICK_LABELS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
              value === name
                ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Otro lugar…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={datalistId}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      <datalist id={datalistId}>
        {options.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
