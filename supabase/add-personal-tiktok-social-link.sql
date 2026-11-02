-- Run once in the Supabase SQL Editor to add Lewis's personal TikTok profile.
insert into public.social_links (platform, label, url, owner_scope, is_active, sort_order)
values (
  'tiktok',
  'TikTok',
  'https://www.tiktok.com/@homeswithlewy',
  'personal',
  true,
  4
)
on conflict (owner_scope, platform) do update
set label = excluded.label,
    url = excluded.url,
    is_active = true,
    sort_order = excluded.sort_order;
