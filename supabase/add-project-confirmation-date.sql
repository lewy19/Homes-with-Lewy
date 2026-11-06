-- Run once in Supabase SQL Editor to enable the optional project freshness date.
-- Only enter a date after you have actually checked the project details with Willstone Homes.
alter table public.projects
  add column if not exists details_confirmed_on date;
