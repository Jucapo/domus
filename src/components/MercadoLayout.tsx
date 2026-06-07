import { useEffect, useMemo } from 'react'
import AppShell from './AppShell'
import type { NavBadge } from './SideNavBody'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { usePriceStore } from '../store/usePriceStore'
import { APPS } from '../apps/registry'

const MERCADO_APP = APPS.find((a) => a.id === 'mercado')!

export default function MercadoLayout() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const fetchCategories = useCategoryStore((s) => s.fetchCategories)
  const fetchRecords = usePriceStore((s) => s.fetchRecords)
  const allProducts = useProductStore((s) => s.products)

  useEffect(() => {
    if (householdId) {
      fetchProducts(householdId)
      fetchCategories(householdId)
      fetchRecords(householdId)
    }
  }, [householdId, fetchProducts, fetchCategories, fetchRecords])

  const badges = useMemo<Record<string, NavBadge>>(() => {
    const shopping = allProducts.filter(
      (p) => p.householdId === householdId && p.inShoppingList,
    ).length
    const pending = allProducts.filter(
      (p) => p.householdId === householdId && p.pendingRegistration,
    ).length
    return {
      'por-comprar': { count: shopping, className: 'bg-amber-500' },
      'registrar-compra': { count: pending, className: 'bg-indigo-500' },
    }
  }, [allProducts, householdId])

  return <AppShell app={MERCADO_APP} badges={badges} />
}
