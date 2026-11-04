-- Run once in Supabase SQL Editor to store the new optional enquiry preferences.
alter table public.enquiries
  add column if not exists budget_range text check (budget_range is null or char_length(trim(budget_range)) <= 80),
  add column if not exists preferred_area text check (preferred_area is null or char_length(trim(preferred_area)) <= 120),
  add column if not exists timeline text check (timeline is null or char_length(trim(timeline)) <= 80);

grant insert (name, email, phone, property_title, budget_range, preferred_area, timeline, message)
  on public.enquiries to anon, authenticated;

drop policy if exists "Visitors can submit enquiries" on public.enquiries;
create policy "Visitors can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (
    status = 'new'
    and char_length(trim(name)) between 2 and 120
    and char_length(trim(email)) between 5 and 254
    and char_length(trim(message)) between 10 and 5000
    and (budget_range is null or char_length(trim(budget_range)) <= 80)
    and (preferred_area is null or char_length(trim(preferred_area)) <= 120)
    and (timeline is null or char_length(trim(timeline)) <= 80)
  );
