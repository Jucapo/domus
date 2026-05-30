-- =====================================================================
-- Cleanup para arranque de QA (post refine_products.sql)
--
-- Hace 4 cosas:
--   1) Anclajes de paquetes → individual (linked_product_id).
--   2) Borrado de duplicados de barcode (mismo código en 2 productos).
--   3) Borrado de duplicados lógicos (mismo producto físico con código
--      interno corto + EAN largo — conservar EAN).
--   4) Reorganización de categorías incorrectas.
--
-- ORDEN: ejecutar DESPUÉS de refine_products.sql y ANTES de
-- hide_all_products_for_qa.sql.
--
-- Atómico: rollback si algo falla.
-- =====================================================================

begin;

-- =====================================================================
-- PARTE 1 — ANCLAJES de paquetes (pack → individual)
-- =====================================================================

-- 1.1) Cerveza Cero Águila individual (sin barcode, dato base):
--      configurar nombre/marca/display_unit antes de anclar el pack a ella.
update public.products set
  name = 'Cerveza Cero',
  brand = 'Águila',
  display_unit = 'can',
  content_amount = 330,
  content_unit = 'ml',
  notes = ''
where id = 'a1000001-0000-4000-8000-00000000001e'::uuid;

-- 1.2) "Cerveza 0.0 lata 6 und" (EAN 7702004033635, mi seed): anclar al individual
--      arriba. Quedará como sixpack de 6 unidades de la lata individual.
update public.products set
  name = 'Sixpack Cerveza Cero',
  brand = 'Águila',
  display_unit = 'pack',
  content_amount = 6,
  content_unit = 'unit',
  linked_units_per_package = 6,
  linked_product_id = 'a1000001-0000-4000-8000-00000000001e'::uuid,
  notes = ''
where id = 'ec73d28e-d8bc-4745-a709-61d83daacfb1'::uuid;

-- 1.3) Leche Alpina UHT bolsa 6und (id ...0000b0, la que conserva — BOLSA con A):
--      anclar al individual ...000118 (refine ya lo dejó como bag 1100ml Alpina).
update public.products set
  display_unit = 'pack',
  content_amount = 6,
  content_unit = 'unit',
  linked_units_per_package = 6,
  linked_product_id = 'a1000001-0000-4000-8000-000000000118'::uuid,
  notes = ''
where id = 'a1000001-0000-4000-8000-0000000000b0'::uuid;

-- =====================================================================
-- PARTE 2 — BORRADO de duplicados de barcode
-- =====================================================================

-- 2.1) Leche Alpina UHT 6und duplicado exacto (barcode 052274): borrar "BOLS" sin A.
delete from public.products where id = 'a1000001-0000-4000-8000-000000000089'::uuid;

-- 2.2) Sal ligera Refisal duplicada (barcode 1001409): borrar 400g, dejar 800g.
delete from public.products where id = 'a1000001-0000-4000-8000-000000000135'::uuid;

-- =====================================================================
-- PARTE 3 — BORRADO de duplicados lógicos (mismo producto, distintos códigos)
-- Conservar EAN (largo), borrar internal (corto del proveedor).
-- Previo a borrar: asegurar que el EAN tenga la mejor info final.
-- =====================================================================

-- 3.1) Sixpack Cerveza Águila Cero — internal duplicado (info ya migrada al EAN en 1.2)
delete from public.products where id = 'a1000001-0000-4000-8000-00000000006e'::uuid;

-- 3.2) Mantequilla Colanta 250g
update public.products set
  name = 'Mantequilla con sal',
  brand = 'Colanta',
  display_unit = 'unit',
  content_amount = 250,
  content_unit = 'g',
  notes = ''
where id = 'a00701ad-3e72-45a4-96f5-429bcd65b083'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-00000000014c'::uuid;

-- 3.3) Yogurt baby vainilla 113g
update public.products set
  display_unit = 'unit',
  content_amount = 113,
  content_unit = 'g',
  notes = ''
where id = '37652730-4770-4284-aefb-cef542273432'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-00000000008a'::uuid;

-- 3.4) Yogurt baby natural 113g
update public.products set
  display_unit = 'unit',
  content_amount = 113,
  content_unit = 'g',
  notes = ''
where id = '586c077b-8a3c-487d-96b1-6e9569ce0893'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-000000000052'::uuid;

-- 3.5) Queso mozzarella tajado 500g
update public.products set
  name = 'Queso mozzarella tajado',
  brand = 'Colanta',
  display_unit = 'pack',
  content_amount = 500,
  content_unit = 'g',
  notes = ''
where id = '4f131a90-e19d-486c-a992-5a3c61a04c26'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-00000000004f'::uuid;

