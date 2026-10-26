-- Run once in Supabase SQL Editor to add Mangu Grove as a public project.
alter table public.projects
  add column if not exists maisonette_price numeric(14, 2) check (maisonette_price is null or maisonette_price >= 0),
  add column if not exists bungalow_price numeric(14, 2) check (bungalow_price is null or bungalow_price >= 0),
  add column if not exists plot_price numeric(14, 2) check (plot_price is null or plot_price >= 0);

insert into public.projects (title, slug, location, description, home_type, bungalow_price, plot_price, published)
values (
  'Mangu Grove',
  'mangu-grove',
  'Along Thika Superhighway, off Exit 16, behind Zetech University',
  'A premium residential development offering modern 3-bedroom bungalows with DSQ and 50-by-100 plots.',
  'Modern 3-bedroom bungalows with DSQ and 50-by-100 plots',
  13850000,
  3950000,
  true
)
on conflict (slug) do update
set title = excluded.title,
    location = excluded.location,
    description = excluded.description,
    home_type = excluded.home_type,
    bungalow_price = excluded.bungalow_price,
    plot_price = excluded.plot_price,
    published = true,
    updated_at = now();
