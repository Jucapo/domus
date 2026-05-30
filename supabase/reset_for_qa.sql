-- =====================================================================
-- Reset para arranque de QA — Domus
--
-- Borra TODO lo relacionado a compras y vacía el inventario, MANTENIENDO:
--   ✓ Categorías
--   ✓ Productos (con sus nombres, marcas, barcodes, fotos, unidades, links)
--   ✓ Hogar(es) y profile(s)
--
-- Resetea a CERO:
--   ✗ price_records (todo el histórico de compras)
--   ✗ invoices (todas las facturas)
--   ✗ products.quantity (stock = 0)
--   ✗ products.in_shopping_list (lista de compras vacía)
--   ✗ products.pending_registration (sin pendientes por registrar)
--
-- Ejecutar en SQL Editor:
--   https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new
--
-- Atómico: si algo falla, rollback completo y la data queda intacta.
-- =====================================================================

begin;

-- 1. Borrar líneas de precio (deben ir antes que invoices porque tienen FK).
delete from public.price_records
where household_id = '00000000-0000-0000-0000-000000000001';

-- 2. Borrar cabeceras de facturas.
delete from public.invoices
where household_id = '00000000-0000-0000-0000-000000000001';

-- 3. Resetear inventario y flags de productos (sin tocar el catálogo).
update public.products
set
  quantity = 0,
  in_shopping_list = false,
  pending_registration = false
where household_id = '00000000-0000-0000-0000-000000000001';

commit;

-- =====================================================================
-- Verificación (descomentar y correr después)
-- =====================================================================
-- select
--   (select count(*) from public.price_records where household_id = '00000000-0000-0000-0000-000000000001') as price_records_restantes,
--   (select count(*) from public.invoices where household_id = '00000000-0000-0000-0000-000000000001') as facturas_restantes,
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001') as productos_mantenidos,
--   (select count(*) from public.categories where household_id = '00000000-0000-0000-0000-000000000001') as categorias_mantenidas,
--   (select count(*) from public.products where household_id = '00000000-0000-0000-0000-000000000001' and quantity > 0) as productos_con_stock;
--
-- Esperado: price_records_restantes = 0, facturas_restantes = 0,
--           productos_con_stock = 0, productos y categorías intactos.
