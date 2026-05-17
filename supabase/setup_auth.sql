-- =====================================================================
-- Domus — Setup de auth real (jucapo05@gmail.com → owner del hogar legacy)
--
-- Pre-requisito: este script asume que ya hiciste login al menos una vez
-- con jucapo05@gmail.com en la app (para que exista la row en auth.users).
--
-- Pega TODO este archivo en el SQL Editor de Supabase y ejecuta:
--   https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new
--
-- Hace tres cosas en una transacción:
--   1) Crea la tabla household_members.
--   2) Te agrega como owner del hogar legacy (hereda toda tu data).
--   3) Aplica las RLS reales (reemplaza las allow_all).
--
-- Si falla en cualquier paso, hace rollback y la app sigue funcionando
-- en modo legacy.
-- =====================================================================

begin;

-- =====================================================================
-- PASO 1 — Verificar que el usuario existe (si no, abortamos)
-- =====================================================================
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'jucapo05@gmail.com';
  if v_user_id is null then
    raise exception 'No existe ningún user con email jucapo05@gmail.com. PRIMERO haz login en la app y luego corre este script.';
  end if;
end $$;

-- =====================================================================
-- PASO 2 — Crear tabla household_members + indexes + RLS
-- =====================================================================
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id, household_id)
);

create index if not exists idx_household_members_user
  on public.household_members(user_id);

create index if not exists idx_household_members_household
  on public.household_members(household_id);

alter table public.household_members enable row level security;

-- =====================================================================
-- PASO 3 — Atar tu cuenta al hogar legacy como owner
-- =====================================================================
insert into public.household_members (user_id, household_id, role)
values (
  (select id from auth.users where email = 'jucapo05@gmail.com'),
  '00000000-0000-0000-0000-000000000001',
  'owner'
)
on conflict (user_id, household_id) do update
  set role = excluded.role;

-- =====================================================================
-- PASO 4 — Funciones helper para las RLS reales
-- =====================================================================
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

-- =====================================================================
-- PASO 5 — Reemplazar policies "allow_all" por las RLS reales
-- =====================================================================
drop policy if exists "allow_all" on public.households;
drop policy if exists "allow_all" on public.profiles;
drop policy if exists "allow_all" on public.categories;
drop policy if exists "allow_all" on public.products;
drop policy if exists "allow_all" on public.price_records;
drop policy if exists "allow_all" on public.invoices;
drop policy if exists "allow_all" on public.household_members;

-- households
create policy "household_member_read" on public.households
  for select using (public.user_belongs_to_household(id));
create policy "household_owner_update" on public.households
  for update using (public.user_is_owner_of_household(id))
  with check (public.user_is_owner_of_household(id));
create policy "household_member_insert" on public.households
  for insert with check (true);
create policy "household_owner_delete" on public.households
  for delete using (public.user_is_owner_of_household(id));

-- household_members
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

-- profiles
create policy "profile_self_read" on public.profiles
  for select using (id = auth.uid() or public.user_belongs_to_household(household_id));
create policy "profile_self_write" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- categories
create policy "categories_member_read" on public.categories
  for select using (public.user_belongs_to_household(household_id));
create policy "categories_member_write" on public.categories
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- products
create policy "products_member_read" on public.products
  for select using (public.user_belongs_to_household(household_id));
create policy "products_member_write" on public.products
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- invoices
create policy "invoices_member_read" on public.invoices
  for select using (public.user_belongs_to_household(household_id));
create policy "invoices_member_write" on public.invoices
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

-- price_records
create policy "price_records_member_read" on public.price_records
  for select using (public.user_belongs_to_household(household_id));
create policy "price_records_member_write" on public.price_records
  for all using (public.user_belongs_to_household(household_id))
  with check (public.user_belongs_to_household(household_id));

commit;

-- =====================================================================
-- VERIFICACIÓN (corre esto después y revisa el resultado)
-- =====================================================================
-- select hm.role, h.name
-- from public.household_members hm
-- join public.households h on h.id = hm.household_id
-- where hm.user_id = (select id from auth.users where email = 'jucapo05@gmail.com');
