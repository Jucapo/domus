-- Duplicados: registros individuales (invoice_id NULL) que ya existen como línea de factura.
--
-- Caso de uso: cargaste líneas a mano en “Registrar compra” y luego importaste la misma
-- compra como factura (D1, Cañaveral…). En “Registros individuales” siguen los viejos.
--
-- En Supabase SQL Editor:
--   1) Ejecuta el SELECT de PREVIEW y revisa filas.
--   2) Si cuadra, ejecuta el DELETE (misma condición).
--
-- Sustituye el UUID si tu hogar no es el de la semilla local.

-- === PREVIEW ===
SELECT
  p.id,
  p.product_id,
  p.recorded_date,
  p.store,
  p.price,
  p.quantity
FROM public.price_records p
WHERE p.household_id = '00000000-0000-0000-0000-000000000001'
  AND p.invoice_id IS NULL
  AND p.recorded_date BETWEEN '2026-03-27' AND '2026-04-26'
  AND EXISTS (
    SELECT 1
    FROM public.price_records i
    WHERE i.household_id = p.household_id
      AND i.invoice_id IS NOT NULL
      AND i.product_id = p.product_id
      AND i.recorded_date = p.recorded_date
      AND i.price = p.price
      AND i.quantity = p.quantity
  )
ORDER BY p.recorded_date, p.product_id;

-- === DELETE (ejecutar aparte, después del preview) ===
-- DELETE FROM public.price_records p
-- WHERE p.household_id = '00000000-0000-0000-0000-000000000001'
--   AND p.invoice_id IS NULL
--   AND p.recorded_date BETWEEN '2026-03-27' AND '2026-04-26'
--   AND EXISTS (
--     SELECT 1
--     FROM public.price_records i
--     WHERE i.household_id = p.household_id
--       AND i.invoice_id IS NOT NULL
--       AND i.product_id = p.product_id
--       AND i.recorded_date = p.recorded_date
--       AND i.price = p.price
--       AND i.quantity = p.quantity
--   );

-- Notas:
-- - household_id en este proyecto suele ser '00000000-0000-0000-0000-000000000001' (revisa en tu tabla households).
-- - No comparamos `store` (ej. “D1 / Carulla” vs “D1”).
-- - Ajusta o quita el BETWEEN de fechas si tu período es otro.
-- - Compras solo “Finca” u otras sin factura gemela no aparecen en el preview y no se borran.
