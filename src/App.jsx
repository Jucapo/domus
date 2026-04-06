import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Inventario from './views/Inventario'
import PorComprar from './views/PorComprar'
import Gastos from './views/Gastos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inventario />} />
          <Route path="por-comprar" element={<PorComprar />} />
          <Route path="gastos" element={<Gastos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
