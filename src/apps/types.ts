import type { LucideIcon } from 'lucide-react'
import type { NavItem } from '../components/nav-items'

/**
 * Definición de una "mini-app" dentro de Domus.
 *
 * Domus es un contenedor de varias mini-apps (Mercado, Finanzas, …). El launcher,
 * las rutas y los menús se generan a partir de este registro: agregar una app
 * nueva es agregar un objeto a `APPS` en `registry.ts`.
 */
export interface AppDefinition {
  /** Identificador estable (slug). */
  id: string
  /** Nombre visible en launcher y sidebar. */
  name: string
  /** Descripción corta para la tarjeta del launcher. */
  description: string
  /** Icono (lucide) para launcher y sidebar. */
  icon: LucideIcon
  /** Color base (clave de Tailwind, p.ej. 'violet', 'emerald'). */
  color: string
  /** Prefijo de ruta de la app, p.ej. '/mercado'. Sin slash final. */
  basePath: string
  /** Items de navegación principales (rutas relativas al basePath). */
  navItems: NavItem[]
  /** Items de la sección "Gestión" (opcional, rutas relativas al basePath). */
  gestionItems?: NavItem[]
}
