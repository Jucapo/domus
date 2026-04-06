import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <MobileHeader />
      <BottomNav />

      <main className="min-h-screen px-4 pt-[72px] pb-20 md:ml-64 md:px-8 md:pt-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
