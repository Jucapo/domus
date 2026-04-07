import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getPageTitle } from '../data/pageTitles'
import AvatarMenu from './AvatarMenu'

export default function MobileHeader({ onMenuOpen }) {
  const location = useLocation()
  const title = getPageTitle(location.pathname, location.search)

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Abrir menú"
        >
          <Menu size={24} strokeWidth={2} />
        </button>
        <h1 className="min-w-0 truncate text-base font-bold leading-tight tracking-tight text-slate-900">
          {title}
        </h1>
      </div>

      <AvatarMenu size="sm" />
    </header>
  )
}
