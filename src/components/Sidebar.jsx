import { NavLink } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, Home } from 'lucide-react'
import { useAuthStore, useCurrentHousehold } from '../store/useAuthStore'

const NAV_ITEMS = [
  { to: '/', label: 'Inventario', icon: Package },
  { to: '/por-comprar', label: 'Por Comprar', icon: ShoppingCart },
  { to: '/gastos', label: 'Gastos', icon: DollarSign },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const currentHousehold = useCurrentHousehold()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Home size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Domus
          </h1>
          <p className="text-xs text-slate-500">{currentHousehold?.name}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
