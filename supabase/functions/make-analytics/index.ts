const allowedEvents = new Set([
  'page_view', 'whatsapp_click', 'call_click', 'enquiry_started', 'enquiry_submitted',
  'gallery_opened', 'brochure_clicked', 'map_clicked', 'viewing_booked', 'sale_recorded',
  'automation_succeeded', 'automation_failed', 'automation_skipped',
]);

const boundedText = (value: unknown, max: number): string | null => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= max ? text : null;
};

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('MAKE_ANALYTICS_WEBHOOK_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !url || !serviceKey) {
    console.error('Missing Make analytics function secrets.');
    return new Response('Analytics integration is not configured', { status: 500 });
  }
  if (request.headers.get('x-make-analytics-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 8_000) return new Response('Payload too large', { status: 413 });

  try {
    const payload = await request.json();
    const eventName = boundedText(payload.event_name, 40);
    const pagePath = boundedText(payload.page_path, 500) || '/integrations/make';
    const projectSlug = boundedText(payload.project_slug, 120);
    const campaign = boundedText(payload.campaign, 120);
    const eventSource = boundedText(payload.source, 80) || 'make';
    const device = payload.device === 'mobile' ? 'mobile' : 'desktop';
    if (!eventName || !allowedEvents.has(eventName)) {
      return new Response('Unsupported event_name', { status: 400 });
    }
    if ((payload.project_slug != null && payload.project_slug !== '' && !projectSlug)
      || (payload.campaign != null && payload.campaign !== '' && !campaign)
      || (payload.source != null && payload.source !== '' && !boundedText(payload.source, 80))) {
      return new Response('Invalid event metadata', { status: 400 });
    }

    const response = await fetch(`${url}/rest/v1/site_events`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_name: eventName,
        page_path: pagePath,
        project_slug: projectSlug,
        source: eventSource,
        campaign,
        device,
      }),
    });
    if (!response.ok) {
      console.error('Could not record Make analytics event:', response.status, await response.text());
      return new Response('Could not record analytics event', { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }
});
