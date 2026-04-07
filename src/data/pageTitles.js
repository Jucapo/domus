import { NAV_ITEMS } from '../components/nav-items'

function normalizePath(pathname) {
  if (!pathname) return '/'
  let p = pathname
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1)
  return p || '/'
}

const GESTION_TITLES = {
  '/gestion/categorias': 'Categorías',
  '/gestion/productos': 'Productos',
}

/** Misma redacción que el h2 de la vista (el ítem del menú a veces es más corto). */
const TITLE_OVERRIDES = {
  '/historico-precios': 'Histórico de precios',
  '/facturas': 'Historial de compras',
}

/**
 * Título de la pantalla para el header móvil (y puede alinearse con el h2 de escritorio).
 * @param {string} [search] — `location.search`, p. ej. pestañas en `historial-compras`
 */
export function getPageTitle(pathname, search = '') {
  const p = normalizePath(pathname)
  if (TITLE_OVERRIDES[p]) return TITLE_OVERRIDES[p]
  if (p === '/historial-compras') {
    const tab = new URLSearchParams(search).get('tab')
    if (tab === 'individuales') return 'Registros individuales'
    return 'Historial de compras · Facturas'
  }
  const fromNav = NAV_ITEMS.find((item) => item.to === p)
  if (fromNav) return fromNav.label
  if (GESTION_TITLES[p]) return GESTION_TITLES[p]
  return 'Domus'
}
