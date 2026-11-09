# Testimonials page setup

The `/testimonials` page remains public to browse. Visitors sign in with Google only when they choose to submit feedback. New feedback is private with `pending` status until an administrator reviews and approves it in the owner dashboard's **Testimonials** tab.

## Supabase setup

1. Run `supabase/add-testimonials.sql` once in the Supabase SQL Editor. This creates the table and policies. Only the two site administrator emails can moderate submissions. Signed-in visitors can submit one review per Google account, and can read their own moderation status. The public can read only approved reviews with public-display consent.
2. In Supabase **Authentication → URL Configuration → Redirect URLs**, add the exact callback URLs for local and production use:
   - `http://localhost:5174/testimonials`
   - `https://homes-with-lewy.vercel.app/testimonials`
3. Confirm Google sign-in is enabled in Supabase Authentication. Visitors can browse every other page without signing in.
4. To review feedback, sign into `/admin`, open **Testimonials**, and approve, reject, or delete each submission.

Google sign-in limits anonymous spam but does not prove that a reviewer purchased a property or is a client. The page states this plainly and does not label reviews as verified. Only display feedback that has explicit public consent.
