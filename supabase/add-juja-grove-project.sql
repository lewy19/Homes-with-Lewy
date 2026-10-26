-- Run once in Supabase SQL Editor to add Juja Grove as a public project.
alter table public.projects
  add column if not exists maisonette_price numeric(14, 2) check (maisonette_price is null or maisonette_price >= 0),
  add column if not exists bungalow_price numeric(14, 2) check (bungalow_price is null or bungalow_price >= 0),
  add column if not exists plot_price numeric(14, 2) check (plot_price is null or plot_price >= 0);

insert into public.projects (title, slug, location, description, home_type, plot_price, published)
values (
  'Juja Grove',
  'juja-grove',
  '3 km from Thika Superhighway, along Juja Farm',
  'Prime residential plots for sale, strategically located 3 km from Thika Superhighway along Juja Farm.',
  'Residential plots',
  3750000,
  true
)
on conflict (slug) do update
set title = excluded.title,
    location = excluded.location,
    description = excluded.description,
    home_type = excluded.home_type,
    plot_price = excluded.plot_price,
    published = true,
    updated_at = now();
