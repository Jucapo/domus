-- Domus — Schema completo para Supabase
-- Ejecutar en: Dashboard > SQL Editor > New query

-- 1. HOUSEHOLDS
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. PROFILES (sin auth real por ahora)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  household_id uuid not null references public.households(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

-- 4. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  quantity integer not null default 0,
  display_unit text not null default 'unit',
  content_amount numeric(10,2),
  content_unit text,
  in_shopping_list boolean not null default false,
  pending_registration boolean not null default false,
  visible_in_inventory boolean not null default true,
  brand text not null default '',
  image_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- 5. PRICE RECORDS
create table public.price_records (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  price numeric(12,2) not null,
  quantity integer not null default 1,
  store text not null default '',
  recorded_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- INDEXES
create index idx_categories_household on public.categories(household_id);
create index idx_products_household on public.products(household_id);
create index idx_products_category on public.products(category_id);
create index idx_price_records_product on public.price_records(product_id);
create index idx_price_records_household on public.price_records(household_id);

-- ROW LEVEL SECURITY — permisivo para beta
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.price_records enable row level security;

create policy "allow_all" on public.households for all using (true) with check (true);
create policy "allow_all" on public.profiles for all using (true) with check (true);
create policy "allow_all" on public.categories for all using (true) with check (true);
create policy "allow_all" on public.products for all using (true) with check (true);
create policy "allow_all" on public.price_records for all using (true) with check (true);
