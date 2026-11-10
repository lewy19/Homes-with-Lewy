# Email alerts for website enquiries

The website continues saving each enquiry to `public.enquiries`. A Supabase Database Webhook can send an alert to both dashboard administrators (`lewisnjuguna926@gmail.com` and `lewisnjuguna777@gmail.com`) after each successful insert. The Resend API key and webhook token stay in Supabase Edge Function secrets, never in the website or Vercel variables.

## One-time setup

Before accepting enquiries with optional email and contact consent, run `supabase/add-enquiry-contact-consent.sql` and `supabase/add-lead-analytics-security.sql` in the Supabase SQL Editor. The notification function supports missing email and includes the stored consent, source and campaign in the alert.

1. Create a Resend account, add and verify a sender domain, and create an API key. Resend requires a verified sender domain for production sending.
2. In Supabase, open **Edge Functions → Secrets** and add these three secrets:
   - `RESEND_API_KEY`: the Resend API key.
   - `RESEND_FROM`: a sender using the verified domain, for example `Homes with Lew¥ <enquiries@your-verified-domain>`.
   - `ENQUIRY_WEBHOOK_SECRET`: a long random value. Generate one in PowerShell with:

     ```powershell
     [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
     ```

   The function uses Supabase's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only inside the Edge Function to read the private notification settings. Never place that key in Vercel or browser `.env` variables. If the dashboard notification email setting is empty, the function defaults to the two owner email addresses already authorized in the database.

   Optional WhatsApp alerts use Twilio. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` as Supabase Edge Function secrets, then set the alert number in Dashboard → Settings. The Twilio WhatsApp sender must already be enabled for your account. If those settings are missing, only email is attempted.

3. From the project folder, deploy the function (replace the project reference with the part before `.supabase.co` in `VITE_SUPABASE_URL`):

   ```powershell
   npx supabase functions deploy notify-enquiry --project-ref YOUR_PROJECT_REF
   ```

4. In Supabase, open **Database → Webhooks** and create a webhook:
   - Name: `notify-enquiry`
   - Table: `public.enquiries`
   - Event: **Insert** only
   - Type: **HTTP Request**
   - Method: **POST**
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-enquiry`
   - Header: `x-enquiry-webhook-secret` with the same value as `ENQUIRY_WEBHOOK_SECRET`

5. Submit one real test enquiry and confirm the alert arrives at both admin email addresses. Remove the test enquiry from the dashboard afterward if you prefer.

The webhook runs after the database insert and does not hold up the visitor's form submission. Failed email delivery is visible in the Edge Function logs; the enquiry itself remains in the dashboard inbox.
