const SITE = 'https://homes-with-lewy.vercel.app';
const STATIC_PATHS = [
  '/', '/homes', '/projects', '/testimonials', '/about-lewis', '/enquire',
  '/how-it-works', '/viewing-checklist', '/buying-guide', '/faqs',
  '/willstone-homes', '/areas', '/privacy',
];
const BUILT_PROJECTS = ['whitepark-2-estate', 'manna-residence', 'mangu-grove', 'juja-grove'];

function xmlEscape(value) {
  return String(value).replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]);
}

export default async function handler(_request, response) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let projects = BUILT_PROJECTS.map(slug => ({ slug }));
  if (url && anonKey) {
    try {
      const result = await fetch(`${url.replace(/\/$/, '')}/rest/v1/projects?select=slug,updated_at&published=eq.true&archived=eq.false`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (result.ok) projects = await result.json();
    } catch (error) {
      console.error('Project sitemap used its built-in project list after Supabase was unavailable.', error);
    }
  }
  const urls = [
    ...STATIC_PATHS.map(path => ({ loc: `${SITE}${path}` })),
    ...projects.filter(project => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)).map(project => ({
      loc: `${SITE}/projects/${project.slug}`,
      ...(project.updated_at ? { lastmod: new Date(project.updated_at).toISOString().slice(0, 10) } : {}),
    })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(item => `<url><loc>${xmlEscape(item.loc)}</loc>${item.lastmod ? `<lastmod>${xmlEscape(item.lastmod)}</lastmod>` : ''}</url>`).join('')}</urlset>`;
  response.setHeader('Content-Type', 'application/xml; charset=utf-8');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  response.status(200).send(body);
}
