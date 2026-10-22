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

## Enquiries and contact details

The form validates details, shows loading, error and confirmation states, and currently does not send or save personal information. Connect a verified enquiry service before accepting enquiries. Update the privacy notice to explain what happens to submitted details. The footer links to Willstone Homes’ public social profiles; add Lewis’s own verified email, phone and social profiles when available.

The homepage and Willstone Homes page include images from the “Mansionatte Photos” album Lewis shared, with the page gallery linking back to the source. The album is labeled as project imagery, not verified listings. The Willstone Homes page also includes selected images from the White Park 2 site-progress album, explicitly labeled as construction progress rather than homes currently for sale. White Park 2 image 4, which includes an unverified sign/contact number, is intentionally excluded.
