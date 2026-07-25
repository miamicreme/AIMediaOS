-- Persistent job store + public media storage bucket for AIMediaOS.
--
-- This is intentionally permissive (RLS allows any anon read/write) because
-- the app has no auth yet — see README "Development Rules". Tighten these
-- policies before any multi-user or production use.

create table if not exists public.media_jobs (
  id text primary key,
  workflow_id text not null,
  kind text not null,
  status text not null,
  provider text not null,
  provider_job_id text,
  task_type text,
  model text,
  prompt text,
  input_images jsonb not null default '[]'::jsonb,
  result_urls jsonb not null default '[]'::jsonb,
  queue jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_jobs_created_at_idx on public.media_jobs (created_at desc);

alter table public.media_jobs enable row level security;

create policy "media_jobs anon read" on public.media_jobs
  for select to anon using (true);

create policy "media_jobs anon write" on public.media_jobs
  for insert to anon with check (true);

create policy "media_jobs anon update" on public.media_jobs
  for update to anon using (true) with check (true);

-- Public bucket for uploaded/generated media so external providers
-- (Seedream, RunPod) can fetch input images by URL.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media bucket public read" on storage.objects
  for select to public using (bucket_id = 'media');

create policy "media bucket anon insert" on storage.objects
  for insert to anon with check (bucket_id = 'media');
