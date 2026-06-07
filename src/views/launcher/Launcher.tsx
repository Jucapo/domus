import { Link } from 'react-router-dom'
import { useCurrentHousehold } from '../../store/useAuthStore'
import AvatarMenu from '../../components/AvatarMenu'
import { APPS } from '../../apps/registry'

/** Clases de color por app (fondo del icono). Tailwind necesita clases literales. */
const ICON_BG: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
}

const RING: Record<string, string> = {
  violet: 'hover:border-violet-300 hover:shadow-violet-100',
  emerald: 'hover:border-emerald-300 hover:shadow-emerald-100',
  indigo: 'hover:border-indigo-300 hover:shadow-indigo-100',
  amber: 'hover:border-amber-300 hover:shadow-amber-100',
  sky: 'hover:border-sky-300 hover:shadow-sky-100',
  rose: 'hover:border-rose-300 hover:shadow-rose-100',
}

export default function Launcher() {
  const currentHousehold = useCurrentHousehold()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Domus" className="h-9 w-9 object-contain" />
          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-slate-900">Domus</p>
            {currentHousehold?.name && (
              <p className="truncate text-xs text-slate-500">{currentHousehold.name}</p>
            )}
          </div>
        </div>
        <AvatarMenu size="sm" />
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">¿Qué quieres gestionar?</h2>
        <p className="mt-1 text-sm text-slate-500">Elige una app para empezar.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {APPS.map((app) => {
            const Icon = app.icon
            return (
              <Link
                key={app.id}
                to={app.basePath}
                className={`group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                  RING[app.color] ?? RING.indigo
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    ICON_BG[app.color] ?? ICON_BG.indigo
                  }`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">{app.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{app.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
