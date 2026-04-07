import { LogOut } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function NavUserStrip() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="shrink-0 border-t border-slate-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
