import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { ConfirmDialog } from '../../components/AppDialogs'
import { useAuthStore } from '../../store/useAuthStore'
import { useAccountStore } from '../../store/useAccountStore'
import { useFinanceCategoryStore } from '../../store/useFinanceCategoryStore'
import { useFinanceTransactionStore } from '../../store/useFinanceTransactionStore'
import type { FinanceCategory, FinanceTransaction, TransactionType } from '../../types'
import { formatMoney, formatLongDate, groupByDate, todayISO } from './financeShared'

interface FormState {
  type: TransactionType
  date: string
  accountId: string
  toAccountId: string
  categoryId: string
  amount: string
  note: string
}

function emptyForm(): FormState {
  return {
    type: 'expense',
    date: todayISO(),
    accountId: '',
    toAccountId: '',
    categoryId: '',
    amount: '',
    note: '',
  }
}

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
}

export default function FinanzasTransacciones() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const allAccounts = useAccountStore((s) => s.accounts)
  const allCategories = useFinanceCategoryStore((s) => s.categories)
  const allTx = useFinanceTransactionStore((s) => s.transactions)
  const addTransaction = useFinanceTransactionStore((s) => s.addTransaction)
  const updateTransaction = useFinanceTransactionStore((s) => s.updateTransaction)
  const deleteTransaction = useFinanceTransactionStore((s) => s.deleteTransaction)

  const accounts = useMemo(
    () => allAccounts.filter((a) => a.householdId === householdId),
    [allAccounts, householdId],
  )
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])

  const categories = useMemo(
    () => allCategories.filter((c) => c.householdId === householdId),
    [allCategories, householdId],
  )
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const transactions = useMemo(
    () => allTx.filter((t) => t.householdId === householdId),
    [allTx, householdId],
  )
  const groups = useMemo(() => groupByDate(transactions), [transactions])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceTransaction | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FinanceTransaction | null>(null)

  // Opciones de categoría ordenadas (raíz seguida de sus subcategorías) por tipo.
  const categoryOptions = useMemo(() => {
    const kind = form.type === 'income' ? 'income' : 'expense'
    const roots = categories
      .filter((c) => c.kind === kind && c.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name))
    const out: { cat: FinanceCategory; depth: number }[] = []
    for (const r of roots) {
      out.push({ cat: r, depth: 0 })
      categories
        .filter((c) => c.parentId === r.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((sub) => out.push({ cat: sub, depth: 1 }))
    }
    return out
  }, [categories, form.type])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm(), accountId: accounts[0]?.id ?? '' })
    setModalOpen(true)
  }

  const openEdit = (t: FinanceTransaction) => {
    setEditing(t)
    setForm({
      type: t.type,
      date: t.date,
      accountId: t.accountId,
      toAccountId: t.toAccountId ?? '',
      categoryId: t.categoryId ?? '',
      amount: String(t.amount),
      note: t.note,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (!saving) setModalOpen(false)
  }

  const canSave = useMemo(() => {
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return false
    if (!form.accountId) return false
    if (form.type === 'transfer' && (!form.toAccountId || form.toAccountId === form.accountId))
      return false
    return true
  }, [form])

  const handleSave = async () => {
    if (!canSave || !householdId || saving) return
    const amount = parseFloat(form.amount.replace(',', '.'))
    const account = accountById.get(form.accountId)
    const isTransfer = form.type === 'transfer'
    const payload = {
      type: form.type,
      date: form.date,
      accountId: form.accountId,
      toAccountId: isTransfer ? form.toAccountId : null,
      categoryId: isTransfer ? null : form.categoryId || null,
      amount,
      currency: account?.currency || 'COP',
      note: form.note.trim(),
    }
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, payload)
      } else {
        await addTransaction({ householdId, ...payload })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteTransaction(deleteTarget.id)
    setDeleteTarget(null)
  }

  /** Total del día: ingresos − gastos (transferencias no cuentan). */
  const dayTotal = (items: FinanceTransaction[]) =>
    items.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount
      if (t.type === 'expense') return sum - t.amount
      return sum
    }, 0)

  const txLabel = (t: FinanceTransaction): string => {
    if (t.type === 'transfer') {
      const from = accountById.get(t.accountId)?.name ?? '—'
      const to = t.toAccountId ? accountById.get(t.toAccountId)?.name ?? '—' : '—'
      return `${from} → ${to}`
    }
    const cat = t.categoryId ? categoryById.get(t.categoryId) : null
    if (!cat) return 'Sin categoría'
    if (cat.parentId) {
      const parent = categoryById.get(cat.parentId)
      return parent ? `${parent.name} · ${cat.name}` : cat.name
    }
    return cat.name
  }

  const amountColor = (type: TransactionType) =>
    type === 'income' ? 'text-emerald-600' : type === 'expense' ? 'text-rose-600' : 'text-slate-600'

  const amountSign = (type: TransactionType) =>
    type === 'income' ? '+' : type === 'expense' ? '−' : ''

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">Transacciones</h2>
        <button
          type="button"
          onClick={openCreate}
          disabled={accounts.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          Nueva transacción
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Primero crea una cuenta en la pestaña <span className="font-medium">Cuentas</span>.
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Aún no hay transacciones. Agrega la primera con &ldquo;Nueva transacción&rdquo;.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const total = dayTotal(g.items)
            return (
              <section key={g.date}>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatLongDate(g.date)}
                  </h3>
                  <span className={`text-xs font-medium ${total < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {total >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(total))}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {g.items.map((t) => {
                    const account = accountById.get(t.accountId)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openEdit(t)}
                        className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 truncate text-sm font-medium text-slate-900">
                            {t.type === 'transfer' ? (
                              <>
                                {account?.name ?? '—'}
                                <ArrowRight size={13} className="shrink-0 text-slate-400" />
                                {t.toAccountId ? accountById.get(t.toAccountId)?.name ?? '—' : '—'}
                              </>
                            ) : (
                              txLabel(t)
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {t.type !== 'transfer' && account ? account.name : TYPE_LABELS[t.type]}
                            {t.note ? ` · ${t.note}` : ''}
                          </p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${amountColor(t.type)}`}>
                          {amountSign(t.type)}
                          {formatMoney(t.amount, t.currency)}
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(t)
                          }}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-slate-900">
              {editing ? 'Editar transacción' : 'Nueva transacción'}
            </h2>

            <div className="mt-3 inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['expense', 'income', 'transfer'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, type: tp, categoryId: '' }))}
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    form.type === tp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {TYPE_LABELS[tp]}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Monto</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                  autoFocus
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {form.type === 'income' ? 'Cuenta destino' : form.type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}
                </label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm((s) => ({ ...s, accountId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Selecciona…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === 'transfer' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Cuenta destino</label>
                  <select
                    value={form.toAccountId}
                    onChange={(e) => setForm((s) => ({ ...s, toAccountId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Selecciona…</option>
                    {accounts
                      .filter((a) => a.id !== form.accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Sin categoría</option>
                    {categoryOptions.map(({ cat, depth }) => (
                      <option key={cat.id} value={cat.id}>
                        {depth > 0 ? '  — ' : ''}
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nota (opcional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                  placeholder="Descripción"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canSave || saving}
                onClick={() => void handleSave()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Eliminar transacción"
        message="¿Eliminar esta transacción? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
