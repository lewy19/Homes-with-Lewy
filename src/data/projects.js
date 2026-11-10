/**
 * Canonical, public project details for the project-page sample.
 * Add only information confirmed by Lewis/Willstone Homes. Omit unknown fields.
 * @typedef {'selling'|'sold out'|'coming soon'} ProjectStatus
 * @typedef {{label:string, bedrooms?:number, bathrooms?:number, dsq?:boolean, price?:number, priceNotes?:string}} ProjectUnitType
 * @typedef {{src:string, alt:string, caption?:string, kind?:'render'|'site-photo'}} ProjectImage
 * @typedef {{deposit?:string, balanceTerms?:string, duration?:string}} ProjectPaymentPlan
 * @typedef {{slug:string, name:string, location:{area:string, landmarkRoad:string}, status?:ProjectStatus, unitTypes?:ProjectUnitType[], priceFrom?:number, priceNotes?:string, plotSize?:string, titleStatus?:string, features?:string[], security?:string, water?:string, electricity?:string, gated?:boolean, driveTimes?:{landmark:string, time:string}[], gallery?:ProjectImage[], heroImage?:ProjectImage, floorPlan?:ProjectImage, videoUrl?:string, brochureUrl?:string, mapUrl?:string, coordinates?:{latitude:number, longitude:number}, lastVerified?:string, description:string, seoDescription:string}}
 * @typedef {Object} Project
 * @property {string} slug
 * @property {string} name
 * @property {{area:string, landmarkRoad:string}} location
 * @property {ProjectStatus} [status]
 * @property {ProjectUnitType[]} [unitTypes]
 * @property {number} [priceFrom]
 * @property {ProjectImage[]} [gallery]
 * @property {ProjectImage} [heroImage]
 * @property {ProjectImage} [floorPlan]
 * @property {ProjectPaymentPlan} [paymentPlan]
 * @property {string} [plotSize]
 * @property {string} [titleStatus]
 * @property {string[]} [features]
 * @property {string} [security]
 * @property {string} [water]
 * @property {string} [electricity]
 * @property {boolean} [gated]
 * @property {{landmark:string, time:string}[]} [driveTimes]
 * @property {string} [videoUrl]
 * @property {string} [brochureUrl]
 * @property {string} [mapUrl]
 * @property {{latitude:number, longitude:number}} [coordinates]
 * @property {string} [lastVerified]
 * @property {string} description
 * @property {string} seoDescription
 */

