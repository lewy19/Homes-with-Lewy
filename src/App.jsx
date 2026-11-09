import { lazy, Suspense, useEffect, useState } from 'react';
import { properties } from './data/properties.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import ChatWidget from './ChatWidget.jsx';
import { projects, projectBySlug } from './data/projects.js';
import { ProjectsPage, ProjectDetailPage, ProjectCards } from './ProjectPages.jsx';
import TestimonialsPage from './TestimonialsPage.jsx';

const AdminPage = lazy(() => import('./AdminPage.jsx'));

const routes = [
  ['/', 'Home'], ['/homes', 'Homes'], ['/about-lewis', 'About Lewis'],
  ['/enquire', 'Enquire'], ['/how-it-works', 'How it works'],
  ['/viewing-checklist', 'Viewing checklist'], ['/buying-guide', 'Home buying guide'],
  ['/faqs', 'FAQs'], ['/willstone-homes', 'Willstone Homes'], ['/projects/manna-residence', 'Manna Residence'],
  ['/projects/mangu-grove', 'Mangu Grove'], ['/projects/juja-grove', 'Juja Grove'], ['/areas', 'Areas'],
  ['/privacy', 'Privacy'], ['/projects', 'Projects'], ['/testimonials', 'Testimonials'],
];
function useVerifiedHomes() {
  const [homes, setHomes] = useState(() => properties.filter(home => home.verified === true));
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('properties').select('*').eq('verified', true).eq('published', true).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (active && !error) setHomes((data || []).map(home => ({ ...home, image: home.image_url, imageAlt: home.image_alt })));
    });
    return () => { active = false; };
  }, []);
  return homes;
}

