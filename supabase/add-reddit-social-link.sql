-- Run once in Supabase SQL Editor to add Lewis's personal Reddit profile.
insert into public.social_links (platform, label, url, owner_scope, is_active, sort_order)
values (
  'reddit',
  'Reddit',
  'https://www.reddit.com/user/Mission-Bluebird5874/',
  'personal',
  true,
  2
)
on conflict (owner_scope, platform) do update
set label = excluded.label,
    url = excluded.url,
    is_active = true,
    sort_order = excluded.sort_order;
