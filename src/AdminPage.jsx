import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import './admin.css';
import './admin-google.css';
import './admin-brand.css';
import { AnalyticsPanel, AdminOverview, LeadsPanel, LinkBuilder, ProjectCompleteness, SettingsPanel } from './AdminTools.jsx';
import { isAuthorizedAdmin, leadStatusIsValid } from './domain/dashboard-rules.js';
import { projects as publicProjects } from './data/projects.js';
import { isProjectImagePath, projectCompleteness } from './domain/rules.js';

const emptyProperty = { title: '', slug: '', location: '', price: '', currency: '', beds: '', baths: '', summary: '', image_url: '', image_alt: '', verified: false, published: false };
const emptyProject = { title: '', slug: '', location: '', area: '', landmark_road: '', description: '', seo_description: '', status: '', home_type: '', maisonette_price: '', bungalow_price: '', plot_price: '', price_from: '', price_notes: '', land_size: '', title_status: '', payment_plan: '', unit_types: '', features: '', security: '', water: '', electricity: '', gated: '', drive_times: '', gallery: '[]', hero_image: '', floor_plan: '', video_url: '', brochure_url: '', map_url: '', coordinates: '', last_verified: '', archived: false, cover_image: '', details_confirmed_on: '', published: false };
const emptySocial = { platform: '', label: '', url: '', owner_scope: 'personal', is_active: true, sort_order: 0 };
const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const adminEmails = new Set(['lewisnjuguna926@gmail.com', 'lewisnjuguna777@gmail.com']);

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAuthorized(false);
      if (event === 'SIGNED_IN' && isAuthorizedAdmin(nextSession)) {
        supabase.from('admin_sign_in_log').insert({ user_id: nextSession.user.id }).then(({ error }) => {
          if (error) console.error('Could not record admin sign-in.', error.message);
        });
      }
      if (event !== 'SIGNED_OUT') setMessage('');
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) { setAuthorized(false); return undefined; }
    let active = true;
    const email = session.user.email?.trim().toLowerCase();
    Promise.resolve().then(async () => {
      if (!active) return;
      if (!email || !adminEmails.has(email) || !isAuthorizedAdmin(session)) {
        setMessage('This Google account is not on the dashboard access list.');
        setAuthorized(false);
        await supabase.auth.signOut();
        return;
      }
      setAuthorized(true);
    });
    return () => { active = false; };
  }, [session?.user?.id, session?.user?.email]);

  useEffect(() => { document.title = `Owner dashboard | Homes with Lew¥`; }, []);

  if (!isSupabaseConfigured) return <AdminFrame><section className="admin-card admin-message"><span className="admin-kicker">OWNER AREA</span><h1>Dashboard setup needed</h1><p>Add your Supabase project URL and public anon key to the local <code>.env</code> file, then run the database setup steps in the README.</p><p>The service role key must never be added to this website.</p><a className="admin-back" href="/">← Back to Homes with Lew¥</a></section></AdminFrame>;
  if (!authChecked) return <AdminFrame><p className="admin-loading">Checking your session…</p></AdminFrame>;
  if (!session) return <LoginForm message={message} onMessage={setMessage}/>;
  if (!authorized) return <AdminFrame><p className="admin-loading">Checking dashboard access…</p>{message && <p className="admin-alert" role="alert">{message}</p>}</AdminFrame>;
  return <AdminWorkspace session={session}/>;
}

function AdminFrame({ children }) {
  return <main className="admin-gate"><a className="admin-brand" href="/"><span className="admin-brand-mark">LN</span><span>Homes with <strong>Lew¥</strong><small>OWNER DASHBOARD</small></span></a>{children}</main>;
}

