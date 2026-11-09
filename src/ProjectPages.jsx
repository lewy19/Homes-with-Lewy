import { useEffect } from 'react';
import { projectBySlug, projects, projectStartingPrice } from './data/projects.js';
import './project-pages.css';

const SITE = 'https://homes-with-lewy.vercel.app';
const phone = '254114998890';
const kes = value => `KSh ${new Intl.NumberFormat('en-KE').format(value)}`;
const absolute = path => new URL(path, SITE).href;

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
  return <article className="project-card">
    <a className={`project-card-image ${!project.heroImage ? 'project-card-no-image' : ''}`} href={`/projects/${project.slug}`} aria-label={`View ${project.name}`}>
      {project.heroImage && <img src={project.heroImage.src} alt={project.heroImage.alt} loading="lazy"/>}
      {project.heroImage?.kind === 'render' && <span className="project-image-label">Architectural render</span>}
    </a>
    <div className="project-card-copy">
      <div className="project-card-top"><span>{project.location.area}</span>{project.status && <span className={`project-status status-${project.status.replaceAll(' ', '-')}`}>{project.status}</span>}</div>
      <h2><a href={`/projects/${project.slug}`}>{project.name}</a></h2>
      <p>{project.location.landmarkRoad}</p>
      {price != null && <strong className="project-price">From {kes(price)} <small>KES</small></strong>}
      <a className="text-link" href={`/projects/${project.slug}`}>View project details <span aria-hidden="true">↗</span></a>
    </div>
  </article>;
}

export function ProjectCards() {
  return <div className="project-cards-grid">{projects.map(project => <ProjectCard key={project.slug} project={project}/>)}</div>;
}

