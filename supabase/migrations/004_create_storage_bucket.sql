-- Bucket de imágenes de productos (idempotente: ya puede existir tras un reset de tablas)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

-- Políticas permisivas (beta): recrear si vuelves a ejecutar el script
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Allow public deletes" on storage.objects;

create policy "Allow public uploads"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Allow public reads"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Allow public deletes"
  on storage.objects for delete
  using (bucket_id = 'product-images');
