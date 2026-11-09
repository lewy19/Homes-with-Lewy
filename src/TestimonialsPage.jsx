import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';
import './testimonials.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

function Stars({ value, label }) {
  return <span className="testimonial-stars" aria-label={label || `${value} out of 5 stars`}>
    {STAR_VALUES.map(star => <span key={star} aria-hidden="true" className={star <= value ? 'is-filled' : ''}>★</span>)}
  </span>;
}

function LockIcon() {
  return <svg className="testimonial-lock-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="10" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 14v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export default function TestimonialsPage() {
  const [session, setSession] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rating, setRating] = useState(0);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({ display_name: '', comment: '', website: '' });

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    let active = true;
    supabase.from('testimonials').select('id,display_name,rating,comment,created_at').eq('status', 'approved').eq('consent_public', true).order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError('Testimonials are temporarily unavailable. Please try again later.');
        else setReviews(data || []);
        setLoading(false);
      });
    supabase.auth.getSession().then(({ data }) => { if (active) setSession(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { if (active) setSession(next); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) { setMyReview(null); return undefined; }
    let active = true;
    const user = session.user;
    const suggestedName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    setForm(current => ({ ...current, display_name: current.display_name || suggestedName }));
    supabase.from('testimonials').select('id,status,created_at').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (active) setMyReview(data || null);
    });
    return () => { active = false; };
  }, [session?.user?.id]);

  async function signIn() {
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/testimonials` },
    });
    if (authError) { setError(`Google sign-in could not start: ${authError.message}`); setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (form.website) return;
    if (!session?.user?.id || !supabase) { setError('Sign in with Google to submit feedback.'); return; }
    if (form.display_name.trim().length < 2 || form.comment.trim().length < 20 || form.comment.trim().length > 2000 || rating < 1 || rating > 5 || !consent) {
      setError('Add a display name, choose a star rating, write at least 20 characters, and agree to public display.');
      return;
    }
    setBusy(true); setError(''); setNotice('Sending your feedback…');
    const { data, error: insertError } = await supabase.from('testimonials').insert({
      user_id: session.user.id,
      display_name: form.display_name.trim(),
      rating,
      comment: form.comment.trim(),
      consent_public: true,
      status: 'pending',
    }).select('id,status,created_at').single();
    setBusy(false);
    if (insertError) {
      setNotice('');
      setError(insertError.code === '23505' ? 'This Google account has already submitted feedback.' : 'We could not submit your feedback. Check that the testimonials database setup has been applied, then try again.');
      return;
    }
    setMyReview(data);
    setNotice('Thanks for sharing your feedback. It will appear here after review.');
    setForm(current => ({ ...current, comment: '', website: '' }));
    setRating(0); setConsent(false);
  }

  return <main className="testimonials-page">
    <header className="testimonials-intro">
      <p className="eyebrow"><span className="eyebrow-line"/>A place for your voice</p>
      <h1>Experiences, shared<br/><em>in their own words.</em></h1>
      <p>Have you spoken with Lewis or explored a Willstone Homes development? Share your experience to help other visitors know what to expect.</p>
      <p className="testimonials-transparency">Feedback is reviewed before publication. Sign-in helps limit spam; it does not independently verify a property purchase or client relationship.</p>
    </header>

    <section className="testimonial-list" aria-labelledby="testimonial-list-title">
      <div className="testimonial-section-heading"><div><p className="eyebrow">Community feedback</p><h2 id="testimonial-list-title">What people <em>have shared.</em></h2></div><span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
      {loading ? <p className="testimonial-empty" role="status">Loading feedback…</p>
        : reviews.length ? <div className="testimonial-grid">{reviews.map(review => <article className="testimonial-card" key={review.id}>
          <Stars value={review.rating}/><blockquote>{review.comment}</blockquote>
          <div className="testimonial-attribution"><strong>{review.display_name}</strong><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}</time></div>
        </article>)}</div>
          : <div className="testimonial-empty"><span aria-hidden="true">✳</span><h3>{isSupabaseConfigured ? 'No published feedback yet.' : 'Feedback is not connected yet.'}</h3><p>{isSupabaseConfigured ? 'When someone shares feedback and it is approved for display, it will appear here.' : 'The public site can be browsed without signing in. Feedback will appear here after the testimonials database is configured.'}</p></div>}
      {error && <p className="testimonial-error" role="alert">{error}</p>}
    </section>

    <section className="testimonial-submit" aria-labelledby="testimonial-submit-title">
      <div className="testimonial-submit-copy"><p className="eyebrow">Share your experience</p><h2 id="testimonial-submit-title">A few words can help someone <em>feel at home.</em></h2><p>You can browse this page and the rest of the website without an account. Google sign-in is only needed to submit feedback.</p></div>
      {!isSupabaseConfigured ? <div className="testimonial-signin"><p>Feedback submissions are not connected yet. You can still browse all public pages without signing in.</p></div>
        : !session ? <div className="testimonial-signin"><div className="testimonial-access-label"><span className="testimonial-lock-wrap"><LockIcon/></span><span><strong>Private feedback access</strong><small>Sign-in is only needed to submit a review.</small></span></div><p>Sign in with Google when you’re ready to write a review. Your feedback stays private until it’s approved.</p><button type="button" className="button button-dark" onClick={signIn} disabled={busy}>{busy ? 'Opening Google…' : 'Sign in to share feedback'} <span aria-hidden="true">↗</span></button></div>
          : myReview ? <div className="testimonial-pending"><span aria-hidden="true">✓</span><div><strong>Feedback received</strong><p>{myReview.status === 'approved' ? 'Your feedback is published above.' : myReview.status === 'rejected' ? 'This submission was not published. Contact Lewis if you have a question.' : 'Your feedback is awaiting review. It is not public yet.'}</p></div><button type="button" className="testimonial-signout" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
            : <form className="testimonial-form" onSubmit={submit}>
              <p className="testimonial-account">Signed in as <strong>{session.user.email}</strong></p>
              <label className="testimonial-field">Name to show publicly<input required minLength="2" maxLength="80" autoComplete="name" value={form.display_name} onChange={event => setForm(current => ({ ...current, display_name: event.target.value }))}/></label>
              <fieldset className="testimonial-rating"><legend>Your rating <span aria-hidden="true">*</span></legend><div>{STAR_VALUES.map(value => <button type="button" key={value} className={value <= rating ? 'selected' : ''} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} aria-pressed={rating === value} onClick={() => setRating(value)}>★</button>)}</div><small>{rating ? `${rating} out of 5` : 'Choose a rating'}</small></fieldset>
              <label className="testimonial-field">Your experience<textarea required minLength="20" maxLength="2000" rows="5" value={form.comment} onChange={event => setForm(current => ({ ...current, comment: event.target.value }))} placeholder="Share what your experience was like. Please don’t include private contact or financial details."/></label>
              <label className="testimonial-honeypot" aria-hidden="true">Leave this field empty<input tabIndex="-1" autoComplete="off" name="website" value={form.website} onChange={event => setForm(current => ({ ...current, website: event.target.value }))}/></label>
              <label className="testimonial-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I agree that this feedback and the name above may be displayed publicly if approved. <strong>*</strong></span></label>
              {notice && <p className="testimonial-notice" role="status" aria-live="polite">{notice}</p>}{error && <p className="testimonial-error" role="alert">{error}</p>}
              <button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'} <span aria-hidden="true">↗</span></button>
              <p className="testimonial-privacy">Your Google account email is used for sign-in and spam prevention; it is not shown publicly. Don’t include sensitive information in your feedback.</p>
            </form>}
    </section>
    <section className="testimonial-contact"><h2>Questions about a home?</h2><p>For current prices, availability or a viewing, contact Lewis directly.</p><div><a href="https://wa.me/254114998890?text=Hi%20Lewy%2C%20I%20have%20a%20question%20about%20a%20home." target="_blank" rel="noopener noreferrer">WhatsApp Lewis ↗</a><a href="/enquire">Make an enquiry ↗</a></div></section>
  </main>;
}
