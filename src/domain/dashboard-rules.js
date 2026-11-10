export const LEAD_STATUSES = ['New', 'Contacted', 'Viewing booked', 'Negotiating', 'Won', 'Lost'];
const ALLOWED_ADMINS = new Set(['lewisnjuguna926@gmail.com', 'lewisnjuguna777@gmail.com']);

export function isAuthorizedAdmin(session) {
  return Boolean(session?.user?.email && ALLOWED_ADMINS.has(session.user.email.trim().toLowerCase()));
}

export function leadStatusIsValid(status) {
  return LEAD_STATUSES.includes(status);
}

export function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function leadsToCsv(leads) {
  const headers = ['Name', 'Phone', 'Email', 'Project', 'Source', 'Campaign', 'Message', 'Consent', 'Timestamp', 'Status', 'Private notes', 'Follow-up'];
  const rows = leads.map(lead => [lead.name, lead.phone, lead.email, lead.property_title, lead.source, lead.campaign, lead.message,
    lead.contact_consent ? 'Yes' : 'No', lead.created_at, lead.status, lead.private_notes, lead.follow_up_at]);
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

export function trackingContext({ url, referrer = '', userAgent = '', pathname = '' }) {
  const params = new URL(url, 'https://homes-with-lewy.vercel.app').searchParams;
  const ref = (() => { try { return new URL(referrer).hostname; } catch { return ''; } })();
  let source = params.get('utm_source') || params.get('source');
  if (!source) {
    if (/google|bing|yahoo|duckduckgo/i.test(ref)) source = 'search';
    else if (/instagram/i.test(ref)) source = 'instagram';
    else if (/tiktok/i.test(ref)) source = 'tiktok';
    else if (/facebook/i.test(ref)) source = 'facebook';
    else if (/whatsapp/i.test(ref)) source = 'whatsapp';
    else source = 'direct';
  }
  return {
    source: source.slice(0, 80),
    campaign: (params.get('utm_campaign') || '').slice(0, 120) || null,
    device: /android|iphone|ipad|mobile/i.test(userAgent) ? 'mobile' : 'desktop',
    page_path: pathname || new URL(url, 'https://homes-with-lewy.vercel.app').pathname,
  };
}

export function summarizeLeads(enquiries, now = Date.now()) {
  const recent = days => enquiries.filter(row => now - new Date(row.created_at).getTime() < days * 86_400_000 && now >= new Date(row.created_at).getTime());
  const topProjects = new Map();
  for (const row of enquiries) {
    const project = row.property_title || 'General enquiry';
    topProjects.set(project, (topProjects.get(project) || 0) + 1);
  }
  return {
    today: recent(1).filter(row => new Date(row.created_at).toDateString() === new Date(now).toDateString()).length,
    sevenDays: recent(7).length,
    thirtyDays: recent(30).length,
    awaitingFollowUp: enquiries.filter(row => row.status === 'New').length,
    topProjects: [...topProjects].map(([project, count]) => ({ project, count })).sort((a, b) => b.count - a.count),
    lastTen: [...enquiries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10),
  };
}
