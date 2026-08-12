-- SaaS Database Schema
-- Users, subscriptions, credits, usage tracking

-- User profiles (extends Supabase auth)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  subscription_tier text not null default 'free', -- free, pro, enterprise
  subscription_start_at timestamptz,
  subscription_end_at timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usage credits (virtual currency)
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  balance bigint not null default 0, -- Credits remaining (1 credit = 1 generation)
  lifetime_purchased bigint not null default 0, -- Total credits ever purchased
  lifetime_used bigint not null default 0, -- Total credits ever used
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Credit transactions log
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null, -- Positive for purchases/rewards, negative for usage
  transaction_type text not null, -- purchase, usage, refund, bonus, adjustment
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Subscription plans
create table if not exists public.subscription_plans (
  id text primary key, -- free, pro-monthly, pro-annual, enterprise
  name text not null,
  description text,
  price_usd_cents bigint not null, -- $0 for free tier
  credits_per_month bigint not null, -- 0 for pay-as-you-go
  is_recurring boolean not null default true,
  stripe_price_id text,
  features jsonb, -- Array of feature strings
  created_at timestamptz not null default now()
);

-- Usage analytics (per user, per day)
create table if not exists public.usage_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  workflow text not null, -- text-to-image, image-to-image, etc
  count bigint not null default 0,
  created_at timestamptz not null default now(),
  constraint usage_analytics_unique unique (user_id, date, workflow)
);

-- Subscription history (audit trail)
create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references subscription_plans(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);

-- Payment invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_invoice_id text unique,
  amount_usd_cents bigint not null,
  credits_purchased bigint,
  status text not null default 'draft', -- draft, sent, paid, failed, void
  paid_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- API keys for users
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_hash text not null unique, -- Never store plain text
  key_preview text not null, -- First 8 chars for display
  name text,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Enable RLS on all tables
alter table public.user_profiles enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.usage_analytics enable row level security;
alter table public.subscription_history enable row level security;
alter table public.invoices enable row level security;
alter table public.api_keys enable row level security;

-- RLS Policies: user_profiles
create policy "Users can read own profile" on public.user_profiles
  for select to authenticated using (auth.uid() = id);

create policy "Users can update own profile" on public.user_profiles
  for update to authenticated using (auth.uid() = id);

-- RLS Policies: user_credits
create policy "Users can read own credits" on public.user_credits
  for select to authenticated using (auth.uid() = user_id);

-- RLS Policies: credit_transactions
create policy "Users can read own transactions" on public.credit_transactions
  for select to authenticated using (auth.uid() = user_id);

-- RLS Policies: usage_analytics
create policy "Users can read own analytics" on public.usage_analytics
  for select to authenticated using (auth.uid() = user_id);

-- RLS Policies: api_keys
create policy "Users can read own API keys" on public.api_keys
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can create API keys" on public.api_keys
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own API keys" on public.api_keys
  for delete to authenticated using (auth.uid() = user_id);

-- Indexes for performance
create index idx_user_profiles_email on public.user_profiles(email);
create index idx_user_profiles_stripe_customer on public.user_profiles(stripe_customer_id);
create index idx_credit_transactions_user_id on public.credit_transactions(user_id);
create index idx_usage_analytics_user_date on public.usage_analytics(user_id, date desc);
create index idx_subscription_history_user_id on public.subscription_history(user_id);
create index idx_invoices_user_id on public.invoices(user_id);
create index idx_api_keys_key_hash on public.api_keys(key_hash);

-- Insert default subscription plans
insert into public.subscription_plans (id, name, description, price_usd_cents, credits_per_month, features)
values
  ('free', 'Free', 'Get started with AI media', 0, 10, '["10 generations/month", "Community support", "3:4 aspect ratio only"]'::jsonb),
  ('pro-monthly', 'Pro Monthly', 'Unlimited generations', 9900, 0, '["Unlimited generations", "Priority support", "All aspect ratios", "API access"]'::jsonb),
  ('pro-annual', 'Pro Annual', 'Save 20% with annual billing', 99900, 0, '["Unlimited generations", "Priority support", "All aspect ratios", "API access"]'::jsonb),
  ('pay-as-you-go', 'Pay as you go', 'Pay per generation', 0, 0, '["$0.10 per generation", "No commitment", "All features"]'::jsonb)
on conflict do nothing;
