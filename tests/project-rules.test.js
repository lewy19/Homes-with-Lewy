import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatKES, hasRealValue, isDuplicateEnquiry, isProjectImagePath,
  isSpamHoneypotFilled, normalizeKenyanPhone, projectCompleteness,
  projectPresentation, projectStartingPrice, verificationFreshness,
  whatsappProjectUrl,
} from '../src/domain/rules.js';
import { isAuthorizedAdmin, leadStatusIsValid, leadsToCsv, summarizeLeads, trackingContext } from '../src/domain/dashboard-rules.js';
import { projects } from '../src/data/projects.js';

test('A: only real values render; empty and placeholder strings are omitted', () => {
  for (const value of [null, undefined, '', '   ', 'TBC', 'to confirm', false]) assert.equal(hasRealValue(value), false);
  assert.equal(hasRealValue('KES 3.75M'), true);
  assert.equal(hasRealValue(0), true);
});

test('B: only positive prices render and multi-unit projects use the lowest price', () => {
  assert.equal(formatKES(13_850_000), 'KES 13.85M');
  assert.equal(formatKES(20_500_000), 'KES 20.5M');
  assert.equal(formatKES(0), null);
  assert.equal(projectStartingPrice({ unitTypes: [{ price: 100 }, { price: 50 }, { price: 0 }] }), 50);
});

test('C: sold out and coming soon have the required action behavior', () => {
  const project = { priceFrom: 100, paymentPlan: { deposit: '10%' } };
  assert.deepEqual(projectPresentation({ ...project, status: 'sold out' }), {
    status: 'sold out', price: null, showPaymentPlan: false, mainAction: 'Join the waitlist', showViewing: false,
  });
  assert.equal(projectPresentation({ ...project, status: 'coming soon' }).mainAction, 'Get notified');
  assert.equal(projectPresentation({ ...project, status: 'coming soon' }).showViewing, false);
  assert.equal(projectPresentation({ ...project, status: 'selling' }).showViewing, true);
  assert.equal(projectPresentation({ ...project, status: null }).mainAction, 'Ask about availability');
  assert.equal(projectPresentation({ ...project, status: null }).showViewing, false);
});

test('D: freshness is stale after 30 days and missing dates are unknown', () => {
  const now = new Date('2026-11-09T12:00:00');
  assert.equal(verificationFreshness('2026-10-10', now).stale, false);
  assert.equal(verificationFreshness('2026-10-09', now).stale, true);
  assert.deepEqual(verificationFreshness('', now), { known: false, stale: false });
});

test('E: project completeness counts known key details and reports missing keys', () => {
  const result = projectCompleteness({
    priceFrom: 100, location: { area: 'Joska', landmarkRoad: 'Kangundo Road' },
    gallery: [{ src: '/x', alt: 'house' }],
  });
  assert.equal(result.complete, 3);
  assert.equal(result.total, 9);
  assert.deepEqual(result.missing, ['plot size', 'title status', 'payment plan', 'security', 'water', 'electricity']);
});

test('F: Kenyan mobile formats normalize; invalid numbers, honeypots and recent duplicate enquiries fail', () => {
  for (const phone of ['0712345678', '0112345678', '+254712345678', '254112345678', '0712 345 678']) {
    assert.match(normalizeKenyanPhone(phone), /^\+254[17]\d{8}$/);
  }
  assert.equal(normalizeKenyanPhone('12345'), null);
  assert.equal(isSpamHoneypotFilled(''), false);
  assert.equal(isSpamHoneypotFilled('bot value'), true);
  const row = { phone: '+254712345678', property_title: 'Juja Grove', created_at: '2026-11-09T11:55:00Z' };
  const candidate = { phone: row.phone, project: 'Juja Grove' };
  assert.equal(isDuplicateEnquiry([row], candidate, Date.parse('2026-11-09T12:00:00Z')), true);
  assert.equal(isDuplicateEnquiry([row], candidate, Date.parse('2026-11-09T12:06:00Z')), false);
});

