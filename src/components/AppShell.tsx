import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MobileNavDrawer from './MobileNavDrawer'
import type { NavBadge } from './SideNavBody'
import type { AppDefinition } from '../apps/types'

export interface AppShellProps {
  app: AppDefinition
  /** Badges indexados por la ruta relativa (`to`) del NavItem. */
  badges?: Record<string, NavBadge>
}

/**
 * Shell común a todas las mini-apps: sidebar de escritorio, header + drawer
 * móvil y área de contenido. Parametrizado por la app activa.
 */
export default function AppShell({ app, badges }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        appName={app.name}
        navItems={app.navItems}
        basePath={app.basePath}
        gestionItems={app.gestionItems}
        badges={badges}
      />
      <MobileHeader app={app} onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        appName={app.name}
        navItems={app.navItems}
        basePath={app.basePath}
        gestionItems={app.gestionItems}
        badges={badges}
      />

      <main className="min-h-screen min-w-0 px-4 pt-[72px] pb-8 md:ml-64 md:px-8 md:pt-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
