-- Run once after schema.sql to support the complete public project page model.
alter table public.projects
  add column if not exists area text,
  add column if not exists landmark_road text,
  add column if not exists status text check (status is null or status in ('selling', 'sold out', 'coming soon')),
  add column if not exists price_from numeric(14, 2) check (price_from is null or price_from > 0),
  add column if not exists price_notes text,
  add column if not exists title_status text,
  add column if not exists payment_plan jsonb,
  add column if not exists unit_types jsonb,
  add column if not exists security text,
  add column if not exists water text,
  add column if not exists electricity text,
  add column if not exists gated boolean,
  add column if not exists drive_times jsonb,
  add column if not exists gallery jsonb,
  add column if not exists hero_image jsonb,
  add column if not exists floor_plan jsonb,
  add column if not exists video_url text,
  add column if not exists brochure_url text,
  add column if not exists map_url text,
  add column if not exists seo_description text,
  add column if not exists coordinates jsonb,
  add column if not exists last_verified date,
  add column if not exists archived boolean not null default false;

alter table public.projects
  add constraint projects_payment_plan_object check (payment_plan is null or jsonb_typeof(payment_plan) = 'object'),
  add constraint projects_unit_types_array check (unit_types is null or jsonb_typeof(unit_types) = 'array'),
  add constraint projects_drive_times_array check (drive_times is null or jsonb_typeof(drive_times) = 'array'),
  add constraint projects_gallery_array check (gallery is null or jsonb_typeof(gallery) = 'array');

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects for select to anon, authenticated
  using (published and archived = false);

-- The public website reads published project media; only authorized admins may upload/manage it.
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read project media" on storage.objects;
drop policy if exists "Admins can upload project media" on storage.objects;
drop policy if exists "Admins can update project media" on storage.objects;
drop policy if exists "Admins can delete project media" on storage.objects;
create policy "Public can read project media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'project-media');
create policy "Admins can upload project media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-media' and public.is_site_admin());
create policy "Admins can update project media"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-media' and public.is_site_admin())
  with check (bucket_id = 'project-media' and public.is_site_admin());
create policy "Admins can delete project media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-media' and public.is_site_admin());

-- Upsert only details already supplied in the site/instructions. Unknown fields remain NULL.
insert into public.projects (title, slug, location, area, landmark_road, description, home_type, land_size, features, gated, hero_image, gallery, map_url, seo_description, published)
values ('Whitepark 2 Estate', 'whitepark-2-estate', 'Joska, along Kangundo Road near the Greater Eastern Bypass', 'Joska', 'Along Kangundo Road, near the Greater Eastern Bypass',
  'A modern gated community offering spacious 3-bedroom bungalows with DSQ. Each is on a 50-by-100 piece of land with its own compound and garden.',
  '3-bedroom bungalow with DSQ', '50 by 100', array['Cabro-paved driveways', 'Own compound', 'Garden'], true,
  '{"src":"/images/whitepark-2-estate/whitepark-render-01.jpeg","alt":"Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents","kind":"render"}'::jsonb,
  '[{"src":"/images/whitepark-2-estate/whitepark-render-01.jpeg","alt":"Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents","kind":"render"},{"src":"/images/whitepark-2-estate/whitepark-render-02.jpeg","alt":"Second architectural view of a proposed Whitepark 2 bungalow and driveway","kind":"render"},{"src":"/images/whitepark-2-estate/progress-08.jpg","alt":"Aerial site-progress photo showing rows of unfinished homes and surrounding greenery at Whitepark 2","kind":"site-photo"},{"src":"/images/whitepark-2-estate/progress-12.jpg","alt":"Site-progress photo looking down a central access road between homes at Whitepark 2","kind":"site-photo"}]'::jsonb,
  'https://www.google.com/maps/search/?api=1&query=Joska%2C+Kangundo+Road%2C+near+Greater+Eastern+Bypass',
  'Whitepark 2 Estate in Joska, near Kangundo Road and the Greater Eastern Bypass: 3-bedroom bungalows with DSQ, private gardens and cabro-paved driveways.', true)
on conflict (slug) do update set location = excluded.location, area = excluded.area, landmark_road = excluded.landmark_road,
 description = excluded.description, home_type = excluded.home_type, land_size = excluded.land_size, features = excluded.features,
 gated = excluded.gated, hero_image = excluded.hero_image, gallery = excluded.gallery, map_url = excluded.map_url,
 seo_description = excluded.seo_description, published = excluded.published, updated_at = now();

