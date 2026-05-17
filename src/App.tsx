import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import Layout from './components/Layout'
import Inventario from './views/Inventario'
import PorComprar from './views/PorComprar'
import RegistrarCompra from './views/RegistrarCompra'
import HistorialCompras from './views/HistorialCompras'
import HistoricoPrecios from './views/HistoricoPrecios'
import Gastos from './views/Gastos'
import GestionCategorias from './views/GestionCategorias'
import GestionProductos from './views/GestionProductos'
import { Loader2 } from 'lucide-react'

export default function App() {
  const loading = useAuthStore((s) => s.loading)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Domus" className="h-16 w-16 object-contain" />
          <Loader2 size={20} className="animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Cargando Domus...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inventario />} />
          <Route path="por-comprar" element={<PorComprar />} />
          <Route path="registrar-compra" element={<RegistrarCompra />} />
          <Route path="historial-compras" element={<HistorialCompras />} />
          <Route
            path="facturas"
            element={<Navigate to="/historial-compras?tab=facturas" replace />}
          />
          <Route path="historico-precios" element={<HistoricoPrecios />} />
          <Route path="precios" element={<Navigate to="/historico-precios" replace />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="gestion/categorias" element={<GestionCategorias />} />
          <Route path="gestion/productos" element={<GestionProductos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
