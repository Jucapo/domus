import { Wrench } from 'lucide-react'

export default function Gastos() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Gastos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra y visualiza los gastos del hogar.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
          <Wrench size={24} className="text-violet-500" />
        </div>
        <p className="text-lg font-semibold text-slate-700">En construcción</p>
        <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
          Estamos trabajando en esta funcionalidad. Pronto podrás registrar
          gastos compartidos, dividir cuentas y ver resúmenes mensuales.
        </p>
      </div>
    </div>
  )
}
