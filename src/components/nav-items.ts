import {
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  ShoppingBag,
  History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inventario', icon: Package },
  { to: '/por-comprar', label: 'Por Comprar', icon: ShoppingCart },
  { to: '/registrar-compra', label: 'Registrar compra', icon: ShoppingBag },
  { to: '/historial-compras', label: 'Historial de compras', icon: History },
  { to: '/historico-precios', label: 'Histórico precios', icon: Receipt },
  { to: '/gastos', label: 'Gastos', icon: DollarSign },
]
