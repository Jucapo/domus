import { Package, ShoppingCart, DollarSign, Receipt } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Inventario', icon: Package },
  { to: '/por-comprar', label: 'Por Comprar', icon: ShoppingCart },
  { to: '/precios', label: 'Precios', icon: Receipt },
  { to: '/gastos', label: 'Gastos', icon: DollarSign },
]
