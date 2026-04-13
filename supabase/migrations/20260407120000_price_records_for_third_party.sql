-- Líneas marcadas "para tercero": se guardan en factura/histórico pero no suman en gastos del mes.
alter table public.price_records
  add column if not exists for_third_party boolean not null default false;

comment on column public.price_records.for_third_party is
  'Si true, la línea no cuenta en agregados de gasto del período (presupuesto / resumen mensual).';
