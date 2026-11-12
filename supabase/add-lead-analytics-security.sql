-- Lead workflow and privacy-aware event tracking migration.
-- Run once in Supabase SQL Editor after schema.sql and add-enquiry-contact-consent.sql.
-- Dashboard table access remains controlled by public.is_site_admin() RLS.

alter table public.enquiries
  add column if not exists source text,
  add column if not exists campaign text,
  add column if not exists private_notes text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists honeypot text not null default '';

-- Migrate existing workflow values into the requested lead statuses.
alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries drop constraint if exists enquiries_phone_e164_check;
alter table public.enquiries drop constraint if exists enquiries_source_length_check;
alter table public.enquiries drop constraint if exists enquiries_campaign_length_check;
alter table public.enquiries drop constraint if exists enquiries_private_notes_length_check;
update public.enquiries set status = case status
  when 'in_progress' then 'Contacted'
  when 'resolved' then 'Won'
  when 'spam' then 'Lost'
  else 'New'
end;
alter table public.enquiries
  alter column status set default 'New',
  add constraint enquiries_status_check check (status in ('New', 'Contacted', 'Viewing booked', 'Negotiating', 'Won', 'Lost')),
  add constraint enquiries_phone_e164_check check (left(phone, 4) = '+254' and substring(phone from 5) ~ '^[17][0-9]{8}$') not valid,
  add constraint enquiries_source_length_check check (source is null or char_length(trim(source)) between 1 and 80),
  add constraint enquiries_campaign_length_check check (campaign is null or char_length(campaign) <= 120),
  add constraint enquiries_private_notes_length_check check (private_notes is null or char_length(private_notes) <= 5000);

grant update (status, private_notes, follow_up_at) on public.enquiries to authenticated;
grant select (source, private_notes, follow_up_at) on public.enquiries to authenticated;
grant insert (name, email, phone, property_title, budget_range, preferred_area, timeline, message, contact_consent, source, campaign, honeypot)
  on public.enquiries to anon, authenticated;

drop policy if exists "Visitors can submit enquiries" on public.enquiries;
create policy "Visitors can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (
    status = 'New'
    and contact_consent is true
    and honeypot = ''
    and char_length(trim(name)) between 2 and 120
    and phone is not null
    and left(phone, 4) = '+254'
    and substring(phone from 5) ~ '^[17][0-9]{8}$'
    and (email is null or (char_length(trim(email)) between 5 and 254 and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'))
    and char_length(trim(message)) between 10 and 5000
    and (property_title is null or char_length(trim(property_title)) between 1 and 160)
  );

create or replace function public.validate_and_dedupe_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  digits text;
begin
  if new.contact_consent is distinct from true then
    raise exception 'Contact consent is required.' using errcode = '23514';
  end if;
  if nullif(trim(coalesce(new.honeypot, '')), '') is not null then
    raise exception 'This enquiry could not be accepted.' using errcode = '23514';
  end if;

  digits := regexp_replace(coalesce(new.phone, ''), '[^0-9]', '', 'g');
  if digits ~ '^0[17][0-9]{8}$' then
    digits := '254' || substr(digits, 2);
  elsif digits ~ '^[17][0-9]{8}$' then
    digits := '254' || digits;
  end if;
  if digits !~ '^254[17][0-9]{8}$' then
    raise exception 'Enter a valid Kenyan mobile number.' using errcode = '23514';
  end if;
  new.phone := '+' || digits;

  perform pg_advisory_xact_lock(hashtextextended(new.phone || ':' || coalesce(new.property_title, ''), 0));

  if exists (
    select 1
    from public.enquiries existing
    where existing.phone = new.phone
      and existing.property_title is not distinct from new.property_title
      and existing.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'A recent enquiry already exists for this phone and project.' using errcode = '23505';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_and_dedupe_enquiry() from public, anon, authenticated;
drop trigger if exists validate_and_dedupe_enquiry on public.enquiries;
create trigger validate_and_dedupe_enquiry
  before insert on public.enquiries
  for each row execute function public.validate_and_dedupe_enquiry();

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in (
    'page_view', 'whatsapp_click', 'call_click', 'enquiry_started', 'enquiry_submitted',
    'gallery_opened', 'brochure_clicked', 'map_clicked', 'viewing_booked', 'sale_recorded'
  )),
  page_path text not null check (char_length(page_path) between 1 and 500),
  project_slug text,
  source text not null default 'direct' check (char_length(source) between 1 and 80),
  campaign text check (campaign is null or char_length(campaign) <= 120),
  device text not null check (device in ('mobile', 'desktop')),
  created_at timestamptz not null default now()
);

alter table public.site_events enable row level security;
grant insert (event_name, page_path, project_slug, source, campaign, device) on public.site_events to anon, authenticated;
grant select, update, delete on public.site_events to authenticated;

drop policy if exists "Visitors can record privacy-friendly site events" on public.site_events;
drop policy if exists "Admins can manage site events" on public.site_events;
create policy "Visitors can record privacy-friendly site events"
  on public.site_events for insert to anon, authenticated
  with check (
    event_name in ('page_view', 'whatsapp_click', 'call_click', 'enquiry_started', 'enquiry_submitted', 'gallery_opened', 'brochure_clicked', 'map_clicked')
    and char_length(page_path) between 1 and 500
    and char_length(source) between 1 and 80
    and device in ('mobile', 'desktop')
  );
create policy "Admins can manage site events"
  on public.site_events for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

create table if not exists public.site_settings (
  key text primary key check (key in ('notification_email', 'notification_whatsapp', 'consent_text')),
  value text not null check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select on public.site_settings to anon;
insert into public.site_settings (key, value) values
  ('consent_text', 'I agree to be contacted by phone or WhatsApp about this property.')
on conflict (key) do nothing;
drop policy if exists "Public can read enquiry consent text" on public.site_settings;
create policy "Public can read enquiry consent text"
  on public.site_settings for select to anon, authenticated
  using (key = 'consent_text');
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
  on public.site_settings for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

-- Admin sign-in audit table. Add a row after successful sign-in from AdminPage.
create table if not exists public.admin_sign_in_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  signed_in_at timestamptz not null default now()
);
alter table public.admin_sign_in_log enable row level security;
grant insert (user_id) on public.admin_sign_in_log to authenticated;
grant select on public.admin_sign_in_log to authenticated;
drop policy if exists "Admins can log own sign-ins" on public.admin_sign_in_log;
drop policy if exists "Admins can read sign-in log" on public.admin_sign_in_log;
create policy "Admins can log own sign-ins"
  on public.admin_sign_in_log for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_site_admin());
create policy "Admins can read sign-in log"
  on public.admin_sign_in_log for select to authenticated
  using (public.is_site_admin());
