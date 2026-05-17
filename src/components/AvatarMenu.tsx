import { useState, useRef, useEffect } from 'react'
import { LogOut, Check, Home } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export interface AvatarMenuProps {
  size?: 'sm' | 'md'
}

export default function AvatarMenu({ size = 'md' }: AvatarMenuProps) {
  const user = useAuthStore((s) => s.user)
  const households = useAuthStore((s) => s.households)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const switchHousehold = useAuthStore((s) => s.switchHousehold)
  const signOut = useAuthStore((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (!user) return null

  const sizeClasses =
    size === 'sm' ? 'h-8 w-8 text-sm' : 'h-8 w-8 text-sm md:h-9 md:w-9'
  const showHouseholdSwitch = households.length > 1

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex ${sizeClasses} items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 transition-shadow hover:ring-2 hover:ring-violet-200`}
      >
        {user.name.charAt(0)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {showHouseholdSwitch ? (
            <div className="border-b border-slate-100 py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Hogares
              </p>
              {households.map((h) => {
                const active = h.id === user.currentHouseholdId
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      switchHousehold(h.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      active ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Home size={14} className="text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-left">{h.name}</span>
                    {active ? <Check size={14} className="text-indigo-500" /> : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          {isAuthenticated ? (
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  signOut()
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
