-- Run once in Supabase SQL Editor before using the updated enquiry form.
-- Email is optional; phone and explicit phone/WhatsApp consent are required.
alter table public.enquiries
  alter column email drop not null,
  add column if not exists budget_range text check (budget_range is null or char_length(trim(budget_range)) <= 80),
  add column if not exists preferred_area text check (preferred_area is null or char_length(trim(preferred_area)) <= 120),
  add column if not exists timeline text check (timeline is null or char_length(trim(timeline)) <= 80),
  add column if not exists contact_consent boolean not null default false;

grant insert (name, email, phone, property_title, budget_range, preferred_area, timeline, message, contact_consent)
  on public.enquiries to anon, authenticated;

drop policy if exists "Visitors can submit enquiries" on public.enquiries;
create policy "Visitors can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (
    status = 'new'
    and char_length(trim(name)) between 2 and 120
    and phone is not null
    and char_length(trim(phone)) between 7 and 32
    and phone ~ '^[+0-9() .-]{7,32}$'
    and (email is null or (
      char_length(trim(email)) between 5 and 254
      and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    ))
    and char_length(trim(message)) between 10 and 5000
    and contact_consent is true
    and (property_title is null or char_length(trim(property_title)) between 1 and 160)
    and (budget_range is null or char_length(trim(budget_range)) <= 80)
    and (preferred_area is null or char_length(trim(preferred_area)) <= 120)
    and (timeline is null or char_length(trim(timeline)) <= 80)
  );
