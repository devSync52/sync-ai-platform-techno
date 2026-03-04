create table if not exists public.plan_features (
  id bigserial primary key,
  plan_id uuid not null references public.plans (id) on delete cascade,
  feature text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plan_features_plan_id on public.plan_features (plan_id);
create index if not exists idx_plan_features_sort_order on public.plan_features (plan_id, sort_order);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plans'
      and column_name = 'features'
  ) then
    execute $sql$
      insert into public.plan_features (plan_id, feature, sort_order)
      select
        p.id,
        f.feature,
        f.ord - 1
      from public.plans p
      cross join lateral unnest(p.features) with ordinality as f(feature, ord)
      where p.features is not null
        and not exists (
          select 1
          from public.plan_features pf
          where pf.plan_id = p.id
        )
    $sql$;
  end if;
end $$;
