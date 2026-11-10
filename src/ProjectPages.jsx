import { useEffect, useState } from 'react';
import { projectBySlug, projects } from './data/projects.js';
import { formatKES, hasRealValue, projectPresentation, projectStartingPrice, verificationFreshness } from './domain/rules.js';
import { supabase } from './lib/supabase.js';
import './project-pages.css';

const SITE = 'https://homes-with-lewy.vercel.app';
const phone = '254114998890';
const kes = value => formatKES(value);
const absolute = path => new URL(path, SITE).href;

function projectFromDatabase(row) {
  const unitTypes = Array.isArray(row.unit_types) ? row.unit_types : [
    ...(row.maisonette_price ? [{ label: 'Maisonette', price: Number(row.maisonette_price) }] : []),
    ...(row.bungalow_price ? [{ label: 'Bungalow', price: Number(row.bungalow_price) }] : []),
    ...(row.plot_price ? [{ label: 'Residential plot', price: Number(row.plot_price) }] : []),
  ];
  const heroImage = row.hero_image && typeof row.hero_image === 'object' && hasRealValue(row.hero_image.alt) ? row.hero_image : null;
  const gallery = (Array.isArray(row.gallery) ? row.gallery : []).filter(image => image?.src && hasRealValue(image.alt));
  const floorPlan = row.floor_plan && typeof row.floor_plan === 'object' && hasRealValue(row.floor_plan.alt) ? row.floor_plan : null;
  return {
    slug: row.slug,
    name: row.title,
    location: { area: row.area || row.location, landmarkRoad: row.landmark_road || row.location },
    status: row.status || undefined,
    unitTypes,
    priceFrom: Number(row.price_from) > 0 ? Number(row.price_from) : undefined,
    priceNotes: row.price_notes || undefined,
    plotSize: row.land_size || undefined,
    titleStatus: row.title_status || undefined,
    features: Array.isArray(row.features) ? row.features.filter(hasRealValue) : [],
    security: row.security || undefined,
    water: row.water || undefined,
    electricity: row.electricity || undefined,
    gated: row.gated == null ? undefined : row.gated,
    driveTimes: Array.isArray(row.drive_times) ? row.drive_times : [],
    gallery,
    heroImage,
    floorPlan,
    videoUrl: row.video_url || undefined,
    brochureUrl: row.brochure_url || undefined,
    mapUrl: row.map_url || undefined,
    coordinates: row.coordinates || undefined,
    paymentPlan: row.payment_plan || undefined,
    lastVerified: row.last_verified || row.details_confirmed_on || undefined,
    description: row.description,
    seoDescription: row.seo_description || `${row.title} · ${row.area || row.location}. Confirm current details with Lewis before making a decision.`,
  };
}

function usePublishedProjects() {
  const [items, setItems] = useState(projects);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('projects').select('*').eq('published', true).eq('archived', false).then(({ data, error }) => {
      if (!active || error || !data) return;
      const databaseProjects = data.map(projectFromDatabase);
      const bySlug = new Map(databaseProjects.map(project => [project.slug, project]));
      setItems([...projects.filter(project => !bySlug.has(project.slug)), ...databaseProjects]);
    });
    return () => { active = false; };
  }, []);
  return items;
}

function useProjectMeta(title, description, image, canonicalPath) {
  useEffect(() => {
    const pageTitle = `${title} | Homes with Lew¥`;
    const canonical = `${SITE}${canonicalPath || window.location.pathname}`;
    document.title = pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', pageTitle);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    const imageAlt = document.querySelector('meta[property="og:image:alt"]');
    if (image) {
      ogImage?.setAttribute('content', absolute(image.src));
      twitterImage?.setAttribute('content', absolute(image.src));
      imageAlt?.setAttribute('content', image.alt);
    } else {
      ogImage?.remove();
      twitterImage?.remove();
      imageAlt?.remove();
    }
  }, [title, description, image, canonicalPath]);
}

