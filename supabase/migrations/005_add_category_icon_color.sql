-- Add icon + color metadata to categories
alter table public.categories
  add column if not exists icon text not null default 'tag',
  add column if not exists color text not null default 'indigo';

