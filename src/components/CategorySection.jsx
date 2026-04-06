import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  CATEGORY_ICON_MAP,
  CATEGORY_COLOR_MAP,
  CATEGORY_COLOR_SURFACE_MAP,
} from '../data/category_styles'

/**
 * Cabecera colapsable + contenido (mismo patrón visual que Inventario).
 */
export default function CategorySection({
  categoryName,
  productCount,
  meta,
  isCollapsed,
  onToggle,
  children,
}) {
  const m = meta || { icon: 'tag', color: 'slate' }
  const Icon = CATEGORY_ICON_MAP[m.icon] || CATEGORY_ICON_MAP.tag
  const surface =
    CATEGORY_COLOR_SURFACE_MAP[m.color] || 'bg-slate-50/60 border-slate-200'
  const chipClass =
    CATEGORY_COLOR_MAP[m.color] || 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b border-black/[0.06] bg-white/40 px-3 py-2.5 text-left md:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chipClass}`}
          >
            <Icon size={16} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {categoryName}
            <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {productCount}
            </span>
          </h3>
        </div>
        <div className="shrink-0 text-slate-500">
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>
      {!isCollapsed && (
        <div className="space-y-2 bg-white/50 p-2 md:p-3">{children}</div>
      )}
    </div>
  )
}
