import { useEffect, useRef, useState } from 'react';
import { properties as localProperties } from './data/properties.js';
import { supabase } from './lib/supabase.js';
import './chat-widget.css';

const quickPrompts = ['Explore homes', 'Tell me about Whitepark 2', 'Talk to Lewis'];

function makeReply(message, homes) {
  const text = message.toLowerCase();
  if (/^(hi|hello|hey|habari)\b/.test(text)) {
    return { text: 'Hi! I can help you explore the website and share confirmed information. What would you like to know?' };
  }
  if (/white ?park|joska|bungalow|dsq|driveway|garden|compound/.test(text)) {
    return {
      text: 'Whitepark 2 Estate is described as a modern gated community in Joska, along Kangundo Road near the Greater Eastern Bypass. The information provided describes 3-bedroom bungalows with DSQ, cabro-paved driveways, an own compound and garden, on 50-by-100 pieces of land (the unit was not specified). Ask Lewis or Willstone Homes to confirm current details and availability.',
      links: [{ label: 'Ask about Whitepark 2', href: '/enquire?property=Whitepark%202%20Estate' }],
    };
  }
  if (/price|cost|budget|available|availability|for sale/.test(text)) {
    return {
      text: 'I don’t have confirmed current prices or availability. Please ask Lewis so he can check with Willstone Homes.',
      links: [{ label: 'Send an enquiry', href: '/enquire' }, { label: 'Browse verified homes', href: '/homes' }],
    };
  }
  if (/home|house|listing|property|properties/.test(text)) {
    if (!homes.length) {
      return { text: 'There are no verified property listings currently displayed. Check the Homes page for updates, or send a general enquiry.', links: [{ label: 'Open Homes', href: '/homes' }, { label: 'Send an enquiry', href: '/enquire' }] };
    }
    const list = homes.slice(0, 4).map(home => `${home.title} — ${home.location}${home.price && home.currency ? ` · ${home.currency} ${new Intl.NumberFormat().format(home.price)}` : ''}`).join('\n');
    return { text: `These verified listings are currently shown on the site:\n${list}\n\nPlease confirm current availability and details with Willstone Homes.`, links: [{ label: 'See all homes', href: '/homes' }, { label: 'Ask Lewis', href: '/enquire' }] };
  }
  if (/lewis|who are you|about/.test(text)) {
    return { text: 'Lewis Njuguna works in IT support and also promotes and sells homes for Willstone Homes. This site does not describe him as a licensed real estate agent or broker.', links: [{ label: 'About Lewis', href: '/about-lewis' }] };
  }
  if (/buy|buying|view|viewing|checklist/.test(text)) {
    return { text: 'The buying guide and viewing checklist can help you organise your questions. Confirm property, legal and financial details with the relevant professionals.', links: [{ label: 'Home buying guide', href: '/buying-guide' }, { label: 'Viewing checklist', href: '/viewing-checklist' }] };
  }
  if (/whatsapp/.test(text)) {
    return { text: 'The WhatsApp Channel shares updates. For a question about a property, send Lewis an enquiry.', links: [{ label: 'Open WhatsApp Channel', href: 'https://whatsapp.com/channel/0029VbAtw1UKbYMNrzgEqS0g' }, { label: 'Send an enquiry', href: '/enquire' }] };
  }
  if (/contact|enquir|message|talk|human|help/.test(text)) {
    return { text: 'You can send Lewis a message through the enquiry form. The private dashboard is for managing enquiries after the site is connected to Supabase.', links: [{ label: 'Contact Lewis', href: '/enquire' }] };
  }
  return { text: 'I can help with confirmed site information and navigation. Try asking about Whitepark 2, current listings, Lewis, the buying guide, or send Lewis an enquiry.' };
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [homes, setHomes] = useState(() => localProperties.filter(home => home.verified && home.published));
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! I’m the Homes with Lew¥ site helper. Ask me about the site or a home. I’m automated; I can’t confirm live prices or availability.' }]);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.from('properties').select('title,location,price,currency,verified,published').eq('verified', true).eq('published', true).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (active && !error) setHomes(data || []);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [open, messages, busy]);

  function submit(event, preset) {
    event?.preventDefault();
    const question = (preset || input).trim();
    if (!question || busy) return;
    setMessages(current => [...current, { from: 'user', text: question }]);
    setInput('');
    setBusy(true);
    window.setTimeout(() => {
      setMessages(current => [...current, { from: 'bot', ...makeReply(question, homes) }]);
      setBusy(false);
    }, 350);
  }

  return <div className="chat-widget">
    {open && <section id="homes-chat" className="chat-panel" aria-label="Homes with Lew¥ site helper">
      <header className="chat-header"><span className="chat-avatar" aria-hidden="true">LN</span><span className="chat-title"><strong>Homes with Lew¥</strong><small>Automated site helper</small></span><button className="chat-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions text" ref={logRef}>
        {messages.map((message, index) => <article className={`chat-message ${message.from}`} key={`${index}-${message.from}`}><p>{message.text}</p>{message.links?.length > 0 && <div className="chat-actions">{message.links.map(link => <a key={link.href} href={link.href}>{link.label} ↗</a>)}</div>}</article>)}
        {busy && <p className="chat-thinking" role="status">Preparing a reply…</p>}
      </div>
      {messages.length === 1 && <div className="chat-prompts" aria-label="Suggested questions">{quickPrompts.map(prompt => <button type="button" key={prompt} onClick={event => submit(event, prompt)}>{prompt}</button>)}</div>}
      <form className="chat-input-row" onSubmit={submit}><label className="visually-hidden" htmlFor="site-chat-input">Your message</label><input id="site-chat-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} placeholder="Ask a question…" maxLength={500}/><button type="submit" disabled={!input.trim() || busy} aria-label="Send message">Send</button></form>
      <p className="chat-disclaimer">Automated replies use site information. Messages stay in this browser and aren’t sent or saved. Confirm property details with Willstone Homes.</p>
    </section>}
    <button className="chat-launcher" type="button" aria-expanded={open} aria-controls="homes-chat" onClick={() => setOpen(value => !value)}><span className="chat-launch-icon" aria-hidden="true">{open ? '×' : '✳'}</span><span>{open ? 'Close' : 'Ask us'}</span></button>
  </div>;
}
