create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  parent_account_id uuid not null references public.accounts(id) on delete cascade,
  source text not null default 'sellercloud',
  external_product_id text null,
  sku text not null,
  product_name text null,
  description text null,
  upc text null,
  available numeric null,
  on_hold numeric null,
  physical_qty numeric null,
  site_price numeric null,
  warehouse_name text not null default 'default',
  raw jsonb not null default '{}'::jsonb,
  sellercloud_last_modified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_account_source_sku_wh_uq
  on public.products (parent_account_id, source, sku, warehouse_name);

create index if not exists products_parent_account_idx
  on public.products (parent_account_id);

create index if not exists products_updated_at_idx
  on public.products (updated_at desc);

create index if not exists products_source_idx
  on public.products (source);