function LoginForm({ message, onMessage }) {
  const [busy, setBusy] = useState(false);
  async function signInWithGoogle() {
    setBusy(true); onMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      onMessage(`Google sign-in could not start: ${error.message}`);
      setBusy(false);
    }
  }
  return <AdminFrame><section className="admin-card admin-login"><span className="admin-kicker">PRIVATE OWNER ACCESS</span><h1>Sign in to your dashboard.</h1><p>Continue with the Google account authorized for dashboard access.</p>{message && <p className="admin-alert" role="alert">{message}</p>}<button className="admin-primary admin-google-button" onClick={signInWithGoogle} disabled={busy}>{busy ? 'Connecting to Google…' : <><GoogleMark/>Continue with Google</>}</button><a className="admin-back" href="/">← Back to Homes with Lew¥</a></section></AdminFrame>;
}

function GoogleMark() {
  return <svg className="admin-google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.4Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4 1.9-6.8 1.9-5.3 0-9.8-3.6-11.4-8.4H5.7v5.4A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.4a12 12 0 0 1 0-6.8v-5.4H5.7a20 20 0 0 0 0 17.6l6.9-5.4Z"/><path fill="#EA4335" d="M24 12.2c3 0 5.6 1 7.7 3.1l5.8-5.8C34 6.1 29.5 4 24 4A20 20 0 0 0 5.7 15.2l6.9 5.4c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg>;
}

