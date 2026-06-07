import { useCurrentHousehold } from '../store/useAuthStore'
import SideNavBody from './SideNavBody'
import type { NavBadge } from './SideNavBody'
import NavUserStrip from './NavUserStrip'
import type { NavItem } from './nav-items'

export interface SidebarProps {
  appName: string
  navItems: NavItem[]
  basePath: string
  gestionItems?: NavItem[]
  badges?: Record<string, NavBadge>
}

export default function Sidebar({
  appName,
  navItems,
  basePath,
  gestionItems,
  badges,
}: SidebarProps) {
  const currentHousehold = useCurrentHousehold()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-5">
        <img src="/logo.png" alt="Domus" className="h-9 w-9 object-contain" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
            {appName}
          </h1>
          <p className="truncate text-xs text-slate-500">{currentHousehold?.name}</p>
        </div>
      </div>

      <SideNavBody
        navItems={navItems}
        basePath={basePath}
        gestionItems={gestionItems}
        badges={badges}
      />

      <NavUserStrip />
    </aside>
  )
}
