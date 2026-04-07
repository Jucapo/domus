import { Package, ShoppingCart, DollarSign, Receipt, ShoppingBag, History } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Inventario', icon: Package },
  { to: '/por-comprar', label: 'Por Comprar', icon: ShoppingCart },
  { to: '/registrar-compra', label: 'Registrar compra', icon: ShoppingBag },
  { to: '/historial-compras', label: 'Historial de compras', icon: History },
  { to: '/historico-precios', label: 'Histórico precios', icon: Receipt },
  { to: '/gastos', label: 'Gastos', icon: DollarSign },
]
