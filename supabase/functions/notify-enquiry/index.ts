const fallbackRecipients = ['lewisnjuguna926@gmail.com', 'lewisnjuguna777@gmail.com'];

async function notificationSettings(): Promise<Record<string, string>> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return {};
  const response = await fetch(`${url}/rest/v1/site_settings?key=in.(notification_email,notification_whatsapp)&select=key,value`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) throw new Error(`Could not load notification settings: ${response.status}`);
  const rows = await response.json();
  return Object.fromEntries(rows.map((row: { key: string; value: string }) => [row.key, row.value]));
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const webhookSecret = Deno.env.get('ENQUIRY_WEBHOOK_SECRET');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM');
  if (!webhookSecret || !resendKey || !from) {
    console.error('Missing notification function secrets.');
    return new Response('Notification service is not configured', { status: 500 });
  }
  if (request.headers.get('x-enquiry-webhook-secret') !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await request.json();
    if (payload.type !== 'INSERT' || payload.table !== 'enquiries' || payload.schema !== 'public') {
      return new Response('Ignored event', { status: 200 });
    }

    const enquiry = payload.record ?? {};
    const name = String(enquiry.name ?? '').slice(0, 120);
    const email = String(enquiry.email ?? '').slice(0, 254);
    const phone = String(enquiry.phone ?? '').slice(0, 32);
    const property = String(enquiry.property_title ?? 'General enquiry').slice(0, 160);
    const message = String(enquiry.message ?? '').slice(0, 5000);
    const budget = String(enquiry.budget_range ?? '').slice(0, 80);
    const area = String(enquiry.preferred_area ?? '').slice(0, 120);
    const timeline = String(enquiry.timeline ?? '').slice(0, 80);
    const source = String(enquiry.source ?? 'direct').slice(0, 80);
    const campaign = String(enquiry.campaign ?? '').slice(0, 120);
    if (!name || !message || enquiry.contact_consent !== true) return new Response('Invalid enquiry record', { status: 400 });
    let settings: Record<string, string> = {};
    try { settings = await notificationSettings(); }
    catch (error) { console.error('Could not read notification settings; using configured fallback.', error); }
    const configuredRecipients = (settings.notification_email || Deno.env.get('ENQUIRY_NOTIFICATION_EMAILS') || fallbackRecipients.join(','))
      .split(',').map((value: string) => value.trim()).filter((value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    const recipients = configuredRecipients.length ? configuredRecipients : fallbackRecipients;

    const html = `<h2>New Homes with Lew¥ enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'Not provided'}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
      <p><strong>Home:</strong> ${escapeHtml(property)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget || 'Not provided')}</p>
      <p><strong>Preferred area:</strong> ${escapeHtml(area || 'Not provided')}</p>
      <p><strong>Timing:</strong> ${escapeHtml(timeline || 'Not provided')}</p>
      <p><strong>Source:</strong> ${escapeHtml(source)}${campaign ? ` · Campaign: ${escapeHtml(campaign)}` : ''}</p>
      <p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
    const text = `New Homes with Lew¥ enquiry\n\nName: ${name}\nEmail: ${email || 'Not provided'}\nPhone: ${phone || 'Not provided'}\nHome: ${property}\nBudget: ${budget || 'Not provided'}\nPreferred area: ${area || 'Not provided'}\nTiming: ${timeline || 'Not provided'}\nContact consent: Yes\n\n${message}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: recipients,
        ...(email ? { reply_to: email } : {}),
        subject: `New home enquiry: ${property}`,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error('Resend rejected enquiry notification:', response.status, await response.text());
      return new Response('Could not send notification email', { status: 502 });
    }
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM');
    const notificationPhone = settings.notification_whatsapp;
    if (twilioSid && twilioToken && twilioFrom && notificationPhone) {
      const form = new URLSearchParams({
        From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: `whatsapp:${notificationPhone}`,
        Body: `New Homes with Lew¥ enquiry: ${name} · ${property} · ${phone}. Check the private dashboard for details.`,
      });
      const smsResult = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      if (!smsResult.ok) console.error('WhatsApp alert provider rejected the message:', smsResult.status, await smsResult.text());
    }
    return new Response('Notification sent', { status: 200 });
  } catch (error) {
    console.error('Could not process enquiry notification:', error);
    return new Response('Invalid webhook payload', { status: 400 });
  }
});
