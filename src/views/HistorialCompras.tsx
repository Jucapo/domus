import { Link, useSearchParams } from 'react-router-dom'
import FacturasListSection from './FacturasListSection'
import IndividualPurchasesHistory from './IndividualPurchasesHistory'

/**
 * Consulta: facturas agrupadas y registros individuales (sin registrar aquí).
 * El alta sigue en Registrar compra.
 */
export default function HistorialCompras() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'individuales' ? 'individuales' : 'facturas'

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h2 className="hidden text-xl font-bold text-slate-900 md:block md:text-2xl">
          Historial de compras
        </h2>
        <p className="mt-0 text-sm text-slate-500 md:mt-0.5">
          Revisa y edita lo que ya guardaste. Para cargar compras nuevas ve a{' '}
          <Link
            to="/registrar-compra"
            className="font-medium text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
          >
            Registrar compra
          </Link>
          .
        </p>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'facturas'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Facturas
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'individuales' })}
          className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'individuales'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Registros individuales
        </button>
      </div>

      {tab === 'facturas' ? <FacturasListSection /> : <IndividualPurchasesHistory />}
    </div>
  )
}
