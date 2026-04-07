-- Facturas agrupadas (registro por ticket) y vínculo en price_records

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

alter table public.price_records
  add column invoice_id uuid references public.invoices(id) on delete set null;

create index idx_price_records_invoice on public.price_records(invoice_id);

alter table public.invoices enable row level security;

create policy "allow_all" on public.invoices for all using (true) with check (true);
