-- Borra TODO el historial de compras de un hogar: price_records + invoices.
-- NO borra productos, categorías ni hogar.
--
-- Sirve para empezar de cero solo con las facturas del último mes (Cañaveral / D1)
-- que generas con los scripts, sin arrastrar semillas históricas ni duplicados.
--
-- Después de ejecutar:
--   - Pestaña Facturas: vacía hasta que vuelvas a correr tus SQL de facturas.
--   - Registros individuales: vacío → solo lo que registres sin factura (arepas, huevos en finca, etc.).
--
-- Orden: primero líneas de precio, luego cabeceras de factura.

begin;

-- Sustituye si tu hogar no es el de la semilla beta
-- (cópialo desde public.households o desde tu perfil en la app)

delete from public.price_records
where household_id = '00000000-0000-0000-0000-000000000001';

delete from public.invoices
where household_id = '00000000-0000-0000-0000-000000000001';

commit;

-- Qué NO ejecutes si solo quieres el último mes bien limpio:
--   - Los grandes INSERT de price_records / facturas viejos dentro de
--     seed_invoices_from_pdfs.sql o seed_invoices_historical_from_pdfs.sql
--     (repondrían años de historial y otra vez llenarían todo).
--
-- Atajo: reload_purchases_d1_and_canal.sql hace reset + D1 + Cañaveral en una sola
-- transacción (regenerar con: node scripts/build-reload-purchases-sql.mjs).
--
-- Qué sí puedes ejecutar tras el reset (en el orden que ya uses):
--   1) update_barcodes.sql (si lo necesitas para PLU/EAN)
--   2) d1_barcodes_and_invoices.sql (solo tus facturas D1 actuales)
--   3) canal_invoices.sql (Cañaveral del período que filtras en el parser)
--
-- Registrar compra en la app: sigue siendo la vía para ítems sin factura.
