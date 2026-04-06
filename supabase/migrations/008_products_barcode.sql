-- Código de barras opcional (EAN/UPC, etc.) para emparejar con líneas de factura u OCR futuro
alter table public.products
  add column if not exists barcode text;

comment on column public.products.barcode is 'Opcional: EAN-13, UPC, etc.';
