import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MobileNavDrawer from './MobileNavDrawer'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { useCategoryStore } from '../store/useCategoryStore'
import { usePriceStore } from '../store/usePriceStore'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const fetchCategories = useCategoryStore((s) => s.fetchCategories)
  const fetchRecords = usePriceStore((s) => s.fetchRecords)

  useEffect(() => {
    if (householdId) {
      fetchProducts(householdId)
      fetchCategories(householdId)
      fetchRecords(householdId)
    }
  }, [householdId, fetchProducts, fetchCategories, fetchRecords])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <MobileHeader onMenuOpen={() => setMobileMenuOpen(true)} />
      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="min-h-screen min-w-0 px-4 pt-[72px] pb-8 md:ml-64 md:px-8 md:pt-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
