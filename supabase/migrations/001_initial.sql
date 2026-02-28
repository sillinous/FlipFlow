-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'agency')),
  subscription_status text not null default 'inactive' check (subscription_status in ('active', 'inactive', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  analyses_used_this_month integer not null default 0,
  analyses_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Analyses table
create table public.analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  flippa_url text not null,
  listing_id text not null,
  listing_title text,
  listing_type text,
  asking_price numeric,
  monthly_revenue numeric,
  monthly_profit numeric,
  annual_revenue numeric,
  flip_score integer check (flip_score between 0 and 100),
  score_breakdown jsonb,
  red_flags jsonb default '[]',
  growth_opportunities jsonb default '[]',
  recommendation text,
  summary text,
  raw_listing_data jsonb,
  created_at timestamptz not null default now()
);

-- Scout filters (saved search criteria)
create table public.scout_filters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  min_score integer default 70,
  max_asking_price numeric,
  min_monthly_profit numeric,
  max_multiple numeric,
  listing_types text[] default array['website', 'ecommerce', 'saas'],
  keywords text[],
  exclude_keywords text[],
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

-- Scout alerts (deals found by the scout)
create table public.scout_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  filter_id uuid references public.scout_filters(id) on delete set null,
  analysis_id uuid references public.analyses(id) on delete cascade not null,
  is_read boolean not null default false,
  is_emailed boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.scout_filters enable row level security;
alter table public.scout_alerts enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own analyses" on public.analyses for select using (auth.uid() = user_id);
create policy "Users can create own analyses" on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can manage own filters" on public.scout_filters for all using (auth.uid() = user_id);
create policy "Users can manage own alerts" on public.scout_alerts for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Reset monthly analysis counts
create or replace function public.reset_monthly_analyses()
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set analyses_used_this_month = 0,
      analyses_reset_at = date_trunc('month', now()) + interval '1 month'
  where analyses_reset_at <= now();
end;
$$;

-- Indexes
create index analyses_user_id_idx on public.analyses(user_id);
create index analyses_created_at_idx on public.analyses(created_at desc);
create index scout_alerts_user_id_idx on public.scout_alerts(user_id);
create index scout_alerts_is_read_idx on public.scout_alerts(is_read) where is_read = false;
