-- FlipFlow Database Schema
-- Run in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','starter','pro','scout')),
  subscription_status text default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  analyses_used integer not null default 0,
  analyses_reset_at timestamptz default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Reset monthly usage counter
create or replace function reset_monthly_usage()
returns void as $$
begin
  update profiles
  set analyses_used = 0,
      analyses_reset_at = date_trunc('month', now()) + interval '1 month'
  where analyses_reset_at <= now();
end;
$$ language plpgsql security definer;

-- Analyses
create table analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  listing_url text not null,
  listing_title text,
  listing_id text,
  asking_price numeric,
  monthly_revenue numeric,
  monthly_profit numeric,
  flip_score_overall integer,
  flip_score_data jsonb,
  red_flags jsonb default '[]',
  growth_opportunities jsonb default '[]',
  raw_analysis jsonb,
  created_at timestamptz default now()
);

create index analyses_user_id_idx on analyses(user_id);
create index analyses_created_at_idx on analyses(created_at desc);

-- Scout Filters
create table scout_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null default 'My Scout Filter',
  is_active boolean default true,
  business_type text,
  min_monthly_revenue numeric,
  max_asking_price numeric,
  min_flip_score integer default 60,
  max_multiple numeric,
  keywords text[],
  exclude_keywords text[],
  notify_email boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index scout_filters_user_id_idx on scout_filters(user_id);
create index scout_filters_active_idx on scout_filters(is_active) where is_active = true;

-- Scout Alerts
create table scout_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  filter_id uuid references scout_filters(id) on delete set null,
  listing_id text not null,
  listing_url text not null,
  listing_title text,
  asking_price numeric,
  monthly_revenue numeric,
  monthly_profit numeric,
  flip_score integer,
  alert_reasons jsonb default '[]',
  is_read boolean default false,
  created_at timestamptz default now()
);

create index scout_alerts_user_id_idx on scout_alerts(user_id);
create index scout_alerts_is_read_idx on scout_alerts(is_read) where is_read = false;
create unique index scout_alerts_unique_idx on scout_alerts(user_id, listing_id);

-- Row Level Security
alter table profiles enable row level security;
alter table analyses enable row level security;
alter table scout_filters enable row level security;
alter table scout_alerts enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Analyses: users can only see their own
create policy "Users can view own analyses" on analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on analyses for insert with check (auth.uid() = user_id);

-- Scout Filters
create policy "Users can manage own filters" on scout_filters for all using (auth.uid() = user_id);

-- Scout Alerts
create policy "Users can view own alerts" on scout_alerts for select using (auth.uid() = user_id);
create policy "Users can update own alerts" on scout_alerts for update using (auth.uid() = user_id);
