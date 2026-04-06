-- Create public bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

-- Allow anyone to upload images (beta - permissive)
create policy "Allow public uploads"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

-- Allow anyone to read images
create policy "Allow public reads"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow anyone to delete images
create policy "Allow public deletes"
  on storage.objects for delete
  using (bucket_id = 'product-images');
