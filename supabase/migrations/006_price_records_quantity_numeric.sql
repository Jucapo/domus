-- Cantidad comprada puede ser decimal (ej. 2.44 kg)
alter table public.price_records
  alter column quantity type numeric(12, 4) using quantity::numeric(12, 4);
