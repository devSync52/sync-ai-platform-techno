create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint features_slug_unique unique (slug)
);

create index if not exists idx_features_name on public.features (name);

alter table public.plan_features
  add column if not exists feature_id uuid references public.features (id) on delete cascade;

create index if not exists idx_plan_features_feature_id on public.plan_features (feature_id);

insert into public.features (name, slug, description)
select distinct
  pf.feature as name,
  regexp_replace(lower(trim(pf.feature)), '[^a-z0-9]+', '-', 'g') as slug,
  null as description
from public.plan_features pf
where pf.feature is not null
  and length(trim(pf.feature)) > 0
on conflict (slug) do nothing;

update public.plan_features pf
set feature_id = f.id
from public.features f
where pf.feature_id is null
  and pf.feature is not null
  and regexp_replace(lower(trim(pf.feature)), '[^a-z0-9]+', '-', 'g') = f.slug;
