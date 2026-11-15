-- Alinhavo · Resultados (ROI): como era a operação antes e os pilotos cortados por mês.
--
-- Regras:
--   * roi_settings (uma por organização): os números de antes do Alinhavo (os mesmos do simulador da
--     página inicial) e a meta de economia por mês. Dinheiro em centavos, tecido em mm.
--   * roi_months: os pilotos cortados em cada mês (a pessoa informa; o app não tem como saber).
--   * A conta da economia fica no app (lib/roi.ts) e é sempre estimativa com os números da organização.
--   * Dono e admin escrevem; todo membro lê.

create table public.roi_settings (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  pilots_per_month integer not null default 0 check (pilots_per_month between 0 and 2000),
  fabric_per_pilot_mm integer not null default 0 check (fabric_per_pilot_mm between 0 and 50000),
  price_per_meter_cents integer not null default 0 check (price_per_meter_cents between 0 and 10000000),
  hours_per_pilot numeric(6, 2) not null default 0 check (hours_per_pilot between 0 and 500),
  hour_rate_cents integer not null default 0 check (hour_rate_cents between 0 and 10000000),
  monthly_fabric_mm bigint not null default 0 check (monthly_fabric_mm between 0 and 100000000000),
  efficiency_pct numeric(5, 2) check (efficiency_pct > 0 and efficiency_pct < 100),
  goal_monthly_cents integer check (goal_monthly_cents between 0 and 1000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger roi_settings_updated_at before update on public.roi_settings
  for each row execute function private.set_updated_at();

create table public.roi_months (
  org_id uuid not null references public.orgs (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  pilots_cut integer not null check (pilots_cut between 0 and 2000),
  updated_at timestamptz not null default now(),
  primary key (org_id, month)
);

create trigger roi_months_updated_at before update on public.roi_months
  for each row execute function private.set_updated_at();

alter table public.roi_settings enable row level security;
alter table public.roi_months enable row level security;

create policy roi_settings_select on public.roi_settings for select to authenticated using (private.is_org_member(org_id));
create policy roi_settings_insert on public.roi_settings for insert to authenticated
  with check (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy roi_settings_update on public.roi_settings for update to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]))
  with check (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy roi_months_select on public.roi_months for select to authenticated using (private.is_org_member(org_id));
create policy roi_months_insert on public.roi_months for insert to authenticated
  with check (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy roi_months_update on public.roi_months for update to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]))
  with check (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

revoke all on public.roi_settings from anon, authenticated;
revoke all on public.roi_months from anon, authenticated;
grant select on public.roi_settings, public.roi_months to authenticated;
grant insert (org_id, pilots_per_month, fabric_per_pilot_mm, price_per_meter_cents, hours_per_pilot, hour_rate_cents, monthly_fabric_mm, efficiency_pct, goal_monthly_cents)
  on public.roi_settings to authenticated;
grant update (pilots_per_month, fabric_per_pilot_mm, price_per_meter_cents, hours_per_pilot, hour_rate_cents, monthly_fabric_mm, efficiency_pct, goal_monthly_cents)
  on public.roi_settings to authenticated;
grant insert (org_id, month, pilots_cut) on public.roi_months to authenticated;
grant update (pilots_cut) on public.roi_months to authenticated;
