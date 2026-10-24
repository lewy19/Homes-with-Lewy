# Homes with Lew¥

Responsive React website built with React 19 and Vite 8. Start the local development server with:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`. For a production build, run `npm run build`; preview it with `npm run preview`.

## Pages

The site has eleven pages: Home, Homes, About Lewis, Enquire, How it works, Viewing checklist, Home buying guide, FAQs, Willstone Homes, Areas, and Privacy.

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
2. Run `supabase/schema.sql` once in the Supabase SQL Editor. It creates the tables and row-level security policies and adds the Whitepark 2 project profile plus known social links. For an existing project, run `supabase/admin-email-allowlist.sql` to replace the prior user-ID admin check with the email allowlist.
3. In Google Cloud Console, create an OAuth client for a Web application. Add your local site origin (for example, `http://localhost:5173`) and production site origin to **Authorized JavaScript origins**. In **Authorized redirect URIs**, add the callback URL shown on the Supabase **Authentication > Sign In / Providers > Google** page (it uses your project URL and `/auth/v1/callback`).
4. Enable Google under **Supabase > Authentication > Sign In / Providers**, then paste the Google OAuth client ID and client secret there. In **Authentication > URL Configuration**, set your site URL and add `http://localhost:5173/**` plus your production URL to the allowed redirect URLs. The app returns to `/admin` after Google sign-in.
5. Sign in with either allowlisted Google account. Other Google accounts will be denied dashboard access.
6. Copy `.env.example` to `.env` and fill in the project URL and public anon key. Never add the `service_role` key or Google client secret to frontend environment variables or commit a populated `.env` file.
7. Restart `npm run dev`. Use the small lock icon in the footer to sign in at `/admin`.

The enquiry form writes to Supabase only when the project is configured and the schema has been applied. Verified, published properties populate the public Homes page. Published project details and active social links are read from Supabase. The dashboard lets the owner manage properties, project details, enquiries, and social links.

Add the same public URL and anon key as deployment environment variables when publishing. Database access remains governed by the RLS policies in `supabase/schema.sql`.

## Enquiries and contact details

Enquiries contain a visitor’s name, email, optional phone, selected property and message. They are visible only to an authorized dashboard account. Review enquiries and remove records that are no longer needed. The WhatsApp Channel is for updates; add a direct contact method separately if buyers should message Lewis directly.

The homepage and Willstone Homes page include images from the “Mansionatte Photos” album Lewis shared, with the page gallery linking back to the source. The album is labeled as project imagery, not verified listings. The Willstone Homes page also includes selected images from the White Park 2 site-progress album, explicitly labeled as construction progress rather than homes currently for sale. White Park 2 image 4, which includes an unverified sign/contact number, is intentionally excluded.
