-- Extend the first-party event stream for authenticated Make automation runs.
-- Run once after add-lead-analytics-security.sql.

alter table public.site_events
  drop constraint if exists site_events_event_name_check;

alter table public.site_events
  add constraint site_events_event_name_check check (event_name in (
    'page_view', 'whatsapp_click', 'call_click', 'enquiry_started', 'enquiry_submitted',
    'gallery_opened', 'brochure_clicked', 'map_clicked', 'viewing_booked', 'sale_recorded',
    'automation_succeeded', 'automation_failed', 'automation_skipped'
  ));

-- These automation events are deliberately excluded from the anonymous visitor policy.
-- The make-analytics Edge Function writes them with the server-only service role key.
