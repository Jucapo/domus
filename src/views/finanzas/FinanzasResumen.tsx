import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { useAccountStore } from '../../store/useAccountStore'
import { useFinanceCategoryStore } from '../../store/useFinanceCategoryStore'
import { useFinanceTransactionStore } from '../../store/useFinanceTransactionStore'
import { accountBalance, formatMoney } from './financeShared'

/** Devuelve YYYY-MM del mes actual (hora local). */
function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

const BAR_BG: Record<string, string> = {
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  sky: 'bg-sky-400',
  teal: 'bg-teal-400',
  slate: 'bg-slate-400',
}

export default function FinanzasResumen() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const allAccounts = useAccountStore((s) => s.accounts)
  const allCategories = useFinanceCategoryStore((s) => s.categories)
  const allTx = useFinanceTransactionStore((s) => s.transactions)

  const [month, setMonth] = useState(currentMonthKey)

  const accounts = useMemo(
    () => allAccounts.filter((a) => a.householdId === householdId && !a.archived),
    [allAccounts, householdId],
  )
  const categoryById = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories],
  )

  const monthTx = useMemo(
    () => allTx.filter((t) => t.householdId === householdId && t.date.startsWith(month)),
    [allTx, householdId, month],
  )

  const { income, expense } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of monthTx) {
      if (t.type === 'income') income += t.amount
      else if (t.type === 'expense') expense += t.amount
    }
    return { income, expense }
  }, [monthTx])

  const net = income - expense

  const netWorth = useMemo(
    () => accounts.reduce((sum, a) => sum + accountBalance(a, allTx), 0),
    [accounts, allTx],
  )

  // Gasto por categoría principal (las subcategorías suben a su padre).
  const byCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of monthTx) {
      if (t.type !== 'expense') continue
      let cat = t.categoryId ? categoryById.get(t.categoryId) : null
      if (cat?.parentId) cat = categoryById.get(cat.parentId) ?? cat
      const key = cat?.id ?? '__none__'
      totals.set(key, (totals.get(key) ?? 0) + t.amount)
    }
    return [...totals.entries()]
      .map(([id, total]) => ({
        id,
        name: id === '__none__' ? 'Sin categoría' : categoryById.get(id)?.name ?? '—',
        color: id === '__none__' ? 'slate' : categoryById.get(id)?.color ?? 'slate',
        total,
      }))
      .sort((a, b) => b.total - a.total)
  }, [monthTx, categoryById])

  const maxCat = byCategory[0]?.total ?? 0

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">Resumen</h2>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-1">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize text-slate-700">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingUp size={15} className="text-emerald-500" /> Ingresos
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-600">{formatMoney(income)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingDown size={15} className="text-rose-500" /> Gastos
          </div>
          <p className="mt-1 text-lg font-bold text-rose-600">{formatMoney(expense)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Scale size={15} className="text-slate-500" /> Balance del mes
          </div>
          <p className={`mt-1 text-lg font-bold ${net < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {net >= 0 ? '+' : '−'}
            {formatMoney(Math.abs(net))}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium text-slate-500">Patrimonio (saldo de todas las cuentas)</p>
        <p className={`mt-1 text-xl font-bold ${netWorth < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
          {formatMoney(netWorth)}
        </p>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 px-1 text-sm font-semibold text-slate-700">Gastos por categoría</h3>
        {byCategory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No hay gastos registrados este mes.
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            {byCategory.map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{c.name}</span>
                  <span className="shrink-0 font-medium text-slate-600">{formatMoney(c.total)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${BAR_BG[c.color] ?? BAR_BG.slate}`}
                    style={{ width: `${maxCat > 0 ? (c.total / maxCat) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
