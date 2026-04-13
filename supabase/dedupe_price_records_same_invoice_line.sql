-- Quita filas duplicadas en price_records ligadas a la misma factura cuando
-- producto + fecha + precio + cantidad + tienda coinciden (misma línea insertada dos veces).
--
-- Causa típica: ejecutar canal_invoices.sql (o similar) más de una vez: la cabecera
-- invoices usa ON CONFLICT y no se duplica, pero los INSERT de líneas sin id fijo
-- creaban copias → la suma de líneas era el doble del total del ticket.
--
-- Riesgo: si en un mismo ticket compraste dos veces el mismo artículo con el mismo
-- precio y cantidad en líneas separadas, este script dejaría solo una. Revisa el PREVIEW.
--
-- Ajusta household_id si aplica.

-- === PREVIEW: grupos con más de una fila idéntica (misma factura) ===
SELECT
  invoice_id,
  product_id,
  recorded_date,
  price,
  quantity,
  store,
  COUNT(*) AS filas
FROM public.price_records
WHERE household_id = '00000000-0000-0000-0000-000000000001'
  AND invoice_id IS NOT NULL
GROUP BY invoice_id, product_id, recorded_date, price, quantity, store
HAVING COUNT(*) > 1
ORDER BY recorded_date, invoice_id;

-- === DELETE: conserva la fila más antigua (created_at, luego id) ===
-- Ejecutar aparte tras revisar el preview.
/*
DELETE FROM public.price_records pr
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY invoice_id, product_id, household_id, recorded_date, price, quantity, store
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.price_records
    WHERE invoice_id IS NOT NULL
      AND household_id = '00000000-0000-0000-0000-000000000001'
  ) ranked
  WHERE ranked.rn > 1
) doomed
WHERE pr.id = doomed.id;
*/
