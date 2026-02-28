-- Guest analysis tracking (for anonymous usage limits)
create table if not exists guest_analyses (
  id uuid default gen_random_uuid() primary key,
  token text not null unique,
  created_at timestamptz default now()
);

-- Index for lookup speed
create index if not exists guest_analyses_token_idx on guest_analyses(token);

-- Shared reports
create table if not exists shared_reports (
  id uuid default gen_random_uuid() primary key,
  analysis_id uuid references analyses(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  view_count int default 0,
  created_at timestamptz default now()
);

create index if not exists shared_reports_token_idx on shared_reports(token);

-- Add missing columns to analyses table if not present
alter table analyses add column if not exists listing_id text;
alter table analyses add column if not exists listing_type text;
alter table analyses add column if not exists asking_price bigint;
alter table analyses add column if not exists monthly_revenue bigint;
alter table analyses add column if not exists monthly_profit bigint;
alter table analyses add column if not exists annual_revenue bigint;
alter table analyses add column if not exists score_breakdown jsonb;
alter table analyses add column if not exists raw_listing_data jsonb;
alter table analyses add column if not exists summary text;

-- Add monthly reset tracking to profiles
alter table profiles add column if not exists analyses_used_this_month int default 0;
alter table profiles add column if not exists usage_reset_at timestamptz default now();

-- Monthly usage reset function
create or replace function reset_monthly_usage()
returns void as $$
begin
  update profiles
  set analyses_used_this_month = 0, usage_reset_at = now()
  where usage_reset_at < date_trunc('month', now());
end;
$$ language plpgsql security definer;

-- RLS for new tables
alter table guest_analyses enable row level security;
alter table shared_reports enable row level security;

-- Guest analyses: service role only (no user access)
create policy "Service role only" on guest_analyses
  for all using (false);

-- Shared reports: owners can manage, public can read valid tokens via API
create policy "Users manage their shares" on shared_reports
  for all using (auth.uid() = user_id);
