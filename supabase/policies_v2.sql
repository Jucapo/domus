-- =====================================================================
-- Domus — Policies RLS v2 (multi-tenant real)
--
-- NO APLICAR todavía. Este archivo se ejecuta en el momento de activar
-- Supabase Auth + multi-hogar (hito 6 del plan de optimización 2026-05).
--
-- Reemplaza las policies "allow_all" actuales por reglas basadas en
-- auth.uid() + pertenencia al hogar vía household_members.
-- =====================================================================

-- 0. Funciones helper (centralizan la lógica de "este user pertenece a este hogar").
create or replace function public.user_belongs_to_household(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.user_id = auth.uid() and hm.household_id = hh
  );
$$;

create or replace function public.user_is_owner_of_household(hh uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.user_id = auth.uid() and hm.household_id = hh and hm.role = 'owner'
  );
$$;

-- 1. Limpieza de policies viejas (allow_all).
drop policy if exists "allow_all" on public.households;
drop policy if exists "allow_all" on public.profiles;
drop policy if exists "allow_all" on public.categories;
drop policy if exists "allow_all" on public.products;
drop policy if exists "allow_all" on public.price_records;
drop policy if exists "allow_all" on public.invoices;
drop policy if exists "allow_all" on public.household_members;

-- 2. households: ver/editar solo los hogares de los que el user es miembro.
create policy "household_member_read" on public.households
  for select using (public.user_belongs_to_household(id));

create policy "household_owner_update" on public.households
  for update using (public.user_is_owner_of_household(id))
  with check (public.user_is_owner_of_household(id));

create policy "household_member_insert" on public.households
  for insert with check (true);
  -- Nota: al crear un hogar se inserta inmediatamente una fila en
  -- household_members(role='owner') por el cliente o un trigger.

create policy "household_owner_delete" on public.households
  for delete using (public.user_is_owner_of_household(id));

-- 3. household_members: cada user ve sus propias membresías; el owner
--    del hogar gestiona las membresías de ese hogar.
create policy "membership_self_read" on public.household_members
  for select using (
    user_id = auth.uid() or public.user_is_owner_of_household(household_id)
  );

create policy "membership_owner_write" on public.household_members
  for insert with check (
    public.user_is_owner_of_household(household_id) or user_id = auth.uid()
  );

create policy "membership_owner_update" on public.household_members
  for update using (public.user_is_owner_of_household(household_id))
  with check (public.user_is_owner_of_household(household_id));

create policy "membership_owner_delete" on public.household_members
  for delete using (public.user_is_owner_of_household(household_id));

-- 4. profiles: el user ve y edita su propio profile.
create policy "profile_self_read" on public.profiles
  for select using (id = auth.uid() or public.user_belongs_to_household(household_id));

create policy "profile_self_write" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- 5. categories: ver/escribir solo dentro de hogares donde el user es miembro.
create policy "categories_member_read" on public.categories
  for select using (public.user_belongs_to_household(household_id));

create policy "categories_member_write" on public.categories
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- 6. products: idem.
create policy "products_member_read" on public.products
  for select using (public.user_belongs_to_household(household_id));

create policy "products_member_write" on public.products
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- 7. invoices: idem.
create policy "invoices_member_read" on public.invoices
  for select using (public.user_belongs_to_household(household_id));

create policy "invoices_member_write" on public.invoices
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- 8. price_records: idem.
create policy "price_records_member_read" on public.price_records
  for select using (public.user_belongs_to_household(household_id));

create policy "price_records_member_write" on public.price_records
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));
