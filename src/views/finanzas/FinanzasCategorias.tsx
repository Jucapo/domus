import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/AppDialogs'
import { useAuthStore } from '../../store/useAuthStore'
import { useFinanceCategoryStore } from '../../store/useFinanceCategoryStore'
import type { FinanceCategory, FinanceCategoryKind } from '../../types'

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
const DOT_BG: Record<string, string> = {
  indigo: 'bg-indigo-400',
  emerald: 'bg-emerald-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  sky: 'bg-sky-400',
  teal: 'bg-teal-400',
  slate: 'bg-slate-400',
}

interface FormState {
  name: string
  kind: FinanceCategoryKind
  parentId: string
  color: string
}

const EMPTY_FORM: FormState = { name: '', kind: 'expense', parentId: '', color: 'indigo' }

export default function FinanzasCategorias() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const allCategories = useFinanceCategoryStore((s) => s.categories)
  const addCategory = useFinanceCategoryStore((s) => s.addCategory)
  const updateCategory = useFinanceCategoryStore((s) => s.updateCategory)
  const deleteCategory = useFinanceCategoryStore((s) => s.deleteCategory)

  const [tab, setTab] = useState<FinanceCategoryKind>('expense')

  const categories = useMemo(
    () => allCategories.filter((c) => c.householdId === householdId),
    [allCategories, householdId],
  )

  const roots = useMemo(
    () =>
      categories
        .filter((c) => c.kind === tab && c.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, tab],
  )

  const childrenOf = useMemo(() => {
    const map = new Map<string, FinanceCategory[]>()
    for (const c of categories) {
      if (c.parentId) {
        const arr = map.get(c.parentId) ?? []
        arr.push(c)
        map.set(c.parentId, arr)
      }
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name))
    return map
  }, [categories])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceCategory | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FinanceCategory | null>(null)

  const openCreate = (parentId = '') => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, kind: tab, parentId })
    setModalOpen(true)
  }

  const openEdit = (c: FinanceCategory) => {
    setEditing(c)
    setForm({ name: c.name, kind: c.kind, parentId: c.parentId ?? '', color: c.color })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (!saving) setModalOpen(false)
  }

  const handleSave = async () => {
    const name = form.name.trim()
    if (!name || !householdId || saving) return
    setSaving(true)
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name,
          parentId: form.parentId || null,
          color: form.color,
        })
      } else {
        await addCategory({
          householdId,
          name,
          kind: form.kind,
          parentId: form.parentId || null,
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
    await deleteCategory(deleteTarget.id)
    setDeleteTarget(null)
  }

  // Posibles padres en el modal: raíces del mismo tipo (no la propia categoría).
  const parentOptions = useMemo(
    () =>
      categories
        .filter((c) => c.kind === form.kind && c.parentId === null && c.id !== editing?.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, form.kind, editing],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">Categorías</h2>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus size={15} />
          Nueva categoría
        </button>
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === k ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {k === 'expense' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      {roots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          No hay categorías de {tab === 'expense' ? 'gasto' : 'ingreso'} todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {roots.map((c) => {
            const kids = childrenOf.get(c.id) ?? []
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${DOT_BG[c.color] ?? DOT_BG.indigo}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => openCreate(c.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Agregar subcategoría"
                  >
                    <Plus size={13} /> Sub
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(c)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {kids.length > 0 && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                    {kids.map((k) => (
                      <div key={k.id} className="flex items-center gap-3 py-2 pl-10 pr-4">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_BG[k.color] ?? DOT_BG.indigo}`} />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{k.name}</span>
                        <button
                          type="button"
                          onClick={() => openEdit(k)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(k)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              {editing ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  autoFocus
                  placeholder="Mercado, Salud, Salario, …"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              {!editing && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
                  <select
                    value={form.kind}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, kind: e.target.value as FinanceCategoryKind, parentId: '' }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Categoría padre (opcional)
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((s) => ({ ...s, parentId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">— Ninguna (categoría principal)</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
        title="Eliminar categoría"
        message={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.name}"?${
                (childrenOf.get(deleteTarget.id)?.length ?? 0) > 0
                  ? ' Se eliminarán también sus subcategorías.'
                  : ''
              }`
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