insert into public.projects (title, slug, location, area, landmark_road, description, home_type, maisonette_price, bungalow_price, unit_types, price_from, price_notes, map_url, seo_description, published)
values ('Manna Residence', 'manna-residence', '4 km from Ruiru town, along Ruiru-Githurai Road', 'Ruiru', '4 km from Ruiru town, along Ruiru-Githurai Road',
  'A unique development blending elegant 4-bedroom maisonettes and bungalows, each featuring a DSQ.', '4-bedroom maisonettes and bungalows, each with a DSQ', 20500000, 15500000,
  '[{"label":"4-bedroom maisonette","bedrooms":4,"dsq":true,"price":20500000},{"label":"4-bedroom bungalow","bedrooms":4,"dsq":true,"price":15500000}]'::jsonb,
  15500000, 'Bungalows: KES 15.5M; maisonettes: KES 20.5M. Confirm current pricing.',
  'https://www.google.com/maps/search/?api=1&query=Ruiru-Githurai+Road%2C+Ruiru%2C+Kenya',
  'Manna Residence is 4 km from Ruiru town along Ruiru-Githurai Road, with 4-bedroom maisonettes and bungalows, each with a DSQ. Shared prices start at KES 15.5M.', true)
on conflict (slug) do update set location = excluded.location, area = excluded.area, landmark_road = excluded.landmark_road,
 description = excluded.description, home_type = excluded.home_type, maisonette_price = excluded.maisonette_price, bungalow_price = excluded.bungalow_price,
 unit_types = excluded.unit_types, price_from = excluded.price_from, price_notes = excluded.price_notes, map_url = excluded.map_url,
 seo_description = excluded.seo_description, published = excluded.published, updated_at = now();

insert into public.projects (title, slug, location, area, landmark_road, description, home_type, bungalow_price, plot_price, unit_types, price_from, price_notes, land_size, map_url, seo_description, published)
values ('Mangu Grove', 'mangu-grove', 'Along Thika Superhighway, off Exit 16, behind Zetech University', 'Thika Superhighway', 'Off Exit 16, behind Zetech University',
  'A premium residential development offering modern 3-bedroom bungalows with DSQ and 50-by-100 plots.', 'Modern 3-bedroom bungalows with DSQ and 50-by-100 plots', 13850000, 3950000,
  '[{"label":"3-bedroom bungalow","bedrooms":3,"dsq":true,"price":13850000},{"label":"Residential plot","price":3950000}]'::jsonb,
  3950000, 'Plots: KES 3.95M; bungalows: KES 13.85M. Confirm current pricing.', '50 by 100',
  'https://www.google.com/maps/search/?api=1&query=Exit+16%2C+Thika+Superhighway%2C+near+Zetech+University%2C+Kenya',
  'Mangu Grove, off Exit 16 on Thika Superhighway behind Zetech University, with 3-bedroom bungalows with DSQ and 50-by-100 plots.', true)
on conflict (slug) do update set location = excluded.location, area = excluded.area, landmark_road = excluded.landmark_road,
 description = excluded.description, home_type = excluded.home_type, bungalow_price = excluded.bungalow_price, plot_price = excluded.plot_price,
 unit_types = excluded.unit_types, price_from = excluded.price_from, price_notes = excluded.price_notes, land_size = excluded.land_size,
 map_url = excluded.map_url, seo_description = excluded.seo_description, published = excluded.published, updated_at = now();

insert into public.projects (title, slug, location, area, landmark_road, description, home_type, plot_price, unit_types, price_from, price_notes, map_url, seo_description, published)
values ('Juja Grove', 'juja-grove', '3 km from Thika Superhighway, along Juja Farm', 'Juja Farm', '3 km from Thika Superhighway',
  'Prime residential plots for sale, strategically located 3 km from Thika Superhighway along Juja Farm.', 'Residential plots', 3750000,
  '[{"label":"Residential plot","price":3750000}]'::jsonb, 3750000, 'Residential plots: KES 3.75M. Confirm current pricing.',
  'https://www.google.com/maps/search/?api=1&query=Juja+Farm%2C+Kenya',
  'Juja Grove offers residential plots in Juja Farm, 3 km from Thika Superhighway. Shared price: KES 3.75M; confirm current price and details.', true)
on conflict (slug) do update set location = excluded.location, area = excluded.area, landmark_road = excluded.landmark_road,
 description = excluded.description, home_type = excluded.home_type, plot_price = excluded.plot_price, unit_types = excluded.unit_types,
 price_from = excluded.price_from, price_notes = excluded.price_notes, map_url = excluded.map_url,
 seo_description = excluded.seo_description, published = excluded.published, updated_at = now();
