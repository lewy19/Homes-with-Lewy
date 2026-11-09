-- Run once in the Supabase SQL Editor to enable moderated public testimonials.
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 20 and 2000),
  consent_public boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select on public.testimonials to anon;

drop policy if exists "Public can read approved testimonials" on public.testimonials;
drop policy if exists "Signed in users can submit pending testimonials" on public.testimonials;
drop policy if exists "Users can read their own testimonials" on public.testimonials;
drop policy if exists "Admins can manage testimonials" on public.testimonials;

create policy "Public can read approved testimonials"
  on public.testimonials for select to anon, authenticated
  using (status = 'approved' and consent_public is true);

create policy "Signed in users can submit pending testimonials"
  on public.testimonials for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and consent_public is true
    and char_length(trim(display_name)) between 2 and 80
    and rating between 1 and 5
    and char_length(trim(comment)) between 20 and 2000
  );

create policy "Users can read their own testimonials"
  on public.testimonials for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage testimonials"
  on public.testimonials for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
