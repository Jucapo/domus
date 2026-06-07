import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, Landmark, CreditCard, PiggyBank, Users, Circle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ConfirmDialog } from '../../components/AppDialogs'
import { useAuthStore } from '../../store/useAuthStore'
import { useAccountStore } from '../../store/useAccountStore'
import { useFinanceTransactionStore } from '../../store/useFinanceTransactionStore'
import type { Account, AccountType } from '../../types'
import { ACCOUNT_TYPE_LABELS, accountBalance, formatMoney } from './financeShared'

const TYPE_ICON: Record<AccountType, LucideIcon> = {
  cash: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
  savings: PiggyBank,
  person: Users,
  other: Circle,
}

const COLOR_SWATCHES = ['indigo', 'emerald', 'violet', 'amber', 'rose', 'sky', 'teal', 'slate']
const SWATCH_BG: Record<string, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  teal: 'bg-teal-500',
  slate: 'bg-slate-500',
}
const ICON_BG: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
  teal: 'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-700',
}

const TYPE_OPTIONS: AccountType[] = ['cash', 'bank', 'credit_card', 'savings', 'person', 'other']

interface FormState {
  name: string
  type: AccountType
  currency: string
  initialBalance: string
  color: string
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'cash',
  currency: 'COP',
  initialBalance: '',
  color: 'indigo',
}

function bucketOf(type: AccountType): 'cuentas' | 'ahorros' | 'personas' {
  if (type === 'savings') return 'ahorros'
  if (type === 'person') return 'personas'
  return 'cuentas'
}

const BUCKET_LABELS: Record<'cuentas' | 'ahorros' | 'personas', string> = {
  cuentas: 'Cuentas',
  ahorros: 'Ahorros',
  personas: 'Personas',
}

export default function FinanzasCuentas() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const allAccounts = useAccountStore((s) => s.accounts)
  const addAccount = useAccountStore((s) => s.addAccount)
  const updateAccount = useAccountStore((s) => s.updateAccount)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const transactions = useFinanceTransactionStore((s) => s.transactions)

  const accounts = useMemo(
    () =>
      allAccounts
        .filter((a) => a.householdId === householdId && !a.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [allAccounts, householdId],
  )

  const balances = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of accounts) map.set(a.id, accountBalance(a, transactions))
    return map
  }, [accounts, transactions])

  const total = useMemo(
    () => accounts.reduce((sum, a) => sum + (balances.get(a.id) ?? 0), 0),
    [accounts, balances],
  )

  const buckets = useMemo(() => {
    const out: Record<'cuentas' | 'ahorros' | 'personas', Account[]> = {
      cuentas: [],
      ahorros: [],
      personas: [],
    }
    for (const a of accounts) out[bucketOf(a.type)].push(a)
    return out
  }, [accounts])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({
      name: a.name,
      type: a.type,
      currency: a.currency,
      initialBalance: String(a.initialBalance),
      color: a.color,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (!saving) setModalOpen(false)
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name || !householdId || saving) return
    const initialBalance = parseFloat(form.initialBalance.replace(',', '.')) || 0
    setSaving(true)
    try {
      if (editing) {
        await updateAccount(editing.id, {
          name,
          type: form.type,
          currency: form.currency.trim() || 'COP',
          initialBalance,
          color: form.color,
        })
      } else {
        await addAccount({
          householdId,
          name,
          type: form.type,
          currency: form.currency.trim() || 'COP',
          initialBalance,
          color: form.color,
        })
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteAccount(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 md:mb-6">
        <div>
          <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">Cuentas</h2>
          <p className="mt-0 text-sm text-slate-500 md:mt-0.5">
            Saldo total:{' '}
            <span className={`font-semibold ${total < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(total)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus size={15} />
          Nueva cuenta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Aún no tienes cuentas. Crea la primera con &ldquo;Nueva cuenta&rdquo;.
        </div>
      ) : (
        <div className="space-y-6">
          {(['cuentas', 'ahorros', 'personas'] as const).map((bucket) => {
            const list = buckets[bucket]
            if (list.length === 0) return null
            const subtotal = list.reduce((s, a) => s + (balances.get(a.id) ?? 0), 0)
            return (
              <section key={bucket}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-700">{BUCKET_LABELS[bucket]}</h3>
                  <span className="text-xs font-medium text-slate-500">{formatMoney(subtotal)}</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {list.map((a) => {
                    const Icon = TYPE_ICON[a.type]
                    const balance = balances.get(a.id) ?? 0
                    return (
                      <div key={a.id} className="group flex items-center gap-3 px-4 py-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_BG[a.color] ?? ICON_BG.indigo}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                          <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[a.type]}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${balance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formatMoney(balance, a.currency)}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(a)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
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
              {editing ? 'Editar cuenta' : 'Nueva cuenta'}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  autoFocus
                  placeholder="Efectivo, Bancolombia, …"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as AccountType }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value.toUpperCase() }))}
                    placeholder="COP"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Saldo inicial</label>
                <input
                  type="number"
                  step="any"
                  value={form.initialBalance}
                  onChange={(e) => setForm((s) => ({ ...s, initialBalance: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, color: c }))}
                      className={`h-7 w-7 rounded-full ${SWATCH_BG[c]} ${
                        form.color === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      aria-label={c}
                    />
                  ))}
                </div>
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
                disabled={!form.name.trim() || saving}
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
        title="Eliminar cuenta"
        message={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.name}"? Se borrarán también sus transacciones asociadas.`
            : ''
        }
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
