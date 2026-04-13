-- Facturas Cañaveral → invoices + price_records (invoice_id)
-- Cada línea lleva id determinista + ON CONFLICT DO NOTHING (puedes re-ejecutar sin duplicar).
-- Generado: 2026-04-08T21:22:45.398Z
-- Período gastos mes nominal 2026-04: 2026-03-27 .. 2026-04-26

begin;

-- Asegurar categorías y productos referenciados (ON CONFLICT no-op) por si falta la última semilla PDF
insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Aceites'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Aceites'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Alacena'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Alacena'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Aseo hogar'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Aseo hogar'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Bebidas'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Bebidas'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Cuidado personal'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Cuidado personal'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Frutas'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Frutas'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Lácteos'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Lácteos'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Panadería'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Panadería'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Proteínas'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Proteínas'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Verduras'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Verduras'
);

insert into public.products (id, household_id, category_id, name, quantity, display_unit, content_amount, content_unit, brand, notes, visible_in_inventory) values
  ('a1000001-0000-4000-8000-000000000176', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'LECHUGA BIOFRESCOS*160g TROPICAL', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000009f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'PEPINO COHOMBRO A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000009c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'AGUACATE COMUN*und', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000009d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'TOMATE*500g CHERRY CONTENEDOR', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000019f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Remolacha a granel', 0, 'kg', null, null, '', 'Importado factura Cañaveral', true),
  ('a1000001-0000-4000-8000-000000000096', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'ZANAHORIA A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000097', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'PAPA SIN LAVAR A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000092', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'PAPA AMARILLA A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-0000000000ed', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'ESPONJA BRIO*2und LL3 ORO PLATA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000129', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'TC FAMILIA*135h*1rol GREEN FSC R', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000088', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'QUESO COLANTA*400g CREMA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-0000000000b0', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'LECHE ALPINA*1100ml*6und ENT UHT BOLSA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'YOGURT ALPINA*113g BABY VAINILLA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000071', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'CERVEZA AGUILA*330ml*6und LIGHT LATA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000008b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'CERVEZA CLUB COLOMBIA*330ml*6u DRDA L', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000049', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Tomate chonto 1000g malla', 0, 'pack', 1000, 'g', '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-000000000077', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'ENJUAGUE PLAX*250ml KIDS MINIONS', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000085', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'C.D ORAL B*107ml 3D WHITE', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Maquinilla Gillette Venus', 0, 'unit', null, null, '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Repuesto Gillette Venus 2und', 0, 'unit', null, null, '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-000000000086', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'JABON PALM*390ml BODY PITAHAYA NATU/SE', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000087', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'JABON PROTEX*110g*3und SPORT MEN', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Repuesto Gillette Mach3 4und', 0, 'unit', null, null, '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-00000000005d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'PERNIL CAMPO S/MARIN A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000046', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Limón 1000g malla', 0, 'pack', 1000, 'g', '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-00000000006a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'CAMARON PRECOCIDO SMALL*500g', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000006b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Panadería' limit 1), 'HOJA TAMAL*und', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000068', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aceites' limit 1), 'ACEITE DONA LUPE*3000ml SOYA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000069', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'PLATANO A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-0000000000e3', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'MANDARINA ARRAYANA A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000091', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'LIMON TAHITI A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000047', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Papa lista y fresca 2500g', 0, 'pack', 2500, 'g', '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-00000000004c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'TOMATE CHONTO A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000109', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'CADERITA ESPECIAL RES A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000039', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Chorizo Colanta 450g campesino', 0, 'pack', 450, 'g', '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-00000000014c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'MANTEQUILLA COLANTA*250g C/SAL', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000044', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Cilantro 80g', 0, 'pack', 80, 'g', '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-00000000005f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'PECHUGA PIKU CAMPO MARINADA A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000017', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Crema dental Colgate Sensitive', 0, 'unit', null, null, '', 'Importado factura', true),
  ('a1000001-0000-4000-8000-000000000065', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'CAFE TOSTAO*454g MOLIDO SELECTO', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000006e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'CERVEZA AGUILA*330ml*6und 0.0% LATA', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000004e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'PAPAYA COMUN A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-0000000000aa', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'PAN BIMBO*730g BLANCO TAJADO', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000004f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'QUESO COLANTA*500g MOZAREL TAJADO', 0, 'unit', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000008d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'MELON A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000115', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'PINA ORO MIEL A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000008e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'MANGO GRUESO SURTIDO A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-00000000011d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'MANZANA VERDE A GRANEL', 0, 'kg', null, null, '', 'Importado factura PDF', true),
  ('a1000001-0000-4000-8000-000000000052', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'YOGURT ALPINA*113g BABY NATURAL', 0, 'unit', null, null, '', 'Importado factura PDF', true)
on conflict (id) do nothing;

-- 06FC109391 (2026-03-27) fv08050280410152600109391.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-03-27', 76945) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('61635aa4-b106-4831-8fd0-1eb081e2ef2f', 'a1000001-0000-4000-8000-000000000176', '00000000-0000-0000-0000-000000000001', 3160, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('a0db8a4f-0e9b-454d-83ee-1fed6bd128a8', 'a1000001-0000-4000-8000-00000000009f', '00000000-0000-0000-0000-000000000001', 2700.55, 0.915, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('89e052b1-a855-44a6-8e7e-0428a87ac040', 'a1000001-0000-4000-8000-00000000009c', '00000000-0000-0000-0000-000000000001', 7750, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('262cb635-a165-4f26-8c7a-8c4fb46e6fb0', 'a1000001-0000-4000-8000-00000000009c', '00000000-0000-0000-0000-000000000001', 7750, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('47ec41e3-6219-47a9-8586-e8a9920b834c', 'a1000001-0000-4000-8000-00000000009d', '00000000-0000-0000-0000-000000000001', 8900, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('5fd5435b-c710-4080-8ff1-80441dc12ac4', 'a1000001-0000-4000-8000-00000000019f', '00000000-0000-0000-0000-000000000001', 5200, 0.23, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e3124112-67d2-4cc2-890c-c69601675831', 'a1000001-0000-4000-8000-000000000096', '00000000-0000-0000-0000-000000000001', 2079.71, 1.38, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('1cd77d7d-b638-4d42-87fe-1c669841d180', 'a1000001-0000-4000-8000-000000000097', '00000000-0000-0000-0000-000000000001', 2380.14, 2.165, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('bd194b3a-c7f8-4b18-840b-d1e11480e021', 'a1000001-0000-4000-8000-000000000092', '00000000-0000-0000-0000-000000000001', 6900, 1.05, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('49c48a56-c5c8-40e9-8773-d3ac801a051b', 'a1000001-0000-4000-8000-00000000009c', '00000000-0000-0000-0000-000000000001', 7750, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('23caa34e-935a-4d63-8cbf-f8714a56e577', 'a1000001-0000-4000-8000-0000000000ed', '00000000-0000-0000-0000-000000000001', 10850, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e83818c7-9815-4a81-8847-0a6f43307dd6', 'a1000001-0000-4000-8000-000000000129', '00000000-0000-0000-0000-000000000001', 11850, 1, 'Cañaveral', '2026-03-27', '7240a2d3-fa7e-4cbb-85a9-405a1eb9af6e') ON CONFLICT (id) DO NOTHING;

-- 03FC92923 (2026-03-28) fv08050280410152600092923.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('1905e127-e2f3-474d-890b-e405e5fb02b9', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-03-28', 300940) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('316cc3d8-b422-4ee0-853a-40cf5e95a9fe', 'a1000001-0000-4000-8000-000000000088', '00000000-0000-0000-0000-000000000001', 10801, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('5c6ac6a1-b9ff-481d-8dd4-8b2e3ae9aa47', 'a1000001-0000-4000-8000-0000000000b0', '00000000-0000-0000-0000-000000000001', 44425, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('6ea12a62-9473-48d6-8465-1e17df99a891', 'a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', 4331, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('0d8286ba-81c4-4068-811f-f255d3dea9a6', 'a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', 4330, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('0d562f8f-5cc8-4d3d-8d5c-074220ba9ef2', 'a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', 4330, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e8f92710-d624-44a4-8028-f48137d1708d', 'a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', 4330, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('581cc02f-a79c-4789-8833-564e8108de79', 'a1000001-0000-4000-8000-000000000071', '00000000-0000-0000-0000-000000000001', 18711, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('9d281c76-0250-4304-8e92-65a37f27c63e', 'a1000001-0000-4000-8000-00000000008b', '00000000-0000-0000-0000-000000000001', 14315, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('07b8452f-b9a4-4d55-8b1b-e63a57f69a02', 'a1000001-0000-4000-8000-000000000049', '00000000-0000-0000-0000-000000000001', 7112, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('dd0ddef5-789c-4004-858a-dcc958bb730c', 'a1000001-0000-4000-8000-000000000077', '00000000-0000-0000-0000-000000000001', 15386, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('1cf2ed7a-f3c3-4c4e-8cac-3697039f30b8', 'a1000001-0000-4000-8000-000000000085', '00000000-0000-0000-0000-000000000001', 11106, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('f0d3d330-a059-4ac8-85a0-2df8f4f18f82', 'a1000001-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000001', 26461, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('25ab0b89-1c21-42ec-8d4d-d28588d6b8ea', 'a1000001-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000001', 26461, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('502b25bc-4d71-4617-8ed4-a1d062bc4935', 'a1000001-0000-4000-8000-000000000086', '00000000-0000-0000-0000-000000000001', 20837, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('bb253dfb-270b-4fbe-8b33-4b7b32eb707e', 'a1000001-0000-4000-8000-000000000087', '00000000-0000-0000-0000-000000000001', 12023, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('2343925a-1b43-4680-85e4-436996facebe', 'a1000001-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000001', 35627, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e5a51332-dc50-4055-8b24-60503bc614a7', 'a1000001-0000-4000-8000-00000000005d', '00000000-0000-0000-0000-000000000001', 15997.25, 2.185, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('d01c9461-65d1-4ac7-8a27-47bdad77890c', 'a1000001-0000-4000-8000-000000000046', '00000000-0000-0000-0000-000000000001', 5400, 1, 'Cañaveral', '2026-03-28', '1905e127-e2f3-474d-890b-e405e5fb02b9') ON CONFLICT (id) DO NOTHING;

-- 13FC62610 (2026-03-29) fv08050280410152600062610.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('050704e2-ef25-423b-8f67-c8e5b34ba66f', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-03-29', 92288) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('4f9639fc-3df0-4b94-8941-01685ab5fb31', 'a1000001-0000-4000-8000-00000000006a', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('0bd63183-1247-4281-8cdd-7cdf4eba88de', 'a1000001-0000-4000-8000-00000000006a', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('8f34b222-fa3a-4ab0-8c8b-01c9d5607e2c', 'a1000001-0000-4000-8000-00000000006a', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('2176fd2d-c012-4452-8228-2728a4ba7982', 'a1000001-0000-4000-8000-00000000006b', '00000000-0000-0000-0000-000000000001', 3600, 1, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('f86711c7-3776-46ba-8ac3-de28ce454699', 'a1000001-0000-4000-8000-000000000068', '00000000-0000-0000-0000-000000000001', 22500, 1, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('a02a1775-c3b5-4e63-8f3a-df77b3198d6b', 'a1000001-0000-4000-8000-000000000069', '00000000-0000-0000-0000-000000000001', 4500.43, 1.175, 'Cañaveral', '2026-03-29', '050704e2-ef25-423b-8f67-c8e5b34ba66f') ON CONFLICT (id) DO NOTHING;

-- 02FC121868 (2026-03-31) fv08050280410152600121868.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('69286cb3-8215-4fcc-89b3-5a85d154b701', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-03-31', 23352) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('35d1cd5c-8dbd-443a-863e-91ddaa7adb6a', 'a1000001-0000-4000-8000-0000000000e3', '00000000-0000-0000-0000-000000000001', 8700.27, 1.845, 'Cañaveral', '2026-03-31', '69286cb3-8215-4fcc-89b3-5a85d154b701') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e7851e13-8c01-487c-8708-a1ebcf2f45dd', 'a1000001-0000-4000-8000-00000000009c', '00000000-0000-0000-0000-000000000001', 7300, 1, 'Cañaveral', '2026-03-31', '69286cb3-8215-4fcc-89b3-5a85d154b701') ON CONFLICT (id) DO NOTHING;

-- 03FC93557 (2026-04-02) fv08050280410152600093557.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('1ee62514-dcbc-492a-8a80-b911ac05d406', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-04-02', 151470) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('8df46709-a1f6-4f81-8dd8-79b6e04b4745', 'a1000001-0000-4000-8000-000000000091', '00000000-0000-0000-0000-000000000001', 6200, 0.835, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('91fc5325-681e-4018-8728-e0d0643a5574', 'a1000001-0000-4000-8000-000000000047', '00000000-0000-0000-0000-000000000001', 12150, 1, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('6cccb1cf-facf-4fba-8a91-74c9fe0c97e0', 'a1000001-0000-4000-8000-00000000004c', '00000000-0000-0000-0000-000000000001', 7300.56, 0.895, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('0af82c83-689b-4ad9-813d-962e1dd07bb4', 'a1000001-0000-4000-8000-000000000109', '00000000-0000-0000-0000-000000000001', 37800, 1.335, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('8de8a447-5d71-477c-89df-b1898996ab3d', 'a1000001-0000-4000-8000-000000000039', '00000000-0000-0000-0000-000000000001', 19150, 1, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('77d66be3-0d11-4741-86c5-13225286ca68', 'a1000001-0000-4000-8000-00000000014c', '00000000-0000-0000-0000-000000000001', 15900, 1, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('271d286d-1a1c-451f-8b73-9c522eef62b4', 'a1000001-0000-4000-8000-000000000044', '00000000-0000-0000-0000-000000000001', 1200, 1, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('e7238efd-e285-40ff-8562-4286fd3cda27', 'a1000001-0000-4000-8000-00000000005f', '00000000-0000-0000-0000-000000000001', 14800, 1.27, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('b6d5a8a3-b6c7-4d79-8d50-070c681761fd', 'a1000001-0000-4000-8000-000000000017', '00000000-0000-0000-0000-000000000001', 22100, 1, 'Cañaveral', '2026-04-02', '1ee62514-dcbc-492a-8a80-b911ac05d406') ON CONFLICT (id) DO NOTHING;

-- 08FC71297 (2026-04-02) fv08050280410152600071297.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('3fd3354c-58d7-4cbc-8184-35a109cd4d19', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-04-02', 72200) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('68ed31d1-243f-4a54-8eb8-841f34dcbb85', 'a1000001-0000-4000-8000-000000000065', '00000000-0000-0000-0000-000000000001', 26500, 1, 'Cañaveral', '2026-04-02', '3fd3354c-58d7-4cbc-8184-35a109cd4d19') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('bf000f4e-853b-4877-818f-abae0315fd6b', 'a1000001-0000-4000-8000-000000000065', '00000000-0000-0000-0000-000000000001', 26500, 1, 'Cañaveral', '2026-04-02', '3fd3354c-58d7-4cbc-8184-35a109cd4d19') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('3cd383de-163d-40a5-872b-e717b770f6f4', 'a1000001-0000-4000-8000-00000000006e', '00000000-0000-0000-0000-000000000001', 9600, 1, 'Cañaveral', '2026-04-02', '3fd3354c-58d7-4cbc-8184-35a109cd4d19') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('4cd69966-a5ae-470f-8445-63a80a8cbbff', 'a1000001-0000-4000-8000-00000000006e', '00000000-0000-0000-0000-000000000001', 9600, 1, 'Cañaveral', '2026-04-02', '3fd3354c-58d7-4cbc-8184-35a109cd4d19') ON CONFLICT (id) DO NOTHING;

-- 02FC123707 (2026-04-06) fv08050280410152600123707.pdf
INSERT INTO public.invoices (id, household_id, store, invoice_date, total_cop) VALUES ('fb9d26a5-67fc-49e4-8c6c-79c07923f937', '00000000-0000-0000-0000-000000000001', 'Cañaveral', '2026-04-06', 84267) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('c564cbea-4f3b-4918-8388-bf13c3cd7193', 'a1000001-0000-4000-8000-00000000004e', '00000000-0000-0000-0000-000000000001', 4800, 1.355, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('73bf00b1-4c7b-46d6-8da9-c97660faff9d', 'a1000001-0000-4000-8000-0000000000aa', '00000000-0000-0000-0000-000000000001', 8650, 1, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('0d51a9e2-7fd8-4f68-8fd5-40f2a93dc59f', 'a1000001-0000-4000-8000-00000000004f', '00000000-0000-0000-0000-000000000001', 23550, 1, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('b96d07ff-b03a-4316-87e6-c1181d79852b', 'a1000001-0000-4000-8000-00000000008a', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('eb8680f2-1cc7-48c8-809b-fb4d52445118', 'a1000001-0000-4000-8000-00000000008d', '00000000-0000-0000-0000-000000000001', 6979.92, 1.295, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('687ae34a-155e-488c-8efb-995902eb990e', 'a1000001-0000-4000-8000-000000000115', '00000000-0000-0000-0000-000000000001', 4000, 1.315, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('86b1da6b-8196-4c46-8219-3fee3582c1b0', 'a1000001-0000-4000-8000-00000000008e', '00000000-0000-0000-0000-000000000001', 9800, 1.86, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('386d4fbb-7eee-4316-8d44-b8766a7e6143', 'a1000001-0000-4000-8000-00000000011d', '00000000-0000-0000-0000-000000000001', 14400, 0.315, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.price_records (id, product_id, household_id, price, quantity, store, recorded_date, invoice_id) VALUES ('9611ddf3-3f17-4e3e-854b-faa599068501', 'a1000001-0000-4000-8000-000000000052', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-04-06', 'fb9d26a5-67fc-49e4-8c6c-79c07923f937') ON CONFLICT (id) DO NOTHING;

commit;