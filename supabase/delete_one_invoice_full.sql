-- Borra una factura y todas sus líneas en price_records (elimina el ticket completo del histórico).
-- La acción "Quitar agrupación" en la app solo borra la fila de invoices y deja las líneas como compras individuales;
-- este script elimina también esas líneas.
--
-- 1) Obtén el id: Supabase → Table Editor → invoices, o:
--    select id, invoice_date, store, total_cop from public.invoices order by invoice_date desc;
-- 2) Sustituye el UUID en inv abajo y ejecuta.

do $$
declare
  inv uuid := '00000000-0000-0000-0000-000000000000'; -- ← pega aquí el id de la factura
begin
  delete from public.price_records where invoice_id = inv;
  delete from public.invoices where id = inv;
end $$;
