import { useCurrentHousehold } from '../store/useAuthStore'
import SideNavBody from './SideNavBody'
import NavUserStrip from './NavUserStrip'

export default function Sidebar() {
  const currentHousehold = useCurrentHousehold()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-5">
        <img src="/logo.png" alt="Domus" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Domus
          </h1>
          <p className="text-xs text-slate-500">{currentHousehold?.name}</p>
        </div>
      </div>

      <SideNavBody />

      <NavUserStrip />
    </aside>
  )
}