-- 3.6) Pan blanco tajado Bimbo 730g
update public.products set
  display_unit = 'pack',
  content_amount = 730,
  content_unit = 'g',
  notes = ''
where id = '89253403-72d0-48e5-ae7b-1eeb966c0c36'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-0000000000aa'::uuid;

-- 3.7) Pan perro dorado Bimbo 4 und
update public.products set
  display_unit = 'pack',
  content_amount = 4,
  content_unit = 'unit',
  notes = ''
where id = '51606caa-a742-40de-a46e-957df2377b99'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-0000000000bb'::uuid;

-- 3.8) Tocineta Rica 250g
update public.products set
  name = 'Tocineta',
  brand = 'Rica',
  display_unit = 'unit',
  content_amount = 250,
  content_unit = 'g',
  notes = ''
where id = '8b4d2c3b-7334-4ef9-b574-b465e2b7a7df'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-0000000000a7'::uuid;

-- 3.9) Cilantro 80g — borrar internal (089157) y la versión sin barcode
update public.products set
  display_unit = 'unit',
  content_amount = 80,
  content_unit = 'g',
  notes = ''
where id = '418baf73-e04a-4eed-8a00-c6c756ac721e'::uuid;
delete from public.products where id in (
  'a1000001-0000-4000-8000-000000000044'::uuid,
  'a1000001-0000-4000-8000-0000000000a4'::uuid
);

-- 3.10) Sandía granel
update public.products set notes = '' where id = '90a3cd5b-945f-4043-9368-c2ad71f361a3'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-00000000012e'::uuid;

-- 3.11) Zanahoria granel
update public.products set notes = '' where id = 'ec6029ee-4f03-4c0e-948d-91682f0af656'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-000000000096'::uuid;

-- 3.12) Tomate chonto granel — borrar internal (005598) y dos versiones sin barcode
update public.products set notes = '' where id = 'f82e8f79-0039-4cbb-8cdd-df6fcd5373a6'::uuid;
delete from public.products where id in (
  'a1000001-0000-4000-8000-000000000048'::uuid,
  'a1000001-0000-4000-8000-00000000004c'::uuid
);
-- "Tomate chonto 1000g malla" (id ...000049) sin barcode es un producto distinto
-- (presentación malla vs granel): se conserva, se le quita el [REVISAR].
update public.products set
  display_unit = 'pack',
  content_amount = 1000,
  content_unit = 'g',
  notes = ''
where id = 'a1000001-0000-4000-8000-000000000049'::uuid;

-- 3.13) Cebolla cabezona blanca granel
update public.products set notes = '' where id = 'fce90f2a-2377-43ef-83ed-9f9903667d45'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-0000000000a2'::uuid;

-- 3.14) Mango granel
update public.products set notes = '' where id = 'cab49bc3-400c-48a0-a687-f5197dc74d0f'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-00000000008e'::uuid;

-- 3.15) Champiñón Champis 250g
update public.products set
  name = 'Champiñón entero',
  brand = 'Champis',
  display_unit = 'pack',
  content_amount = 250,
  content_unit = 'g',
  notes = ''
where id = 'a1000001-0000-4000-8000-00000000019e'::uuid;
delete from public.products where id = 'a1000001-0000-4000-8000-0000000000c4'::uuid;

-- =====================================================================
-- PARTE 4 — REORGANIZACIÓN de categorías
-- =====================================================================

-- 4.1) Mover a GRANOS (8ad95f67...): arroces, frijol, lenteja, avena, maíz pira
update public.products set
  category_id = '8ad95f67-57a6-49e3-86b7-44347ae10c70'::uuid
where id in (
  '8bf71fd6-3e9d-4987-9bd7-51885caf54ba'::uuid,  -- Arroz premium Doña Lupe 500g (sin barcode)
  'a1000001-0000-4000-8000-0000000000a9'::uuid,  -- Arroz premium Doña Lupe 2500g
  'a1000001-0000-4000-8000-00000000007e'::uuid,  -- Arroz de coco Diana
  'a1000001-0000-4000-8000-000000000021'::uuid,  -- Arroz integral Diana
  'a1000001-0000-4000-8000-00000000019d'::uuid,  -- Arroz económico Alba
  'a1000001-0000-4000-8000-000000000082'::uuid,  -- Roa Arroz Premium Doña Lupe 25und
  'a1000001-0000-4000-8000-000000000198'::uuid,  -- Frijol rojo Duba 500g
  'a1000001-0000-4000-8000-000000000024'::uuid,  -- Lenteja El Estío 500g
  'a1000001-0000-4000-8000-00000000013a'::uuid,  -- Avena Quaker 2000g
  'a1000001-0000-4000-8000-00000000017f'::uuid   -- Maíz pira Doña Lupe 500g
);

