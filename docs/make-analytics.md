# Make analytics for the owner dashboard

Make can report scenario outcomes into the dashboard's **Analytics** tab. Each run adds one aggregate event to `site_events`; the dashboard shows automation successes, failures and skips alongside website events. Do not send names, phone numbers, email addresses, enquiry messages or other personal data to this endpoint.

## One-time setup

1. Run `supabase/add-make-analytics.sql` in the Supabase SQL Editor after the existing lead analytics migration.
2. Create a long random secret (at least 32 characters) and save it as a Supabase Edge Function secret named `MAKE_ANALYTICS_WEBHOOK_SECRET`. Keep it in Make's connection/secret storage too; never put it in a website variable or dashboard setting.
3. Deploy the `make-analytics` Edge Function. It also needs the standard `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` function secrets. In Supabase CLI, use `supabase secrets set MAKE_ANALYTICS_WEBHOOK_SECRET=...` and `supabase functions deploy make-analytics`.
4. In a Make scenario, add an **HTTP > Make a request** module at the point where you want to report a result:
   - Method: `POST`
   - URL: `https://<project-ref>.supabase.co/functions/v1/make-analytics`
   - Header: `x-make-analytics-secret: <the same secret>`
   - Header: `Content-Type: application/json`
   - Header: `apikey: <your Supabase publishable/anon key>`
   - Body type: raw JSON

Use a Make error handler to report failures separately from successful completion. Do not report the same event in more than one branch, or retries will count as additional runs.

## Example body

```json
{
  "event_name": "automation_succeeded",
  "page_path": "/integrations/make",
  "project_slug": "manna-residence",
  "source": "make",
  "campaign": "lead-follow-up",
  "device": "desktop"
}
```

`event_name` may be `automation_succeeded`, `automation_failed`, `automation_skipped`, or one of the website analytics event names listed in `supabase/add-make-analytics.sql`. The optional `project_slug` lets project funnel summaries include the event. Use a short campaign label to split scenarios. `page_path` defaults to `/integrations/make`, `source` defaults to `make`, and `device` defaults to `desktop`.

The endpoint requires the secret header and writes through a server-side service role key. The key is never sent to the browser. The migration does not allow public visitors to insert automation events.
