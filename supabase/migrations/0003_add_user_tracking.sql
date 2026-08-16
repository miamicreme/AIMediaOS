-- Add user tracking and auth-based access to media_jobs

alter table public.media_jobs
add column user_id uuid references auth.users(id) on delete cascade;

alter table public.media_jobs
add column is_public boolean default false;

-- Update RLS policies for media_jobs to be user-based
drop policy if exists "media_jobs anon read" on public.media_jobs;
drop policy if exists "media_jobs anon write" on public.media_jobs;
drop policy if exists "media_jobs anon update" on public.media_jobs;

-- New policies: authenticated users can only see their own jobs
create policy "Users can read own jobs" on public.media_jobs
  for select to authenticated using (auth.uid() = user_id or is_public = true);

create policy "Users can create jobs" on public.media_jobs
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update own jobs" on public.media_jobs
  for update to authenticated using (auth.uid() = user_id);

-- Temporary anon access for development (remove in production)
create policy "Anonymous can read if explicitly public" on public.media_jobs
  for select to anon using (is_public = true);

create index idx_media_jobs_user_id on public.media_jobs(user_id);
create index idx_media_jobs_user_created on public.media_jobs(user_id, created_at desc);