test('G: WhatsApp text is encoded and includes project name and page URL', () => {
  const url = whatsappProjectUrl('254114998890', 'Whitepark 2 Estate', 'https://example.test/projects/whitepark-2-estate?utm_source=instagram');
  const decoded = new URL(url).searchParams.get('text');
  assert.match(decoded, /Whitepark 2 Estate/);
  assert.match(decoded, /https:\/\/example\.test\/projects\/whitepark-2-estate\?utm_source=instagram/);
  assert.match(url, /%20/);
});

test('H: project image ownership is checked against a slug path segment', () => {
  const project = { slug: 'manna-residence' };
  assert.equal(isProjectImagePath(project, '/images/manna-residence/front.jpg'), true);
  assert.equal(isProjectImagePath(project, '/images/white-park-2/front.jpg'), false);
  for (const item of projects) {
    for (const image of [item.heroImage, ...(item.gallery || []), item.floorPlan].filter(Boolean)) {
      assert.equal(Boolean(image.alt?.trim()), true, `${item.slug} image needs alt text`);
      assert.equal(isProjectImagePath(item, image.src), true, `${item.slug} image path should include its slug`);
    }
  }
});

test('Public footer contains no clickable admin route', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /href=["']\/admin(?:["'/?#])/);
});

test('Admin security helper denies missing sessions and unknown accounts', () => {
  assert.equal(isAuthorizedAdmin(null), false);
  assert.equal(isAuthorizedAdmin({ user: { email: 'visitor@example.com' } }), false);
  assert.equal(isAuthorizedAdmin({ user: { email: ' LewisNjuguna926@gmail.com ' } }), true);
});

test('Lead status updates accept only the published workflow states', () => {
  for (const status of ['New', 'Contacted', 'Viewing booked', 'Negotiating', 'Won', 'Lost']) assert.equal(leadStatusIsValid(status), true);
  assert.equal(leadStatusIsValid('Spam'), false);
});

test('CSV export quotes and escapes user-provided values', () => {
  const csv = leadsToCsv([{ name: 'Lewis, "Lewy"', message: 'line 1\nline 2', status: 'New', contact_consent: true }]);
  assert.match(csv, /"Lewis, ""Lewy"""/);
  assert.match(csv, /"line 1\nline 2"/);
  assert.match(csv, /"Consent"/);
});

test('Tracking captures campaign, source and device without identifiers', () => {
  const event = trackingContext({ url: 'https://homes-with-lewy.vercel.app/projects/juja-grove?utm_source=whatsapp&utm_campaign=juja_launch', userAgent: 'Android Mobile', pathname: '/projects/juja-grove' });
  assert.deepEqual(event, { source: 'whatsapp', campaign: 'juja_launch', device: 'mobile', page_path: '/projects/juja-grove' });
  assert.equal(trackingContext({ url: 'https://homes-with-lewy.vercel.app/', referrer: 'https://www.google.com/search?q=home' }).source, 'search');
});

test('Lead overview summarizes time windows, follow-up and project rank', () => {
  const now = Date.parse('2026-11-09T12:00:00Z');
  const rows = [
    { name: 'a', property_title: 'Juja Grove', status: 'New', created_at: new Date(now - 60_000).toISOString() },
    { name: 'b', property_title: 'Juja Grove', status: 'Won', created_at: new Date(now - 3 * 86_400_000).toISOString() },
    { name: 'c', property_title: 'Manna Residence', status: 'Contacted', created_at: new Date(now - 40 * 86_400_000).toISOString() },
  ];
  const result = summarizeLeads(rows, now);
  assert.equal(result.today, 1);
  assert.equal(result.sevenDays, 2);
  assert.equal(result.thirtyDays, 2);
  assert.equal(result.awaitingFollowUp, 1);
  assert.equal(result.topProjects[0].project, 'Juja Grove');
  assert.equal(result.lastTen.length, 3);
});
