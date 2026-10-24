import { useEffect, useState } from 'react';
import { properties } from './data/properties.js';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import AdminPage from './AdminPage.jsx';

const routes = [
  ['/', 'Home'], ['/homes', 'Homes'], ['/about-lewis', 'About Lewis'],
  ['/enquire', 'Enquire'], ['/how-it-works', 'How it works'],
  ['/viewing-checklist', 'Viewing checklist'], ['/buying-guide', 'Home buying guide'],
  ['/faqs', 'FAQs'], ['/willstone-homes', 'Willstone Homes'], ['/areas', 'Areas'],
  ['/privacy', 'Privacy'],
];
const fallbackWhiteparkProject = {
  title: 'Whitepark 2 Estate',
  slug: 'whitepark-2-estate',
  location: 'Joska, along Kangundo Road near the Greater Eastern Bypass',
  description: 'A modern gated community offering spacious 3-bedroom bungalows with DSQ and cabro-paved driveways. Each is on a 50-by-100 piece of land with its own compound and garden.',
  home_type: '3-bedroom bungalows with DSQ and cabro-paved driveways',
  land_size: '50-by-100 (unit not specified)',
  features: ['Own compound', 'Garden'],
};

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

function useWhiteparkProject() {
  const [project, setProject] = useState(fallbackWhiteparkProject);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('projects').select('*').eq('slug', 'whitepark-2-estate').eq('published', true).maybeSingle().then(({ data, error }) => {
      if (active && !error) setProject(data || null);
    });
    return () => { active = false; };
  }, []);
  return isSupabaseConfigured ? project : project || fallbackWhiteparkProject;
}

