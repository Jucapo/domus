import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import MercadoLayout from './components/MercadoLayout'
import FinanzasLayout from './components/FinanzasLayout'
import Launcher from './views/launcher/Launcher'
import Login from './views/Login'
import Onboarding from './views/Onboarding'
import Inventario from './views/Inventario'
import PorComprar from './views/PorComprar'
import RegistrarCompra from './views/RegistrarCompra'
import HistorialCompras from './views/HistorialCompras'
import HistoricoPrecios from './views/HistoricoPrecios'
import Gastos from './views/Gastos'
import GestionCategorias from './views/GestionCategorias'
import GestionProductos from './views/GestionProductos'
import FinanzasCuentas from './views/finanzas/FinanzasCuentas'
import FinanzasTransacciones from './views/finanzas/FinanzasTransacciones'
import FinanzasCategorias from './views/finanzas/FinanzasCategorias'
import FinanzasResumen from './views/finanzas/FinanzasResumen'
import { Loader2 } from 'lucide-react'

export default function App() {
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  const households = useAuthStore((s) => s.households)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    init().then((unsub) => {
      cleanup = unsub
    })
    return () => {
      cleanup?.()
    }
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

  // Auth real activa pero sin sesión: pantalla de login.
  if (!user) {
    return <Login />
  }

  // Auth real activa, sesión OK pero sin hogares: onboarding.
  if (isAuthenticated && households.length === 0) {
    return <Onboarding />
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Launcher: pantalla inicial para elegir mini-app */}
        <Route index element={<Launcher />} />

        {/* App: Mercado */}
        <Route path="mercado" element={<MercadoLayout />}>
          <Route index element={<Inventario />} />
          <Route path="por-comprar" element={<PorComprar />} />
          <Route path="registrar-compra" element={<RegistrarCompra />} />
          <Route path="historial-compras" element={<HistorialCompras />} />
          <Route
            path="facturas"
            element={<Navigate to="/mercado/historial-compras?tab=facturas" replace />}
          />
          <Route path="historico-precios" element={<HistoricoPrecios />} />
          <Route path="precios" element={<Navigate to="/mercado/historico-precios" replace />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="gestion/categorias" element={<GestionCategorias />} />
          <Route path="gestion/productos" element={<GestionProductos />} />
        </Route>

        {/* App: Finanzas */}
        <Route path="finanzas" element={<FinanzasLayout />}>
          <Route index element={<FinanzasCuentas />} />
          <Route path="transacciones" element={<FinanzasTransacciones />} />
          <Route path="categorias" element={<FinanzasCategorias />} />
          <Route path="resumen" element={<FinanzasResumen />} />
        </Route>

        {/* Compat: rutas viejas en raíz → su equivalente en /mercado */}
        <Route path="por-comprar" element={<Navigate to="/mercado/por-comprar" replace />} />
        <Route path="registrar-compra" element={<Navigate to="/mercado/registrar-compra" replace />} />
        <Route path="historial-compras" element={<Navigate to="/mercado/historial-compras" replace />} />
        <Route path="facturas" element={<Navigate to="/mercado/historial-compras?tab=facturas" replace />} />
        <Route path="historico-precios" element={<Navigate to="/mercado/historico-precios" replace />} />
        <Route path="precios" element={<Navigate to="/mercado/historico-precios" replace />} />
        <Route path="gastos" element={<Navigate to="/mercado/gastos" replace />} />
        <Route path="gestion/categorias" element={<Navigate to="/mercado/gestion/categorias" replace />} />
        <Route path="gestion/productos" element={<Navigate to="/mercado/gestion/productos" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
