import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import './admin.css';
import './admin-google.css';

const emptyProperty = { title: '', slug: '', location: '', price: '', currency: '', beds: '', baths: '', summary: '', image_url: '', image_alt: '', verified: false, published: false };
const emptyProject = { title: '', slug: '', location: '', description: '', home_type: '', land_size: '', features: '', cover_image: '', published: false };
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
      if (!email || !adminEmails.has(email)) {
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
  return <main className="admin-gate"><a className="admin-brand" href="/"><span className="admin-brand-mark">LN</span><span>Homes with <strong>Lew¥</strong></span></a>{children}</main>;
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
  const [data, setData] = useState({ properties: [], projects: [], enquiries: [], social_links: [] });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [socialForm, setSocialForm] = useState(emptySocial);
  const [editing, setEditing] = useState({ property: null, project: null, social: null });

  async function loadData() {
    setLoading(true);
    const names = ['properties', 'projects', 'enquiries', 'social_links'];
    const results = await Promise.all(names.map(name => supabase.from(name).select('*').order('created_at', { ascending: false })));
    const failed = results.find(result => result.error);
    if (failed) setNotice(`Could not load dashboard data: ${failed.error.message}`);
    else {
      setData(Object.fromEntries(names.map((name, index) => [name, results[index].data || []])));
      setNotice('');
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
  async function updateEnquiry(id, status) {
    const { error } = await supabase.from('enquiries').update({ status }).eq('id', id);
    setNotice(error ? `Could not update enquiry: ${error.message}` : 'Enquiry updated.');
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
    const row = {
      ...projectForm,
      slug: projectForm.slug.trim() || slugify(projectForm.title),
      features: projectForm.features.split('\n').map(item => item.trim()).filter(Boolean),
      ...(editing.project ? { id: editing.project } : {}),
    };
    await save('projects', row, () => { setProjectForm(emptyProject); setEditing(current => ({ ...current, project: null })); });
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
    setProjectForm({ ...emptyProject, ...row, features: (row.features || []).join('\n') });
    setEditing(current => ({ ...current, project: row.id })); setTab('Projects');
  }
  function editSocial(row) {
    setSocialForm({ ...emptySocial, ...row });
    setEditing(current => ({ ...current, social: row.id })); setTab('Social links');
  }

  const tabs = ['Overview', 'Properties', 'Projects', 'Enquiries', 'Social links'];
  return <div className="admin-shell"><aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="admin-brand-mark">LN</span><span>Homes with <strong>Lew¥</strong><small>OWNER DASHBOARD</small></span></a><p className="admin-nav-label">WORKSPACE</p><nav>{tabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav><a className="admin-back" href="/">← View public website</a></aside><main className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">OWNER WORKSPACE</span><h1>{tab}</h1></div><div className="admin-user"><span>{session.user.email}</span><button onClick={signOut}>Sign out</button></div></header>{notice && <p className="admin-notice" role="status">{notice}</p>}{loading ? <p className="admin-loading">Loading your dashboard…</p> : <>
    {tab === 'Overview' && <Overview data={data} setTab={setTab}/>}
    {tab === 'Properties' && <section className="admin-columns"><form className="admin-panel admin-form" onSubmit={submitProperty}><h2>{editing.property ? 'Edit property' : 'Add a property'}</h2><p>Only mark a listing verified after confirming its details with Willstone Homes.</p><label>Property title<input required value={propertyForm.title} onChange={e => setPropertyForm({ ...propertyForm, title: e.target.value })}/></label><label>Location<input required value={propertyForm.location} onChange={e => setPropertyForm({ ...propertyForm, location: e.target.value })}/></label><div className="admin-form-row"><label>Price<input type="number" min="0" step="0.01" value={propertyForm.price} onChange={e => setPropertyForm({ ...propertyForm, price: e.target.value })}/></label><label>Currency<input placeholder="KES" value={propertyForm.currency} onChange={e => setPropertyForm({ ...propertyForm, currency: e.target.value })}/></label></div><div className="admin-form-row"><label>Bedrooms<input type="number" min="0" value={propertyForm.beds} onChange={e => setPropertyForm({ ...propertyForm, beds: e.target.value })}/></label><label>Bathrooms<input type="number" min="0" value={propertyForm.baths} onChange={e => setPropertyForm({ ...propertyForm, baths: e.target.value })}/></label></div><label>Image URL or site path<input value={propertyForm.image_url} onChange={e => setPropertyForm({ ...propertyForm, image_url: e.target.value })} placeholder="/images/..."/></label><label>Image description<input value={propertyForm.image_alt} onChange={e => setPropertyForm({ ...propertyForm, image_alt: e.target.value })}/></label><label>Summary<textarea rows="3" value={propertyForm.summary} onChange={e => setPropertyForm({ ...propertyForm, summary: e.target.value })}/></label><Check label="Verified with Willstone Homes" checked={propertyForm.verified} onChange={value => setPropertyForm({ ...propertyForm, verified: value, published: value && propertyForm.published })}/><Check label="Publish on the public website" checked={propertyForm.published} onChange={value => setPropertyForm({ ...propertyForm, published: value })} disabled={!propertyForm.verified}/><div className="admin-actions"><button className="admin-primary">{editing.property ? 'Save changes' : 'Add property'}</button>{editing.property && <button type="button" className="admin-secondary" onClick={() => { setPropertyForm(emptyProperty); setEditing(current => ({ ...current, property: null })); }}>Cancel</button>}</div></form><section className="admin-panel"><h2>Properties ({data.properties.length})</h2><div className="admin-record-list">{data.properties.map(row => <article className="admin-record" key={row.id}><div><strong>{row.title}</strong><span>{row.location} · {row.verified ? 'Verified' : 'Unverified'} · {row.published ? 'Published' : 'Draft'}</span></div><div className="admin-record-actions"><button onClick={() => editProperty(row)}>Edit</button><button className="danger" onClick={() => remove('properties', row.id, row.title)}>Delete</button></div></article>)}{!data.properties.length && <Empty>There are no property records yet.</Empty>}</div></section></section>}
    {tab === 'Projects' && <section className="admin-columns"><form className="admin-panel admin-form" onSubmit={submitProject}><h2>{editing.project ? 'Edit project' : 'Add a project'}</h2><p>Project pages describe developments; they don’t mark individual homes for sale.</p><label>Project title<input required value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}/></label><label>Location<input required value={projectForm.location} onChange={e => setProjectForm({ ...projectForm, location: e.target.value })}/></label><label>Description<textarea required rows="4" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}/></label><label>Home type<input value={projectForm.home_type} onChange={e => setProjectForm({ ...projectForm, home_type: e.target.value })}/></label><label>Land size, including unit if known<input value={projectForm.land_size} onChange={e => setProjectForm({ ...projectForm, land_size: e.target.value })}/></label><label>Features, one per line<textarea rows="4" value={projectForm.features} onChange={e => setProjectForm({ ...projectForm, features: e.target.value })}/></label><label>Cover image path<input value={projectForm.cover_image} onChange={e => setProjectForm({ ...projectForm, cover_image: e.target.value })}/></label><Check label="Publish project information" checked={projectForm.published} onChange={value => setProjectForm({ ...projectForm, published: value })}/><div className="admin-actions"><button className="admin-primary">{editing.project ? 'Save changes' : 'Add project'}</button>{editing.project && <button type="button" className="admin-secondary" onClick={() => { setProjectForm(emptyProject); setEditing(current => ({ ...current, project: null })); }}>Cancel</button>}</div></form><section className="admin-panel"><h2>Projects ({data.projects.length})</h2><div className="admin-record-list">{data.projects.map(row => <article className="admin-record" key={row.id}><div><strong>{row.title}</strong><span>{row.location} · {row.published ? 'Published' : 'Draft'}</span></div><div className="admin-record-actions"><button onClick={() => editProject(row)}>Edit</button><button className="danger" onClick={() => remove('projects', row.id, row.title)}>Delete</button></div></article>)}{!data.projects.length && <Empty>No projects in the database yet.</Empty>}</div></section></section>}
    {tab === 'Enquiries' && <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Enquiry inbox</h2><p>Submitted through the website form</p></div><button className="admin-secondary" onClick={loadData}>Refresh</button></div><div className="admin-record-list">{data.enquiries.map(row => <article className="admin-enquiry" key={row.id}><div className="admin-enquiry-top"><strong>{row.name}</strong><span>{new Date(row.created_at).toLocaleString()}</span></div><p><a href={`mailto:${encodeURIComponent(row.email)}`}>{row.email}</a>{row.phone && <> · <a href={`tel:${encodeURIComponent(row.phone)}`}>{row.phone}</a></>}{row.property_title && <> · About: {row.property_title}</>}</p><blockquote>{row.message}</blockquote><label className="admin-status">Status<select value={row.status} onChange={e => updateEnquiry(row.id, e.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="spam">Spam</option></select></label></article>)}{!data.enquiries.length && <Empty>No enquiries received yet.</Empty>}</div></section>}
    {tab === 'Social links' && <section className="admin-columns"><form className="admin-panel admin-form" onSubmit={submitSocial}><h2>{editing.social ? 'Edit social link' : 'Add a social link'}</h2><label>Platform<input required value={socialForm.platform} onChange={e => setSocialForm({ ...socialForm, platform: e.target.value })} placeholder="instagram"/></label><label>Display name<input required value={socialForm.label} onChange={e => setSocialForm({ ...socialForm, label: e.target.value })}/></label><label>Profile URL<input type="url" required value={socialForm.url} onChange={e => setSocialForm({ ...socialForm, url: e.target.value })} placeholder="https://…"/></label><label>Account owner<select value={socialForm.owner_scope} onChange={e => setSocialForm({ ...socialForm, owner_scope: e.target.value })}><option value="personal">Homes with Lew¥</option><option value="willstone">Willstone Homes</option></select></label><label>Order<input type="number" value={socialForm.sort_order} onChange={e => setSocialForm({ ...socialForm, sort_order: Number(e.target.value) })}/></label><Check label="Show on the public website" checked={socialForm.is_active} onChange={value => setSocialForm({ ...socialForm, is_active: value })}/><div className="admin-actions"><button className="admin-primary">{editing.social ? 'Save changes' : 'Add social link'}</button>{editing.social && <button type="button" className="admin-secondary" onClick={() => { setSocialForm(emptySocial); setEditing(current => ({ ...current, social: null })); }}>Cancel</button>}</div></form><section className="admin-panel"><h2>Social links ({data.social_links.length})</h2><div className="admin-record-list">{data.social_links.map(row => <article className="admin-record" key={row.id}><div><strong>{row.label}</strong><span>{row.owner_scope === 'personal' ? 'Homes with Lew¥' : 'Willstone Homes'} · {row.is_active ? 'Visible' : 'Hidden'}</span></div><div className="admin-record-actions"><button onClick={() => editSocial(row)}>Edit</button><button className="danger" onClick={() => remove('social_links', row.id, row.label)}>Delete</button></div></article>)}{!data.social_links.length && <Empty>No social links have been added.</Empty>}</div></section></section>}
  </>}</main></div>;
}

function Overview({ data, setTab }) {
  return <><section className="admin-stats"><Stat label="Published homes" value={data.properties.filter(row => row.published && row.verified).length}/><Stat label="Projects" value={data.projects.length}/><Stat label="New enquiries" value={data.enquiries.filter(row => row.status === 'new').length}/><Stat label="Active social links" value={data.social_links.filter(row => row.is_active).length}/></section><section className="admin-panel admin-overview"><div><h2>Whitepark 2 Estate</h2><p>Project information is stored separately from current listings. Update its details in Projects.</p><button className="admin-secondary" onClick={() => setTab('Projects')}>Manage projects</button></div><div><h2>Enquiry form status</h2><p>Once Supabase is configured, visitor enquiries will appear in your private inbox here.</p><button className="admin-secondary" onClick={() => setTab('Enquiries')}>Open enquiries</button></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Quick actions</h2><p>Keep property facts and social links up to date.</p></div></div><div className="admin-quick-actions"><button onClick={() => setTab('Properties')}>Manage properties</button><button onClick={() => setTab('Projects')}>Manage projects</button><button onClick={() => setTab('Social links')}>Manage social links</button></div></section></>;
}

function Stat({ label, value }) { return <article className="admin-stat"><span>{label}</span><strong>{value}</strong></article>; }
function Check({ label, checked, onChange, disabled = false }) { return <label className={`admin-check ${disabled ? 'is-disabled' : ''}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)}/>{label}</label>; }
function Empty({ children }) { return <p className="admin-empty">{children}</p>; }
