import type { AppDefinition } from '../apps/types'

function stripBase(pathname: string, basePath: string): string {
  let p = pathname
  if (p.startsWith(basePath)) p = p.slice(basePath.length)
  if (p.startsWith('/')) p = p.slice(1)
  if (p.endsWith('/')) p = p.slice(0, -1)
  return p
}

/** Redacción más larga que el ítem del menú para ciertas vistas. */
const TITLE_OVERRIDES: Record<string, string> = {
  'historico-precios': 'Histórico de precios',
}

/**
 * Título de la pantalla para el header móvil, derivado de la app activa.
 * @param search `location.search`, p. ej. pestañas en `historial-compras`
 */
export function getPageTitle(
  pathname: string,
  app: AppDefinition | undefined,
  search: string = '',
): string {
  if (!app) return 'Domus'
  const rel = stripBase(pathname, app.basePath)

  if (app.id === 'mercado' && rel === 'historial-compras') {
    const tab = new URLSearchParams(search).get('tab')
    if (tab === 'individuales') return 'Registros individuales'
    return 'Historial de compras · Facturas'
  }

  if (TITLE_OVERRIDES[rel]) return TITLE_OVERRIDES[rel]

  const items = [...app.navItems, ...(app.gestionItems ?? [])]
  const match = items.find((item) => item.to === rel)
  if (match) return match.label

  return app.name
}
