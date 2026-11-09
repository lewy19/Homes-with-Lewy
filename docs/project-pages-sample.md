# Project pages sample

The `/projects` list, project detail pages, homepage cards, location page, enquiry selector, page metadata, sitemap entries, and JSON-LD are driven by `src/data/projects.js`. That file is the source for this sample. The existing Supabase project table and dashboard remain available for the old project records, but they do not manage these richer sample profiles yet.

## Add another project

1. Add its photos to a project-specific folder under `public/images/<project-slug>/`. Keep renders and site photos clearly labelled. Do not reuse another estate's imagery.
2. Add one object to the `projects` array in `src/data/projects.js` with a unique lowercase hyphenated `slug`, `name`, `location.area`, and `location.landmarkRoad`.
3. Add only facts Willstone Homes has supplied: `status`, `unitTypes`, prices in KES, `priceNotes`, `plotSize`, `titleStatus`, `paymentPlan`, `features`, `gated`, security, utilities, drive times, images, map link, and `lastVerified` are optional. Leave unknown facts out; do not use `TBC` or `to confirm` as values. Set `lastVerified` only after actually checking with Willstone Homes.
4. Give every image meaningful `alt` text and a caption that says whether it is an architectural render or a site photo.
5. Add `<url><loc>https://homes-with-lewy.vercel.app/projects/<project-slug></loc></url>` to `public/sitemap.xml`.
6. Run the Vite production build and inspect `/projects/<project-slug>` before deploying. The project route, homepage card, enquiry selector, JSON-LD, and per-page title/description are otherwise generated from the data object.

## Enquiry database update

Before accepting enquiries on the updated form, run `supabase/add-enquiry-contact-consent.sql` once in the Supabase SQL Editor. It makes email optional and requires valid phone details plus the saved contact-consent checkbox. The database's `created_at` column stores the submission time. Email notification delivery still depends on the Resend Edge Function and Database Webhook setup in `supabase/ENQUIRY-NOTIFICATIONS.md`.

