import { useMemo } from 'react'
import { ShoppingCart, Plus } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useProductStore } from '../store/useProductStore'

export default function PorComprar() {
  const householdId = useAuthStore((s) => s.user.currentHouseholdId)
  const allProducts = useProductStore((s) => s.products)
  const increment = useProductStore((s) => s.increment)

  const products = useMemo(
    () =>
      allProducts.filter(
        (p) => p.householdId === householdId && p.quantity === 0,
      ),
    [allProducts, householdId],
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Por Comprar</h2>
        <p className="mt-1 text-sm text-slate-500">
          Productos con stock agotado &mdash; {products.length}{' '}
          {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <ShoppingCart size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            ¡Todo abastecido!
          </p>
          <p className="mt-1 text-xs text-slate-500">
            No hay productos con stock en 0.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <ShoppingCart size={18} className="text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
              </div>
              <button
                onClick={() => increment(product.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                <Plus size={14} />
                Comprado
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
