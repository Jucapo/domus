import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './nav-items'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'

export default function BottomNav() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)

  const shoppingCount = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.inShoppingList,
      ).length,
    [allProducts, householdId],
  )

  const pendingCount = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.pendingRegistration,
      ).length,
    [allProducts, householdId],
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white md:hidden">
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 active:text-slate-600'
              }`
            }
          >
            <span className="relative">
              <Icon size={20} />
              {to === '/por-comprar' && shoppingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {shoppingCount}
                </span>
              )}
              {to === '/precios' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </span>
            <span className="truncate px-0.5">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Safe area spacer for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
