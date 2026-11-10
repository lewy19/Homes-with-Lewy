import { useEffect, useState } from 'react';
import { ProjectCards, ProjectSearchBar } from './ProjectPages.jsx';
import { supabase } from './lib/supabase.js';
import './home-designs.css';

const phone = '254114998890';

const sharedAlbum = 'https://photos.google.com/share/AF1QipOu3va-AAbotEKb8fu-8ySY73u4rHnFZZk05JHmJQNplyM7dWvIyXhvoqKeFpYfQw?key=UzlyRDRWcHduRWZ2U2tSb1NXWjhJRW8wM1NiOU53';

export function MansionetteAlbum({ compact = false }) {
  const images = [
    ['/images/mansionatte/mansionatte-01.jpg', 'Modern two-storey home photographed beside neighboring homes under construction.'],
    ['/images/mansionatte/mansionatte-06.jpg', 'Exterior view of a contemporary two-storey home with a pitched roof.'],
    ['/images/mansionatte/mansionatte-11.jpg', 'Modern home with a driveway and private compound.'],
  ];
  return <section className={`mansionette-album section-pad${compact ? ' is-compact' : ''}`} aria-labelledby="mansionette-album-title">
    <header><p className="eyebrow"><span className="eyebrow-line"/>Shared project imagery</p><h2 id="mansionette-album-title">A look at homes<br/><em>from the photo album.</em></h2><p>These images were shared in the “Mansionatte Photos” album. They are not verified as belonging to a specific development or available listing. Ask Lewis to confirm project details.</p></header>
    <div className="mansionette-album-grid">{images.map(([src, alt]) => <figure key={src}><img src={src} alt={alt} loading="lazy"/><figcaption>Photo from the shared album</figcaption></figure>)}</div>
    <a className="text-link" href={sharedAlbum} target="_blank" rel="noopener noreferrer">Open the shared photo album <span aria-hidden="true">↗</span></a>
  </section>;
}

function TrustStrip({ dark = false }) {
  return <section className={`home-trust-strip${dark ? ' is-dark' : ''}`} aria-label="About this portfolio">
    <div><span>01</span><p><strong>Authorized connection</strong><small>Lewis is authorized by Willstone Homes to promote and sell its homes.</small></p></div>
    <div><span>02</span><p><strong>Kenyan developments</strong><small>Explore shared projects in Joska, Ruiru, Mangu and Juja.</small></p></div>
    <div><span>03</span><p><strong>Speak with Lewis</strong><small>Ask about current prices, availability or arranging a visit.</small></p></div>
  </section>;
}

function ContactLinks({ light = false }) {
  return <div className={`home-contact-links${light ? ' is-light' : ''}`}>
    <a className="button button-dark" href="/projects">Explore developments <span aria-hidden="true">↗</span></a>
    <a className="home-contact-secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">WhatsApp Lewis</a>
    <a className="home-contact-secondary" href={`tel:+${phone}`}>Call Lewis</a>
  </div>;
}

function ProjectIntro() {
  return <header className="home-project-heading">
    <div><p className="eyebrow"><span className="eyebrow-line"/>Explore real options</p><h2>Projects to <em>compare.</em></h2></div>
    <p>See what is known at a glance, then open a project for its details. Prices and availability can change; Lewis can check the latest with Willstone Homes.</p>
  </header>;
}

function ProcessSteps() {
  const steps = [
    ['01', 'Tell Lewis', 'Share the area, budget or type of property you have in mind.'],
    ['02', 'Explore options', 'Compare the project details currently available.'],
    ['03', 'Arrange a visit', 'Ask Lewis about visiting a project or site.'],
    ['04', 'Review the details', 'Confirm price, availability and sale terms before deciding.'],
  ];
  return <section className="home-process section-pad" aria-labelledby="home-process-title">
    <header><p className="eyebrow"><span className="eyebrow-line"/>A clear next step</p><h2 id="home-process-title">A straightforward way <em>forward.</em></h2></header>
    <ol>{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
  </section>;
}

function HomeTestimonials() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('testimonials').select('id,display_name,rating,comment').eq('status', 'approved').eq('consent_public', true).order('created_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { if (active && !error) setReviews(data || []); });
    return () => { active = false; };
  }, []);
  if (!reviews.length) return null;
  return <section className="home-testimonials section-pad" aria-labelledby="home-reviews-title">
    <header><p className="eyebrow"><span className="eyebrow-line"/>Shared with permission</p><h2 id="home-reviews-title">A few words from <em>visitors.</em></h2><p>Reviews are shown after approval and with the writer’s permission.</p></header>
    <div className="home-testimonial-grid">{reviews.map(review => <article key={review.id}><div aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}<span>{'☆'.repeat(5 - review.rating)}</span></div><blockquote>{review.comment}</blockquote><p>{review.display_name}</p></article>)}</div>
    <a className="text-link" href="/testimonials">Read or share an experience <span aria-hidden="true">↗</span></a>
  </section>;
}

