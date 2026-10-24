-- Run this once in Supabase SQL Editor for an existing project.
-- This restricts dashboard data policies to these two signed-in Google emails.
create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
    'lewisnjuguna926@gmail.com',
    'lewisnjuguna777@gmail.com'
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;
