alter table public.plans
add column if not exists status text not null default 'active';

update public.plans
set status = 'active'
where status is null;

alter table public.plans
drop constraint if exists plans_status_check;

alter table public.plans
add constraint plans_status_check check (status in ('active', 'inactive'));
