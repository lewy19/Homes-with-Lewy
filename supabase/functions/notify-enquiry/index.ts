const recipients = ['lewisnjuguna926@gmail.com', 'lewisnjuguna777@gmail.com'];

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
    if (!name || !email || !message) return new Response('Invalid enquiry record', { status: 400 });

    const html = `<h2>New Homes with Lew¥ enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
      <p><strong>Home:</strong> ${escapeHtml(property)}</p>
      <p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
    const text = `New Homes with Lew¥ enquiry\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nHome: ${property}\n\n${message}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: email,
        subject: `New home enquiry: ${property}`,
        html,
        text,
      }),
    });
    if (!response.ok) {
      console.error('Resend rejected enquiry notification:', response.status, await response.text());
      return new Response('Could not send notification email', { status: 502 });
    }
    return new Response('Notification sent', { status: 200 });
  } catch (error) {
    console.error('Could not process enquiry notification:', error);
    return new Response('Invalid webhook payload', { status: 400 });
  }
});