function AdminWorkspace({ session }) {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ properties: [], projects: [], enquiries: [], social_links: [], testimonials: [], site_events: [], site_settings: [] });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [projectImage, setProjectImage] = useState(null);
  const [projectImageAlt, setProjectImageAlt] = useState('');
  const [projectImageKind, setProjectImageKind] = useState('site-photo');
  const [socialForm, setSocialForm] = useState(emptySocial);
  const [editing, setEditing] = useState({ property: null, project: null, social: null });

  async function loadData() {
    setLoading(true);
    const names = ['properties', 'projects', 'enquiries', 'social_links'];
    const [results, testimonials, events, settings] = await Promise.all([
      Promise.all(names.map(name => supabase.from(name).select('*').order('created_at', { ascending: false }))),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('site_events').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('*').order('key'),
    ]);
    const failed = results.find(result => result.error);
    if (failed) setNotice(`Could not load dashboard data: ${failed.error.message}`);
    else {
      setData({ ...Object.fromEntries(names.map((name, index) => [name, results[index].data || []])), testimonials: testimonials.error ? [] : testimonials.data || [], site_events: events.error ? [] : events.data || [], site_settings: settings.error ? [] : settings.data || [] });
      setNotice(testimonials.error ? 'Feedback moderation is not configured yet. Run supabase/add-testimonials.sql to enable it.' : events.error || settings.error ? 'Some dashboard tools need supabase/add-lead-analytics-security.sql. Run that migration to enable them.' : '');
    }
    setLoading(false);
  }
  useEffect(() => { loadData(); }, []);

  async function save(table, row, formReset) {
    setNotice('Saving…');
    const { error } = await supabase.from(table).upsert(row).select().single();
    if (error) { setNotice(`Could not save: ${error.message}`); return false; }
    formReset(); setNotice('Saved.'); await loadData(); return true;
  }
  async function remove(table, id, description) {
    if (!window.confirm(`Delete ${description}? This cannot be undone.`)) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    setNotice(error ? `Could not delete: ${error.message}` : 'Deleted.');
    if (!error) await loadData();
  }
  async function updateLead(id, changes) {
    if (changes.status && !leadStatusIsValid(changes.status)) { setNotice('Choose one of the listed lead statuses.'); return; }
    const previous = data.enquiries.find(row => row.id === id);
    const { error } = await supabase.from('enquiries').update(changes).eq('id', id);
    if (!error && ['Viewing booked', 'Won'].includes(changes.status)) {
      const projectSlug = publicProjects.find(project => project.name === previous?.property_title)?.slug || null;
      const eventName = changes.status === 'Won' ? 'sale_recorded' : 'viewing_booked';
      await supabase.from('site_events').insert({ event_name: eventName, page_path: projectSlug ? `/projects/${projectSlug}` : '/enquire', project_slug: projectSlug, source: previous?.source || 'direct', device: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop' });
    }
    setNotice(error ? `Could not update enquiry: ${error.message}` : 'Enquiry updated.');
    if (!error) await loadData();
  }
  async function removeLead(row) {
    const choice = window.prompt('Type DELETE to remove this lead, or ANONYMIZE to remove contact details and message.');
    if (choice?.toUpperCase() === 'DELETE') return remove('enquiries', row.id, `lead from ${row.name}`);
    if (choice?.toUpperCase() === 'ANONYMIZE') {
      const { error } = await supabase.from('enquiries').update({ name: 'Anonymized lead', email: null, phone: null, property_title: null, message: '[Removed on privacy request]', contact_consent: false, private_notes: null, source: 'anonymized', status: 'Lost' }).eq('id', row.id);
      setNotice(error ? `Could not anonymize lead: ${error.message}` : 'Lead anonymized.');
      if (!error) await loadData();
    }
  }
  async function saveSettings(rows) {
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setNotice(error ? `Could not save settings: ${error.message}` : 'Settings saved. Keep the Supabase email notification function configuration in sync.');
    if (!error) await loadData();
  }
  async function updateTestimonial(id, status) {
    const { error } = await supabase.from('testimonials').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setNotice(error ? `Could not update feedback: ${error.message}` : `Feedback ${status === 'approved' ? 'approved and published' : 'rejected'}.`);
    if (!error) await loadData();
  }
  async function signOut() { await supabase.auth.signOut(); }

  async function submitProperty(event) {
    event.preventDefault();
    const row = {
      ...propertyForm,
      slug: propertyForm.slug.trim() || slugify(propertyForm.title),
      price: propertyForm.price === '' ? null : Number(propertyForm.price),
      currency: propertyForm.price === '' ? null : propertyForm.currency.trim() || null,
      beds: propertyForm.beds === '' ? null : Number(propertyForm.beds),
      baths: propertyForm.baths === '' ? null : Number(propertyForm.baths),
      image_url: propertyForm.image_url.trim() || null,
      image_alt: propertyForm.image_alt.trim() || null,
      summary: propertyForm.summary.trim() || null,
      published: propertyForm.verified && propertyForm.published,
      ...(editing.property ? { id: editing.property } : {}),
    };
    await save('properties', row, () => { setPropertyForm(emptyProperty); setEditing(current => ({ ...current, property: null })); });
  }
  async function submitProject(event) {
    event.preventDefault();
    try {
      const parse = (key, fallback = null) => {
        const value = projectForm[key]?.trim();
        return value ? JSON.parse(value) : fallback;
      };
      const slug = projectForm.slug.trim() || slugify(projectForm.title);
      let gallery = parse('gallery', []);
      let heroImage = parse('hero_image');
      if (!Array.isArray(gallery)) throw new Error('Gallery must be a JSON array of image objects with src and alt.');
      if (projectImage) {
        if (!projectImageAlt.trim()) throw new Error('Add descriptive alt text before uploading an image.');
        const safeName = projectImage.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
        const objectPath = `${slug}/${Date.now()}-${safeName}`;
        setNotice('Uploading project image…');
        const { error: uploadError } = await supabase.storage.from('project-media').upload(objectPath, projectImage, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('project-media').getPublicUrl(objectPath);
        const uploaded = { src: publicData.publicUrl, alt: projectImageAlt.trim(), kind: projectImageKind };
        gallery = [...gallery, uploaded];
        if (!heroImage) heroImage = uploaded;
      }
      const nullable = key => projectForm[key]?.trim() || null;
      const numeric = key => projectForm[key] === '' ? null : Number(projectForm[key]);
      const row = {
        title: projectForm.title.trim(), slug, location: projectForm.location.trim(), area: nullable('area'), landmark_road: nullable('landmark_road'),
        description: projectForm.description.trim(), seo_description: nullable('seo_description'), status: nullable('status'), home_type: nullable('home_type'),
        maisonette_price: numeric('maisonette_price'), bungalow_price: numeric('bungalow_price'), plot_price: numeric('plot_price'),
        price_from: numeric('price_from'), price_notes: nullable('price_notes'), land_size: nullable('land_size'), title_status: nullable('title_status'),
        payment_plan: parse('payment_plan'), unit_types: parse('unit_types', []), features: projectForm.features.split('\n').map(item => item.trim()).filter(Boolean),
        security: nullable('security'), water: nullable('water'), electricity: nullable('electricity'), gated: projectForm.gated === '' ? null : projectForm.gated === 'true',
        drive_times: parse('drive_times', []), gallery, hero_image: heroImage, floor_plan: parse('floor_plan'), video_url: nullable('video_url'),
        brochure_url: nullable('brochure_url'), map_url: nullable('map_url'), coordinates: parse('coordinates'),
        last_verified: nullable('last_verified'), archived: projectForm.archived, published: projectForm.published, updated_at: new Date().toISOString(),
        ...(editing.project ? { id: editing.project } : {}),
      };
      await save('projects', row, () => { setProjectForm(emptyProject); setProjectImage(null); setProjectImageAlt(''); setEditing(current => ({ ...current, project: null })); });
    } catch (error) { setNotice(`Project not saved: ${error.message}. Check that JSON fields are valid.`); }
  }
  async function submitSocial(event) {
    event.preventDefault();
    const row = { ...socialForm, platform: socialForm.platform.toLowerCase().trim(), ...(editing.social ? { id: editing.social } : {}) };
    await save('social_links', row, () => { setSocialForm(emptySocial); setEditing(current => ({ ...current, social: null })); });
  }

  function editProperty(row) {
    setPropertyForm({ ...emptyProperty, ...row, price: row.price ?? '', currency: row.currency ?? '', beds: row.beds ?? '', baths: row.baths ?? '', image_url: row.image_url ?? '', image_alt: row.image_alt ?? '', summary: row.summary ?? '' });
    setEditing(current => ({ ...current, property: row.id })); setTab('Properties');
  }
  function editProject(row) {
    const json = value => value == null ? '' : JSON.stringify(value, null, 2);
    setProjectForm({ ...emptyProject, ...row,
      maisonette_price: row.maisonette_price ?? '', bungalow_price: row.bungalow_price ?? '', plot_price: row.plot_price ?? '', price_from: row.price_from ?? '',
      features: (row.features || []).join('\n'), payment_plan: json(row.payment_plan), unit_types: json(row.unit_types), drive_times: json(row.drive_times),
      gallery: json(row.gallery) || '[]', hero_image: json(row.hero_image), floor_plan: json(row.floor_plan), coordinates: json(row.coordinates),
      last_verified: row.last_verified ?? '', details_confirmed_on: row.details_confirmed_on ?? '', gated: row.gated == null ? '' : String(row.gated),
    });
    setEditing(current => ({ ...current, project: row.id })); setTab('Projects');
  }

  async function confirmProjectDetails(row) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('projects').update({ last_verified: today, details_confirmed_on: today, updated_at: new Date().toISOString() }).eq('id', row.id);
    setNotice(error ? `Could not update verification date: ${error.message}` : `${row.title} marked as confirmed today.`);
    if (!error) await loadData();
  }
  function editSocial(row) {
    setSocialForm({ ...emptySocial, ...row });
    setEditing(current => ({ ...current, social: row.id })); setTab('Social links');
  }

  const tabs = ['Overview', 'Leads', 'Projects', 'Analytics', 'Link builder', 'Settings', 'Properties', 'Testimonials', 'Social links'];
  return <div className="admin-shell"><aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="admin-brand-mark">LN</span><span>Homes with <strong>Lew¥</strong><small>OWNER DASHBOARD</small></span></a><p className="admin-nav-label">WORKSPACE</p><nav>{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav><a className="admin-back" href="/">← View public website</a></aside><main className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">OWNER WORKSPACE</span><h1>{tab}</h1></div><div className="admin-user"><span>{session.user.email}</span><button onClick={signOut}>Sign out</button></div></header>{notice && <p className="admin-notice" role="status">{notice}</p>}{loading ? <p className="admin-loading">Loading your dashboard…</p> : <>
    {tab === 'Overview' && <AdminOverview enquiries={data.enquiries} setTab={setTab}/>}
    {tab === 'Properties' && <section className="admin-columns"><form className="admin-panel admin-form" onSubmit={submitProperty}><h2>{editing.property ? 'Edit property' : 'Add a property'}</h2><p>Only mark a listing verified after confirming its details with Willstone Homes.</p><label>Property title<input required value={propertyForm.title} onChange={e => setPropertyForm({ ...propertyForm, title: e.target.value })}/></label><label>Location<input required value={propertyForm.location} onChange={e => setPropertyForm({ ...propertyForm, location: e.target.value })}/></label><div className="admin-form-row"><label>Price<input type="number" min="0" step="0.01" value={propertyForm.price} onChange={e => setPropertyForm({ ...propertyForm, price: e.target.value })}/></label><label>Currency<input placeholder="KES" value={propertyForm.currency} onChange={e => setPropertyForm({ ...propertyForm, currency: e.target.value })}/></label></div><div className="admin-form-row"><label>Bedrooms<input type="number" min="0" value={propertyForm.beds} onChange={e => setPropertyForm({ ...propertyForm, beds: e.target.value })}/></label><label>Bathrooms<input type="number" min="0" value={propertyForm.baths} onChange={e => setPropertyForm({ ...propertyForm, baths: e.target.value })}/></label></div><label>Image URL or site path<input value={propertyForm.image_url} onChange={e => setPropertyForm({ ...propertyForm, image_url: e.target.value })} placeholder="/images/..."/></label><label>Image description<input value={propertyForm.image_alt} onChange={e => setPropertyForm({ ...propertyForm, image_alt: e.target.value })}/></label><label>Summary<textarea rows="3" value={propertyForm.summary} onChange={e => setPropertyForm({ ...propertyForm, summary: e.target.value })}/></label><Check label="Verified with Willstone Homes" checked={propertyForm.verified} onChange={value => setPropertyForm({ ...propertyForm, verified: value, published: value && propertyForm.published })}/><Check label="Publish on the public website" checked={propertyForm.published} onChange={value => setPropertyForm({ ...propertyForm, published: value })} disabled={!propertyForm.verified}/><div className="admin-actions"><button className="admin-primary">{editing.property ? 'Save changes' : 'Add property'}</button>{editing.property && <button type="button" className="admin-secondary" onClick={() => { setPropertyForm(emptyProperty); setEditing(current => ({ ...current, property: null })); }}>Cancel</button>}</div></form><section className="admin-panel"><h2>Properties ({data.properties.length})</h2><div className="admin-record-list">{data.properties.map(row => <article className="admin-record" key={row.id}><div><strong>{row.title}</strong><span>{row.location} · {row.verified ? 'Verified' : 'Unverified'} · {row.published ? 'Published' : 'Draft'}</span></div><div className="admin-record-actions"><button onClick={() => editProperty(row)}>Edit</button><button className="danger" onClick={() => remove('properties', row.id, row.title)}>Delete</button></div></article>)}{!data.properties.length && <Empty>There are no property records yet.</Empty>}</div></section></section>}
    {tab === 'Projects' && <AdminProjectsPanel rows={data.projects} form={projectForm} setForm={setProjectForm} image={projectImage} setImage={setProjectImage} imageAlt={projectImageAlt} setImageAlt={setProjectImageAlt} imageKind={projectImageKind} setImageKind={setProjectImageKind} editing={editing.project} onSubmit={submitProject} onEdit={editProject} onRemove={remove} onConfirm={confirmProjectDetails} onCancel={() => { setProjectForm(emptyProject); setProjectImage(null); setProjectImageAlt(''); setEditing(current => ({ ...current, project: null })); }} />}
    {(tab === 'Leads' || tab === 'Enquiries') && <LeadsPanel rows={data.enquiries} updateLead={updateLead} removeLead={removeLead}/>}
    {tab === 'Analytics' && <AnalyticsPanel events={data.site_events} leads={data.enquiries}/>}
    {tab === 'Link builder' && <LinkBuilder report={setNotice}/>}
    {tab === 'Settings' && <SettingsPanel settings={data.site_settings} saveSettings={saveSettings} report={setNotice}/>}
    {tab === 'Testimonials' && <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Feedback moderation</h2><p>Only approved feedback with public-display consent appears on the website. Google sign-in does not verify buyer status.</p></div><button className="admin-secondary" onClick={loadData}>Refresh</button></div><div className="admin-record-list">{data.testimonials.map(row => <article className="admin-enquiry" key={row.id}><div className="admin-enquiry-top"><strong>{row.display_name} · {row.rating}/5 stars</strong><span>{new Date(row.created_at).toLocaleString()}</span></div><p>Publication: {row.status} · Public display consent: {row.consent_public ? 'Recorded' : 'Not recorded'}</p><blockquote>{row.comment}</blockquote><div className="admin-record-actions">{row.status !== 'approved' && <button className="admin-secondary" onClick={() => updateTestimonial(row.id, 'approved')}>Approve and publish</button>}{row.status !== 'rejected' && <button className="admin-secondary" onClick={() => updateTestimonial(row.id, 'rejected')}>Reject</button>}<button className="admin-secondary danger" onClick={() => remove('testimonials', row.id, `feedback from ${row.display_name}`)}>Delete</button></div></article>)}{!data.testimonials.length && <Empty>No feedback submissions yet.</Empty>}</div></section>}
    {tab === 'Social links' && <section className="admin-columns"><form className="admin-panel admin-form" onSubmit={submitSocial}><h2>{editing.social ? 'Edit social link' : 'Add a social link'}</h2><label>Platform<input required value={socialForm.platform} onChange={e => setSocialForm({ ...socialForm, platform: e.target.value })} placeholder="instagram"/></label><label>Display name<input required value={socialForm.label} onChange={e => setSocialForm({ ...socialForm, label: e.target.value })}/></label><label>Profile URL<input type="url" required value={socialForm.url} onChange={e => setSocialForm({ ...socialForm, url: e.target.value })} placeholder="https://…"/></label><label>Account owner<select value={socialForm.owner_scope} onChange={e => setSocialForm({ ...socialForm, owner_scope: e.target.value })}><option value="personal">Homes with Lew¥</option><option value="willstone">Willstone Homes</option></select></label><label>Order<input type="number" value={socialForm.sort_order} onChange={e => setSocialForm({ ...socialForm, sort_order: Number(e.target.value) })}/></label><Check label="Show on the public website" checked={socialForm.is_active} onChange={value => setSocialForm({ ...socialForm, is_active: value })}/><div className="admin-actions"><button className="admin-primary">{editing.social ? 'Save changes' : 'Add social link'}</button>{editing.social && <button type="button" className="admin-secondary" onClick={() => { setSocialForm(emptySocial); setEditing(current => ({ ...current, social: null })); }}>Cancel</button>}</div></form><section className="admin-panel"><h2>Social links ({data.social_links.length})</h2><div className="admin-record-list">{data.social_links.map(row => <article className="admin-record" key={row.id}><div><strong>{row.label}</strong><span>{row.owner_scope === 'personal' ? 'Homes with Lew¥' : 'Willstone Homes'} · {row.is_active ? 'Visible' : 'Hidden'}</span></div><div className="admin-record-actions"><button onClick={() => editSocial(row)}>Edit</button><button className="danger" onClick={() => remove('social_links', row.id, row.label)}>Delete</button></div></article>)}{!data.social_links.length && <Empty>No social links have been added.</Empty>}</div></section></section>}
  </>}</main></div>;
}


function AdminProjectsPanel({ rows, form, setForm, image, setImage, imageAlt, setImageAlt, imageKind, setImageKind, editing, onSubmit, onEdit, onRemove, onConfirm, onCancel }) {
  const field = (key, label, props = {}) => <label key={key}>{label}{props.multiline ? <textarea required={props.required} rows={props.rows || 3} value={form[key] || ''} onChange={event => setForm({ ...form, [key]: event.target.value })} placeholder={props.placeholder || ''}/> : <input required={props.required} type={props.type || 'text'} value={form[key] ?? ''} min={props.min} step={props.step} onChange={event => setForm({ ...form, [key]: event.target.value })} placeholder={props.placeholder || ''}/>}</label>;
  const jsonField = (key, label, placeholder = '[]') => field(key, label, { multiline: true, rows: 5, placeholder });
  return <><section className="admin-columns"><form className="admin-panel admin-form" onSubmit={onSubmit}>
    <h2>{editing ? 'Edit project' : 'Add a project'}</h2><p>Only add facts confirmed by Willstone Homes. Leave unknown information blank. JSON fields must contain valid JSON.</p>
    {field('title', 'Project name', { required: true })}{field('slug', 'URL slug (auto-created if blank)')}{field('location', 'Location summary', { required: true })}{field('area', 'Area')}{field('landmark_road', 'Nearby road or landmark')}{field('description', 'Description', { multiline: true, rows: 4 })}{field('seo_description', 'Search description', { multiline: true, rows: 3 })}
    <label>Status<select value={form.status || ''} onChange={event => setForm({ ...form, status: event.target.value })}><option value="">Not set</option><option value="selling">Selling</option><option value="sold out">Sold out</option><option value="coming soon">Coming soon</option></select></label>
    {field('home_type', 'Unit or property types')}{field('price_from', 'Starting price (KES)', { type: 'number', min: 1, step: 1000 })}{field('price_notes', 'Price notes', { multiline: true })}{field('maisonette_price', 'Maisonette price (KES)', { type: 'number', min: 0, step: 1000 })}{field('bungalow_price', 'Bungalow price (KES)', { type: 'number', min: 0, step: 1000 })}{field('plot_price', 'Plot price (KES)', { type: 'number', min: 0, step: 1000 })}
    {field('land_size', 'Plot size')}{field('title_status', 'Title status')}{jsonField('unit_types', 'Unit types JSON', '[{"label":"3-bedroom bungalow","bedrooms":3,"dsq":true,"price":13850000}]')}{jsonField('payment_plan', 'Payment plan JSON', '{"deposit":"","balanceTerms":"","duration":""}')}
    {field('features', 'Features (one per line)', { multiline: true, rows: 4 })}<label>Gated community<select value={form.gated ?? ''} onChange={event => setForm({ ...form, gated: event.target.value })}><option value="">Not provided</option><option value="true">Yes</option><option value="false">No</option></select></label>{field('security', 'Security details')}{field('water', 'Water details')}{field('electricity', 'Electricity details')}{jsonField('drive_times', 'Drive times JSON', '[{"landmark":"","time":""}]')}
    {field('map_url', 'Map link')}{field('video_url', 'Video link')}{field('brochure_url', 'Brochure link')}{jsonField('coordinates', 'Coordinates JSON', '{"latitude":0,"longitude":0}')}{field('last_verified', 'Last verified date', { type: 'date' })}
    {jsonField('hero_image', 'Hero image JSON', '{"src":"/images/project-slug/house.jpg","alt":"Descriptive image text","kind":"render"}')}{jsonField('gallery', 'Gallery JSON', '[{"src":"/images/project-slug/house.jpg","alt":"Descriptive image text","kind":"render"}]')}{jsonField('floor_plan', 'Floor plan JSON', '{"src":"/images/project-slug/plan.jpg","alt":"Floor plan for project"}')}
    <label>Upload a project image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setImage(event.target.files?.[0] || null)}/></label><p className="admin-help">Uploads go to the public project-media bucket under this project slug.</p>
    <label>Uploaded image description (alt text)<input value={imageAlt} onChange={event => setImageAlt(event.target.value)} placeholder="Describe what the image shows"/></label><label>Uploaded image type<select value={imageKind} onChange={event => setImageKind(event.target.value)}><option value="site-photo">Site photo</option><option value="render">Architectural render</option></select></label>
    <Check label="Publish project details" checked={form.published} onChange={value => setForm({ ...form, published: value })}/><Check label="Archive this project" checked={Boolean(form.archived)} onChange={value => setForm({ ...form, archived: value })}/><div className="admin-actions"><button className="admin-primary">{editing ? 'Save project' : 'Add project'}</button>{editing && <button type="button" className="admin-secondary" onClick={onCancel}>Cancel</button>}</div>
  </form><section className="admin-panel"><h2>Projects ({rows.length})</h2><div className="admin-record-list">{rows.map(row => <article className="admin-record" key={row.id}><div><strong>{row.title}</strong><span>{row.location} · {row.published ? 'Published' : 'Draft'}{row.archived ? ' · Archived' : ''}</span></div><div className="admin-record-actions"><button onClick={() => onEdit(row)}>Edit</button><button onClick={() => onConfirm(row)}>I just confirmed these details</button><button className="danger" onClick={() => onRemove('projects', row.id, row.title)}>Delete</button></div></article>)}{!rows.length && <Empty>No projects in the database yet.</Empty>}</div></section></section><ProjectCompleteness projects={rows}/></>;
}

