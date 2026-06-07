import { useEffect } from 'react'
import { X } from 'lucide-react'
import SideNavBody from './SideNavBody'
import type { NavBadge } from './SideNavBody'
import NavUserStrip from './NavUserStrip'
import { useCurrentHousehold } from '../store/useAuthStore'
import type { NavItem } from './nav-items'

export interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  appName: string
  navItems: NavItem[]
  basePath: string
  gestionItems?: NavItem[]
  badges?: Record<string, NavBadge>
}

export default function MobileNavDrawer({
  open,
  onClose,
  appName,
  navItems,
  basePath,
  gestionItems,
  badges,
}: MobileNavDrawerProps) {
  const currentHousehold = useCurrentHousehold()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      <aside
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] max-w-full flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-900">{appName}</p>
              <p className="truncate text-xs text-slate-500">{currentHousehold?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <SideNavBody
          navItems={navItems}
          basePath={basePath}
          gestionItems={gestionItems}
          badges={badges}
          onNavigate={onClose}
        />
        <NavUserStrip />
      </aside>
    </div>
  )
}
