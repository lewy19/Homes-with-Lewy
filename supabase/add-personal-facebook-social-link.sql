-- Run once in Supabase SQL Editor to add Lewis's personal Facebook profile.
insert into public.social_links (platform, label, url, owner_scope, is_active, sort_order)
values (
  'facebook',
  'Facebook',
  'https://web.facebook.com/profile.php?id=61583083756453',
  'personal',
  true,
  1
)
on conflict (owner_scope, platform) do update
set label = excluded.label,
    url = excluded.url,
    is_active = true,
    sort_order = excluded.sort_order;
