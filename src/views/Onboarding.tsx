import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Pantalla que se muestra cuando un usuario autenticado todavía no
 * tiene ningún hogar asociado. Crea un hogar + lo agrega como owner
 * en household_members.
 */
export default function Onboarding() {
  const user = useAuthStore((s) => s.user)
  const refresh = useAuthStore((s) => s.refresh)
  const signOut = useAuthStore((s) => s.signOut)
  const [name, setName] = useState('Mi hogar')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { data: household, error: hhErr } = await supabase
        .from('households')
        .insert({ name: name.trim() })
        .select()
        .single()
      if (hhErr || !household) throw hhErr || new Error('No se pudo crear el hogar.')

      // Cast temporal hasta regenerar tipos tras aplicar migration 010.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memErr } = await (supabase as any)
        .from('household_members')
        .insert({ user_id: user.id, household_id: household.id, role: 'owner' })
      if (memErr) throw memErr

      await refresh()
    } catch (err) {
      setError((err as Error)?.message || 'No se pudo crear el hogar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold text-slate-900">Bienvenido a Domus</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea tu primer hogar para empezar a gestionar tu inventario.
        </p>

        <label className="mt-5 block text-xs font-medium text-slate-600">Nombre del hogar</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Casa Posso"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          autoFocus
        />

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Crear hogar
        </button>

        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 w-full text-xs text-slate-500 hover:text-slate-700"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}