-- 4.2) Mover a BEBIDAS (ca0acfc8...): refajo, Suerox, infusión
update public.products set
  category_id = 'ca0acfc8-4508-4923-99d8-302be233b8f7'::uuid,
  notes = ''
where id in (
  'a1000001-0000-4000-8000-000000000070'::uuid,  -- Refajo Cola y Pola lata 330ml x 6
  'a1000001-0000-4000-8000-000000000100'::uuid,  -- Bebida hidratante fresa kiwi Suerox
  'a1000001-0000-4000-8000-000000000153'::uuid   -- Infusión Superblends Energy Hindu
);

-- 4.3) Mover a MECATO (9fee4121...): Pasabocas, Papas, Chips, Chocolatinas, Galleta Cocosette
update public.products set
  category_id = '9fee4121-9a2e-44d8-b41f-4fa1656c8f3a'::uuid,
  notes = ''
where id in (
  -- desde Verduras
  'a1000001-0000-4000-8000-0000000000f7'::uuid,  -- Papas Margarita mayonesa
  'a1000001-0000-4000-8000-00000000017c'::uuid,  -- Papas Yupi rizadas mayonesa
  'a1000001-0000-4000-8000-000000000053'::uuid,  -- Papas Yupi rizadas naturales
  -- desde Frutas
  'a1000001-0000-4000-8000-000000000146'::uuid,  -- Pasabocas Santaféreño arándanos
  -- desde Lácteos
  'a1000001-0000-4000-8000-000000000141'::uuid,  -- Pasabocas Doritos mega queso
  'a1000001-0000-4000-8000-000000000123'::uuid,  -- Chocolatina Jet con leche
  'a1000001-0000-4000-8000-00000000018a'::uuid,  -- Chocolatina Jet con leche 12 und
  -- desde Alacena (pasabocas + galleta individual)
  'a1000001-0000-4000-8000-0000000000f6'::uuid,  -- Pasabocas Choclitos limón
  'a1000001-0000-4000-8000-00000000017e'::uuid,  -- Pasabocas Detodito BBQ
  'a1000001-0000-4000-8000-00000000016c'::uuid,  -- Pasabocas Detodito pollo
  'a1000001-0000-4000-8000-00000000015f'::uuid,  -- Pasabocas Detodito natural bolsaza
  'a1000001-0000-4000-8000-00000000017a'::uuid,  -- Pasabocas Yupi palomitas
  'a1000001-0000-4000-8000-000000000173'::uuid,  -- Chips Corona sabor chocolate
  'a1000001-0000-4000-8000-00000000010c'::uuid   -- Galleta Cocosette wafer (individual)
);

-- 4.4) Mover a CUIDADO PERSONAL (b16b694c...)
update public.products set
  category_id = 'b16b694c-e0d4-4482-9045-80fdd9f91913'::uuid,
  notes = ''
where id = 'a1000001-0000-4000-8000-000000000076'::uuid;  -- Talco Arden For Men

-- 4.5) Mover a ALACENA (fa364e70...)
update public.products set
  category_id = 'fa364e70-2888-4c22-b508-b18304733418'::uuid,
  notes = ''
where id in (
  'a1000001-0000-4000-8000-000000000101'::uuid,  -- Crema Maggi pollo con champiñones
  'a1000001-0000-4000-8000-00000000016b'::uuid,  -- Crema sopera champiñones 6 porc
  'a1000001-0000-4000-8000-0000000000ce'::uuid   -- Salsa de tomate Constancia doypack
);

-- 4.6) Mover a PANADERÍA (fc9ec6e7...)
update public.products set
  category_id = 'fc9ec6e7-1ab5-4397-8e63-8a178c8e6452'::uuid
where id in (
  'a1000001-0000-4000-8000-0000000000fe'::uuid,  -- Tortilla Bimbo con mantequilla 30g x 8 (estaba en Lácteos)
  'a1000001-0000-4000-8000-00000000017b'::uuid   -- Ponqué Bimbo casero (estaba en Alacena)
);

commit;

-- =====================================================================
-- Verificación (descomenta y corre después)
-- =====================================================================
-- select
--   c.name as categoria,
--   count(*) as productos
-- from public.products p
-- left join public.categories c on c.id = p.category_id
-- where p.household_id = '00000000-0000-0000-0000-000000000001'
-- group by c.name
-- order by c.name;
--
-- -- Verificar que Granos ya no está vacía
-- -- Verificar que duplicados de barcode quedaron limpios:
-- select barcode, count(*) as ocurrencias
-- from public.products
-- where household_id = '00000000-0000-0000-0000-000000000001'
--   and barcode is not null
-- group by barcode
-- having count(*) > 1;
-- -- Esperado: 0 filas (sin duplicados).
