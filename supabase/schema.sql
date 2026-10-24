-- Homes with Lew¥: Supabase/Postgres starter schema.
-- Run this in the Supabase SQL Editor. Never put the service_role key in the website.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location text not null check (char_length(trim(location)) between 2 and 180),
  price numeric(14, 2) check (price is null or price >= 0),
  currency text,
  beds smallint check (beds is null or beds >= 0),
  baths smallint check (baths is null or baths >= 0),
  summary text,
  image_url text,
  image_alt text,
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((price is null and currency is null) or (price is not null and currency is not null))
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location text not null,
  description text not null,
  home_type text,
  land_size text,
  features text[] not null default '{}',
  cover_image text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null check (char_length(trim(email)) between 5 and 254),
  phone text check (phone is null or char_length(trim(phone)) between 7 and 32),
  property_title text,
  message text not null check (char_length(trim(message)) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'spam')),
  created_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null,
  url text not null check (url ~ '^https://'),
  owner_scope text not null check (owner_scope in ('personal', 'willstone')),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_scope, platform)
);

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

alter table public.admin_users enable row level security;
alter table public.properties enable row level security;
alter table public.projects enable row level security;
alter table public.enquiries enable row level security;
alter table public.social_links enable row level security;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.properties, public.projects, public.social_links to authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant select on public.properties, public.projects, public.social_links to anon, authenticated;
revoke insert on public.enquiries from anon, authenticated;
grant insert (name, email, phone, property_title, message) on public.enquiries to anon, authenticated;

create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Public can read verified published properties"
  on public.properties for select to anon, authenticated
  using (verified and published);
create policy "Admins can manage properties"
  on public.properties for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Public can read published projects"
  on public.projects for select to anon, authenticated
  using (published);
create policy "Admins can manage projects"
  on public.projects for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Visitors can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (
    status = 'new'
    and char_length(trim(name)) between 2 and 120
    and char_length(trim(email)) between 5 and 254
    and char_length(trim(message)) between 10 and 5000
  );
create policy "Admins can manage enquiries"
  on public.enquiries for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Public can read active social links"
  on public.social_links for select to anon, authenticated
  using (is_active);
create policy "Admins can manage social links"
  on public.social_links for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

insert into public.projects (title, slug, location, description, home_type, land_size, features, cover_image, published)
values (
  'Whitepark 2 Estate',
  'whitepark-2-estate',
  'Joska, along Kangundo Road near the Greater Eastern Bypass',
  'A modern gated community offering spacious 3-bedroom bungalows with DSQ. Each is on a 50-by-100 piece of land with its own compound and garden.',
  '3-bedroom bungalow with DSQ',
  '50 by 100 (unit to confirm)',
  array['Gated community', 'Cabro-paved driveways', 'Own compound', 'Garden'],
  '/images/white-park-2/progress-08.jpg',
  true
)
on conflict (slug) do nothing;

insert into public.social_links (platform, label, url, owner_scope, sort_order)
values
  ('whatsapp', 'WhatsApp Channel', 'https://whatsapp.com/channel/0029VbAtw1UKbYMNrzgEqS0g', 'personal', 0),
  ('reddit', 'Reddit', 'https://www.reddit.com/user/Mission-Bluebird5874/', 'personal', 1),
  ('facebook', 'Facebook', 'https://www.facebook.com/willstonehomes/', 'willstone', 0),
  ('instagram', 'Instagram', 'https://www.instagram.com/willstone_homes/reel/DB3ND7RohC1/', 'willstone', 1),
  ('tiktok', 'TikTok', 'https://www.tiktok.com/@willstone.homes', 'willstone', 2),
  ('youtube', 'YouTube', 'https://www.youtube.com/channel/UCgxMais9RLaUvoVHHAP83mQ', 'willstone', 3)
on conflict (owner_scope, platform) do nothing;

-- Dashboard access is limited by email in public.is_site_admin().
