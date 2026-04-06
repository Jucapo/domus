import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, PackageSearch, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function AvatarMenu({ size = 'md' }) {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const goTo = (path) => {
    navigate(path)
    setOpen(false)
  }

  const sizeClasses =
    size === 'sm' ? 'h-8 w-8 text-sm' : 'h-8 w-8 text-sm md:h-9 md:w-9'

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex ${sizeClasses} items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 transition-shadow hover:ring-2 hover:ring-violet-200`}
      >
        {user.name.charAt(0)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => goTo('/gestion/categorias')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Tag size={16} className="text-slate-400" />
              Categorías
            </button>
            <button
              onClick={() => goTo('/gestion/productos')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <PackageSearch size={16} className="text-slate-400" />
              Editar productos
            </button>
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-50"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