function whatsappHref(project, pageUrl) {
  const message = `Hi Lewy, I'm interested in ${project.name} (${pageUrl}). Please send details.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function ProjectCard({ project }) {
  const price = projectStartingPrice(project);
  const presentation = projectPresentation(project);
  const kinds = [...new Set((project.unitTypes || []).map(unit => /plot/i.test(unit.label) ? 'Plots' : 'Homes'))];
  return <article className="project-card">
    <a className={`project-card-image ${!project.heroImage ? 'project-card-no-image' : ''}`} href={`/projects/${project.slug}`} aria-label={`View ${project.name}`}>
      {project.heroImage && <img src={project.heroImage.src} alt={project.heroImage.alt} loading="lazy"/>}
      {project.heroImage?.kind === 'render' && <span className="project-image-label">Architectural render</span>}
    </a>
    <div className="project-card-copy">
      <div className="project-card-top"><span>{project.location.area}</span>{project.status && <span className={`project-status status-${project.status.replaceAll(' ', '-')}`}>{project.status}</span>}</div>
      {kinds.length > 0 && <div className="project-kind-tags" aria-label={`Offering: ${kinds.join(' and ')}`}>{kinds.map(kind => <span key={kind}>{kind}</span>)}</div>}
      <h2><a href={`/projects/${project.slug}`}>{project.name}</a></h2>
      <p>{project.location.landmarkRoad}</p>
      {presentation.price != null && <strong className="project-price">From {kes(price)}</strong>}
      <a className="text-link" href={`/projects/${project.slug}`}>View project details <span aria-hidden="true">↗</span></a>
    </div>
  </article>;
}

function matchesProjectFilters(project, filters = {}) {
  if (filters.area && project.location.area !== filters.area) return false;
  if (filters.type) {
    const unitLabels = (project.unitTypes || []).map(unit => unit.label.toLowerCase());
    const includesPlots = unitLabels.some(label => label.includes('plot'));
    const includesHomes = unitLabels.some(label => !label.includes('plot'));
    if (filters.type === 'plots' && !includesPlots) return false;
    if (filters.type === 'homes' && !includesHomes) return false;
  }
  if (filters.budget) {
    const knownPrices = (project.unitTypes || []).map(unit => Number(unit.price)).filter(price => Number.isFinite(price) && price > 0);
    const price = knownPrices.length ? Math.min(...knownPrices) : projectStartingPrice(project);
    if (!Number.isFinite(price) || price > Number(filters.budget)) return false;
  }
  return true;
}

export function ProjectSearchBar({ initialFilters = {} }) {
  const items = usePublishedProjects();
  const areas = [...new Set(items.map(project => project.location.area).filter(Boolean))].sort();
  return <form className="project-search-bar" action="/projects" method="get">
    <label>Area<select name="area" defaultValue={initialFilters.area || ''}><option value="">Any area</option>{areas.map(area => <option key={area} value={area}>{area}</option>)}</select></label>
    <label>Looking for<select name="type" defaultValue={initialFilters.type || ''}><option value="">Homes or plots</option><option value="homes">A home</option><option value="plots">A plot</option></select></label>
    <label>Maximum known price<select name="budget" defaultValue={initialFilters.budget || ''}><option value="">Any price</option>{[5000000, 10000000, 15000000, 20000000, 25000000].map(value => <option key={value} value={value}>Up to KES {(value / 1000000).toFixed(value % 1000000 ? 1 : 0)}M</option>)}</select></label>
    <button type="submit">Find options <span aria-hidden="true">↗</span></button>
    <input type="hidden" name="filtered" value="1"/>
  </form>;
}

export function ProjectCards({ filters = {} }) {
  const items = usePublishedProjects();
  const visible = items.filter(project => matchesProjectFilters(project, filters));
  if (!visible.length) return <div className="project-filter-empty"><h2>No matching projects in this search</h2><p>Try widening the area or price, or contact Lewis about projects without a shared price.</p><a href="/projects">Show all projects</a></div>;
  return <div className="project-cards-grid">{visible.map(project => <ProjectCard key={project.slug} project={project}/>)}</div>;
}

export function ProjectsPage() {
  useProjectMeta('Projects and developments', 'Explore shared Willstone Homes development information in Joska, Ruiru, Mangu and Juja. Confirm current prices and availability directly with Lewis.');
  const [filters, setFilters] = useState({});
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('filtered') === '1') setFilters({ area: params.get('area') || '', type: params.get('type') || '', budget: params.get('budget') || '' });
  }, []);
  return <main className="projects-page">
    <header className="projects-intro"><p className="eyebrow"><span className="eyebrow-line"/>Shared development information</p><h1>Find a place to<br/><em>put down roots.</em></h1><p>Explore project details Lewis has shared for Willstone Homes. Prices and availability can change; Lewis can confirm the latest when you enquire.</p></header>
    <section key={JSON.stringify(filters)} className="projects-search section-pad" aria-label="Search projects"><ProjectSearchBar initialFilters={filters}/></section>
    <div id="project-results"><ProjectCards filters={filters}/></div>
    <p className="projects-disclaimer">Project information is shared by Lewis Njuguna, who works in IT support and is also authorized by Willstone Homes to promote and sell its homes. Confirm all current details directly before making a decision.</p>
  </main>;
}

function Fact({ label, children }) {
  if (children == null || children === '' || children === false) return null;
  return <div className="project-fact"><dt>{label}</dt><dd>{children}</dd></div>;
}

function structuredData(project, canonical) {
  const offers = (project.unitTypes || []).filter(unit => Number.isFinite(unit.price)).map(unit => ({
    '@type': 'Offer', name: unit.label, price: unit.price, priceCurrency: 'KES',
    itemOffered: { '@type': 'Product', name: `${project.name} – ${unit.label}` },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.seoDescription,
    url: canonical,
    ...(project.heroImage ? { image: absolute(project.heroImage.src) } : {}),
    about: {
      '@type': 'Place', name: project.name,
      address: { '@type': 'PostalAddress', addressLocality: project.location.area, addressCountry: 'KE' },
      description: project.location.landmarkRoad,
    },
    ...(offers.length ? { offers } : {}),
  };
}

export function ProjectDetailPage({ slug, canonicalPath }) {
  const [openImage, setOpenImage] = useState(null);
  const [databaseProject, setDatabaseProject] = useState(null);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('projects').select('*').eq('slug', slug).eq('published', true).eq('archived', false).maybeSingle().then(({ data, error }) => {
      if (active && !error && data) setDatabaseProject(projectFromDatabase(data));
    });
    return () => { active = false; };
  }, [slug]);
  const project = databaseProject || projectBySlug[slug];
  useProjectMeta(project?.name || 'Project not found', project?.seoDescription || 'Browse Willstone Homes developments shared by Lewis Njuguna.', project?.heroImage, canonicalPath);
  if (!project) return <main className="project-not-found"><p className="eyebrow">Project not found</p><h1>Let’s find another <em>place.</em></h1><a className="button button-dark" href="/projects">Browse projects</a></main>;
  const canonical = `${SITE}${canonicalPath || `/projects/${project.slug}`}`;
  const pageUrl = typeof window === 'undefined' || !window.location?.href ? canonical : window.location.href.split('#')[0];
  const whatsapp = whatsappHref(project, pageUrl);
  const presentation = projectPresentation(project);
  const requestUrl = `/enquire?property=${encodeURIComponent(project.name)}&source=${presentation.mainAction === 'Join the waitlist' ? 'waitlist' : presentation.mainAction === 'Get notified' ? 'notify' : presentation.showViewing ? 'viewing' : 'availability'}`;
  const facts = [
    ...((project.unitTypes || []).map(unit => ({ label: unit.label, value: [unit.bedrooms ? `${unit.bedrooms} bedrooms` : null, unit.bathrooms ? `${unit.bathrooms} bathrooms` : null, unit.dsq != null ? `DSQ ${unit.dsq ? 'included' : 'not included'}` : null].filter(Boolean).join(' · ') || unit.label }))),
    { label: 'Plot size', value: project.plotSize },
    { label: 'Title status', value: project.titleStatus },
    { label: 'Gated community', value: project.gated == null ? undefined : project.gated ? 'Yes' : 'No' },
    { label: 'Security', value: project.security },
    { label: 'Water', value: project.water },
    { label: 'Electricity', value: project.electricity },
  ].filter(fact => hasRealValue(fact.value));
  const freshness = verificationFreshness(project.lastVerified);
  const verifiedDate = freshness.known ? new Date(`${project.lastVerified}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const schema = structuredData(project, canonical);

  return <main className="project-detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
    <nav className="project-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/projects">Projects</a><span aria-hidden="true">/</span><span aria-current="page">{project.name}</span></nav>
    <header className={`project-detail-hero ${!project.heroImage ? 'project-detail-hero-text' : ''}`}>
      <div className="project-detail-heading"><p className="eyebrow"><span className="eyebrow-line"/>{project.location.area}</p><h1>{project.name}</h1><p className="project-location">{project.location.landmarkRoad}</p>
        <div className="project-hero-badges">{hasRealValue(project.status) && <span className={`project-status status-${project.status.replaceAll(' ', '-')}`}>{project.status}</span>}{presentation.price != null && <span className="project-hero-price">From {kes(presentation.price)}</span>}</div>
        {!['sold out', 'coming soon'].includes(presentation.status) && hasRealValue(project.priceNotes) && <p className="project-price-notes">{project.priceNotes}</p>}
        <div className="project-actions"><a className="button button-dark" href={whatsapp}>WhatsApp me <span aria-hidden="true">↗</span></a><a className="text-link" href={requestUrl}>{presentation.mainAction} <span aria-hidden="true">↗</span></a></div>
      </div>
      {project.heroImage && <figure className="project-hero-figure"><img src={project.heroImage.src} alt={project.heroImage.alt} fetchPriority="high"/><figcaption>{project.heroImage.caption || project.heroImage.alt}</figcaption></figure>}
    </header>
    <section className="project-overview" aria-labelledby="project-overview-title"><div><p className="eyebrow">A closer look</p><h2 id="project-overview-title">About the <em>development.</em></h2><p>{project.description}</p></div>
      {facts.length > 0 && <dl className="project-facts">{facts.map(fact => <Fact key={fact.label} label={fact.label}>{fact.value}</Fact>)}</dl>}
      {project.features?.length > 0 && <div className="project-features"><h3>Features</h3><ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>}
    </section>
    {!['sold out', 'coming soon'].includes(presentation.status) && (project.unitTypes || []).some(unit => Number.isFinite(unit.price) && unit.price > 0) && <section className="project-pricing" aria-labelledby="project-pricing-title"><p className="eyebrow">Prices shared</p><h2 id="project-pricing-title">Options and <em>prices.</em></h2><div className="project-price-options">{project.unitTypes.filter(unit => Number.isFinite(unit.price) && unit.price > 0).map(unit => <article key={unit.label}><h3>{unit.label}</h3><p className="project-option-price">{kes(unit.price)}</p>{hasRealValue(unit.priceNotes) && <p>{unit.priceNotes}</p>}</article>)}</div><p className="project-section-note">Prices may change. Lewis can confirm current pricing and availability when you enquire.</p></section>}
    {presentation.showPaymentPlan && <section className="project-payment"><p className="eyebrow">Payment plan</p><h2>Plan the <em>next steps.</em></h2><dl className="project-facts">{Object.entries({ Deposit: project.paymentPlan.deposit, 'Balance terms': project.paymentPlan.balanceTerms, Duration: project.paymentPlan.duration }).filter(([, value]) => hasRealValue(value)).map(([label, value]) => <Fact key={label} label={label}>{value}</Fact>)}</dl></section>}
    {project.gallery?.length > 0 && <section className="project-gallery" aria-labelledby="project-gallery-title"><div className="project-section-heading"><div><p className="eyebrow">Images</p><h2 id="project-gallery-title">See the <em>project.</em></h2></div><p>Swipe or scroll to explore the images.</p></div><div className="project-gallery-track">{project.gallery.map((image, index) => <figure key={`${image.src}-${index}`}><button className="project-gallery-open" type="button" onClick={() => setOpenImage(image)} aria-label={`Open image: ${image.alt}`}><img src={image.src} alt={image.alt} loading="lazy"/></button><figcaption>{image.caption || image.alt}</figcaption></figure>)}</div></section>}
    {openImage && <div className="project-lightbox" role="dialog" aria-modal="true" aria-label="Project image" onClick={event => { if (event.target === event.currentTarget) setOpenImage(null); }} onKeyDown={event => { if (event.key === 'Escape') setOpenImage(null); }}><div className="project-lightbox-content"><button type="button" className="project-lightbox-close" onClick={() => setOpenImage(null)} autoFocus aria-label="Close image">Close ×</button><img src={openImage.src} alt={openImage.alt}/><p>{openImage.caption || openImage.alt}</p></div></div>}
    {(project.mapUrl || project.driveTimes?.length > 0) && <section className="project-location-section"><p className="eyebrow">Location</p><h2>Get to know the <em>area.</em></h2><p><strong>{project.location.area}</strong> · {project.location.landmarkRoad}</p>{project.driveTimes?.length > 0 && <dl className="project-drive-times">{project.driveTimes.map(item => <div key={item.landmark}><dt>{item.landmark}</dt><dd>{item.time}</dd></div>)}</dl>}{project.mapUrl && <a className="text-link" href={project.mapUrl} target="_blank" rel="noopener noreferrer">Search this area on Google Maps <span aria-hidden="true">↗</span></a>}</section>}
    {project.videoUrl && <section className="project-video"><h2>Project video</h2><a className="text-link" href={project.videoUrl} target="_blank" rel="noopener noreferrer">Watch the project video ↗</a></section>}
    {project.floorPlan && <section className="project-floor-plan"><h2>Floor plan</h2><figure><img src={project.floorPlan.src} alt={project.floorPlan.alt} loading="lazy"/><figcaption>{project.floorPlan.caption}</figcaption></figure></section>}
    {project.brochureUrl && <p className="project-brochure"><a className="text-link" href={project.brochureUrl} target="_blank" rel="noopener noreferrer">View brochure ↗</a></p>}
    <section className="project-enquire"><p className="eyebrow">Want to know more?</p><h2>Let’s make the next step <em>clear.</em></h2><p>{presentation.status === 'sold out' ? 'Join the waitlist to ask about future availability.' : presentation.status === 'coming soon' ? 'Get notified when more project information is available.' : presentation.showViewing ? 'Send Lewis a question or request a viewing. Your enquiry will include this project name.' : 'Ask Lewis to confirm current availability and next steps for this project.'}</p><div className="project-actions"><a className="button button-dark" href={whatsapp}>WhatsApp me <span aria-hidden="true">↗</span></a><a className="button project-outline-button" href={requestUrl}>{presentation.mainAction} <span aria-hidden="true">↗</span></a></div></section>
    <footer className="project-freshness">{verifiedDate && <p>Last verified: {verifiedDate}.</p>}{freshness.stale && <p className="project-stale-note">Confirm current details with me before making a decision.</p>}{!freshness.known && <p className="project-stale-note">A verification date has not been provided. Please confirm current details with Lewis.</p>}<p>Prices and availability can change. Lewis will confirm the latest details with Willstone Homes when you enquire.</p></footer>
    <nav className="project-mobile-cta" aria-label={`Contact Lewis about ${project.name}`}><a href={whatsapp}>WhatsApp me</a>{presentation.showViewing && <a href={requestUrl}>Request a viewing</a>}{!presentation.showViewing && <a href={requestUrl}>{presentation.mainAction}</a>}</nav>
  </main>;
}

