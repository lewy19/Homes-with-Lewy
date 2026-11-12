import { useEffect, useMemo, useState } from 'react';
import { projects as staticProjects } from './data/projects.js';
import { LEAD_STATUSES, leadsToCsv, summarizeLeads } from './domain/dashboard-rules.js';
import { isProjectImagePath, projectCompleteness } from './domain/rules.js';

const dateValue = value => value ? new Date(value).toISOString().slice(0, 10) : '';
const sourceOf = row => row.source || 'direct';

export function AdminOverview({ enquiries, setTab }) {
  const metrics = summarizeLeads(enquiries);
  return <>
    <section className="admin-stats">
      <Stat label="Leads today" value={metrics.today}/><Stat label="Last 7 days" value={metrics.sevenDays}/><Stat label="Last 30 days" value={metrics.thirtyDays}/><Stat label="Awaiting follow-up" value={metrics.awaitingFollowUp}/>
    </section>
    <section className="admin-columns">
      <div className="admin-panel"><h2>Most enquired projects</h2>{metrics.topProjects.slice(0, 5).map(item => <p key={item.project}>{item.project} <strong>{item.count}</strong></p>)}{!metrics.topProjects.length && <Empty>No leads yet.</Empty>}</div>
      <div className="admin-panel"><h2>Latest leads</h2>{metrics.lastTen.slice(0, 10).map(row => <p key={row.id}>{row.name} · {row.property_title || 'General enquiry'} · {new Date(row.created_at).toLocaleString()}</p>)}{!metrics.lastTen.length && <Empty>No leads yet.</Empty>}<button className="admin-secondary" onClick={() => setTab('Leads')}>Open lead inbox</button></div>
    </section>
  </>;
}