function usePageMeta(title, description) {
  useEffect(() => {
    const pageTitle = window.location.pathname === '/' ? title : `${title} | Homes with Lew¥`;
    document.title = pageTitle;
    const canonicalUrl = `https://homes-with-lewy.vercel.app${window.location.pathname}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', pageTitle);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  }, [title, description]);
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <a className="brand" href="/" aria-label="Homes with Lew¥ home"><span className="brand-mark">H<span>W</span></span><span className="brand-name">Homes with <strong>Lew¥</strong></span></a>
    <nav className="main-nav" aria-label="Main navigation"><a href="/homes">Find a home</a><a href="/about-lewis">About Lewis</a><a className="header-contact" href="tel:+254114998890">Call Lewis</a><a className="header-contact" href="https://wa.me/254114998890" target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="nav-cta" href="/enquire">Let’s talk <span aria-hidden="true">↗</span></a></nav>
    <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}><span/><span/></button>
    {menuOpen && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{routes.slice(1, 5).map(([path, label]) => <a key={path} href={path} onClick={() => setMenuOpen(false)}>{label}</a>)}<a href="tel:+254114998890">Call Lewis</a><a href="https://wa.me/254114998890" target="_blank" rel="noopener noreferrer">WhatsApp Lewis</a></nav>}
  </header>;
}

function Footer() {
  const [socialLinks, setSocialLinks] = useState(null);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('social_links').select('platform,label,url,owner_scope,is_active,sort_order').order('sort_order').then(({ data, error }) => {
      if (active && !error) setSocialLinks(data || []);
    });
    return () => { active = false; };
  }, []);
  const personalFallbacks = [
    { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/homeswithlewy/', owner_scope: 'personal', is_active: true, sort_order: 1 },
    { platform: 'facebook', label: 'Facebook', url: 'https://web.facebook.com/profile.php?id=61583083756453', owner_scope: 'personal', is_active: true, sort_order: 2 },
    { platform: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@homeswithlewy', owner_scope: 'personal', is_active: true, sort_order: 4 },
  ];
  const personalRows = socialLinks?.filter(link => link.owner_scope === 'personal' && link.is_active);
  const personalLinks = socialLinks === null ? personalFallbacks : [
    ...personalRows,
    ...personalFallbacks.filter(link => link.platform === 'tiktok' && !socialLinks.some(row => row.owner_scope === 'personal' && row.platform === 'tiktok')),
  ];
  const companyLinks = socialLinks?.filter(link => link.owner_scope === 'willstone' && link.is_active);
  const personalPlatforms = ['instagram', 'facebook', 'tiktok'];
  const officialFallback = [
    { label: 'Facebook', url: 'https://www.facebook.com/willstonehomes/' },
    { label: 'Instagram', url: 'https://www.instagram.com/willstone_homes/reel/DB3ND7RohC1/' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@willstone.homes' },
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCgxMais9RLaUvoVHHAP83mQ' },
  ];
  return <footer className="site-footer"><div className="footer-top"><a className="brand brand-footer" href="/"><span className="brand-mark">H<span>W</span></span><span className="brand-name">Homes with <strong>Lew¥</strong></span></a><p>Making the search for somewhere<br/>feel a little more human.</p><a className="footer-top-link" href="#top">Back to the top ↑</a></div><div className="footer-links">{routes.slice(1).map(([path, label]) => <a key={path} href={path}>{label}</a>)}</div><div className="footer-social" aria-label="Homes with Lew¥ social profiles"><strong>Follow Homes with Lew¥</strong>{personalPlatforms.map(platform => { const link = personalLinks.find(item => item.platform === platform); return link ? <a key={platform} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a> : <span key={platform}>{platform[0].toUpperCase() + platform.slice(1)} · link coming soon</span>; })}{personalLinks.find(item => item.platform === 'whatsapp') ? <a href={personalLinks.find(item => item.platform === 'whatsapp').url} target="_blank" rel="noopener noreferrer">WhatsApp Channel ↗</a> : <a href="https://whatsapp.com/channel/0029VbAtw1UKbYMNrzgEqS0g" target="_blank" rel="noopener noreferrer">WhatsApp Channel ↗</a>}</div><div className="footer-social" aria-label="Official Willstone Homes social profiles"><strong>Follow Willstone Homes</strong>{(companyLinks || officialFallback).map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} Homes with Lew¥ · Lewis Njuguna</span><span>IT support professional · Authorized by Willstone Homes to promote and sell its homes</span><a className="footer-phone" href="tel:+254114998890">Call Lewis: +254 114 998 890</a><a href="https://wa.me/254114998890" target="_blank" rel="noopener noreferrer">WhatsApp Lewis ↗</a><a href="/enquire">Start a conversation ↗</a></div></footer>;
}

function Eyebrow({ children }) { return <p className="eyebrow"><span className="eyebrow-line"/>{children}</p>; }
function ButtonLink({ href, children, light = false }) { return <a className={`button ${light ? 'button-light' : 'button-dark'}`} href={href}>{children}<span aria-hidden="true">↗</span></a>; }

function PropertyCard({ home }) {
  return <article className="property-card"><img className="property-image" src={home.image} alt={home.imageAlt || ''} loading="lazy"/><div className="property-copy"><span className="verified">✓ Verified with Willstone Homes</span><h3 className="property-title">{home.title}</h3><p className="property-meta">{home.location}</p><div className="property-price">{home.price && home.currency ? `${home.currency} ${new Intl.NumberFormat().format(home.price)}` : 'Price on enquiry'}</div>{(home.beds || home.baths) && <p className="property-details">{home.beds ? `${home.beds} bedrooms` : ''}{home.beds && home.baths ? ' · ' : ''}{home.baths ? `${home.baths} bathrooms` : ''}</p>}{home.summary && <p className="property-details">{home.summary}</p>}<a className="text-link" href={`/enquire?property=${encodeURIComponent(home.title)}`}>Ask about this home <span aria-hidden="true">↗</span></a></div></article>;
}

function FeaturedDevelopments() {
  return <><ProjectCards/><p className="listings-note">These project profiles share information Lewis has received. Confirm current price, availability, specifications and sale terms with Lewis or Willstone Homes before deciding.</p><div className="center-link"><a className="text-link" href="/projects">See all project details <span aria-hidden="true">↗</span></a></div></>;
}function ListingSection({ full = false }) {
  const verifiedHomes = useVerifiedHomes();
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const locations = [...new Set(verifiedHomes.map(home => home.location).filter(Boolean))];
  const priced = verifiedHomes.filter(home => Number.isFinite(Number(home.price)) && home.currency);
  const currencies = [...new Set(priced.map(home => home.currency))];
  const priceValues = [...new Set(priced.map(home => Number(home.price)))].sort((a, b) => a - b);
  const showPriceFilter = currencies.length === 1 && priceValues.length > 1;
  const matches = verifiedHomes.filter(home => (!location || home.location === location) && (!price || !Number.isFinite(Number(home.price)) || Number(home.price) <= Number(price)));
  return <>
    {(locations.length > 1 || showPriceFilter) && <div className="listing-tools" aria-label="Filter property listings">{locations.length > 1 && <label className="filter-label">Location <select value={location} onChange={event => setLocation(event.target.value)} aria-label="Filter by location"><option value="">All locations</option>{locations.map(place => <option key={place}>{place}</option>)}</select></label>}{showPriceFilter && <label className="filter-label">Price <select value={price} onChange={event => setPrice(event.target.value)} aria-label="Filter by maximum price"><option value="">Any price</option>{priceValues.map(amount => <option key={amount} value={amount}>Up to {currencies[0]} {new Intl.NumberFormat().format(amount)}</option>)}</select></label>}</div>}
    {matches.length ? <div className={`listing-grid ${full ? 'listing-grid-full' : ''}`}>{matches.map(home => <PropertyCard key={home.title} home={home}/>)}</div> : <div className="empty-listings"><span className="empty-icon" aria-hidden="true">✳</span><h3>Good things are on the way.</h3><p>No verified Willstone Homes listings have been added yet. Check back soon, or send a general enquiry and Lewis can help you get started.</p><ButtonLink href="/enquire">Make a general enquiry</ButtonLink></div>}
    <p className="listings-note"><span aria-hidden="true">✳</span> Listings are shared in connection with Willstone Homes. Confirm availability and details before making a decision.</p>
  </>;
}

function HomePage() {
  usePageMeta('Homes with Lewy | Willstone Homes Developments in Kenya', 'Explore homes and developments in Ruiru, Juja, Joska and along Thika Superhighway. Lewis Njuguna works in IT support and is authorized by Willstone Homes to promote and sell its homes.');
  return <><main><section className="hero" id="top"><div className="hero-copy"><Eyebrow>A considered way home</Eyebrow><h1>A place to<br/>put down <em>roots.</em></h1><p className="hero-intro">Homes with Lewy is Lewis Njuguna’s property portfolio for homes and residential developments in Kenya, shared in connection with Willstone Homes.</p><ButtonLink href="/homes">Explore homes</ButtonLink><div className="hero-note"><span className="note-dot"/>Listing details are shared only after verification</div></div><div className="hero-image-wrap"><img className="hero-image" src="/images/white-park-2/whitepark-render-01.jpeg" alt="Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents" fetchPriority="high"/><div className="image-caption"><span className="caption-dot"/>Whitepark 2 · Architectural render <span className="caption-rule"/> Illustrative design</div><div className="hero-stamp" aria-label="Find your place"><span>FIND YOUR</span><strong>place</strong><span>TO CALL HOME</span><i aria-hidden="true">✳</i></div></div><div className="hero-index"><span>01</span><span className="index-rule"/><span>THE SEARCH STARTS HERE</span></div></section>
    <section className="homes section-pad"><div className="section-heading"><div><Eyebrow>A good place to begin</Eyebrow><h2>Find your <em>somewhere.</em></h2></div><p className="section-aside">Explore developments shared by Lewis with Willstone Homes. Confirm current details and availability directly.</p></div><FeaturedDevelopments/><div className="center-link"><a className="text-link" href="/homes">View verified individual homes <span aria-hidden="true">↗</span></a></div></section>
    <ProgressTeaser/>
    <section className="about section-pad"><div className="about-image"><img src="/images/white-park-2/progress-02.jpg" alt="Row of unfinished masonry homes, some with completed roof tiles and one with exposed roof framing" loading="lazy"/><span className="about-image-label">A home is more than four walls.</span><span className="about-image-index">02 / A LITTLE ABOUT LEWIS</span></div><div className="about-copy"><Eyebrow>The person behind the page</Eyebrow><h2>A real person.<br/><em>A practical approach.</em></h2><p className="about-lead">I’m Lewis Njuguna — I work in IT support, and I am authorized by Willstone Homes to promote and sell its homes.</p><p className="about-body">I bring a problem-solving mindset and a straightforward approach to conversations about finding a home. This page shares development information and individually verified Willstone Homes listings, and makes it easier to ask questions.</p><RoleCard/><a className="text-link" href="/about-lewis">Get to know Lewis <span aria-hidden="true">↗</span></a></div></section>
    <section className="home-cta section-pad"><Eyebrow>Start a conversation</Eyebrow><h2>The right home starts<br/>with <em>a hello.</em></h2><p>Tell Lewis a little about what you’re looking for.</p><ButtonLink href="/enquire">Make an enquiry</ButtonLink><div className="center-link"><a className="text-link" href="/testimonials">Read or share an experience <span aria-hidden="true">↗</span></a></div></section></main></>;
}

function RoleCard() { return <div className="role-card"><span className="role-icon" aria-hidden="true">✳</span><span><strong>Two roles, one clear introduction.</strong><small>IT support professional · Authorized by Willstone Homes to promote and sell its homes</small></span></div>; }

const albumUrl = 'https://photos.google.com/share/AF1QipOu3va-AAbotEKb8fu-8ySY73u4rHnFZZk05JHmJQNplyM7dWvIyXhvoqKeFpYfQw?key=UzlyRDRWcHduRWZ2U2tSb1NXWjhJRW8wM1NiOU53';
const septemberAlbumUrl = 'https://photos.google.com/share/AF1QipNrA9C9w7D9D0hEbT4w7fB2D1qITtwDeE1PUP3nmKJzTXCMqxgxzJbn5VIlZPRLlA?key=aWp0QjBiRlRJYW4zZ09Md0ExMHZMcE81encwLXN3';
function ProgressTeaser() {
  const project = projectBySlug['whitepark-2-estate'];
  return <section className="progress-teaser section-pad"><div className="progress-teaser-copy"><Eyebrow>Whitepark 2 Estate</Eyebrow><h2>A closer look at<br/><em>{project.name}.</em></h2><p>{project.description} Explore architectural visualisations and shared site-progress photos.</p><a className="text-link" href={`/projects/${project.slug}#project-gallery-title`}>See project images <span aria-hidden="true">↗</span></a></div><a className="progress-teaser-image" href={`/projects/${project.slug}#project-gallery-title`} aria-label={`View ${project.name} architectural render`}><img src={project.heroImage.src} alt={project.heroImage.alt} loading="lazy"/><span>{project.name} · {project.heroImage.caption}</span></a></section>;
}
function PageIntro({ eyebrow, title, lead }) { return <div className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{lead && <p>{lead}</p>}</div>; }
function ContentPage({ eyebrow, title, lead, children }) { return <main className="content-main"><PageIntro eyebrow={eyebrow} title={title} lead={lead}/><div className="content-body">{children}</div></main>; }

function HomesPage() {
  usePageMeta('Verified homes', 'Browse verified Willstone Homes listings and enquire about a property that interests you.');
  return <ContentPage eyebrow="Homes and developments" title={<>Find a home that feels <em>right.</em></>} lead="Explore developments Lewis is authorized by Willstone Homes to promote and sell. Prices below were shared by Lewis; ask about current availability and terms."><FeaturedDevelopments/><section className="verified-homes-section"><h2>Verified individual homes</h2><p>These are individual home listings confirmed with Willstone Homes, separate from the development summaries above.</p><ListingSection full/></section></ContentPage>;
}
function AboutPage() {
  usePageMeta('About Lewis Njuguna', 'Meet Lewis Njuguna, an IT support professional who is authorized by Willstone Homes to promote and sell its homes.');
  return <ContentPage eyebrow="The person behind the page" title={<>A real person.<br/><em>A practical approach.</em></>} lead="I’m Lewis Njuguna. I work in IT support, and I am authorized by Willstone Homes to promote and sell its homes."><div className="article-copy"><p>I made Homes with Lew¥ as a place to share Willstone Homes development information and verified individual listings, and make it easier to start a conversation about a home.</p><p>My professional background is in IT support. Alongside that work, Willstone Homes has authorized me to promote and sell its homes. I aim to keep these roles clear and answer enquiries in a straightforward way.</p><RoleCard/><h2>Here to help you get started</h2><p>Explore the current listings or send a general enquiry if you have a question. Property facts and availability should always be confirmed with Willstone Homes.</p><ButtonLink href="/homes">Explore homes</ButtonLink></div></ContentPage>;
}

function HowPage() {
  usePageMeta('How it works', 'A simple overview of browsing listings and making an enquiry through Homes with Lew¥.');
  const steps = [['01', 'Explore the listings', 'Browse the homes shared here. Development pages share project information provided by Lewis. Individual home listings are marked verified only after confirmation with Willstone Homes.'], ['02', 'Send an enquiry', 'Use the form to share your name, phone number, the property you’re asking about, and a short message. Email is optional, and you choose whether Lewis may contact you by phone or WhatsApp.'], ['03', 'Confirm the details', 'Your enquiry is saved to the private owner dashboard. Email alerts are a separate setup and may not be active, so for a quick response you can also call or WhatsApp Lewis. Confirm availability, price and property details before making decisions.']];
  return <ContentPage eyebrow="A simple place to start" title={<>A clearer path to <em>hello.</em></>} lead="A few straightforward steps from looking around to asking about a home."><div className="steps-grid">{steps.map(([num, heading, text]) => <article className="step-card" key={num}><span>{num}</span><h2>{heading}</h2><p>{text}</p></article>)}</div><div className="notice-box"><strong>About enquiry follow-up</strong><p>When Supabase is connected, the form saves your enquiry to the private owner dashboard. Email notifications need a separate service setup and may not be active yet; for a quick response, call or WhatsApp Lewis.</p></div><ButtonLink href="/enquire">Start an enquiry</ButtonLink></ContentPage>;
}

function ChecklistPage() {
  usePageMeta('Home viewing checklist', 'A practical checklist of questions to consider when viewing a home.');
  const groups = [['The space', 'How does the layout fit your everyday routine?', 'Which rooms, storage areas or outdoor spaces matter most to you?', 'What would you want to measure or check again?'], ['The surroundings', 'What would you like to learn about the nearby area?', 'How will you check travel times and everyday amenities for yourself?', 'Are there times of day you would like to revisit?'], ['The details', 'Which property features or inclusions should be confirmed?', 'What maintenance questions would you like to ask?', 'Have you noted any details to follow up directly with Willstone Homes?']];
  return <ContentPage eyebrow="Take your time" title={<>A little checklist for your <em>visit.</em></>} lead="Use these prompts to organise your own questions when viewing a home. Each property and purchase is different."><div className="checklist-grid">{groups.map(([title, ...items]) => <section className="checklist-card" key={title}><h2>{title}</h2><ul>{items.map(item => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>)}</div><div className="notice-box"><strong>Property information</strong><p>Ask Willstone Homes to confirm specific property details, availability and any terms that apply.</p></div><ButtonLink href="/homes">Browse homes</ButtonLink></ContentPage>;
}

function GuidePage() {
  usePageMeta('Kenya Home Buying Guide', 'A practical Kenya home-buying checklist covering independent legal advice, official title searches, costs, written terms and handover questions.');
  return <ContentPage eyebrow="Plan at your own pace" title={<>A few first steps for your <em>search.</em></>} lead="A general checklist for asking good questions and checking the details before you commit to a property."><div className="article-copy"><h2>1. Confirm the home and the terms</h2><p>Ask Willstone Homes for the current written price, availability, exact unit or plot details, what is included, payment schedule, refund terms and expected completion or handover dates. Do not rely on an old post or a verbal estimate as the final offer.</p><h2>2. Carry out independent checks</h2><p>Before paying a deposit, ask an independent Kenyan conveyancing advocate to review the documents and transaction. Request an official land search for the relevant title or parcel and independently confirm ownership and any registered interests. The State Department for Lands describes an official search as a way to check ownership and encumbrances.</p><p><a className="inline-link" href="https://lands.go.ke/issuance-search-certificate" target="_blank" rel="noopener noreferrer">State Department for Lands: search certificate</a><br/><a className="inline-link" href="https://ardhisasa.lands.go.ke/home/faqs" target="_blank" rel="noopener noreferrer">Ardhisasa official FAQs (official site)</a></p><h2>3. Ask about costs and taxes</h2><p>Ask your advocate and the relevant authorities which taxes, stamp duty, legal fees, registration fees, valuation, service charges and other costs apply to your specific transaction. Amounts and rules depend on the instrument, property and circumstances; get current figures in writing instead of relying on a general online estimate.</p><p><a className="inline-link" href="https://www.kra.go.ke/component/kra_faq/faqcategory/43" target="_blank" rel="noopener noreferrer">KRA stamp duty information</a><br/><a className="inline-link" href="https://lands.go.ke/valuation-stamp-duty" target="_blank" rel="noopener noreferrer">Lands Department: stamp duty valuation</a></p><h2>4. Keep a clear record</h2><p>Use a written agreement reviewed by your advocate. Keep copies of the offer, payment receipts, approved plans or specifications you were given, correspondence and any changes. Verify the payee and payment instructions through a trusted, independently confirmed channel.</p><h2>5. Before handover</h2><p>Ask what inspection, snagging, utilities, completion documents and handover records will be provided, and when. Get any promises about finishes, access roads, gardens, security or shared facilities recorded in the agreement or signed specifications.</p><div className="notice-box"><strong>General information only</strong><p>This checklist is not legal, tax, financial or property-specific advice. Have an independent qualified Kenyan advocate review your transaction and confirm current official requirements.</p></div><ButtonLink href="/viewing-checklist">See the viewing checklist</ButtonLink></div></ContentPage>;
}

function FAQPage() {
  usePageMeta('Frequently asked questions', 'Answers about listings, Lewis’s roles and making an enquiry through Homes with Lew¥.');
  const faqs = [['Who is Lewis Njuguna?', 'Lewis works in IT support and is authorized by Willstone Homes to promote and sell its homes.'], ['Are the properties verified?', 'Only property records explicitly marked as verified with Willstone Homes are displayed. Browse the Homes page for the current listings.'], ['Can I enquire without choosing a property?', 'Yes. You can send a general enquiry and leave the property field blank.'], ['Does this form send my message?', 'When Supabase is configured, the form saves enquiries to the private owner dashboard. Email alerts require a separate setup, so call or WhatsApp Lewis if you need a quick response.'], ['How can I confirm availability and price?', 'Ask Lewis or Willstone Homes to confirm current price, availability, specifications and sale terms before you make a decision.'], ['Is Lewis a licensed real estate agent or broker?', 'No licensing or brokerage credentials have been provided, so this site does not describe Lewis that way.']];
  return <ContentPage eyebrow="A few helpful answers" title={<>Good questions, clear <em>answers.</em></>} lead="Here are a few things you may want to know about this page and the homes shared here."><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div><p className="page-outro">Have another question? <a className="inline-link" href="/enquire">Send Lewis an enquiry ↗</a></p></ContentPage>;
}

function WillstonePage() {
  usePageMeta('Willstone Homes', 'Information about Lewis Njuguna’s connection with Willstone Homes and where verified listings appear.');
  return <ContentPage eyebrow="Property listings" title={<>Shared with <em>Willstone Homes.</em></>} lead="Lewis Njuguna is authorized by Willstone Homes to promote and sell its homes. This page is a personal site for sharing development information and receiving enquiries."><div className="article-copy"><h2>What you’ll find here</h2><p>Homes with Lew¥ is Lewis’s personal property page. Project details are shared from information Lewis has received and should be confirmed directly before you make a decision.</p><div className="notice-box"><strong>Clear roles</strong><p>Lewis also works in IT support. This site does not describe him as a licensed real estate agent or broker.</p></div><ButtonLink href="/projects">Browse project details</ButtonLink></div></ContentPage>;
}

function AreasPage() {
  usePageMeta('Development locations', 'Explore Manna Residence near Ruiru, Mangu Grove behind Zetech University, Juja Grove along Juja Farm, and Whitepark 2 Estate in Joska.');
  return <ContentPage eyebrow="Location matters" title={<>Developments around <em>Ruiru, Juja and Joska.</em></>} lead="Explore locations for developments Lewis shares for Willstone Homes. Confirm current details and availability directly."><div className="area-grid">{projects.map(project => <a className="area-card" href={`/projects/${project.slug}`} key={project.slug}><span className="estate-label">DEVELOPMENT</span><h2>{project.name}</h2><p>{project.location.area} · {project.location.landmarkRoad}</p><span className="text-link">View details <span aria-hidden="true">↗</span></span></a>)}</div><p className="page-outro">Have another location in mind? <a className="inline-link" href="/enquire">Ask Lewis about it ↗</a></p></ContentPage>;
}

function PrivacyPage() {
  usePageMeta('Privacy', 'How enquiry information is handled in this Homes with Lew¥ website preview.');
  const configuredNotice = isSupabaseConfigured ? 'Your enquiry is saved to the Homes with Lew¥ database and visible to an authorized site administrator through the private dashboard. Email alerts need separate setup and may not be active yet.' : 'Online enquiries are unavailable until Supabase is configured. Information entered here is not sent or saved.';
  return <ContentPage eyebrow="Your information" title={<>A clear note about <em>privacy.</em></>} lead={configuredNotice}><div className="article-copy"><h2>Enquiry information</h2><p>{configuredNotice} Enquiries include your name, phone number, chosen property, message, explicit contact consent, and any optional email or preferences you provide.</p><h2>Testimonials</h2><p>If you choose to submit feedback, Google sign-in is used to limit spam and prevent multiple reviews from one account. Your account email is not shown publicly. Your display name, rating and comment remain pending until an administrator reviews them. They appear publicly only if approved and you agreed to public display. Sign-in does not verify that someone bought a property or is a client.</p><h2>Website analytics</h2><p>This site uses Vercel Web Analytics to understand page visits and improve the site.</p><h2>LUMA chat</h2><p>If the AI chat is enabled, your latest messages are sent to the AI service so it can generate a reply. The website does not save chat history in its database. Do not enter passwords, identity documents, financial details or other sensitive information. To share contact details for a follow-up, use the enquiry form; LUMA does not collect those details inside chat.</p><h2>Access and handling</h2><p>Dashboard access is restricted to an account explicitly added to the site administrator list. Lewis should review enquiries and remove records that are no longer needed. Do not submit sensitive financial or identity information through this form.</p><h2>Questions</h2><p>Contact Lewis through a verified contact method listed on this website.</p></div></ContentPage>;
}

function EnquiryPage() {
  usePageMeta('Make an enquiry', 'Ask Lewis about Willstone Homes developments in Ruiru, Juja, Joska and along Thika Superhighway.');
  const verifiedHomes = useVerifiedHomes();
  const requestedProperty = new URLSearchParams(window.location.search).get('property') || '';
  const [form, setForm] = useState({ name: '', email: '', phone: '', property: requestedProperty, budget: '', area: '', timeline: '', message: '', website: '', contact_consent: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (form.website) { setStatus({ type: 'success', text: 'Thanks. Your enquiry has been received.' }); return; }
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name (at least 2 characters).';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address or leave it blank.';
    if (!form.phone.trim()) next.phone = 'Please enter a phone number.';
    else if (!/^[+\d\s().-]{7,20}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.message.trim().length < 10) next.message = 'Please share at least 10 characters.';
    if (form.message.trim().length > 5000) next.message = 'Please keep your message under 5,000 characters.';
    if (!form.contact_consent) next.contact_consent = 'Please agree to be contacted about this property.';
    setErrors(next);
    if (Object.keys(next).length) { setStatus({ type: 'error', text: 'Please check the highlighted fields and try again.' }); return; }
    if (!supabase) { setStatus({ type: 'error', text: 'Online enquiries are not connected yet. Your message has not been sent or saved.' }); return; }
    setLoading(true); setStatus({ type: 'loading', text: 'Sending your enquiry...' });
    try {
      const { error } = await supabase.from('enquiries').insert({
        name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim(),
        property_title: form.property || null, budget_range: form.budget || null,
        preferred_area: form.area || null, timeline: form.timeline || null,
        message: form.message.trim(), contact_consent: true,
      });
      if (error) throw error;
      setStatus({ type: 'success', text: 'Your enquiry has been saved to the owner dashboard. Email alerts depend on the notification setup. For a quick reply, call or WhatsApp Lewis.' });
      setForm({ name: '', email: '', phone: '', property: '', budget: '', area: '', timeline: '', message: '', website: '', contact_consent: false });
      setErrors({});
    } catch {
      setStatus({ type: 'error', text: 'We could not save your enquiry. Please check that the contact-consent database update has been applied, then try again or contact Lewis.' });
    } finally { setLoading(false); }
  }
  return <ContentPage eyebrow="Start a conversation" title={<>The right home starts<br/>with <em>a hello.</em></>} lead={supabase ? 'Share what you are looking for. Your enquiry will be saved in the private owner dashboard.' : 'Share what you are looking for. Online enquiries are not connected yet.'}>
    {supabase ? <section className="enquiry-next" aria-labelledby="enquiry-next-title"><h2 id="enquiry-next-title">What happens next</h2><ol><li><span>01</span><p>Your enquiry is saved to the private owner dashboard.</p></li><li><span>02</span><p>Lewis can reply using the phone number you provide. Email is optional.</p></li><li><span>03</span><p>Confirm current availability, prices and terms with Lewis or Willstone Homes before deciding.</p></li></ol><p>Email alerts depend on the notification setup; call or WhatsApp Lewis for a quicker reply.</p></section> : <section className="enquiry-next"><h2>Prefer to speak directly?</h2><p>Online enquiries are not connected right now. Call or WhatsApp Lewis to ask about a development or home.</p></section>}
    <form className="enquiry-form" onSubmit={submit} noValidate><div className="form-top"><span>YOUR ENQUIRY</span><span className="required-legend"><i>*</i> Required</span></div><div className="bot-field" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off"/></div>
      <div className="form-row"><Field label="Your name" name="name" value={form.name} onChange={update} error={errors.name} required autoComplete="name" placeholder="Your name"/><Field label="Email address" name="email" type="email" value={form.email} onChange={update} error={errors.email} optional autoComplete="email" placeholder="you@example.com"/></div>
      <Field label="Phone number" name="phone" type="tel" value={form.phone} onChange={update} error={errors.phone} required autoComplete="tel" placeholder="Your preferred number"/>
      <div className="field"><label htmlFor="property">Development or home <span className="optional">(optional)</span></label><select id="property" name="property" value={form.property} onChange={update}><option value="">General enquiry</option>{projects.map(project => <option key={project.slug} value={project.name}>{project.name}</option>)}{verifiedHomes.map(home => <option key={home.title} value={home.title}>{home.title} - {home.location}</option>)}</select></div>
      <div className="form-row"><div className="field"><label htmlFor="budget">Budget range <span className="optional">(optional)</span></label><select id="budget" name="budget" value={form.budget} onChange={update}><option value="">Prefer not to say</option><option>Under KSh 4M</option><option>KSh 4M-10M</option><option>KSh 10M-16M</option><option>KSh 16M-22M</option><option>Over KSh 22M</option></select></div><div className="field"><label htmlFor="area">Preferred area <span className="optional">(optional)</span></label><select id="area" name="area" value={form.area} onChange={update}><option value="">Not sure yet</option><option>Ruiru</option><option>Mangu / Thika Superhighway</option><option>Juja Farm</option><option>Joska / Kangundo Road</option><option>Another area</option></select></div></div>
      <div className="field"><label htmlFor="timeline">When are you looking to buy? <span className="optional">(optional)</span></label><select id="timeline" name="timeline" value={form.timeline} onChange={update}><option value="">Just exploring</option><option>As soon as possible</option><option>Within 1-3 months</option><option>Within 3-6 months</option><option>Within 6-12 months</option></select></div>
      <div className="field"><label htmlFor="message">What are you looking for? <i>*</i></label><textarea id="message" name="message" rows="4" minLength="10" maxLength="5000" required value={form.message} onChange={update} placeholder="Tell Lewis what matters to you in a home..." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined}/>{errors.message && <span className="field-error" id="message-error">{errors.message}</span>}</div>
      <div className="consent-field"><label><input type="checkbox" name="contact_consent" checked={form.contact_consent} onChange={update} aria-invalid={Boolean(errors.contact_consent)} aria-describedby={errors.contact_consent ? 'consent-error' : 'consent-help'}/><span>I agree to be contacted by phone or WhatsApp about this property. <i>*</i></span></label><small id={errors.contact_consent ? 'consent-error' : 'consent-help'}>{errors.contact_consent || 'Required before Lewis can follow up about this enquiry.'}</small></div>
      <p className="form-privacy">Your enquiry and consent are stored in Supabase for the owner dashboard. Do not send identity or financial documents through this form.</p>{status.text && <div className="form-status" data-state={status.type} role="status" aria-live="polite">{status.text}</div>}<button className="button button-dark submit-button" type="submit" disabled={loading || !supabase}>{loading ? 'Sending your enquiry...' : supabase ? 'Send enquiry' : 'Enquiries not connected'} {supabase && !loading && <span aria-hidden="true">↗</span>}</button>
    </form><p className="page-outro">For a quicker response, <a href="tel:+254114998890">call Lewis at +254 114 998 890</a> or <a href="https://wa.me/254114998890" target="_blank" rel="noopener noreferrer">message him on WhatsApp</a>. The WhatsApp Channel is for updates.</p>
  </ContentPage>;
}
function Field({ label, name, value, onChange, error, required, optional, ...props }) {
  return <div className="field"><label htmlFor={name}>{label} {optional ? <span className="optional">(optional)</span> : required && <i>*</i>}</label><input id={name} name={name} value={value} onChange={onChange} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props}/>{error && <span className="field-error" id={`${name}-error`}>{error}</span>}</div>;
}

const pageComponents = {
  '/': HomePage, '/homes': HomesPage, '/projects': ProjectsPage, '/testimonials': TestimonialsPage, '/about-lewis': AboutPage, '/enquire': EnquiryPage,
  '/how-it-works': HowPage, '/viewing-checklist': ChecklistPage, '/buying-guide': GuidePage,
  '/faqs': FAQPage, '/willstone-homes': WillstonePage,
  '/manna-residence': () => <ProjectDetailPage slug="manna-residence" canonicalPath="/projects/manna-residence"/>, '/mangu-grove': () => <ProjectDetailPage slug="mangu-grove" canonicalPath="/projects/mangu-grove"/>, '/juja-grove': () => <ProjectDetailPage slug="juja-grove" canonicalPath="/projects/juja-grove"/>,
  '/areas': AreasPage, '/privacy': PrivacyPage,
};

function NotFound() {
  usePageMeta('Page not found', 'That page could not be found. Return home or browse verified homes on Homes with Lew¥.');
  return <main className="not-found" aria-labelledby="not-found-title"><div className="not-found-copy"><Eyebrow>A small detour</Eyebrow><p className="not-found-code">404</p><h1 id="not-found-title">This page isn’t<br/><em>home.</em></h1><p className="not-found-message">We couldn’t find that address. Let’s get you back to somewhere familiar.</p><div className="not-found-actions"><ButtonLink href="/">Back to homepage</ButtonLink><a className="text-link" href="/homes">Browse verified homes <span aria-hidden="true">↗</span></a></div></div><div className="not-found-art" aria-hidden="true"><div className="art-sun"/><svg viewBox="0 0 440 350" role="presentation"><path className="art-hill" d="M0 302c60-49 124-53 196-15 63 33 141 16 244-38v101H0z"/><path className="art-house" d="M92 168 219 62l128 106v142H92z"/><path className="art-roof" d="m67 177 152-126 153 126-15 17L219 76 82 194z"/><path className="art-window" d="M132 191h50v52h-50zm123 0h50v52h-50z"/><path className="art-door" d="M195 222h49v88h-49z"/><circle className="art-knob" cx="232" cy="267" r="3"/><path className="art-path" d="M183 310h73l54 40H127z"/><path className="art-plant" d="M54 298v-44m0 25c-18-3-24-13-22-27 15 2 23 11 22 27m0-10c17-4 24-14 22-28-15 3-23 13-22 28m330 28v-39m0 23c-17-2-23-12-21-25 14 2 22 10 21 25m0-8c16-3 22-12 20-25-13 3-20 11-20 25"/></svg><div className="art-label"><span className="note-dot"/>A place to start again</div></div></main>;
}

function QuickContact() { return <aside className="quick-contact" aria-label="Contact Lewis"><a href="tel:+254114998890">Call Lewis</a><a href="https://wa.me/254114998890" target="_blank" rel="noopener noreferrer">WhatsApp</a></aside>; }

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/admin') return <Suspense fallback={<main className="admin-gate"><p className="admin-loading">Loading the owner dashboard…</p></main>}><AdminPage/></Suspense>;
  const detailSlug = path.startsWith('/projects/') ? path.slice('/projects/'.length) : null;
  const Page = detailSlug ? () => <ProjectDetailPage slug={detailSlug}/> : pageComponents[path] || NotFound;
  const isProjectDetail = Boolean(detailSlug) || ['/manna-residence', '/mangu-grove', '/juja-grove'].includes(path);
  return <><a className="skip-link" href="#main">Skip to content</a><div id="top"><Header/></div><div id="main"><Page/></div>{!isProjectDetail && <QuickContact/>}<Footer/><ChatWidget lifted={isProjectDetail}/></>;
}

