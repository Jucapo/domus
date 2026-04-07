import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Tag, PackageSearch } from 'lucide-react'
import { NAV_ITEMS } from './nav-items'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'

function mainLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function gestionLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

/**
 * Navegación principal + Gestión (mismo contenido que el sidebar de escritorio).
 * @param {object} props
 * @param {() => void} [props.onNavigate] — p. ej. cerrar el drawer en móvil
 */
export default function SideNavBody({ onNavigate }) {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)

  const shoppingCount = useMemo(
    () =>
      allProducts.filter((p) => p.householdId === householdId && p.inShoppingList).length,
    [allProducts, householdId],
  )

  const pendingCount = useMemo(
    () =>
      allProducts.filter((p) => p.householdId === householdId && p.pendingRegistration).length,
    [allProducts, householdId],
  )

  const afterNav = onNavigate ?? (() => {})

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={afterNav}
            className={mainLinkClass}
          >
            <span className="relative shrink-0">
              <Icon size={18} />
              {to === '/por-comprar' && shoppingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {shoppingCount > 99 ? '99+' : shoppingCount}
                </span>
              )}
              {to === '/registrar-compra' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 px-3 py-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Gestión
        </p>
        <NavLink
          to="/gestion/categorias"
          onClick={afterNav}
          className={gestionLinkClass}
        >
          <Tag size={16} />
          Categorías
        </NavLink>
        <NavLink
          to="/gestion/productos"
          onClick={afterNav}
          className={gestionLinkClass}
        >
          <PackageSearch size={16} />
          Productos
        </NavLink>
      </div>
    </>
  )
}
