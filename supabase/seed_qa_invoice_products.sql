-- =====================================================================
-- Seed de los 26 productos faltantes detectados por las 3 facturas
-- de prueba para arranque de QA (Cañaveral 135717, 76336 + D1 236675).
--
-- Asignación de categorías basada en las ya existentes en el hogar legacy.
-- Stock = 0 (lo subirán las facturas cuando se importen desde la app).
-- Marca cuando es obvia desde el nombre; contenido cuando viene en el
-- nombre del proveedor. El resto del refinamiento (más marca, tipo de
-- empaque, foto, etc.) se hará desde la app como parte del QA.
--
-- Ejecutar en SQL Editor:
--   https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new
-- =====================================================================

begin;

insert into public.products
  (household_id, category_id, name, brand, barcode, display_unit, content_amount, content_unit, quantity)
values
  -- ---------- PANADERÍA ----------
  ('00000000-0000-0000-0000-000000000001', 'fc9ec6e7-1ab5-4397-8e63-8a178c8e6452', 'Pan blanco tajado',          'Bimbo',  '7705326023261', 'unit', 730,  'g',  0),
  ('00000000-0000-0000-0000-000000000001', 'fc9ec6e7-1ab5-4397-8e63-8a178c8e6452', 'Pan perro dorado 4 und',     'Bimbo',  '7705326629166', 'unit', 270,  'g',  0),
  ('00000000-0000-0000-0000-000000000001', 'fc9ec6e7-1ab5-4397-8e63-8a178c8e6452', 'Arepa de yuca 4 und',        '',       '7700304195473', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', 'fc9ec6e7-1ab5-4397-8e63-8a178c8e6452', 'Arepa con queso extradelgada', '',     '7700304670413', 'unit', null, null, 0),

  -- ---------- PROTEÍNAS ----------
  ('00000000-0000-0000-0000-000000000001', '522d0d53-a1dd-45a4-9cc7-7a5b456f9584', 'Tocineta',                   'Rica',   '7702398040110', 'unit', 250,  'g',  0),

  -- ---------- LÁCTEOS ----------
  ('00000000-0000-0000-0000-000000000001', '0fb270e5-5a0a-4da0-8395-23a7eb798f68', 'Queso mozzarella tajado',    'Colanta','7702129020756', 'unit', 500,  'g',  0),
  ('00000000-0000-0000-0000-000000000001', '0fb270e5-5a0a-4da0-8395-23a7eb798f68', 'Mantequilla con sal',        'Colanta','7702129030236', 'unit', 250,  'g',  0),
  ('00000000-0000-0000-0000-000000000001', '0fb270e5-5a0a-4da0-8395-23a7eb798f68', 'Yogurt baby vainilla',       'Alpina', '7702001148578', 'unit', 113,  'g',  0),
  ('00000000-0000-0000-0000-000000000001', '0fb270e5-5a0a-4da0-8395-23a7eb798f68', 'Yogurt baby natural',        'Alpina', '7702001148561', 'unit', 113,  'g',  0),

  -- ---------- VERDURAS ----------
  ('00000000-0000-0000-0000-000000000001', 'cbd11bdc-c811-4923-8232-505e05fd503d', 'Cebolla cabezona blanca',    '',       '2404347',       'kg',   null, null, 0),
  ('00000000-0000-0000-0000-000000000001', 'cbd11bdc-c811-4923-8232-505e05fd503d', 'Cilantro',                   '',       '7708432897948', 'unit', 80,   'g',  0),
  ('00000000-0000-0000-0000-000000000001', 'cbd11bdc-c811-4923-8232-505e05fd503d', 'Tomate chonto',              '',       '2400161',       'kg',   null, null, 0),
  ('00000000-0000-0000-0000-000000000001', 'cbd11bdc-c811-4923-8232-505e05fd503d', 'Zanahoria',                  '',       '2404928',       'kg',   null, null, 0),

  -- ---------- FRUTAS ----------
  ('00000000-0000-0000-0000-000000000001', 'c8346c45-c296-4d46-b388-a59a9570c287', 'Mango',                      '',       '2404614',       'kg',   null, null, 0),
  ('00000000-0000-0000-0000-000000000001', 'c8346c45-c296-4d46-b388-a59a9570c287', 'Sandía',                     '',       '2404844',       'kg',   null, null, 0),

  -- ---------- BEBIDAS ----------
  ('00000000-0000-0000-0000-000000000001', 'ca0acfc8-4508-4923-99d8-302be233b8f7', 'Cerveza 0.0 lata 6 und',     'Águila', '7702004033635', 'unit', 1980, 'ml', 0),

  -- ---------- ALACENA ----------
  ('00000000-0000-0000-0000-000000000001', 'fa364e70-2888-4c22-b508-b18304733418', 'Vinagre blanco',             'Zev',    '7700304983049', 'unit', null, null, 0),

  -- ---------- ASEO HOGAR ----------
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Detergente líquido',         '',       '7700304755011', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Detergente ropa delicada',   '',       '7700304346851', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Jabón líquido',              '',       '7700304586004', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Suavizante Bonaropa',        '',       '7700304507962', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Bonaropa ropa de color',     '',       '7700304998562', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Perlas de fragancia',        '',       '7700304391035', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Toalla cocina práctica',     '',       '7702026162245', 'unit', null, null, 0),
  ('00000000-0000-0000-0000-000000000001', '93f3d287-4115-4fc4-83ce-712367c0931f', 'Toallas húmedas 99.9',       '',       '7700304372959', 'unit', null, null, 0),

  -- ---------- VARIOS ----------
  ('00000000-0000-0000-0000-000000000001', '37590c5e-8609-42bd-b9bd-6d9bf7c4a112', 'Vitamina C en tabletas',     '',       '7702418006577', 'unit', null, null, 0);

commit;

-- =====================================================================
-- Verificación (descomenta y corre después)
-- =====================================================================
-- select count(*) as productos_nuevos
-- from public.products
-- where household_id = '00000000-0000-0000-0000-000000000001'
--   and barcode in (
--     '7705326023261','7705326629166','7702398040110','2404844',
--     '7702129020756','7702129030236','7702004033635','2404928',
--     '7708432897948','2400161','2404347','2404614',
--     '7702001148578','7702001148561','7700304755011','7700304934744',
--     '7700304391035','7702026162245','7700304648115','7700304324538',
--     '7700304372959','7700304507962','7700304345373','7700304346851',
--     '7700304783755','7700304484546','7700304998562','7700304586004',
--     '7700304716890','7700304797981','7702535018675','7707110100370',
--     '7702418006577','7700304670413','7700304195473','7700304456659',
--     '7700304983049'
--   );
-- Esperado: 37 (los 26 nuevos + 11 que ya existían).
