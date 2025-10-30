-- 024_multitenancy_orgs.sql

-- 1) Core org model
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists user_org_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'admin' | 'member'
  created_at timestamptz default now(),
  unique(user_id, org_id)
);

create index if not exists idx_user_org_memberships_user on user_org_memberships(user_id);
create index if not exists idx_user_org_memberships_org on user_org_memberships(org_id);

-- 2) Add org_id to key business tables (extend as needed)
alter table if exists companies add column if not exists org_id uuid references organizations(id);
alter table if exists alerts add column if not exists org_id uuid references organizations(id);
alter table if exists anomalies add column if not exists org_id uuid references organizations(id);
alter table if exists shipments add column if not exists org_id uuid references organizations(id);

-- 3) RLS: enable and enforce org scoping
alter table organizations enable row level security;
alter table user_org_memberships enable row level security;
alter table companies enable row level security;
alter table alerts enable row level security;
alter table anomalies enable row level security;
alter table shipments enable row level security;

-- Helper policy: a user can see organizations they belong to
create policy if not exists org_read_members on organizations
for select using (
  exists (
    select 1 from user_org_memberships m
    where m.org_id = organizations.id and m.user_id = auth.uid()
  )
);

-- Membership table visibility for the user
create policy if not exists membership_self_read on user_org_memberships
for select using (user_id = auth.uid());

-- Generic org policy template: a row is visible if the user is a member of that row's org_id
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['companies','alerts','anomalies','shipments'])
  loop
    execute format($f$
      create policy if not exists %I_org_select on %I
      for select using (
        %I.org_id is not null and exists (
          select 1 from user_org_memberships m
          where m.org_id = %I.org_id and m.user_id = auth.uid()
        )
      );
    $f$, tbl, tbl, tbl, tbl);

    execute format($f$
      create policy if not exists %I_org_insert on %I
      for insert with check (
        new.org_id is not null and exists (
          select 1 from user_org_memberships m
          where m.org_id = new.org_id and m.user_id = auth.uid()
            and m.role in ('owner','admin')
        )
      );
    $f$, tbl, tbl);

    execute format($f$
      create policy if not exists %I_org_update on %I
      for update using (
        %I.org_id is not null and exists (
          select 1 from user_org_memberships m
          where m.org_id = %I.org_id and m.user_id = auth.uid()
            and m.role in ('owner','admin')
        )
      )
      with check (
        new.org_id = %I.org_id and exists (
          select 1 from user_org_memberships m
          where m.org_id = %I.org_id and m.user_id = auth.uid()
            and m.role in ('owner','admin')
        )
      );
    $f$, tbl, tbl, tbl, tbl, tbl, tbl);

    execute format($f$
      create policy if not exists %I_org_delete on %I
      for delete using (
        %I.org_id is not null and exists (
          select 1 from user_org_memberships m
          where m.org_id = %I.org_id and m.user_id = auth.uid()
            and m.role in ('owner','admin')
        )
      );
    $f$, tbl, tbl, tbl, tbl);
  end loop;
end$$;

-- 4) Enforce org_id presence for tenant tables
alter table companies alter column org_id set not null;
alter table alerts alter column org_id set not null;
alter table anomalies alter column org_id set not null;
alter table shipments alter column org_id set not null;

-- 5) Example org-scoped unique index (adapt as needed)
-- create unique index if not exists uniq_companies_name_org on companies(name, org_id);


