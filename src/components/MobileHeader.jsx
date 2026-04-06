import { useCurrentHousehold } from '../store/useAuthStore'
import AvatarMenu from './AvatarMenu'

export default function MobileHeader() {
  const currentHousehold = useCurrentHousehold()

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="Domus" className="h-8 w-8 object-contain" />
        <div>
          <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900">
            Domus
          </h1>
          <p className="text-[11px] leading-tight text-slate-500">
            {currentHousehold?.name}
          </p>
        </div>
      </div>

      <AvatarMenu size="sm" />
    </header>
  )
}
