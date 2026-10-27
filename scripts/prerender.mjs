import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const site = 'https://homes-with-lewy.vercel.app';
const pages = {
  '/': {
    title: 'Lewis Njuguna Property Portfolio | Homes with Lew¥',
    description: 'Explore homes and residential developments in Kenya shared by Lewis Njuguna, an IT support professional who also promotes and sells homes for Willstone Homes. See Manna Residence, Mangu Grove, Juja Grove and Whitepark 2 Estate.',
  },
  '/homes': {
    title: 'Homes | Homes with Lew¥',
    description: 'Browse Willstone Homes listings shared by Lewis Njuguna. Listing details are published after verification; confirm current availability directly.',
  },
  '/about-lewis': {
    title: 'About Lewis Njuguna | Homes with Lew¥',
    description: 'Meet Lewis Njuguna, an IT support professional who also promotes and sells homes for Willstone Homes.',
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
    description: 'A general guide to organising your home search and questions about property, financing and legal details.',
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
    const canonical = `${site}${route === '/' ? '/' : route}`;
    const html = shell
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${meta.description}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${meta.title}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${meta.description}" />`)
      .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
      .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);

    const output = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html);
  }

  globalThis.window = oldWindow;
  console.log(`Prerendered ${Object.keys(pages).length} public pages.`);
} finally {
  await server.close();
}
