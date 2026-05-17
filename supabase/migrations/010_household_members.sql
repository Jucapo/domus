-- Tabla pivot que permite a un usuario (auth.users) pertenecer a varios hogares.
-- Habilita el modelo multi-cuenta/multi-hogar previsto a futuro.
--
-- Nota: las policies RLS reales (basadas en auth.uid() ∈ household_members) se
-- escriben en `supabase/policies_v2.sql` y SE APLICAN MANUALMENTE cuando se
-- active Supabase Auth (hito 6). Mientras tanto, las policies existentes
-- ("allow_all") siguen vigentes para que la app actual no se rompa.

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

-- RLS habilitada con policy permisiva por ahora; se reemplaza en policies_v2.sql
-- junto con las demás cuando se active auth real.
alter table public.household_members enable row level security;

create policy "allow_all" on public.household_members
  for all using (true) with check (true);