export function LeadsPanel({ rows, updateLead, removeLead, projects: projectRows = [] }) {
  const [query, setQuery] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const now = Date.now();
  const filtered = useMemo(() => [...rows].filter(row => {
    const haystack = [row.name, row.phone, row.email, row.property_title, row.message, row.source, row.campaign].join(' ').toLowerCase();
    const day = dateValue(row.created_at);
    return (!query || haystack.includes(query.toLowerCase()))
      && (!project || row.property_title === project)
      && (!status || row.status === status)
      && (!from || day >= from) && (!to || day <= to);
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [rows, query, project, status, from, to]);
  function exportCsv() {
    const blob = new Blob([leadsToCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `homes-with-lewy-leads-${dateValue(new Date())}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }
  return <section className="admin-panel">
    <div className="admin-panel-heading"><div><h2>Lead inbox ({filtered.length})</h2><p>New leads older than 15 minutes are highlighted for follow-up.</p></div><button className="admin-secondary" onClick={exportCsv}>Export CSV</button></div>
    <div className="admin-filters"><label>Search<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, phone, email, message"/></label><label>Project<select value={project} onChange={event => setProject(event.target.value)}><option value="">All projects</option>{(projectRows.length ? projectRows.map(row => ({ name: row.title })) : staticProjects).map(item => <option key={item.name}>{item.name}</option>)}</select></label><label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{LEAD_STATUSES.map(item => <option key={item}>{item}</option>)}</select></label><label>From<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>To<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label></div>
    <div className="admin-record-list">{filtered.map(row => {
      const needsAttention = row.status === 'New' && now - new Date(row.created_at).getTime() > 15 * 60_000;
      const phoneDigits = String(row.phone || '').replace(/\D/g, '');
      const waText = encodeURIComponent(`Hi ${row.name}, thanks for your enquiry about ${row.property_title || 'a home'}. I’ll help with the next details.`);
      return <article className={`admin-enquiry ${needsAttention ? 'lead-needs-followup' : ''}`} key={row.id}>
        <div className="admin-enquiry-top"><strong>{row.name}</strong><span>{new Date(row.created_at).toLocaleString()}</span></div>
        {needsAttention && <p className="admin-alert" role="status">New lead — no contact recorded after 15 minutes.</p>}
        <p>{row.phone && <a href={`tel:${encodeURIComponent(row.phone)}`}>{row.phone}</a>}{row.email && <> · <a href={`mailto:${encodeURIComponent(row.email)}`}>{row.email}</a></>} · {row.property_title || 'General enquiry'}</p>
        <p className="admin-enquiry-preferences">Source: {sourceOf(row)}{row.campaign ? ` · Campaign: ${row.campaign}` : ''} · Consent: {row.contact_consent ? 'Recorded' : 'Not recorded'} · {row.budget_range || 'Budget not shared'} · {row.preferred_area || 'Area not shared'} · {row.timeline || 'Timeline not shared'}</p>
        <blockquote>{row.message}</blockquote>
        <div className="admin-record-actions"><a className="admin-secondary" href={`https://wa.me/${phoneDigits}?text=${waText}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>{row.phone && <a className="admin-secondary" href={`tel:${encodeURIComponent(row.phone)}`}>Call</a>}</div>
        <div className="admin-form-row"><label>Status<select value={row.status} onChange={event => updateLead(row.id, { status: event.target.value })}>{LEAD_STATUSES.map(item => <option key={item}>{item}</option>)}</select></label><label>Follow-up date<input type="date" value={dateValue(row.follow_up_at)} onChange={event => updateLead(row.id, { follow_up_at: event.target.value ? new Date(`${event.target.value}T09:00:00`).toISOString() : null })}/></label></div>
        <label>Private notes<textarea rows="2" defaultValue={row.private_notes || ''} onBlur={event => { if (event.target.value !== (row.private_notes || '')) updateLead(row.id, { private_notes: event.target.value }); }} placeholder="Only visible in the owner dashboard"/></label>
        <button className="admin-secondary danger" onClick={() => removeLead(row)}>Anonymise / delete on request</button>
      </article>;
    })}{!filtered.length && <Empty>No leads match these filters.</Empty>}</div>
  </section>;
}

export function AnalyticsPanel({ events, leads, projects: projectRows = [], supabaseUrl = '' }) {
  const [days, setDays] = useState(30);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const cutoff = from ? new Date(`${from}T00:00:00`).getTime() : Date.now() - days * 86_400_000;
  const endAt = to ? new Date(`${to}T23:59:59.999`).getTime() : Date.now();
  const filtered = events.filter(event => {
    const date = dateValue(event.created_at);
    const timestamp = new Date(event.created_at).getTime();
    return timestamp >= cutoff && timestamp <= endAt;
  });
  const aggregate = key => {
    const map = new Map(); filtered.forEach(event => { const value = event[key] || 'Unknown'; map.set(value, (map.get(value) || 0) + 1); });
    const total = filtered.length || 1;
    return [...map].map(([label, count]) => ({ label, count, percent: Math.round(count / total * 100) })).sort((a, b) => b.count - a.count);
  };
  const pageViews = filtered.filter(event => event.event_name === 'page_view').length;
  const clicks = filtered.filter(event => ['whatsapp_click', 'call_click'].includes(event.event_name)).length;
  const automationSuccesses = filtered.filter(event => event.event_name === 'automation_succeeded').length;
  const automationFailures = filtered.filter(event => event.event_name === 'automation_failed').length;
  const automationSkips = filtered.filter(event => event.event_name === 'automation_skipped').length;
  const enquiries = leads.filter(lead => new Date(lead.created_at).getTime() >= cutoff).length;
  const viewings = leads.filter(lead => lead.status === 'Viewing booked' && new Date(lead.created_at).getTime() >= cutoff).length;
  const sales = leads.filter(lead => lead.status === 'Won' && new Date(lead.created_at).getTime() >= cutoff).length;
  const withinLeadDate = lead => {
    const timestamp = new Date(lead.created_at).getTime();
    return timestamp >= cutoff && timestamp <= endAt;
  };
  const enquirySources = new Map();
  leads.filter(withinLeadDate).forEach(lead => {
    const key = `${lead.source || 'direct'}${lead.campaign ? ` / ${lead.campaign}` : ''}`;
    enquirySources.set(key, (enquirySources.get(key) || 0) + 1);
  });
  const funnelProjects = projectRows.length ? projectRows.map(row => ({ slug: row.slug, name: row.title })) : staticProjects;
  const funnel = funnelProjects.map(project => {
    const projectEvents = filtered.filter(event => event.project_slug === project.slug);
    const projectLeads = leads.filter(lead => lead.property_title === project.name && withinLeadDate(lead));
    const views = projectEvents.filter(event => event.event_name === 'page_view').length;
    const clicksForProject = projectEvents.filter(event => ['whatsapp_click', 'call_click'].includes(event.event_name)).length;
    const enquiriesForProject = projectLeads.length;
    const viewingsForProject = projectLeads.filter(lead => lead.status === 'Viewing booked').length;
    const wonForProject = projectLeads.filter(lead => lead.status === 'Won').length;
    const percent = count => views ? `${Math.round(count / views * 100)}%` : '—';
    return { project: project.name, views, clicks: clicksForProject, enquiries: enquiriesForProject, viewings: viewingsForProject, won: wonForProject, percent };
  });
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Privacy-friendly analytics</h2><p>First-party event counts; no visitor identifiers or fingerprinting.</p></div><label>Range<select value={days} onChange={event => setDays(Number(event.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label></div>
    <div className="admin-filters"><label>From date<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>To date<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label></div>
    <div className="admin-stats"><Stat label="Page views" value={pageViews}/><Stat label="Contact clicks" value={clicks}/><Stat label="Enquiries" value={enquiries}/><Stat label="Viewing booked" value={viewings}/><Stat label="Won" value={sales}/></div>
    <section className="admin-panel make-analytics-setup"><div className="admin-panel-heading"><div><h2>Make automation</h2><p>Send scenario outcomes here to see runs in this dashboard.</p></div><span className="admin-integration-badge">{automationSuccesses + automationFailures + automationSkips} runs in range</span></div>
      <div className="admin-automation-stats"><Stat label="Successful" value={automationSuccesses}/><Stat label="Failed" value={automationFailures}/><Stat label="Skipped" value={automationSkips}/></div>
      <p>In Make, add an <strong>HTTP → Make a request</strong> module at the end of the scenario (and a separate error handler for failures). Send a POST request with the secret header and your Supabase publishable/anon key in an <code>apikey</code> header to this endpoint:</p>
      <code className="make-endpoint">{supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/make-analytics` : 'Configure VITE_SUPABASE_URL to show the endpoint'}</code>
      <p>Set header <code>x-make-analytics-secret</code> to the same secret stored in Supabase as <code>MAKE_ANALYTICS_WEBHOOK_SECRET</code>. Never put the secret in a public URL, website setting or frontend variable.</p>
      <p>Send JSON such as <code>{'{ "event_name": "automation_succeeded", "campaign": "lead-follow-up", "project_slug": "manna-residence" }'}</code>. See <a href="/make-analytics.html" target="_blank" rel="noreferrer">the setup guide</a> for deployment and error-handler setup. This only stores aggregate event labels; do not send customer contact details.</p>
    </section>
    <section className="admin-panel"><h2>Project conversion funnel</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Project</th><th>Views</th><th>Clicks</th><th>Enquiries</th><th>Viewings</th><th>Sales</th></tr></thead><tbody>{funnel.map(row => <tr key={row.project}><th>{row.project}</th><td>{row.views} (100%)</td><td>{row.clicks} ({row.percent(row.clicks)})</td><td>{row.enquiries} ({row.percent(row.enquiries)})</td><td>{row.viewings} ({row.percent(row.viewings)})</td><td>{row.won} ({row.percent(row.won)})</td></tr>)}</tbody></table></div></section>
    <div className="admin-columns"><Breakdown title="Pages / projects" rows={aggregate('project_slug').map(row => ({ ...row, label: row.label || 'Other pages' }))}/><Breakdown title="Enquiries by source / campaign" rows={[...enquirySources].map(([label, count]) => ({ label, count, percent: Math.round(count / Math.max(leads.filter(withinLeadDate).length, 1) * 100) }))}/><Breakdown title="Traffic sources" rows={aggregate('source')}/><Breakdown title="Events" rows={aggregate('event_name')}/><Breakdown title="Event campaigns / scenarios" rows={aggregate('campaign').map(row => ({ ...row, label: row.label === 'Unknown' ? 'No campaign' : row.label }))}/><Breakdown title="Devices" rows={aggregate('device')}/></div>
  </section>;
}

export function LinkBuilder({ report, projects: projectRows = [] }) {
  const availableProjects = projectRows.length ? projectRows.map(row => ({ slug: row.slug, name: row.title })) : staticProjects;
  const [slug, setSlug] = useState(availableProjects[0]?.slug || '');
  const [channel, setChannel] = useState('whatsapp');
  const project = availableProjects.find(item => item.slug === slug);
  const link = project ? `${window.location.origin}/projects/${project.slug}?utm_source=${encodeURIComponent(channel)}&utm_campaign=${encodeURIComponent(project.slug)}` : '';
  const message = project ? `Hi, explore ${project.name} with Homes with Lew¥: ${link} — ask Lewy to confirm current details.` : '';
  async function copy(text) { await navigator.clipboard.writeText(text); report('Tracked link copied.'); }
  return <section className="admin-panel"><h2>Tracked link builder</h2><p>Create a channel link to see which campaigns lead to real enquiries.</p><div className="admin-form-row"><label>Project<select value={slug} onChange={event => setSlug(event.target.value)}>{availableProjects.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label>Channel<select value={channel} onChange={event => setChannel(event.target.value)}>{['whatsapp', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube', 'email'].map(item => <option key={item}>{item}</option>)}</select></label></div><label>Tracked link<input readOnly value={link}/></label><button className="admin-secondary" onClick={() => copy(link)}>Copy link</button><label>Share text<textarea readOnly rows="3" value={message}/></label><button className="admin-secondary" onClick={() => copy(message)}>Copy share text</button></section>;
}

export function SettingsPanel({ settings, saveSettings, report, anonymiseLead }) {
  const setting = key => settings.find(row => row.key === key)?.value || '';
  const [email, setEmail] = useState(() => setting('notification_email'));
  const [whatsapp, setWhatsapp] = useState(() => setting('notification_whatsapp'));
  const [consentText, setConsentText] = useState(() => setting('consent_text') || 'I agree to be contacted by phone or WhatsApp about this property.');
  useEffect(() => { setEmail(setting('notification_email')); setWhatsapp(setting('notification_whatsapp')); setConsentText(setting('consent_text') || 'I agree to be contacted by phone or WhatsApp about this property.'); }, [settings]);
  async function save(event) {
    event.preventDefault();
    const rows = [
      { key: 'notification_email', value: email.trim() },
      { key: 'notification_whatsapp', value: whatsapp.trim() },
      { key: 'consent_text', value: consentText.trim() },
    ];
    await saveSettings(rows);
  }
  return <div className="admin-columns"><form className="admin-panel admin-form" onSubmit={save}><h2>Settings</h2><p>Email alert recipients are also configured in the Supabase notification function. Keep that list in sync if you change it here.</p><label>Notification email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Owner notification address"/></label><label>Notification WhatsApp number<input type="tel" value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="+254…"/></label><label>Enquiry consent text<textarea rows="3" value={consentText} onChange={event => setConsentText(event.target.value)}/></label><button className="admin-primary">Save settings</button><div className="admin-panel"><h3>Personal data requests</h3><p>Use the Leads tab to anonymise or remove a lead when a deletion request is valid.</p><button type="button" className="admin-secondary" onClick={() => report('Data minimisation: export only when needed, restrict access, and remove/anonymise records after the purpose ends.')}>Data handling guidance</button></div></form><div className="admin-panel"><h2>Notification setup</h2><p>New enquiries are stored first. Email alerts are sent by the Supabase Edge Function after the database insert.</p><p>Required Supabase function secrets: <code>RESEND_API_KEY</code>, <code>RESEND_FROM</code>, and <code>ENQUIRY_WEBHOOK_SECRET</code>. A database webhook must call the function on enquiry insert.</p><p>WhatsApp/SMS notifications are not configured; no provider credentials are present in this app.</p></div></div>;
}

export function ProjectCompleteness({ projects: rows }) {
  const source = rows?.length ? rows.map(row => ({
    slug: row.slug, name: row.title,
    location: { area: row.area || row.location, landmarkRoad: row.landmark_road || row.location },
    priceFrom: row.price_from,
    unitTypes: row.unit_types || [row.maisonette_price, row.bungalow_price, row.plot_price].filter(Boolean).map(price => ({ price: Number(price) })),
    plotSize: row.land_size, titleStatus: row.title_status, paymentPlan: row.payment_plan,
    security: row.security, water: row.water, electricity: row.electricity,
    gallery: [row.hero_image, ...(row.gallery || []), row.floor_plan].filter(Boolean),
  })) : staticProjects;
  return <section className="admin-panel"><h2>Public project detail checklists</h2>{source.map(project => {
    const score = projectCompleteness(project);
    const images = [project.heroImage, ...(project.gallery || []), project.floorPlan].filter(Boolean);
    const mismatches = images.filter(image => !isProjectImagePath(project, image.src));
    const missingAlt = images.filter(image => !image.alt);
    return <article className="admin-record" key={project.slug}><div><strong>{project.name} · {score.complete}/{score.total} details</strong><span>Missing: {score.missing.length ? score.missing.join(', ') : 'none'}</span>{mismatches.length > 0 && <span className="admin-alert">Image path needs review: {mismatches.map(image => image.src).join(', ')}</span>}{missingAlt.length > 0 && <span className="admin-alert">Add alt text to {missingAlt.length} image(s).</span>}</div></article>;
  })}</section>;
}

function Breakdown({ title, rows }) { return <div className="admin-panel"><h2>{title}</h2>{rows.map(row => <p key={row.label}>{row.label} — {row.count} <small>({row.percent}%)</small></p>)}{!rows.length && <Empty>No events in this range.</Empty>}</div>; }
function Stat({ label, value }) { return <article className="admin-stat"><span>{label}</span><strong>{value}</strong></article>; }
function Empty({ children }) { return <p className="admin-empty">{children}</p>; }