/** @type {Project[]} */
export const projects = [
  {
    slug: 'whitepark-2-estate',
    name: 'Whitepark 2 Estate',
    location: { area: 'Joska', landmarkRoad: 'Along Kangundo Road, near the Greater Eastern Bypass' },
    description: 'A gated community of 3-bedroom bungalows with DSQ, cabro-paved driveways, an own compound and a garden.',
    unitTypes: [{ label: '3-bedroom bungalow', bedrooms: 3, dsq: true }],
    plotSize: '50 by 100',
    features: ['Cabro-paved driveway', 'Own compound', 'Garden'],
    gated: true,
    heroImage: {
      src: '/images/whitepark-2-estate/whitepark-render-01.jpeg',
      alt: 'Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents',
      caption: 'Architectural render Â· illustrative design, not a photo of a completed home',
      kind: 'render',
    },
    gallery: [
      { src: '/images/whitepark-2-estate/whitepark-render-01.jpeg', alt: 'Architectural render of a proposed Whitepark 2 bungalow with a pitched roof and stone accents', caption: 'Architectural render Â· illustrative design', kind: 'render' },
      { src: '/images/whitepark-2-estate/whitepark-render-02.jpeg', alt: 'Second architectural view of a proposed Whitepark 2 bungalow and driveway', caption: 'Architectural render Â· illustrative design', kind: 'render' },
      { src: '/images/whitepark-2-estate/progress-08.jpg', alt: 'Aerial site-progress photo showing rows of unfinished homes and surrounding greenery at Whitepark 2', caption: 'Site progress photo Â· conditions may have changed', kind: 'site-photo' },
      { src: '/images/whitepark-2-estate/progress-12.jpg', alt: 'Site-progress photo looking down a central access road between homes at Whitepark 2', caption: 'Site progress photo Â· conditions may have changed', kind: 'site-photo' },
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Joska%2C+Kangundo+Road%2C+near+Greater+Eastern+Bypass',
    seoDescription: 'Explore Whitepark 2 Estate in Joska, near Kangundo Road and the Greater Eastern Bypass: 3-bedroom bungalows with DSQ, private gardens and cabro-paved driveways.',
  },
  {
    slug: 'manna-residence',
    name: 'Manna Residence',
    location: { area: 'Ruiru', landmarkRoad: '4 km from Ruiru town, along Ruiru-Githurai Road' },
    description: 'A development blending 4-bedroom maisonettes and bungalows, each featuring a DSQ.',
    unitTypes: [
      { label: '4-bedroom maisonette', bedrooms: 4, dsq: true, price: 20500000, priceNotes: 'KSh 20.5 million, as shared; confirm current price.' },
      { label: '4-bedroom bungalow', bedrooms: 4, dsq: true, price: 15500000, priceNotes: 'KSh 15.5 million, as shared; confirm current price.' },
    ],
    priceFrom: 15500000,
    priceNotes: 'Bungalows from KSh 15.5 million; maisonettes KSh 20.5 million. Confirm current prices.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ruiru-Githurai+Road%2C+Ruiru%2C+Kenya',
    seoDescription: 'Manna Residence is 4 km from Ruiru town along Ruiru-Githurai Road, with 4-bedroom maisonettes and bungalows, each with a DSQ. Shared prices start at KSh 15.5 million.',
  },
  {
    slug: 'mangu-grove',
    name: 'Mangu Grove',
    location: { area: 'Thika Superhighway', landmarkRoad: 'Off Exit 16, behind Zetech University' },
    description: 'A residential development offering modern 3-bedroom bungalows with DSQ and 50-by-100 plots.',
    unitTypes: [
      { label: '3-bedroom bungalow', bedrooms: 3, dsq: true, price: 13850000, priceNotes: 'KSh 13.85 million, as shared; confirm current price.' },
      { label: 'Residential plot', price: 3950000, priceNotes: 'KSh 3.95 million for a 50-by-100 plot, as shared; confirm current price.' },
    ],
    priceFrom: 3950000,
    priceNotes: 'Plots from KSh 3.95 million; bungalows KSh 13.85 million. Confirm current prices.',
    plotSize: '50 by 100',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Exit+16%2C+Thika+Superhighway%2C+near+Zetech+University%2C+Kenya',
    seoDescription: 'Explore Mangu Grove, off Exit 16 on Thika Superhighway behind Zetech University, with 3-bedroom bungalows with DSQ and 50-by-100 plots.',
  },
  {
    slug: 'juja-grove',
    name: 'Juja Grove',
    location: { area: 'Juja Farm', landmarkRoad: '3 km from Thika Superhighway' },
    description: 'Prime residential plots in Juja Farm, 3 km from Thika Superhighway.',
    unitTypes: [{ label: 'Residential plot', price: 3750000, priceNotes: 'KSh 3.75 million, as shared; confirm current price.' }],
    priceFrom: 3750000,
    priceNotes: 'Residential plots from KSh 3.75 million, as shared; confirm current price.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Juja+Farm%2C+Kenya',
    seoDescription: 'Juja Grove offers residential plots in Juja Farm, 3 km from Thika Superhighway. Shared price: KSh 3.75 million; confirm current price and details.',
  },
];

export const projectBySlug = Object.fromEntries(projects.map(project => [project.slug, project]));

export function projectStartingPrice(project) {
  if (Number.isFinite(project.priceFrom)) return project.priceFrom;
  const prices = (project.unitTypes || []).map(unit => unit.price).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : undefined;
}

