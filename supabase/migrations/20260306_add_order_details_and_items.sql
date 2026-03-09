alter table public.orders
  add column if not exists order_source_order_id text,
  add column if not exists client_name text,
  add column if not exists marketplace_name text,
  add column if not exists payment_status text,
  add column if not exists shipping_status text,
  add column if not exists metadata jsonb;

create table if not exists public.order_items (
  id uuid primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text,
  quantity numeric,
  unit_price numeric,
  total_price numeric,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id
  on public.order_items(order_id);
