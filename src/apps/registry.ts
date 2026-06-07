import {
  Package,
  ShoppingCart,
  ShoppingBag,
  History,
  Receipt,
  DollarSign,
  Wallet,
  ArrowLeftRight,
  Tags,
  PieChart,
  Boxes,
  Landmark,
} from 'lucide-react'
import type { AppDefinition } from './types'

/**
 * Registro de mini-apps de Domus.
 *
 * Las rutas de `navItems` / `gestionItems` son RELATIVAS al `basePath` de la app
 * (sin slash inicial). El shell resuelve la ruta absoluta como
 * `${basePath}/${to}` (y `${basePath}` cuando `to` es '').
 */
export const APPS: AppDefinition[] = [
  {
    id: 'mercado',
    name: 'Mercado',
    description: 'Inventario del hogar, compras y facturas.',
    icon: Boxes,
    color: 'violet',
    basePath: '/mercado',
    navItems: [
      { to: '', label: 'Inventario', icon: Package },
      { to: 'por-comprar', label: 'Por Comprar', icon: ShoppingCart },
      { to: 'registrar-compra', label: 'Registrar compra', icon: ShoppingBag },
      { to: 'historial-compras', label: 'Historial de compras', icon: History },
      { to: 'historico-precios', label: 'Histórico precios', icon: Receipt },
      { to: 'gastos', label: 'Gastos', icon: DollarSign },
    ],
    gestionItems: [
      { to: 'gestion/categorias', label: 'Categorías', icon: Tags },
      { to: 'gestion/productos', label: 'Productos', icon: Package },
    ],
  },
  {
    id: 'finanzas',
    name: 'Finanzas',
    description: 'Cuentas, gastos, ingresos y transferencias del hogar.',
    icon: Landmark,
    color: 'emerald',
    basePath: '/finanzas',
    navItems: [
      { to: '', label: 'Cuentas', icon: Wallet },
      { to: 'transacciones', label: 'Transacciones', icon: ArrowLeftRight },
      { to: 'categorias', label: 'Categorías', icon: Tags },
      { to: 'resumen', label: 'Resumen', icon: PieChart },
    ],
  },
]

export function getAppByBasePath(pathname: string): AppDefinition | undefined {
  return APPS.find(
    (app) => pathname === app.basePath || pathname.startsWith(app.basePath + '/'),
  )
}
