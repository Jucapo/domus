-- Semilla: compras extraídas de facturas PDF (marzo-abril 2026)
-- Ejecutar en Supabase SQL Editor DESPUÉS de seed.sql y del esquema actual.
-- Si ya tienes productos del mismo hogar y quieres evitar duplicados, borra antes:
--   delete from public.price_records where household_id = '00000000-0000-0000-0000-000000000001';
--   delete from public.products where household_id = '00000000-0000-0000-0000-000000000001';

begin;

-- Categorías mínimas para esta semilla (puedes renombrar/refinar después)
insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Frutas'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Frutas'
);

insert into public.categories (household_id, name)
select '00000000-0000-0000-0000-000000000001', 'Verduras'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Verduras'
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
select '00000000-0000-0000-0000-000000000001', 'Cuidado personal'
where not exists (
  select 1 from public.categories c
  where c.household_id = '00000000-0000-0000-0000-000000000001'
    and c.name = 'Cuidado personal'
);

-- IDs fijos de productos (semilla)
insert into public.products (id, household_id, category_id, name, quantity, display_unit, content_amount, content_unit, brand, notes, visible_in_inventory) values
-- Limpieza
('a1000001-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Toalla cocina triple', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Cera autobrillante', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Perlas de fragancia', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Quitamanchas líquido', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Detergente líquido', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Suavizante Bonaropa', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Desengrasante Brilla', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Detergente para prendas', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Servilleta de lujo', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Set esponja borrador', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Lavaplatos líquido', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000000c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aseo hogar' limit 1), 'Toalla desinfectante', 0, 'unit', null, null, '', 'Importado factura', true),
-- Higiene
('a1000001-0000-4000-8000-00000000000d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Desodorante hombre', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000000e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Pañuelo facial', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000000f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Jabón líquido Aveeno', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Enjuague bucal Plax 250ml', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Crema dental Oral-B 3D White', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Maquinilla Gillette Venus', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Repuesto Gillette Venus 2und', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000014', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Jabón Palmolive 390ml', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000015', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Jabón Protex 110g x3', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Repuesto Gillette Mach3 4und', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000017', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Cuidado personal' limit 1), 'Crema dental Colgate Sensitive', 0, 'unit', null, null, '', 'Importado factura', true),
-- Bebidas
('a1000001-0000-4000-8000-000000000018', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Agua con gas maracuyá', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000019', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Agua con gas limón', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Agua con gas limonada', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Cola y Pola 330ml (pack 12)', 0, 'pack', 3960, 'ml', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Coca-Cola sin azúcar', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Soda Izots 1.7L', 0, 'bottle', 1700, 'ml', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Cerveza Águila 330ml x6 (0% alcohol)', 0, 'pack', 1980, 'ml', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000001f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Cerveza Águila Light 330ml x6', 0, 'pack', 1980, 'ml', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000020', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Bebidas' limit 1), 'Cerveza Club Colombia 330ml x6', 0, 'pack', 1980, 'ml', '', 'Importado factura', true),
-- Granos / despensa
('a1000001-0000-4000-8000-000000000021', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Arroz integral Diana', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000022', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Penne Delizaire 500g', 0, 'pack', 500, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000023', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Salsa negra Zev', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000024', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Lenteja El Estío 500g', 0, 'pack', 500, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000025', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Mezcla divertida Nut', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000026', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Salsa de soya Zev', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000027', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Alacena' limit 1), 'Café tostado molido 454g', 0, 'pack', 454, 'g', '', 'Importado factura', true),
-- Aceites
('a1000001-0000-4000-8000-000000000028', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aceites' limit 1), 'Aceite de oliva extra virgen', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000029', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Aceites' limit 1), 'Aceite Doña Lupe soya 3000ml', 0, 'bottle', 3000, 'ml', '', 'Importado factura', true),
-- Lácteos
('a1000001-0000-4000-8000-00000000002a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Queso parmesano Alpina', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000002b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Crema de leche larga vida', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000002c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Mantequilla Colanta 250g', 0, 'pack', 250, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000002d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Queso crema Colanta 400g', 0, 'pack', 400, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000002e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Leche Alpina 1100ml x6 bolsas UHT', 0, 'pack', 6600, 'ml', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000002f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Lácteos' limit 1), 'Yogurt Alpina baby vainilla 113g', 0, 'unit', null, null, '', 'Importado factura', true),
-- Panadería
('a1000001-0000-4000-8000-000000000030', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Panadería' limit 1), 'Pan árabe Backerei', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000031', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Panadería' limit 1), 'Tortillas finas hierbas', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000032', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Panadería' limit 1), 'Tortilla integral', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000033', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Panadería' limit 1), 'Hoja tamal', 0, 'unit', null, null, '', 'Importado factura', true),
-- Proteínas
('a1000001-0000-4000-8000-000000000034', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Salchicha parrilla', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000035', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Salchicha super perro', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000036', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Jamón Pietran', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000037', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Duopack atún en agua', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000038', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Huevo de codorniz', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000039', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Chorizo Colanta 450g campesino', 0, 'pack', 450, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000003a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Pechuga piku marinada (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000003b', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Pernil cerdo (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000003c', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Caderita res (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000003d', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Proteínas' limit 1), 'Camarón precocido 500g', 0, 'pack', 500, 'g', '', 'Importado factura', true),
-- Frutas y verduras
('a1000001-0000-4000-8000-00000000003e', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Brócoli', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000003f', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Cebolla larga 500g', 0, 'pack', 500, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000040', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Uva verde sin semilla', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000041', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Mango', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000042', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Mandarina arrayana (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000043', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Aguacate común', 0, 'unit', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000044', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Cilantro 80g', 0, 'pack', 80, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000045', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Limón Tahití (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000046', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Limón 1000g malla', 0, 'pack', 1000, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000047', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Papa lista y fresca 2500g', 0, 'pack', 2500, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000048', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Tomate chonto (granel)', 0, 'kg', null, null, '', 'Importado factura', true),
('a1000001-0000-4000-8000-000000000049', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Verduras' limit 1), 'Tomate chonto 1000g malla', 0, 'pack', 1000, 'g', '', 'Importado factura', true),
('a1000001-0000-4000-8000-00000000004a', '00000000-0000-0000-0000-000000000001', (select id from public.categories where household_id = '00000000-0000-0000-0000-000000000001' and name = 'Frutas' limit 1), 'Plátano (granel)', 0, 'kg', null, null, '', 'Importado factura', true);

-- Precio por línea de factura (total pagado en COP, cantidad comprada)
insert into public.price_records (product_id, household_id, price, quantity, store, recorded_date) values
-- D1 G1F282905 2026-04-03
('a1000001-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000001', 3650, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000001', 7990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000001', 9990, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000001', 3800, 3, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000001', 11990, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000001', 3500, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000001', 2450, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000001', 6300, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000001', 4200, 3, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000001', 2990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000001', 2600, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000000c', '00000000-0000-0000-0000-000000000001', 4750, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000000d', '00000000-0000-0000-0000-000000000001', 7490, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000018', '00000000-0000-0000-0000-000000000001', 2400, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000019', '00000000-0000-0000-0000-000000000001', 2400, 3, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000001a', '00000000-0000-0000-0000-000000000001', 2400, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000000e', '00000000-0000-0000-0000-000000000001', 3150, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000021', '00000000-0000-0000-0000-000000000001', 4500, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000030', '00000000-0000-0000-0000-000000000001', 4200, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000031', '00000000-0000-0000-0000-000000000001', 4950, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000032', '00000000-0000-0000-0000-000000000001', 3700, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000002a', '00000000-0000-0000-0000-000000000001', 15350, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000022', '00000000-0000-0000-0000-000000000001', 3990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000023', '00000000-0000-0000-0000-000000000001', 2100, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000028', '00000000-0000-0000-0000-000000000001', 34950, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000024', '00000000-0000-0000-0000-000000000001', 1990, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000025', '00000000-0000-0000-0000-000000000001', 4990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000034', '00000000-0000-0000-0000-000000000001', 8990, 2, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000036', '00000000-0000-0000-0000-000000000001', 14950, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000037', '00000000-0000-0000-0000-000000000001', 5990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000038', '00000000-0000-0000-0000-000000000001', 5300, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000001b', '00000000-0000-0000-0000-000000000001', 23880, 12, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000003e', '00000000-0000-0000-0000-000000000001', 6500, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-00000000003f', '00000000-0000-0000-0000-000000000001', 3700, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000040', '00000000-0000-0000-0000-000000000001', 9990, 1, 'D1 / Carulla', '2026-04-03'),
('a1000001-0000-4000-8000-000000000041', '00000000-0000-0000-0000-000000000001', 4300, 2, 'D1 / Carulla', '2026-04-03'),
-- F1 F1G0245612 2026-03-28
('a1000001-0000-4000-8000-00000000003f', '00000000-0000-0000-0000-000000000001', 3700, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000040', '00000000-0000-0000-0000-000000000001', 9990, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000035', '00000000-0000-0000-0000-000000000001', 9990, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000034', '00000000-0000-0000-0000-000000000001', 8990, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000036', '00000000-0000-0000-0000-000000000001', 14950, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002b', '00000000-0000-0000-0000-000000000001', 2300, 2, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000001', 2990, 2, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000000f', '00000000-0000-0000-0000-000000000001', 5490, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000019', '00000000-0000-0000-0000-000000000001', 2400, 2, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000018', '00000000-0000-0000-0000-000000000001', 2400, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000001a', '00000000-0000-0000-0000-000000000001', 2400, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000001c', '00000000-0000-0000-0000-000000000001', 6490, 2, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-00000000001d', '00000000-0000-0000-0000-000000000001', 2100, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000023', '00000000-0000-0000-0000-000000000001', 2100, 1, 'D1 / Carulla', '2026-03-28'),
('a1000001-0000-4000-8000-000000000026', '00000000-0000-0000-0000-000000000001', 1800, 1, 'D1 / Carulla', '2026-03-28'),
-- Cañaveral 02FC121868 2026-03-31
('a1000001-0000-4000-8000-000000000042', '00000000-0000-0000-0000-000000000001', 16052, 2, 'Cañaveral', '2026-03-31'),
('a1000001-0000-4000-8000-000000000043', '00000000-0000-0000-0000-000000000001', 7300, 1, 'Cañaveral', '2026-03-31'),
-- Cañaveral 03FC93557 2026-04-02
('a1000001-0000-4000-8000-00000000003c', '00000000-0000-0000-0000-000000000001', 50463, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000039', '00000000-0000-0000-0000-000000000001', 19150, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-00000000002c', '00000000-0000-0000-0000-000000000001', 15900, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000044', '00000000-0000-0000-0000-000000000001', 1200, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000045', '00000000-0000-0000-0000-000000000001', 5177, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000047', '00000000-0000-0000-0000-000000000001', 12150, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000048', '00000000-0000-0000-0000-000000000001', 6534, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-00000000003a', '00000000-0000-0000-0000-000000000001', 18796, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000017', '00000000-0000-0000-0000-000000000001', 22100, 1, 'Cañaveral', '2026-04-02'),
-- Cañaveral 08FC71297 2026-04-02
('a1000001-0000-4000-8000-000000000027', '00000000-0000-0000-0000-000000000001', 26500, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-000000000027', '00000000-0000-0000-0000-000000000001', 26500, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-00000000001e', '00000000-0000-0000-0000-000000000001', 9600, 1, 'Cañaveral', '2026-04-02'),
('a1000001-0000-4000-8000-00000000001e', '00000000-0000-0000-0000-000000000001', 9600, 1, 'Cañaveral', '2026-04-02'),
-- Cañaveral 03FC92923 2026-03-28
('a1000001-0000-4000-8000-00000000003b', '00000000-0000-0000-0000-000000000001', 34305, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000046', '00000000-0000-0000-0000-000000000001', 5300, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000049', '00000000-0000-0000-0000-000000000001', 6980, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000001', 15100, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000001', 10900, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000001', 25970, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000001', 25970, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000014', '00000000-0000-0000-0000-000000000001', 20450, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000015', '00000000-0000-0000-0000-000000000001', 11800, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000001', 34965, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002d', '00000000-0000-0000-0000-000000000001', 10600, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002e', '00000000-0000-0000-0000-000000000001', 43600, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002f', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002f', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002f', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000002f', '00000000-0000-0000-0000-000000000001', 4250, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-00000000001f', '00000000-0000-0000-0000-000000000001', 21100, 1, 'Cañaveral', '2026-03-28'),
('a1000001-0000-4000-8000-000000000020', '00000000-0000-0000-0000-000000000001', 16900, 1, 'Cañaveral', '2026-03-28'),
-- Cañaveral 13FC62610 2026-03-29
('a1000001-0000-4000-8000-000000000029', '00000000-0000-0000-0000-000000000001', 22500, 1, 'Cañaveral', '2026-03-29'),
('a1000001-0000-4000-8000-00000000004a', '00000000-0000-0000-0000-000000000001', 5288, 1, 'Cañaveral', '2026-03-29'),
('a1000001-0000-4000-8000-00000000003d', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29'),
('a1000001-0000-4000-8000-00000000003d', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29'),
('a1000001-0000-4000-8000-00000000003d', '00000000-0000-0000-0000-000000000001', 20300, 1, 'Cañaveral', '2026-03-29'),
('a1000001-0000-4000-8000-000000000033', '00000000-0000-0000-0000-000000000001', 3600, 1, 'Cañaveral', '2026-03-29');

commit;
