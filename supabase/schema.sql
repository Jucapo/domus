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
  icon text not null default 'tag',
  color text not null default 'indigo',
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
  linked_product_id uuid references public.products(id) on delete set null,
  linked_units_per_package numeric(12,4),
  barcode text,
  created_at timestamptz not null default now()
);

-- 5. INVOICES (tickets agrupados desde "Registrar factura")
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  store text not null default '',
  invoice_date date not null default current_date,
  total_cop numeric(12,2),
  created_at timestamptz not null default now()
);

create index idx_invoices_household on public.invoices(household_id);
create index idx_invoices_date on public.invoices(household_id, invoice_date desc);

-- 6. PRICE RECORDS
create table public.price_records (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  price numeric(12,2) not null,
  quantity numeric(12,4) not null default 1,
  store text not null default '',
  recorded_date date not null default current_date,
  invoice_id uuid references public.invoices(id) on delete set null,
  for_third_party boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. FINANZAS — cuentas, categorías y transacciones (app de gastos estilo 1Money)
create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'cash'
    check (type in ('cash', 'bank', 'credit_card', 'savings', 'person', 'other')),
  currency text not null default 'COP',
  initial_balance numeric(14,2) not null default 0,
  icon text not null default 'wallet',
  color text not null default 'indigo',
  is_favorite boolean not null default false,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  parent_id uuid references public.finance_categories(id) on delete cascade,
  name text not null,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  icon text not null default 'tag',
  color text not null default 'indigo',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, parent_id, name)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'transfer')),
  tx_date date not null default current_date,
  account_id uuid not null references public.finance_accounts(id) on delete cascade,
  to_account_id uuid references public.finance_accounts(id) on delete cascade,
  category_id uuid references public.finance_categories(id) on delete set null,
  amount numeric(14,2) not null,
  currency text not null default 'COP',
  amount_secondary numeric(14,2),
  currency_secondary text,
  note text not null default '',
  tags text not null default '',
  invoice_id uuid references public.invoices(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- INDEXES
create index idx_categories_household on public.categories(household_id);
create index idx_products_household on public.products(household_id);
create index idx_products_category on public.products(category_id);
create index idx_products_linked_product on public.products(linked_product_id);
create index idx_price_records_product on public.price_records(product_id);
create index idx_price_records_household on public.price_records(household_id);
create index idx_price_records_invoice on public.price_records(invoice_id);
create index idx_finance_accounts_household on public.finance_accounts(household_id);
create index idx_finance_categories_household on public.finance_categories(household_id);
create index idx_finance_categories_parent on public.finance_categories(parent_id);
create index idx_finance_transactions_household on public.finance_transactions(household_id);
create index idx_finance_transactions_date on public.finance_transactions(household_id, tx_date desc);
create index idx_finance_transactions_account on public.finance_transactions(account_id);
create index idx_finance_transactions_invoice on public.finance_transactions(invoice_id);

-- ROW LEVEL SECURITY — permisivo para beta
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.price_records enable row level security;
alter table public.invoices enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_transactions enable row level security;

create policy "allow_all" on public.households for all using (true) with check (true);
create policy "allow_all" on public.profiles for all using (true) with check (true);
create policy "allow_all" on public.categories for all using (true) with check (true);
create policy "allow_all" on public.products for all using (true) with check (true);
create policy "allow_all" on public.price_records for all using (true) with check (true);
create policy "allow_all" on public.invoices for all using (true) with check (true);
create policy "allow_all" on public.finance_accounts for all using (true) with check (true);
create policy "allow_all" on public.finance_categories for all using (true) with check (true);
create policy "allow_all" on public.finance_transactions for all using (true) with check (true);
