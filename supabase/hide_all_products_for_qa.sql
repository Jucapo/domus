-- =====================================================================
-- Ocultar todos los productos del inventario para arranque de QA
--
-- Marca visible_in_inventory = false en todos los productos del hogar.
-- A partir de aquí, al importar facturas se irán "destapando"
-- automáticamente (ver lógica en src/store/useProductStore.ts:
-- addInventoryFromPurchase auto-activa visibilidad cuando suma stock).
--
-- El catálogo completo sigue accesible desde Gestión de Productos.
-- =====================================================================

begin;

update public.products
set visible_in_inventory = false
where household_id = '00000000-0000-0000-0000-000000000001';

commit;

-- Verificación:
-- select count(*) as visibles
-- from public.products
-- where household_id = '00000000-0000-0000-0000-000000000001'
--   and visible_in_inventory = true;
-- Esperado: 0
