import type { LucideIcon } from 'lucide-react'

/**
 * Item de navegación de una mini-app.
 *
 * `to` es una ruta RELATIVA al `basePath` de la app (sin slash inicial). El shell
 * resuelve la ruta absoluta como `${basePath}/${to}` (o `${basePath}` si `to` es '').
 * Las definiciones concretas viven en `src/apps/registry.ts`.
 */
export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Resuelve la ruta absoluta de un NavItem dado el basePath de su app. */
export function resolveNavPath(basePath: string, to: string): string {
  return to ? `${basePath}/${to}` : basePath
}
