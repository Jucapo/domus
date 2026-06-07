import { NavLink, Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import type { NavItem } from './nav-items'
import { resolveNavPath } from './nav-items'

function mainLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

function gestionLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-50 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`
}

/** Badge opcional por item, indexado por la ruta relativa (`to`) del NavItem. */
export interface NavBadge {
  count: number
  /** Clase de fondo Tailwind, p.ej. 'bg-amber-500'. */
  className?: string
}

export interface SideNavBodyProps {
  navItems: NavItem[]
  basePath: string
  gestionItems?: NavItem[]
  /** Badges indexados por la ruta relativa (`to`) del item. */
  badges?: Record<string, NavBadge>
  /** p. ej. cerrar el drawer en móvil */
  onNavigate?: () => void
}

/**
 * Navegación principal + Gestión de la app activa. Parametrizado: recibe los
 * items y el basePath de la app (ver `src/apps/registry.ts`).
 */
export default function SideNavBody({
  navItems,
  basePath,
  gestionItems,
  badges,
  onNavigate,
}: SideNavBodyProps) {
  const afterNav = onNavigate ?? (() => {})

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          to="/"
          onClick={afterNav}
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <LayoutGrid size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">Cambiar de app</span>
        </Link>

        {navItems.map(({ to, label, icon: Icon }) => {
          const badge = badges?.[to]
          return (
            <NavLink
              key={to || 'index'}
              to={resolveNavPath(basePath, to)}
              end={to === ''}
              onClick={afterNav}
              className={mainLinkClass}
            >
              <span className="relative shrink-0">
                <Icon size={18} />
                {badge && badge.count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                      badge.className ?? 'bg-indigo-500'
                    }`}
                  >
                    {badge.count > 99 ? '99+' : badge.count}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      {gestionItems && gestionItems.length > 0 && (
        <div className="shrink-0 border-t border-slate-200 px-3 py-3">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Gestión
          </p>
          {gestionItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={resolveNavPath(basePath, to)}
              onClick={afterNav}
              className={gestionLinkClass}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}
