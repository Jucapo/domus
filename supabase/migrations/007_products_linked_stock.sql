-- Paquetes anclados a un producto "base": al registrar compras del empaque,
-- el stock se suma al producto base (p. ej. 1 paquete de 25 lb → +25 en arroz por libra).

alter table public.products
  add column if not exists linked_product_id uuid references public.products(id) on delete set null,
  add column if not exists linked_units_per_package numeric(12,4);

comment on column public.products.linked_product_id is 'Producto al que se suma el stock al comprar este empaque';
comment on column public.products.linked_units_per_package is 'Unidades del producto base equivalentes a 1 unidad de venta de este empaque';

create index if not exists idx_products_linked_product on public.products(linked_product_id);
