ALTER TABLE public.products RENAME COLUMN unit TO display_unit;
ALTER TABLE public.products ADD COLUMN content_amount numeric(10,2);
ALTER TABLE public.products ADD COLUMN content_unit text;
ALTER TABLE public.products DROP COLUMN package_size;