function Overview({ data, setTab }) {
  return <><section className="admin-stats"><Stat label="Published homes" value={data.properties.filter(row => row.published && row.verified).length}/><Stat label="Projects" value={data.projects.length}/><Stat label="New enquiries" value={data.enquiries.filter(row => row.status === 'new').length}/><Stat label="Pending feedback" value={data.testimonials.filter(row => row.status === 'pending').length}/><Stat label="Active social links" value={data.social_links.filter(row => row.is_active).length}/></section><section className="admin-panel admin-overview"><div><h2>Whitepark 2 Estate</h2><p>Project information is stored separately from current listings. Update its details in Projects.</p><button className="admin-secondary" onClick={() => setTab('Projects')}>Manage projects</button></div><div><h2>Enquiry form status</h2><p>Once Supabase is configured, visitor enquiries will appear in your private inbox here.</p><button className="admin-secondary" onClick={() => setTab('Enquiries')}>Open enquiries</button></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Quick actions</h2><p>Keep property facts, feedback and social links up to date.</p></div></div><div className="admin-quick-actions"><button onClick={() => setTab('Properties')}>Manage properties</button><button onClick={() => setTab('Projects')}>Manage projects</button><button onClick={() => setTab('Testimonials')}>Review feedback</button><button onClick={() => setTab('Social links')}>Manage social links</button></div></section></>;
}

function Stat({ label, value }) { return <article className="admin-stat"><span>{label}</span><strong>{value}</strong></article>; }
function Check({ label, checked, onChange, disabled = false }) { return <label className={`admin-check ${disabled ? 'is-disabled' : ''}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}/>{label}</label>; }
function Empty({ children }) { return <p className="admin-empty">{children}</p>; }
