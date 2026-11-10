# Homes with Lew¥

Responsive React website built with React 19 and Vite 8. Start the local development server with:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`. For a production build, run `npm run build`; preview it with `npm run preview`.

## Pages

The public site includes its homepage, project index and detail pages, testimonials, buying guides, FAQs, privacy information and a custom 404. The private owner dashboard is at `/admin`.

## Add verified listings

Edit `src/data/properties.js`. Only records marked `verified: true` are displayed. Add confirmed facts and approved photos from Willstone Homes:

```js
{
  verified: true,
  title: "VERIFIED PROPERTY TITLE",
  location: "VERIFIED LOCATION",
  image: "/images/confirmed-property.jpg",
  imageAlt: "Accurate description of the property photo",
  // Optional: confirmed numeric price and currency, beds, baths, and summary.
}
```

Location and price filters appear only when the verified listings include data that supports them. Price and currency can be omitted; the card will say “Price on enquiry.” Do not add unverified facts, customer quotes, or photos without permission.

## Supabase and the owner dashboard

The discreet lock icon in the site footer opens `/admin`. The dashboard permits only `lewisnjuguna926@gmail.com` and `lewisnjuguna777@gmail.com`; Supabase row-level security enforces the same email allowlist for private records. Public visitors cannot read enquiries or draft/unverified listings.

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor. For existing projects, run `supabase/add-enquiry-qualification-fields.sql`, `supabase/add-enquiry-contact-consent.sql`, then `supabase/add-lead-analytics-security.sql` once each, in that order. The last migration adds lead workflow fields, normalized phone validation, repeat-enquiry protection, settings, sign-in audit and event analytics. The existing owner allowlist contains lewisnjuguna926@gmail.com and lewisnjuguna777@gmail.com. Google OAuth client setup remains the following step.
3. In Google Cloud Console, create an OAuth client for a Web application. Add your local site origin (for example, `http://localhost:5173`) and production site origin to **Authorized JavaScript origins**. In **Authorized redirect URIs**, add the callback URL shown on the Supabase **Authentication > Sign In / Providers > Google** page (it uses your project URL and `/auth/v1/callback`).
4. Enable Google under **Supabase > Authentication > Sign In / Providers**, then paste the Google OAuth client ID and client secret there. In **Authentication > URL Configuration**, set your site URL and add `http://localhost:5173/**` plus your production URL to the allowed redirect URLs. The app returns to `/admin` after Google sign-in.
5. Sign in with either allowlisted Google account. Other Google accounts will be denied dashboard access.
6. Copy `.env.example` to `.env` and fill in the project URL and public anon key. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel for Production, Preview and Development. Never add the `service_role` key or Google client secret to frontend variables or commit a populated `.env` file.
7. Restart `npm run dev`. Use the small lock icon in the footer to sign in at `/admin`.

To add Lewis’s Reddit profile to an existing database, run `supabase/add-reddit-social-link.sql` in the Supabase SQL Editor. The profile is also included in the starter schema and the local no-database fallback.

To add Lewis’s personal Facebook profile to an existing database, run `supabase/add-personal-facebook-social-link.sql` in the Supabase SQL Editor. It is separate from the Willstone Homes Facebook page.

LUMA can use a Supabase Edge Function and the OpenAI Responses API for natural-language replies, grounded only in published public projects, verified published listings, active social links and fixed public site information. The website does not store chat history; recent turns are sent to OpenAI for a reply. Without the function and its API secret configured, LUMA uses a small local scripted fallback. Do not use it for sensitive personal information or internal dashboard/security topics.

The enquiry form writes to Supabase only when the project is configured and the required migrations have been applied. Public project detail pages currently use the canonical JSDoc-typed source in `src/data/projects.js`; edits in the separate database Projects tab do not currently update that public source or create a prerendered page. Treat that as a known limitation until project CRUD is wired to the public project loader. To enable AI chat, follow `supabase/LUMA-SETUP.md`.

Add the same public URL and anon key as deployment environment variables when publishing. Database access remains governed by Supabase RLS. This Vite app serves a static `/admin` shell and Google OAuth runs in the browser; RLS protects database records, but static HTML is not gated by an HTTP-only server session. `noindex` and the discreet lock are not access control. A server auth gateway is still needed for strict server-side `/admin` protection and HTTP-only cookies.

## Enquiries and contact details

Enquiries contain a visitor name, email, optional phone, selected development, budget range, preferred area, timeline and message. Records are visible only to an authorized dashboard account. Review and remove records that are no longer needed. The form saves to the dashboard; email alerts require the separate Resend and Supabase webhook setup in `supabase/ENQUIRY-NOTIFICATIONS.md`. Visitors can call Lewis at +254 114 998 890 or message him directly on WhatsApp at wa.me/254114998890. The WhatsApp Channel is for updates.

The homepage and Willstone Homes page include images from the “Mansionatte Photos” album Lewis shared, with the page gallery linking back to the source. The album is labeled as project imagery, not verified listings. The Willstone Homes page also includes selected images from the White Park 2 site-progress album, explicitly labeled as construction progress rather than homes currently for sale. White Park 2 image 4, which includes an unverified sign/contact number, is intentionally excluded.
