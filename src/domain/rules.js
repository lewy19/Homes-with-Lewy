const EMPTY_TEXT = /^(?:tbc|to confirm)$/i;

export function hasRealValue(value) {
  if (value == null || value === false) return false;
  if (typeof value === 'string') return value.trim() !== '' && !EMPTY_TEXT.test(value.trim());
  if (Array.isArray(value)) return value.some(hasRealValue);
  return true;
}

export function projectStartingPrice(project) {
  const prices = [project.priceFrom, ...(project.unitTypes || []).map(unit => unit.price)]
    .filter(price => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function formatKES(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 }).format(millions)}M`;
  }
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`;
}

export function projectPresentation(project) {
  const rawStatus = String(project.status || '').trim().toLowerCase();
  const status = ['selling', 'sold out', 'coming soon'].includes(rawStatus) ? rawStatus : null;
  const soldOut = status === 'sold out';
  const comingSoon = status === 'coming soon';
  const selling = status === 'selling';
  return {
    status,
    price: soldOut ? null : projectStartingPrice(project),
    showPaymentPlan: !soldOut && hasRealValue(project.paymentPlan),
    mainAction: soldOut ? 'Join the waitlist' : comingSoon ? 'Get notified' : selling ? 'Request a viewing' : 'Ask about availability',
    showViewing: selling,
  };
}

export function verificationFreshness(lastVerified, now = new Date()) {
  if (!lastVerified) return { known: false, stale: false };
  const verifiedAt = new Date(`${lastVerified}T00:00:00`);
  if (Number.isNaN(verifiedAt.getTime())) return { known: false, stale: false };
  const ageDays = Math.floor((now.getTime() - verifiedAt.getTime()) / 86_400_000);
  return { known: true, ageDays, stale: ageDays > 30 };
}

const completenessFields = [
  ['price', project => projectStartingPrice(project) != null],
  ['plot size', project => hasRealValue(project.plotSize)],
  ['title status', project => hasRealValue(project.titleStatus)],
  ['payment plan', project => hasRealValue(project.paymentPlan)],
  ['security', project => hasRealValue(project.security)],
  ['water', project => hasRealValue(project.water)],
  ['electricity', project => hasRealValue(project.electricity)],
  ['gallery', project => hasRealValue(project.gallery)],
  ['location', project => hasRealValue(project.location?.area) && hasRealValue(project.location?.landmarkRoad)],
];

export function projectCompleteness(project) {
  const complete = completenessFields.filter(([, test]) => test(project)).map(([label]) => label);
  const missing = completenessFields.filter(([, test]) => !test(project)).map(([label]) => label);
  return { complete: complete.length, total: completenessFields.length, missing };
}

export function isProjectImagePath(project, imagePath) {
  if (!imagePath || !project?.slug) return false;
  const segments = new URL(imagePath, 'https://local.invalid').pathname.split('/').filter(Boolean);
  return segments.some(segment => segment === project.slug);
}

export function normalizeKenyanPhone(input) {
  if (typeof input !== 'string') return null;
  const compact = input.trim().replace(/[\s().-]/g, '');
  let national;
  if (/^0[17]\d{8}$/.test(compact)) national = compact.slice(1);
  else if (/^254[17]\d{8}$/.test(compact)) national = compact.slice(3);
  else if (/^\+254[17]\d{8}$/.test(compact)) national = compact.slice(4);
  else return null;
  return `+254${national}`;
}

export function isDuplicateEnquiry(existingRows, candidate, now = Date.now()) {
  if (!candidate.phone || !candidate.project) return false;
  return existingRows.some(row => row.phone === candidate.phone
    && row.property_title === candidate.project
    && now - new Date(row.created_at).getTime() >= 0
    && now - new Date(row.created_at).getTime() < 10 * 60_000);
}

export function isSpamHoneypotFilled(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function whatsappProjectUrl(phone, projectName, pageUrl) {
  const message = `Hi Lewy, I'm interested in ${projectName} (${pageUrl}). Please send details.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