export function ProjectsPage() {
  useProjectMeta('Projects and developments', 'Explore shared Willstone Homes development information in Joska, Ruiru, Mangu and Juja. Confirm current prices and availability directly with Lewis.');
  return <main className="projects-page">
    <header className="projects-intro"><p className="eyebrow"><span className="eyebrow-line"/>Shared development information</p><h1>Find a place to<br/><em>put down roots.</em></h1><p>Explore project details Lewis has shared for Willstone Homes. Prices and availability can change; Lewis can confirm the latest when you enquire.</p></header>
    <ProjectCards/>
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
  const project = projectBySlug[slug];
  useProjectMeta(project?.name || 'Project not found', project?.seoDescription || 'Browse Willstone Homes developments shared by Lewis Njuguna.', project?.heroImage, canonicalPath);
  if (!project) return <main className="project-not-found"><p className="eyebrow">Project not found</p><h1>Let’s find another <em>place.</em></h1><a className="button button-dark" href="/projects">Browse projects</a></main>;
  const canonical = `${SITE}${canonicalPath || `/projects/${project.slug}`}`;
  const pageUrl = typeof window === 'undefined' || !window.location?.href ? canonical : window.location.href.split('#')[0];
  const whatsapp = whatsappHref(project, pageUrl);
  const requestUrl = `/enquire?property=${encodeURIComponent(project.name)}&source=viewing`;
  const facts = [
    ...((project.unitTypes || []).map(unit => ({ label: unit.label, value: [unit.bedrooms ? `${unit.bedrooms} bedrooms` : null, unit.bathrooms ? `${unit.bathrooms} bathrooms` : null, unit.dsq != null ? `DSQ ${unit.dsq ? 'included' : 'not included'}` : null].filter(Boolean).join(' · ') || unit.label }))),
    { label: 'Plot size', value: project.plotSize },
    { label: 'Title status', value: project.titleStatus },
    { label: 'Gated community', value: project.gated == null ? undefined : project.gated ? 'Yes' : 'No' },
    { label: 'Security', value: project.security },
    { label: 'Water', value: project.water },
    { label: 'Electricity', value: project.electricity },
  ].filter(fact => fact.value);
  const verifiedDate = project.lastVerified && new Date(`${project.lastVerified}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  const schema = structuredData(project, canonical);

  return <main className="project-detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>
    <nav className="project-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/projects">Projects</a><span aria-hidden="true">/</span><span aria-current="page">{project.name}</span></nav>
    <header className={`project-detail-hero ${!project.heroImage ? 'project-detail-hero-text' : ''}`}>
      <div className="project-detail-heading"><p className="eyebrow"><span className="eyebrow-line"/>{project.location.area}</p><h1>{project.name}</h1><p className="project-location">{project.location.landmarkRoad}</p>
        <div className="project-hero-badges">{project.status && <span className={`project-status status-${project.status.replaceAll(' ', '-')}`}>{project.status}</span>}{project.priceFrom != null && <span className="project-hero-price">From {kes(project.priceFrom)}</span>}</div>
        {project.priceNotes && <p className="project-price-notes">{project.priceNotes}</p>}
        <div className="project-actions"><a className="button button-dark" href={whatsapp}>WhatsApp me <span aria-hidden="true">↗</span></a><a className="text-link" href={requestUrl}>Request a viewing <span aria-hidden="true">↗</span></a></div>
      </div>
      {project.heroImage && <figure className="project-hero-figure"><img src={project.heroImage.src} alt={project.heroImage.alt} fetchPriority="high"/><figcaption>{project.heroImage.caption || project.heroImage.alt}</figcaption></figure>}
    </header>
    <section className="project-overview" aria-labelledby="project-overview-title"><div><p className="eyebrow">A closer look</p><h2 id="project-overview-title">About the <em>development.</em></h2><p>{project.description}</p></div>
      {facts.length > 0 && <dl className="project-facts">{facts.map(fact => <Fact key={fact.label} label={fact.label}>{fact.value}</Fact>)}</dl>}
      {project.features?.length > 0 && <div className="project-features"><h3>Features</h3><ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>}
    </section>
    {(project.unitTypes || []).some(unit => unit.price != null || unit.priceNotes) && <section className="project-pricing" aria-labelledby="project-pricing-title"><p className="eyebrow">Prices shared</p><h2 id="project-pricing-title">Options and <em>prices.</em></h2><div className="project-price-options">{project.unitTypes.filter(unit => unit.price != null || unit.priceNotes).map(unit => <article key={unit.label}><h3>{unit.label}</h3>{unit.price != null && <p className="project-option-price">{kes(unit.price)}</p>}{unit.priceNotes && <p>{unit.priceNotes}</p>}</article>)}</div><p className="project-section-note">Prices may change. Lewis can confirm current pricing and availability when you enquire.</p></section>}
    {project.paymentPlan && Object.values(project.paymentPlan).some(Boolean) && <section className="project-payment"><p className="eyebrow">Payment plan</p><h2>Plan the <em>next steps.</em></h2><dl className="project-facts">{Object.entries({ Deposit: project.paymentPlan.deposit, 'Balance terms': project.paymentPlan.balanceTerms, Duration: project.paymentPlan.duration }).filter(([, value]) => value).map(([label, value]) => <Fact key={label} label={label}>{value}</Fact>)}</dl></section>}
    {project.gallery?.length > 0 && <section className="project-gallery" aria-labelledby="project-gallery-title"><div className="project-section-heading"><div><p className="eyebrow">Images</p><h2 id="project-gallery-title">See the <em>project.</em></h2></div><p>Swipe or scroll to explore the images.</p></div><div className="project-gallery-track">{project.gallery.map((image, index) => <figure key={`${image.src}-${index}`}><img src={image.src} alt={image.alt} loading="lazy"/><figcaption>{image.caption || image.alt}</figcaption></figure>)}</div></section>}
    {(project.mapUrl || project.driveTimes?.length > 0) && <section className="project-location-section"><p className="eyebrow">Location</p><h2>Get to know the <em>area.</em></h2><p><strong>{project.location.area}</strong> · {project.location.landmarkRoad}</p>{project.driveTimes?.length > 0 && <dl className="project-drive-times">{project.driveTimes.map(item => <div key={item.landmark}><dt>{item.landmark}</dt><dd>{item.time}</dd></div>)}</dl>}{project.mapUrl && <a className="text-link" href={project.mapUrl} target="_blank" rel="noopener noreferrer">Search this area on Google Maps <span aria-hidden="true">↗</span></a>}</section>}
    {project.videoUrl && <section className="project-video"><h2>Project video</h2><a className="text-link" href={project.videoUrl} target="_blank" rel="noopener noreferrer">Watch the project video ↗</a></section>}
    {project.floorPlan && <section className="project-floor-plan"><h2>Floor plan</h2><figure><img src={project.floorPlan.src} alt={project.floorPlan.alt} loading="lazy"/><figcaption>{project.floorPlan.caption}</figcaption></figure></section>}
    {project.brochureUrl && <p className="project-brochure"><a className="text-link" href={project.brochureUrl} target="_blank" rel="noopener noreferrer">View brochure ↗</a></p>}
    <section className="project-enquire"><p className="eyebrow">Want to know more?</p><h2>Let’s make the next step <em>clear.</em></h2><p>Send Lewis a question or arrange a viewing. Your enquiry will include this project name.</p><div className="project-actions"><a className="button button-dark" href={whatsapp}>WhatsApp me <span aria-hidden="true">↗</span></a><a className="button project-outline-button" href={requestUrl}>Request a viewing <span aria-hidden="true">↗</span></a></div></section>
    <footer className="project-freshness">{verifiedDate && <p>Last verified: {verifiedDate}.</p>}<p>Prices and availability can change. Lewis will confirm the latest details with Willstone Homes when you enquire.</p></footer>
    <nav className="project-mobile-cta" aria-label={`Contact Lewis about ${project.name}`}><a href={whatsapp}>WhatsApp me</a><a href={requestUrl}>Request a viewing</a></nav>
  </main>;
}

