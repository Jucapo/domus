-- Seed data for Domus beta
-- Run AFTER schema.sql in Supabase SQL Editor

-- Household
insert into public.households (id, name)
values ('00000000-0000-0000-0000-000000000001', 'La Julia');

-- Profile
insert into public.profiles (id, name, email, household_id)
values (
  '00000000-0000-0000-0000-000000000010',
  'Familia Posso Polo',
  'fliapossopolo19@gmail.com',
  '00000000-0000-0000-0000-000000000001'
);

-- Categories
insert into public.categories (household_id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Lácteos'),
  ('00000000-0000-0000-0000-000000000001', 'Panadería'),
  ('00000000-0000-0000-0000-000000000001', 'Proteínas'),
  ('00000000-0000-0000-0000-000000000001', 'Granos'),
  ('00000000-0000-0000-0000-000000000001', 'Aceites'),
  ('00000000-0000-0000-0000-000000000001', 'Limpieza'),
  ('00000000-0000-0000-0000-000000000001', 'Higiene'),
  ('00000000-0000-0000-0000-000000000001', 'Bebidas');