function usePageMeta(title, description) {
  useEffect(() => {
    document.title = `${title} | Homes with Lew¥`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${title} | Homes with Lew¥`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }, [title, description]);
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <a className="brand" href="/" aria-label="Homes with Lew¥ home"><span className="brand-mark">H<span>W</span></span><span className="brand-name">Homes with <strong>Lew¥</strong></span></a>
    <nav className="main-nav" aria-label="Main navigation"><a href="/homes">Find a home</a><a href="/about-lewis">About Lewis</a><a className="nav-cta" href="/enquire">Let’s talk <span aria-hidden="true">↗</span></a></nav>
    <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}><span/><span/></button>
    {menuOpen && <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">{routes.slice(1, 5).map(([path, label]) => <a key={path} href={path} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav>}
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
  const redditFallback = { platform: 'reddit', label: 'Reddit', url: 'https://www.reddit.com/user/Mission-Bluebird5874/', owner_scope: 'personal', is_active: true, sort_order: 2 };
  const personalRows = socialLinks?.filter(link => link.owner_scope === 'personal' && link.is_active);
  const personalLinks = socialLinks === null ? [redditFallback] : personalRows;
  const companyLinks = socialLinks?.filter(link => link.owner_scope === 'willstone' && link.is_active);
  const personalPlatforms = ['instagram', 'facebook', 'reddit', 'tiktok', 'youtube'];
  const officialFallback = [
    { label: 'Facebook', url: 'https://www.facebook.com/willstonehomes/' },
    { label: 'Instagram', url: 'https://www.instagram.com/willstone_homes/reel/DB3ND7RohC1/' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@willstone.homes' },
    { label: 'YouTube', url: 'https://www.youtube.com/channel/UCgxMais9RLaUvoVHHAP83mQ' },
  ];
  return <footer className="site-footer"><div className="footer-top"><a className="brand brand-footer" href="/"><span className="brand-mark">H<span>W</span></span><span className="brand-name">Homes with <strong>Lew¥</strong></span></a><p>Making the search for somewhere<br/>feel a little more human.</p><a className="footer-top-link" href="#top">Back to the top ↑</a></div><div className="footer-links">{routes.slice(1).map(([path, label]) => <a key={path} href={path}>{label}</a>)}</div><div className="footer-social" aria-label="Homes with Lew¥ social profiles"><strong>Follow Homes with Lew¥</strong>{personalPlatforms.map(platform => { const link = personalLinks.find(item => item.platform === platform); return link ? <a key={platform} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a> : <span key={platform}>{platform[0].toUpperCase() + platform.slice(1)} · link coming soon</span>; })}{personalLinks.find(item => item.platform === 'whatsapp') ? <a href={personalLinks.find(item => item.platform === 'whatsapp').url} target="_blank" rel="noopener noreferrer">WhatsApp Channel ↗</a> : <a href="https://whatsapp.com/channel/0029VbAtw1UKbYMNrzgEqS0g" target="_blank" rel="noopener noreferrer">WhatsApp Channel ↗</a>}</div><div className="footer-social" aria-label="Official Willstone Homes social profiles"><strong>Follow Willstone Homes</strong>{(companyLinks || officialFallback).map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} Homes with Lew¥ · Lewis Njuguna</span><span>IT support professional · Promotes and sells homes for Willstone Homes</span><a href="/enquire">Start a conversation ↗</a><a className="owner-entry" href="/admin" aria-label="Owner dashboard sign in" title="Owner sign in"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3 7h10v8H3z"/></svg></a></div></footer>;
}

function Eyebrow({ children }) { return <p className="eyebrow"><span className="eyebrow-line"/>{children}</p>; }
function ButtonLink({ href, children, light = false }) { return <a className={`button ${light ? 'button-light' : 'button-dark'}`} href={href}>{children}<span aria-hidden="true">↗</span></a>; }

function PropertyCard({ home }) {
  return <article className="property-card"><img className="property-image" src={home.image} alt={home.imageAlt || ''} loading="lazy"/><div className="property-copy"><span className="verified">✓ Verified with Willstone Homes</span><h3 className="property-title">{home.title}</h3><p className="property-meta">{home.location}</p><div className="property-price">{home.price && home.currency ? `${home.currency} ${new Intl.NumberFormat().format(home.price)}` : 'Price on enquiry'}</div>{(home.beds || home.baths) && <p className="property-details">{home.beds ? `${home.beds} bedrooms` : ''}{home.beds && home.baths ? ' · ' : ''}{home.baths ? `${home.baths} bathrooms` : ''}</p>}{home.summary && <p className="property-details">{home.summary}</p>}<a className="text-link" href={`/enquire?property=${encodeURIComponent(home.title)}`}>Ask about this home <span aria-hidden="true">↗</span></a></div></article>;
}

function ListingSection({ full = false }) {
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
  usePageMeta('Find a place to call home', 'Meet Lewis Njuguna and explore verified Willstone Homes listings. Get in touch about a home that interests you.');
  return <><main><section className="hero" id="top"><div className="hero-copy"><Eyebrow>A considered way home</Eyebrow><h1>A place to<br/>put down <em>roots.</em></h1><p className="hero-intro">Thoughtful guidance, real conversations, and homes worth coming back to.</p><ButtonLink href="/homes">Explore homes</ButtonLink><div className="hero-note"><span className="note-dot"/>Listing details are shared only after verification</div></div><div className="hero-image-wrap"><img className="hero-image" src="/images/mansionatte/mansionatte-06.jpg" alt="Two-story modern home with pale exterior walls, stone accents, dark framed windows, and a walled garden" fetchPriority="high"/><div className="image-caption"><span className="caption-dot"/>Mansionatte · Shared album photo <span className="caption-rule"/> Homes with Lew¥</div><div className="hero-stamp" aria-label="Find your place"><span>FIND YOUR</span><strong>place</strong><span>TO CALL HOME</span><i aria-hidden="true">✳</i></div></div><div className="hero-index"><span>01</span><span className="index-rule"/><span>THE SEARCH STARTS HERE</span></div></section>
    <section className="homes section-pad"><div className="section-heading"><div><Eyebrow>A good place to begin</Eyebrow><h2>Find your <em>somewhere.</em></h2></div><p className="section-aside">A considered selection of homes, shared with care. Every listing shown here will be verified with Willstone Homes.</p></div><ListingSection/><div className="center-link"><a className="text-link" href="/homes">View all homes <span aria-hidden="true">↗</span></a></div></section>
    <ProgressTeaser/>
    <section className="about section-pad"><div className="about-image"><img src="/images/white-park-2/progress-02.jpg" alt="Row of unfinished masonry homes, some with completed roof tiles and one with exposed roof framing" loading="lazy"/><span className="about-image-label">A home is more than four walls.</span><span className="about-image-index">02 / A LITTLE ABOUT LEWIS</span></div><div className="about-copy"><Eyebrow>The person behind the page</Eyebrow><h2>A real person.<br/><em>A practical approach.</em></h2><p className="about-lead">I’m Lewis Njuguna — I work in IT support, and I also promote and sell homes for Willstone Homes.</p><p className="about-body">I bring a problem-solving mindset and a straightforward approach to conversations about finding a home. This page is where I share verified Willstone Homes properties and help you make an enquiry.</p><RoleCard/><a className="text-link" href="/about-lewis">Get to know Lewis <span aria-hidden="true">↗</span></a></div></section>
    <section className="home-cta section-pad"><Eyebrow>Start a conversation</Eyebrow><h2>The right home starts<br/>with <em>a hello.</em></h2><p>Tell Lewis a little about what you’re looking for.</p><ButtonLink href="/enquire">Make an enquiry</ButtonLink></section></main></>;
}

function RoleCard() { return <div className="role-card"><span className="role-icon" aria-hidden="true">✳</span><span><strong>Two roles, one clear introduction.</strong><small>IT support professional · Promotes and sells homes for Willstone Homes</small></span></div>; }

const albumUrl = 'https://photos.google.com/share/AF1QipOu3va-AAbotEKb8fu-8ySY73u4rHnFZZk05JHmJQNplyM7dWvIyXhvoqKeFpYfQw?key=UzlyRDRWcHduRWZ2U2tSb1NXWjhJRW8wM1NiOU53';
const progressPhotos = [
  ['progress-01.jpg', 'Aerial view over rows of unfinished masonry homes at White Park 2, with green fields in the distance.'],
  ['progress-02.jpg', 'A row of unfinished masonry homes, some with tiled roofs and one with exposed roof framing.'],
  ['progress-03.jpg', 'Unfinished masonry walls and room outlines at the White Park 2 construction site.'],
  ['progress-05.jpg', 'Closer view of unfinished masonry walls and building materials on site.'],
  ['progress-06.jpg', 'Aerial view of multiple unfinished homes across a green construction site.'],
  ['progress-07.jpg', 'Aerial angle along a row of unfinished masonry homes beside a dirt access road.'],
  ['progress-08.jpg', 'Wide aerial view of the White Park 2 site with rows of unfinished homes and surrounding greenery.'],
  ['progress-09.jpg', 'Aerial view across unfinished homes, open land and a road at the edge of the site.'],
  ['progress-10.jpg', 'Aerial view of unfinished homes and several partially roofed buildings at the site.'],
  ['progress-11.jpg', 'Wide aerial view of construction progress across multiple rows of unfinished buildings.'],
  ['progress-12.jpg', 'Aerial view down the central dirt road between rows of homes at different construction stages.'],
];

function ProgressTeaser() {
  const project = useWhiteparkProject();
  if (!project) return null;
  return <section className="progress-teaser section-pad"><div className="progress-teaser-copy"><Eyebrow>From the shared album</Eyebrow><h2>A closer look at<br/><em>{project.title}.</em></h2><p>{project.description} See selected site progress photos.</p><a className="text-link" href="/willstone-homes#white-park-2">See project photos <span aria-hidden="true">↗</span></a></div><a className="progress-teaser-image" href="/willstone-homes#white-park-2" aria-label={`View ${project.title} project information and progress photos`}><img src={project.cover_image || '/images/white-park-2/progress-08.jpg'} alt="Aerial view across rows of unfinished homes at White Park 2" loading="lazy"/><span>{project.title} · Site progress</span></a></section>;
}

function ProgressGallery() {
  const project = useWhiteparkProject();
  if (!project) return null;
  return <section className="progress-gallery" id="white-park-2" aria-labelledby="progress-title"><div className="gallery-heading"><Eyebrow>Shared site progress</Eyebrow><h2 id="progress-title">{project.title}</h2><p>Construction progress photos from the album Lewis shared. The project description below was provided by Lewis. Price, availability, and current sale status have not been provided.</p></div><div className="estate-summary"><div><span className="estate-label">THE PROJECT</span><h3>A modern gated community</h3><p>{project.description}</p></div><dl><div><dt>Home type</dt><dd>{project.home_type || 'Details not provided'}</dd></div><div><dt>Land and outdoor space</dt><dd>{[project.land_size, ...(project.features || [])].filter(Boolean).join(' · ') || 'Details not provided'}</dd></div><div><dt>Location</dt><dd>{project.location}</dd></div></dl></div><div className="progress-grid">{progressPhotos.map(([file, alt], index) => <a className="progress-photo" key={file} href={albumUrl} target="_blank" rel="noreferrer" aria-label={`Open the shared album, photo ${index + 1}`}><img src={`/images/white-park-2/${file}`} alt={alt} loading="lazy"/><span className="photo-count">{String(index + 1).padStart(2, '0')}</span></a>)}</div><a className="text-link gallery-link" href={albumUrl} target="_blank" rel="noreferrer">Open the shared Google Photos album <span aria-hidden="true">↗</span></a></section>;
}

const mansionatteAlbumUrl = 'https://photos.google.com/share/AF1QipOgUIyhANUrjDdsCcjJQSN_2HjzmjAaN8ye-BdUCC8DrAHVNGuJ-uy7e0QTDoKTkA?key=NFhnaG5DQzcyeENleFlFSTZ1VEdDZGtMclh5RGVB';

function MansionattePhoto() {
  const photos = [
    'Two-story home with pale exterior walls, dark-framed windows and stone accents, viewed from the front.',
    'Modern two-story home behind a black metal fence, with a green yard and stone exterior accents.',
    'Angled exterior view of a modern two-story home, walled garden and tall glass windows.',
    'Modern home and covered parking area behind a stone perimeter wall.',
    'People standing on the upper terrace of a modern home.',
    'Two-story modern home with pale exterior walls, stone accents, dark framed windows, and a walled garden.',
    'Aerial view over a neighborhood of modern homes with walled yards and varied roof colors.',
    'Aerial view over rows of modern homes with flat roofs and landscaped yards.',
    'Modern two-story home behind a metal fence with a red vehicle in the driveway.',
    'Street-side view of a modern home behind a metal fence and driveway.',
    'Modern two-story home and driveway, photographed from inside the front gate.',
    'Aerial view of a residential development with rows of homes and red pitched roofs.',
    'Partly finished modern home with a worker on a ladder beside the exterior.',
    'Row of single-story homes at different completion stages beside a dirt road.',
    'Modern two-story home beside unfinished masonry buildings at the construction site.',
  ];
  return <section className="mansionatte-feature" aria-labelledby="mansionatte-title"><div className="mansionatte-copy"><Eyebrow>Shared photo album</Eyebrow><h2 id="mansionatte-title">Mansionatte<br/><em>photo gallery.</em></h2><p>Photos from the album Lewis shared, showing homes at different stages. They’re here as project imagery, not verified property listings. No price, location, or availability details have been provided.</p></div><div className="mansionatte-grid">{photos.map((alt, index) => <a className="progress-photo" key={index} href={mansionatteAlbumUrl} target="_blank" rel="noreferrer" aria-label={`Open the Mansionatte shared album, photo ${index + 1}`}><img src={`/images/mansionatte/mansionatte-${String(index + 1).padStart(2, '0')}.jpg`} alt={alt} loading="lazy"/><span className="photo-count">{String(index + 1).padStart(2, '0')}</span></a>)}</div><a className="text-link gallery-link" href={mansionatteAlbumUrl} target="_blank" rel="noreferrer">Open the shared Google Photos album <span aria-hidden="true">↗</span></a></section>;
}

function PageIntro({ eyebrow, title, lead }) { return <div className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{lead && <p>{lead}</p>}</div>; }
function ContentPage({ eyebrow, title, lead, children }) { return <main className="content-main"><PageIntro eyebrow={eyebrow} title={title} lead={lead}/><div className="content-body">{children}</div></main>; }

function HomesPage() {
  usePageMeta('Verified homes', 'Browse verified Willstone Homes listings and enquire about a property that interests you.');
  return <ContentPage eyebrow="The current collection" title={<>Find a home that feels <em>right.</em></>} lead="Browse Willstone Homes properties shared by Lewis. Listings will appear here after their details have been verified."><ListingSection full/></ContentPage>;
}
function AboutPage() {
  usePageMeta('About Lewis Njuguna', 'Meet Lewis Njuguna, an IT support professional who also promotes and sells homes for Willstone Homes.');
  return <ContentPage eyebrow="The person behind the page" title={<>A real person.<br/><em>A practical approach.</em></>} lead="I’m Lewis Njuguna. I work in IT support, and I also promote and sell homes for Willstone Homes."><div className="article-copy"><p>I made Homes with Lew¥ as a place to share verified Willstone Homes listings and make it easier to start a conversation about a home.</p><p>My professional background is in IT support. Alongside that work, I promote and sell homes for Willstone Homes. I aim to keep these roles clear and answer enquiries in a straightforward way.</p><RoleCard/><h2>Here to help you get started</h2><p>Explore the current listings or send a general enquiry if you have a question. Property facts and availability should always be confirmed with Willstone Homes.</p><ButtonLink href="/homes">Explore homes</ButtonLink></div></ContentPage>;
}

function HowPage() {
  usePageMeta('How it works', 'A simple overview of browsing listings and making an enquiry through Homes with Lew¥.');
  const steps = [['01', 'Explore the listings', 'Browse the homes shared here. Each property card is shown only after its listing data has been marked as verified with Willstone Homes.'], ['02', 'Send an enquiry', 'Use the form to share your name, email, the property you’re asking about, and a short message.'], ['03', 'Confirm the details', 'Lewis can respond once a working enquiry destination is connected. Confirm availability, price and property details directly before making decisions.']];
  return <ContentPage eyebrow="A simple place to start" title={<>A clearer path to <em>hello.</em></>} lead="A few straightforward steps from looking around to asking about a home."><div className="steps-grid">{steps.map(([num, heading, text]) => <article className="step-card" key={num}><span>{num}</span><h2>{heading}</h2><p>{text}</p></article>)}</div><div className="notice-box"><strong>About this preview</strong><p>The enquiry form currently validates and prepares your message in the browser. It does not transmit or store your details until a verified contact service is configured.</p></div><ButtonLink href="/enquire">Start an enquiry</ButtonLink></ContentPage>;
}

function ChecklistPage() {
  usePageMeta('Home viewing checklist', 'A practical checklist of questions to consider when viewing a home.');
  const groups = [['The space', 'How does the layout fit your everyday routine?', 'Which rooms, storage areas or outdoor spaces matter most to you?', 'What would you want to measure or check again?'], ['The surroundings', 'What would you like to learn about the nearby area?', 'How will you check travel times and everyday amenities for yourself?', 'Are there times of day you would like to revisit?'], ['The details', 'Which property features or inclusions should be confirmed?', 'What maintenance questions would you like to ask?', 'Have you noted any details to follow up directly with Willstone Homes?']];
  return <ContentPage eyebrow="Take your time" title={<>A little checklist for your <em>visit.</em></>} lead="Use these prompts to organise your own questions when viewing a home. Each property and purchase is different."><div className="checklist-grid">{groups.map(([title, ...items]) => <section className="checklist-card" key={title}><h2>{title}</h2><ul>{items.map(item => <li key={item}><span aria-hidden="true">□</span>{item}</li>)}</ul></section>)}</div><div className="notice-box"><strong>Property information</strong><p>Ask Willstone Homes to confirm specific property details, availability and any terms that apply.</p></div><ButtonLink href="/homes">Browse homes</ButtonLink></ContentPage>;
}

function GuidePage() {
  usePageMeta('Home buying guide', 'General questions to help organise your home search. Confirm financial, legal and property details with qualified local professionals.');
  return <ContentPage eyebrow="Plan at your own pace" title={<>A few first steps for your <em>search.</em></>} lead="A general starting point to help organise what matters to you when looking for a home."><div className="article-copy"><h2>Start with your priorities</h2><p>Write down the areas, home features, timing and budget range that matter to you. Separate essentials from preferences so you can compare options in a way that works for you.</p><h2>Gather the right information</h2><p>For any property you are considering, ask for its current availability, full price and relevant details directly from Willstone Homes. Keep a written record of questions and answers so you can review them later.</p><h2>Get independent advice</h2><p>Property, financing and legal arrangements depend on your own circumstances. Speak to appropriately qualified professionals for advice about financing, contracts, ownership, taxes or legal obligations.</p><h2>Take the time you need</h2><p>Compare what you learn with your priorities. Ask follow-up questions before you make commitments, and make sure the facts you rely on are confirmed by the relevant parties.</p><div className="notice-box"><strong>General information only</strong><p>This page is a planning checklist, not financial, legal or property-specific advice.</p></div><ButtonLink href="/viewing-checklist">See the viewing checklist</ButtonLink></div></ContentPage>;
}

function FAQPage() {
  usePageMeta('Frequently asked questions', 'Answers about listings, Lewis’s roles and making an enquiry through Homes with Lew¥.');
  const faqs = [['Who is Lewis Njuguna?', 'Lewis works in IT support and also promotes and sells homes for Willstone Homes.'], ['Are the properties verified?', 'Only property records explicitly marked as verified with Willstone Homes are displayed. Browse the Homes page for the current listings.'], ['Can I enquire without choosing a property?', 'Yes. You can send a general enquiry and leave the property field blank.'], ['Does this form send my message?', 'Not yet. This preview validates and prepares an enquiry in your browser, but does not send or save it. A verified contact service needs to be connected first.'], ['How can I confirm availability and price?', 'Contact Willstone Homes directly using their verified contact information. Current company contact details have not been provided for this site.'], ['Is Lewis a licensed real estate agent or broker?', 'No licensing or brokerage credentials have been provided, so this site does not describe Lewis that way.']];
  return <ContentPage eyebrow="A few helpful answers" title={<>Good questions, clear <em>answers.</em></>} lead="Here are a few things you may want to know about this page and the homes shared here."><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div><p className="page-outro">Have another question? <a className="inline-link" href="/enquire">Send Lewis an enquiry ↗</a></p></ContentPage>;
}

function WillstonePage() {
  usePageMeta('Willstone Homes', 'Information about Lewis Njuguna’s connection with Willstone Homes and where verified listings appear.');
  return <ContentPage eyebrow="Property listings" title={<>Shared with <em>Willstone Homes.</em></>} lead="Lewis Njuguna promotes and sells homes for Willstone Homes. This page is a personal site for sharing listings and receiving enquiries."><div className="article-copy"><h2>What you’ll find here</h2><p>Homes with Lew¥ is Lewis’s personal property page. Listings are displayed only after their details are verified with Willstone Homes and can be confirmed directly before you make a decision.</p><h2>Company details</h2><p>Official company description, website and contact information have not been provided for this page yet. Add only details confirmed and approved by Willstone Homes.</p><div className="notice-box"><strong>Clear roles</strong><p>Lewis also works in IT support. This site does not describe him as a licensed real estate agent or broker.</p></div><ButtonLink href="/homes">View current listings</ButtonLink></div><MansionattePhoto/><ProgressGallery/></ContentPage>;
}

function AreasPage() {
  usePageMeta('Areas', 'See location information for verified Willstone Homes properties once listings have been added.');
  return <ContentPage eyebrow="Location matters" title={<>Find your place, in the right <em>area.</em></>} lead="Location details will appear alongside each verified Willstone Homes listing."><div className="empty-listings area-empty"><span className="empty-icon" aria-hidden="true">✳</span><h3>Area information is coming soon.</h3><p>No verified property locations have been added yet. Once confirmed listings are available, you’ll be able to explore their locations here.</p><ButtonLink href="/homes">Browse verified homes</ButtonLink></div><p className="page-outro">Have a location in mind? <a className="inline-link" href="/enquire">Share it with Lewis ↗</a></p></ContentPage>;
}

function PrivacyPage() {
  usePageMeta('Privacy', 'How enquiry information is handled in this Homes with Lew¥ website preview.');
  const configuredNotice = isSupabaseConfigured ? 'When you submit the form, your enquiry is sent to the Homes with Lew¥ Supabase database and made available to Lewis through the owner dashboard.' : 'The enquiry form is not connected yet. Information entered here is not sent or saved.';
  return <ContentPage eyebrow="Your information" title={<>A clear note about <em>privacy.</em></>} lead={configuredNotice}><div className="article-copy"><h2>Enquiry information</h2><p>{configuredNotice} Enquiries include the name, email address, optional phone number, selected property and message you provide.</p><h2>Access and handling</h2><p>Dashboard access is restricted to an account explicitly added to the site administrator list. Lewis should review enquiries and remove records that are no longer needed. Do not submit sensitive financial or identity information through this form.</p><h2>Questions</h2><p>Contact Lewis through a verified contact method listed on this website.</p></div></ContentPage>;
}

function EnquiryPage() {
  usePageMeta('Make an enquiry', 'Send Lewis a question about a verified Willstone Homes listing or make a general home enquiry.');
  const verifiedHomes = useVerifiedHomes();
  const requestedProperty = new URLSearchParams(window.location.search).get('property') || '';
  const [form, setForm] = useState({ name: '', email: '', phone: '', property: requestedProperty, message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.phone && !/^[+\d\s().-]{7,20}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number, or leave this blank.';
    if (form.message.trim().length < 10) next.message = 'Please share at least 10 characters.';
    setErrors(next);
    if (Object.keys(next).length) { setStatus({ type: 'error', text: 'Please check the highlighted fields and try again.' }); return; }
    if (!supabase) { setStatus({ type: 'error', text: 'Online enquiries are not connected yet. Your message has not been sent or saved.' }); return; }
    setLoading(true); setStatus({ type: 'loading', text: 'Sending your enquiry…' });
    try {
      const { error } = await supabase.from('enquiries').insert({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, property_title: form.property || null, message: form.message.trim() });
      if (error) throw error;
      setStatus({ type: 'success', text: 'Your enquiry has been sent to Lewis.' });
      setForm({ name: '', email: '', phone: '', property: '', message: '' });
    } catch {
      setStatus({ type: 'error', text: 'We could not send your enquiry. Please try again later.' });
    } finally { setLoading(false); }
  }
  return <ContentPage eyebrow="Start a conversation" title={<>The right home starts<br/>with <em>a hello.</em></>} lead={supabase ? 'Tell Lewis a little about what you’re looking for. Your enquiry will be stored in the owner dashboard.' : 'Tell Lewis a little about what you’re looking for. Online enquiries are not connected yet.'}><form className="enquiry-form" onSubmit={submit} noValidate><div className="form-top"><span>YOUR ENQUIRY</span><span className="required-legend"><i>*</i> Required</span></div><div className="form-row"><Field label="Your name" name="name" value={form.name} onChange={update} error={errors.name} required autoComplete="name" placeholder="Your name"/><Field label="Email address" name="email" type="email" value={form.email} onChange={update} error={errors.email} required autoComplete="email" placeholder="you@example.com"/></div><Field label="Phone number" name="phone" type="tel" value={form.phone} onChange={update} error={errors.phone} autoComplete="tel" placeholder="Your preferred number" optional/><div className="field"><label htmlFor="property">Property of interest <span className="optional">(optional)</span></label><select id="property" name="property" value={form.property} onChange={update}><option value="">General enquiry</option>{verifiedHomes.map(home => <option key={home.title} value={home.title}>{home.title} — {home.location}</option>)}</select></div><div className="field"><label htmlFor="message">What are you looking for? <i>*</i></label><textarea id="message" name="message" rows="4" minLength="10" required value={form.message} onChange={update} placeholder="Tell Lewis what matters to you in a home…" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined}/>{errors.message && <span className="field-error" id="message-error">{errors.message}</span>}</div><p className="form-privacy">{supabase ? 'Your enquiry is stored in Supabase and visible only to an authorized site administrator.' : 'Your details are not sent or saved until the enquiry service is connected.'}</p>{status.text && <div className="form-status" data-state={status.type} role="status" aria-live="polite">{status.text}</div>}<button className="button button-dark submit-button" type="submit" disabled={loading || !supabase}>{loading ? 'Sending your enquiry…' : supabase ? 'Send enquiry' : 'Enquiries not connected'} {supabase && !loading && <span aria-hidden="true">↗</span>}</button></form><p className="page-outro">Prefer to contact Lewis directly? Use the WhatsApp Channel link in the footer for updates.</p></ContentPage>;
}

function Field({ label, name, value, onChange, error, required, optional, ...props }) {
  return <div className="field"><label htmlFor={name}>{label} {optional ? <span className="optional">(optional)</span> : required && <i>*</i>}</label><input id={name} name={name} value={value} onChange={onChange} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props}/>{error && <span className="field-error" id={`${name}-error`}>{error}</span>}</div>;
}

const pageComponents = {
  '/': HomePage, '/homes': HomesPage, '/about-lewis': AboutPage, '/enquire': EnquiryPage,
  '/how-it-works': HowPage, '/viewing-checklist': ChecklistPage, '/buying-guide': GuidePage,
  '/faqs': FAQPage, '/willstone-homes': WillstonePage, '/areas': AreasPage, '/privacy': PrivacyPage,
};

function NotFound() {
  usePageMeta('Page not found', 'That page could not be found. Return home or browse verified homes on Homes with Lew¥.');
  return <main className="not-found" aria-labelledby="not-found-title"><div className="not-found-copy"><Eyebrow>A small detour</Eyebrow><p className="not-found-code">404</p><h1 id="not-found-title">This page isn’t<br/><em>home.</em></h1><p className="not-found-message">We couldn’t find that address. Let’s get you back to somewhere familiar.</p><div className="not-found-actions"><ButtonLink href="/">Back to homepage</ButtonLink><a className="text-link" href="/homes">Browse verified homes <span aria-hidden="true">↗</span></a></div></div><div className="not-found-art" aria-hidden="true"><div className="art-sun"/><svg viewBox="0 0 440 350" role="presentation"><path className="art-hill" d="M0 302c60-49 124-53 196-15 63 33 141 16 244-38v101H0z"/><path className="art-house" d="M92 168 219 62l128 106v142H92z"/><path className="art-roof" d="m67 177 152-126 153 126-15 17L219 76 82 194z"/><path className="art-window" d="M132 191h50v52h-50zm123 0h50v52h-50z"/><path className="art-door" d="M195 222h49v88h-49z"/><circle className="art-knob" cx="232" cy="267" r="3"/><path className="art-path" d="M183 310h73l54 40H127z"/><path className="art-plant" d="M54 298v-44m0 25c-18-3-24-13-22-27 15 2 23 11 22 27m0-10c17-4 24-14 22-28-15 3-23 13-22 28m330 28v-39m0 23c-17-2-23-12-21-25 14 2 22 10 21 25m0-8c16-3 22-12 20-25-13 3-20 11-20 25"/></svg><div className="art-label"><span className="note-dot"/>A place to start again</div></div></main>;
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/admin') return <AdminPage/>;
  const Page = pageComponents[path] || NotFound;
  return <><a className="skip-link" href="#main">Skip to content</a><div id="top"><Header/></div><div id="main"><Page/></div><Footer/></>;
}