export function ClientFirstHome() {
  return <main className="home-design home-design-client">
    <section className="client-hero section-pad" id="top">
      <div className="client-hero-copy"><p className="eyebrow"><span className="eyebrow-line"/>Homes and plots in Kenya</p><h1>Find the right place<br/>with <em>clear details.</em></h1><p>Explore Willstone Homes developments shared by Lewis. Compare locations and known prices, then ask him to confirm the latest details.</p><ContactLinks/><small>Architectural images are labelled. Project details are shared as received.</small></div>
      <figure><img src="/images/whitepark-2-estate/whitepark-render-01.jpeg" alt="Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents" fetchPriority="high"/><figcaption>Whitepark 2 Estate · Architectural render, illustrative design</figcaption></figure>
      <a className="client-hero-scroll" href="#developments">Browse developments ↓</a>
    </section>
    <TrustStrip/>
    <section className="client-projects section-pad" id="developments"><ProjectIntro/><ProjectCards/><p className="home-project-note">A project without a photo is shown without a property image. Open its details to see the information currently available.</p></section>
    <ProcessSteps/>
    <section className="home-story section-pad"><figure><img src="/images/whitepark-2-estate/progress-02.jpg" alt="Site progress photo showing homes under construction at Whitepark 2 Estate" loading="lazy"/><figcaption>Whitepark 2 · Site progress photo</figcaption></figure><div><p className="eyebrow"><span className="eyebrow-line"/>The person behind the page</p><h2>A real person.<br/><em>A practical approach.</em></h2><p>I’m Lewis Njuguna. I work in IT support and am authorized by Willstone Homes to promote and sell its homes. I can help you ask questions and confirm project details.</p><a className="text-link" href="/about-lewis">Get to know Lewis <span aria-hidden="true">↗</span></a></div></section>
    <section className="home-closing section-pad"><p className="eyebrow"><span className="eyebrow-line"/>No pressure, just a conversation</p><h2>Tell Lewis what<br/>you’re <em>looking for.</em></h2><p>Share your questions or ask about arranging a visit.</p><ContactLinks light/></section>
  </main>;
}

export function NexoraHome() {
  return <main className="home-design home-design-nexora">
    <section className="nexora-hero" id="top"><img src="/images/whitepark-2-estate/whitepark-render-02.jpeg" alt="Architectural render of a proposed Whitepark 2 bungalow and driveway" fetchPriority="high"/><div className="nexora-hero-shade"/><div className="nexora-hero-copy"><p className="eyebrow">Homes with Lew¥ · Kenya</p><h1>A clearer way<br/>to find <em>home.</em></h1><p>Explore developments shared by Lewis and Willstone Homes. Compare what is known, then confirm the details before you decide.</p><ContactLinks light/></div><p className="nexora-image-note">Whitepark 2 · Architectural render, illustrative design</p></section>
    <div className="nexora-search"><ProjectSearchBar/><p>Budget results include projects with a known price only. Ask Lewis about unpriced projects.</p></div>
    <TrustStrip dark/>
    <section className="nexora-projects section-pad" id="developments"><ProjectIntro/><ProjectCards/></section>
    <MansionetteAlbum compact/>
    <section className="nexora-story section-pad"><figure><img src="/images/whitepark-2-estate/progress-08.jpg" alt="Aerial site progress photo showing homes under construction at Whitepark 2 Estate" loading="lazy"/><figcaption>Whitepark 2 · Site progress photo</figcaption></figure><div><p className="eyebrow">A person you can speak with</p><h2>Real questions.<br/><em>Clear answers.</em></h2><p>Lewis Njuguna works in IT support and is authorized by Willstone Homes to promote and sell its homes. Ask him about project information, current availability or arranging a visit.</p><a className="text-link" href="/about-lewis">Meet Lewis and learn how he works <span aria-hidden="true">↗</span></a></div></section>
    <ProcessSteps/>
    <HomeTestimonials/>
    <section className="nexora-closing"><div><p className="eyebrow">Ready when you are</p><h2>Start with a<br/><em>conversation.</em></h2><p>Tell Lewis what you are looking for and ask about the projects.</p><a className="nexora-updates-link" href="https://whatsapp.com/channel/0029VbAtw1UKbYMNrzgEqS0g" target="_blank" rel="noopener noreferrer">Follow project updates on the WhatsApp Channel ↗</a></div><ContactLinks light/></section>
  </main>;
}

export function HomepageDesign() {
  return <NexoraHome/>;
}
