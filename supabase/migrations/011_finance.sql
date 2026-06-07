-- App de Finanzas (estilo 1Money): cuentas, categorías y transacciones.
-- Tablas independientes de las de Mercado. household_id sigue el patrón existente.

-- 1. CUENTAS (efectivo, banco, tarjeta, ahorro, persona/deuda)
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

-- 2. CATEGORÍAS de finanzas (gasto/ingreso, con subcategorías vía parent_id)
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

-- 3. TRANSACCIONES (gasto / ingreso / transferencia)
create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'transfer')),
  tx_date date not null default current_date,
  -- Cuenta origen para gasto/transferencia; cuenta destino para ingreso.
  account_id uuid not null references public.finance_accounts(id) on delete cascade,
  -- Solo transferencias: cuenta destino.
  to_account_id uuid references public.finance_accounts(id) on delete cascade,
  -- Solo gasto/ingreso.
  category_id uuid references public.finance_categories(id) on delete set null,
  amount numeric(14,2) not null,
  currency text not null default 'COP',
  amount_secondary numeric(14,2),
  currency_secondary text,
  note text not null default '',
  tags text not null default '',
  -- Conexión futura Mercado→Finanzas: una factura = una transacción de gasto.
  invoice_id uuid references public.invoices(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- INDEXES
create index idx_finance_accounts_household on public.finance_accounts(household_id);
create index idx_finance_categories_household on public.finance_categories(household_id);
create index idx_finance_categories_parent on public.finance_categories(parent_id);
create index idx_finance_transactions_household on public.finance_transactions(household_id);
create index idx_finance_transactions_date on public.finance_transactions(household_id, tx_date desc);
create index idx_finance_transactions_account on public.finance_transactions(account_id);
create index idx_finance_transactions_invoice on public.finance_transactions(invoice_id);

-- ROW LEVEL SECURITY — permisivo para beta (modo legacy)
alter table public.finance_accounts enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_transactions enable row level security;

create policy "allow_all" on public.finance_accounts for all using (true) with check (true);
create policy "allow_all" on public.finance_categories for all using (true) with check (true);
create policy "allow_all" on public.finance_transactions for all using (true) with check (true);
