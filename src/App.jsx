import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Inventario from './views/Inventario'
import PorComprar from './views/PorComprar'
import Precios from './views/Precios'
import Gastos from './views/Gastos'
import GestionCategorias from './views/GestionCategorias'
import GestionProductos from './views/GestionProductos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inventario />} />
          <Route path="por-comprar" element={<PorComprar />} />
          <Route path="precios" element={<Precios />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="gestion/categorias" element={<GestionCategorias />} />
          <Route path="gestion/productos" element={<GestionProductos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
