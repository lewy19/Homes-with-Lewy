import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { projects as projectData } from '../src/data/projects.js';

const site = 'https://homes-with-lewy.vercel.app';
const pages = {
  '/': {
    title: 'Homes with Lewy | Willstone Homes Developments in Kenya',
    description: 'Explore Willstone Homes developments in Ruiru, Juja, Joska and along Thika Superhighway. Lewis Njuguna works in IT support and is authorized to promote and sell homes for Willstone Homes.',
  },
  '/homes': {
    title: 'Homes | Homes with Lew¥',
    description: 'Explore Manna Residence near Ruiru, Mangu Grove behind Zetech University, Juja Grove along Juja Farm, and Whitepark 2 Estate in Joska. Ask about current details and availability.',
  },
  '/projects': {
    title: 'Projects and Developments | Homes with Lew¥',
    description: 'Explore shared Willstone Homes development information in Joska, Ruiru, Mangu and Juja. Confirm current prices and availability directly with Lewis.',
  },
  '/testimonials': {
    title: 'Testimonials | Homes with Lew¥',
    description: 'Read public feedback shared by visitors and submit your own experience. Feedback is reviewed before it appears.',
  },
  '/about-lewis': {
    title: 'About Lewis Njuguna | Homes with Lew¥',
    description: 'Meet Lewis Njuguna, an IT support professional authorized by Willstone Homes to promote and sell its homes.',
  },
  '/enquire': {
    title: 'Enquire About a Home | Homes with Lew¥',
    description: 'Contact Lewis Njuguna about Manna Residence, Mangu Grove, Juja Grove, Whitepark 2 Estate or a general home enquiry.',
  },
  '/how-it-works': {
    title: 'How It Works | Homes with Lew¥',
    description: 'Learn how to explore Willstone Homes developments, ask questions and confirm property details before making decisions.',
  },
  '/viewing-checklist': {
    title: 'Home Viewing Checklist | Homes with Lew¥',
    description: 'Use this practical checklist to prepare questions for a home viewing and follow up with Willstone Homes.',
  },
  '/buying-guide': {
    title: 'Home Buying Guide | Homes with Lew¥',
    description: 'A Kenya home-buying checklist covering independent legal advice, official title searches, costs, written terms and handover questions.',
  },
  '/faqs': {
    title: 'Frequently Asked Questions | Homes with Lew¥',
    description: 'Answers about Lewis Njuguna, Willstone Homes developments, property enquiries and confirming current details.',
  },
  '/willstone-homes': {
    title: 'Willstone Homes Developments | Homes with Lew¥',
    description: 'Explore development information Lewis Njuguna shares for Willstone Homes, including locations and prices provided for selected homes and plots.',
  },
  '/manna-residence': {
    title: 'Manna Residence, Ruiru | Homes with Lew¥',
    description: 'Manna Residence is 4 km from Ruiru town along Ruiru-Githurai Road. Explore 4-bedroom maisonettes and bungalows with DSQ; confirm current prices and availability.',
  },
  '/mangu-grove': {
    title: 'Mangu Grove Homes and Plots | Homes with Lew¥',
    description: 'Explore 3-bedroom bungalows with DSQ and 50-by-100 plots at Mangu Grove, off Exit 16 on Thika Superhighway behind Zetech University.',
  },
  '/juja-grove': {
    title: 'Juja Grove Residential Plots | Homes with Lew¥',
    description: 'Explore residential plots at Juja Grove, 3 km from Thika Superhighway along Juja Farm. Confirm plot size and current availability.',
  },
  '/areas': {
    title: 'Property Locations | Homes with Lew¥',
    description: 'Explore locations for developments shared by Lewis Njuguna for Willstone Homes, including Ruiru, Juja Farm, Joska and Thika Superhighway.',
  },
  '/privacy': {
    title: 'Privacy | Homes with Lew¥',
    description: 'Read how Homes with Lew¥ handles information submitted through the website enquiry form.',
  },
};

for (const project of projectData) {
  const meta = {
    title: `${project.name} | Homes with Lew¥`,
    description: project.seoDescription,
    canonical: `${site}/projects/${project.slug}`,
    ...(project.heroImage ? { ogImage: `${site}${project.heroImage.src}`, ogImageAlt: project.heroImage.alt } : {}),
  };
  pages[`/projects/${project.slug}`] = meta;
  if (['manna-residence', 'mangu-grove', 'juja-grove'].includes(project.slug)) pages[`/${project.slug}`] = meta;
}

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const shell = await readFile(path.resolve('dist/index.html'), 'utf8');
  const oldWindow = globalThis.window;

  for (const [route, meta] of Object.entries(pages)) {
    globalThis.window = { location: { pathname: route, search: '' } };
    const markup = renderToString(createElement(App));
    const canonical = meta.canonical || `${site}${route === '/' ? '/' : route}`;
    const html = shell
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${meta.description}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${meta.title}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${meta.description}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${meta.title}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${meta.description}" />`)
      .replace(/\s*<meta property="og:image"[^>]*\/>/, meta.ogImage ? `\n    <meta property="og:image" content="${meta.ogImage}" />` : '')
      .replace(/\s*<meta property="og:image:alt"[^>]*\/>/, meta.ogImageAlt ? `\n    <meta property="og:image:alt" content="${meta.ogImageAlt}" />` : '')
      .replace(/\s*<meta name="twitter:image"[^>]*\/>/, meta.ogImage ? `\n    <meta name="twitter:image" content="${meta.ogImage}" />` : '')
      .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
      .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);

    const output = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html);
  }

  // Give the client-rendered dashboard a real static entry point without
  // rewriting every unknown URL back to the homepage.
  globalThis.window = { location: { pathname: '/admin', search: '' } };
  const adminMarkup = renderToString(createElement(App));
  await mkdir('dist/admin', { recursive: true });
  await writeFile('dist/admin/index.html', shell.replace('<div id="root"></div>', `<div id="root">${adminMarkup}</div>`));

  // Vercel serves this file with HTTP 404 for paths that do not match a page.
  globalThis.window = { location: { pathname: '/__homes_with_lewy_not_found__', search: '' } };
  const notFoundMarkup = renderToString(createElement(App));
  const notFoundHtml = shell
    .replace('<div id="root"></div>', `<div id="root">${notFoundMarkup}</div>`)
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found | Homes with Lew¥</title>')
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="That page could not be found. Return home or browse homes on Homes with Lew¥." />')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="Page not found | Homes with Lew¥" />')
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, '<meta property="og:description" content="That page could not be found. Return home or browse homes on Homes with Lew¥." />')
    .replace(/\s*<meta property="og:url"[^>]*\/>/, '')
    .replace(/\s*<link rel="canonical"[^>]*\/>/, '')
    .replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
  await writeFile('dist/404.html', notFoundHtml);

  globalThis.window = oldWindow;
  console.log(`Prerendered ${Object.keys(pages).length} public pages, the owner dashboard, and a custom 404 page.`);
} finally {
  await server.close();
}
