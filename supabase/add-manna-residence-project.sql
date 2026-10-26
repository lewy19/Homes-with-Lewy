-- Run once in Supabase SQL Editor to add Manna Residence as a public project.
alter table public.projects
  add column if not exists maisonette_price numeric(14, 2) check (maisonette_price is null or maisonette_price >= 0),
  add column if not exists bungalow_price numeric(14, 2) check (bungalow_price is null or bungalow_price >= 0),
  add column if not exists plot_price numeric(14, 2) check (plot_price is null or plot_price >= 0);

insert into public.projects (title, slug, location, description, home_type, maisonette_price, bungalow_price, published)
values (
  'Manna Residence',
  'manna-residence',
  '4 km from Ruiru town, along Ruiru-Githurai Road',
  'A unique development blending elegant 4-bedroom maisonettes and bungalows, each featuring a DSQ.',
  '4-bedroom maisonettes and bungalows, each with a DSQ',
  20500000,
  15500000,
  true
)
on conflict (slug) do update
set title = excluded.title,
    location = excluded.location,
    description = excluded.description,
    home_type = excluded.home_type,
    maisonette_price = excluded.maisonette_price,
    bungalow_price = excluded.bungalow_price,
    published = true,
    updated_at = now();
