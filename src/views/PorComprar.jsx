import { useMemo } from 'react'
import { ShoppingCart, Check, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'
import { UNITS } from '../data/units'

const unitMap = Object.fromEntries(UNITS.map((u) => [u.id, u]))

export default function PorComprar() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const markAsBought = useProductStore((s) => s.markAsBought)
  const removeFromShoppingList = useProductStore(
    (s) => s.removeFromShoppingList,
  )

  const products = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.inShoppingList,
      ),
    [allProducts, householdId],
  )

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
          Por Comprar
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Productos marcados para comprar &mdash; {products.length}{' '}
          {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 md:py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <ShoppingCart size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">¡Lista vacía!</p>
          <p className="mt-1 max-w-xs px-4 text-center text-xs text-slate-500">
            Marca productos desde el Inventario con el ícono de carrito para que
            aparezcan aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => {
            const unit = unitMap[product.unit]
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-5 md:py-4"
              >
                <div className="flex min-w-0 items-center gap-3 md:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 md:h-10 md:w-10">
                    <ShoppingCart size={16} className="text-amber-500 md:hidden" />
                    <ShoppingCart size={18} className="hidden text-amber-500 md:block" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 md:text-base">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.category}
                      {unit && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-slate-400">
                          {unit.label}
                        </span>
                      )}
                      {product.quantity > 0 && (
                        <span className="ml-1.5 text-slate-400">
                          · {product.quantity}
                          {unit ? unit.abbreviation : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                  <button
                    onClick={() => removeFromShoppingList(product.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2"
                    title="Quitar de la lista sin comprar"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => markAsBought(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 md:gap-2 md:px-3"
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Comprado</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
