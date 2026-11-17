/**
 * Liquid Legacy Distribution: all site copy and editable facts in one place.
 *
 * Copy rules: plain, confident sentences. No em-dashes, no hype words, no invented
 * numbers, partners or testimonials. Facts we have: wine & spirits, national scope,
 * established 2026. Anything else stays empty until the client confirms it, and the
 * components hide empty fields.
 */

export const brand = {
  name: "Liquid Legacy Distribution",
  shortName: "Liquid Legacy",
  established: 2026,
  category: "Wine & Spirits Distribution",
} as const;

/** Public contact details. Leave a field empty to hide it on the site. */
export const contactDetails = {
  email: "", // e.g. "partners@yourdomain.com" (waiting on the client)
  phone: "", // e.g. "+1 (212) 555-0100"
  location: "", // e.g. "New York, NY"
} as const;

/** States we actively serve (two-letter codes). Empty = no coverage claims on the map. */
export const coverage: { states: string[] } = {
  states: [],
};

/** Accessibility strings. */
export const a11y = {
  skipToContent: "Skip to content",
} as const;

export const nav = [
  { label: "About", href: "/#legacy" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "Partners", href: "/#partners" },
  { label: "Contact", href: "/#contact" },
] as const;

export const headerCta = { label: "Partner with us", href: "/#contact" } as const;

/** Header and mobile menu labels (screen-reader names included). */
export const headerUi = {
  logoAlt: "Liquid Legacy Distribution",
  navLabel: "Primary",
  menu: "Menu",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  close: "Close",
} as const;

export const hero = {
  eyebrow: "Wine and spirits distribution, established 2026",
  title: "Built to carry a legacy.",
  lede:
    "Liquid Legacy Distribution moves fine wine and spirits from the people who make them to the retailers, restaurants and bars who pour them.",
  primaryCta: { label: "Partner with us", href: "/#contact" },
  secondaryCta: { label: "Our services", href: "/#services" },
  video: {
    pauseLabel: "Pause background video",
    playLabel: "Play background video",
  },
} as const;

export const legacy = {
  id: "legacy",
  label: "Our legacy",
  title: "A distributor built around the bottle.",
  paragraphs: [
    "Every bottle carries the work of a family, a vineyard or a distillery. Our job is to bring it to the right shelf and the right table in the condition it left the cellar, with its story intact.",
    "Liquid Legacy Distribution was founded in 2026 to do that work at national scale without losing the care of a small importer. We keep our portfolio focused, our people close to the accounts they serve, and our partners informed.",
  ],
  principles: [
    {
      number: "I",
      title: "Stewardship",
      body: "We handle every brand as if it were our own, from how it is stored to how it is presented on the shelf.",
    },
    {
      number: "II",
      title: "Reach",
      body: "Sales, warehousing and delivery under one roof, built to grow market by market.",
    },
    {
      number: "III",
      title: "Accountability",
      body: "Clear numbers, straight answers and one team that owns the result.",
    },
  ],
  crestAlt: "The Liquid Legacy Distribution crest: a gold shield with a tree, a griffin, a lion and a portcullis, beneath a crown and laurel wreath.",
  barrelAlt: "The head of an old oak barrel with iron hoops, resting in a dark cellar.",
  sealImage: {
    src: "/media/legacy-seal.jpg",
    alt: "The neck of an aged bottle closed with a dripping red wax seal, resting on a barrel head.",
  },
} as const;

export const services = {
  id: "services",
  label: "What we do",
  title: "Everything between the producer and the pour.",
  intro: "One partner for the full route to market, with a dedicated team behind every brand we carry.",
  items: [
    {
      number: "01",
      title: "Sales & Market Development",
      image: { src: "/media/service-sales.jpg", alt: "A leather carrier of sample bottles on a walnut bar beside a corkscrew and a linen cloth." },
      body: "Account-level selling to chains, independent shops and on-premise accounts, backed by a written plan for every market we enter.",
    },
    {
      number: "02",
      title: "Route to Market",
      image: { src: "/media/service-route.jpg", alt: "A restaurant dining room set with white linen and wine glasses before evening service." },
      body: "Off-premise and on-premise coverage that places your brand in the stores, restaurants, bars and hotels that suit it.",
    },
    {
      number: "03",
      title: "Warehousing & Inventory",
      image: { src: "/media/service-warehousing.jpg", alt: "Wine bottles resting on their sides in tall racks inside a dim warehouse." },
      body: "Secure, organized storage with accurate counts, careful rotation and clear visibility of stock.",
    },
    {
      number: "04",
      title: "Logistics & Delivery",
      image: { src: "/media/service-logistics.jpg", alt: "The open rear doors of a delivery trailer loaded with strapped cases at dusk." },
      body: "Scheduled deliveries and proper handling from our dock to the account’s back door.",
    },
    {
      number: "05",
      title: "Compliance & Licensing",
      image: { src: "/media/service-compliance.jpg", alt: "A leather ledger and a fountain pen on a desk under a brass lamp." },
      body: "We work within the three-tier system and keep registrations, price postings and state requirements in order.",
    },
    {
      number: "06",
      title: "Brand Building & Trade Marketing",
      image: { src: "/media/service-brand.jpg", alt: "A row of wine glasses with tasting pours set out on a bar for staff training." },
      body: "Staff training, tastings, menu placements and point-of-sale programs that move product off the shelf, not just onto it.",
    },
  ],
} as const;

/** Named processSection (not `process`) so it never shadows Node's global `process`. */
export const processSection = {
  id: "process",
  label: "From cellar to counter",
  title: "How a bottle travels with us.",
  steps: [
    {
      number: "01",
      title: "Select",
      points: ["Tasting and quality review", "Pricing and market fit", "A written plan for launch"],
      body: "We build a focused portfolio. Every brand is tasted, reviewed and given a clear plan before we take it to market.",
      image: { src: "/media/process-select.jpg", alt: "A tasting table set with wine glasses, spirits tumblers, a notebook and a pen." },
    },
    {
      number: "02",
      title: "Store",
      points: ["Receiving and inspection on arrival", "Accurate counts and stock rotation", "Secure, organized storage"],
      body: "Product arrives at our warehouse, where it is checked in, counted and stored properly until it ships.",
      image: { src: "/media/process-store.jpg", alt: "A long warehouse aisle of racking stacked with wooden wine crates and cases." },
    },
    {
      number: "03",
      title: "Sell",
      points: ["Account-by-account selling", "Shelf and menu placement", "Staff education and tastings"],
      body: "Our sales team places it with the retailers, restaurants and bars where it belongs, and keeps it there.",
      image: { src: "/media/process-sell.jpg", alt: "A crystal glass on a marble bar in front of softly lit shelves of bottles." },
    },
    {
      number: "04",
      title: "Deliver",
      points: ["Scheduled delivery routes", "Careful handling to the back door", "Delivery records and account reporting"],
      body: "Orders are picked, loaded and delivered on schedule, case by case and account by account.",
      image: { src: "/media/process-deliver.jpg", alt: "A white box truck at the open loading dock of a brick warehouse at dawn." },
    },
  ],
} as const;

export const partners = {
  id: "partners",
  label: "Partners",
  title: "Two sides of one table.",
  panels: [
    {
      key: "supplier",
      title: "For producers & brand owners",
      body: "Wineries, distilleries and importers looking for a distributor that will sell the brand, not just stock it.",
      points: [
        "A dedicated brand manager",
        "A market plan with clear targets",
        "Regular depletion and account reporting",
        "Compliant pricing and registrations",
      ],
      cta: { label: "Submit your brand", href: "/?inquiry=supplier#contact" },
      image: { src: "/media/partners-cellar.jpg", alt: "Oak barrels resting in a vaulted stone cellar lit by warm lamps." },
    },
    {
      key: "trade",
      title: "For retail & hospitality",
      body: "Shops, restaurants, bars and hotels looking for a portfolio worth recommending and a team that shows up.",
      points: [
        "A curated wine and spirits portfolio",
        "Reliable, scheduled delivery",
        "Staff training and tastings",
        "One point of contact for your account",
      ],
      cta: { label: "Open an account", href: "/?inquiry=retail#contact" },
      image: { src: "/media/partners-shop.jpg", alt: "Wine bottles resting in diamond racks in a wine shop under a brass lamp." },
    },
  ],
} as const;

export const standards = {
  id: "standards",
  label: "Our standards",
  title: "How we do business.",
  image: { src: "/media/standards-case.jpg", alt: "An open wooden wine case lined with straw, holding six bottles, on an oak table in window light." },
  items: [
    { title: "Compliance first", body: "We follow federal and state alcohol laws in every market we serve. No shortcuts." },
    { title: "Responsible marketing", body: "Our brands are marketed to adults of legal drinking age, and only to them." },
    { title: "Careful handling", body: "Product is stored, moved and delivered the way its maker intended." },
    { title: "Straight answers", body: "Partners hear the good news and the bad news from us first." },
  ],
} as const;

export const reach = {
  id: "reach",
  label: "Reach",
  title: "Built for national scale.",
  body:
    "We are building coverage market by market across the United States. Tell us where you sell, or where you want to be, and we will tell you plainly how we can help.",
  emptyNote: "Ask us about availability in your state.",
  mapLabel: "Map of the United States",
  /** Shown beside the map only once `coverage.states` has entries. */
  legend: "States we serve",
} as const;

export const inquiryTypes = [
  { value: "supplier", label: "Producer or brand owner" },
  { value: "importer", label: "Importer" },
  { value: "retail", label: "Retailer" },
  { value: "on-premise", label: "Restaurant, bar or hotel" },
  { value: "media", label: "Media" },
  { value: "careers", label: "Careers" },
  { value: "other", label: "Other" },
] as const;

export type InquiryType = (typeof inquiryTypes)[number]["value"];

export const usStates = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const;

export const contact = {
  id: "contact",
  label: "Contact",
  title: "Start a conversation.",
  intro: "Tell us about your brand or your business, and the right person on our team will be in touch.",
  fields: {
    name: "Full name",
    company: "Company",
    email: "Email",
    phone: "Phone (optional)",
    inquiryType: "I am a",
    state: "State",
    message: "How can we help?",
    consent: "I am 21 or older and I agree to the privacy policy.",
  },
  submit: "Send inquiry",
  sending: "Sending",
  success: {
    title: "Thank you.",
    body: "Your inquiry has been sent. We will be in touch.",
  },
  error: "Your message could not be sent. Please try again in a moment.",
  rateLimited: "Too many messages from this connection. Please try again later.",
  outsideUs: "Outside the United States",
  selectPlaceholder: "Select one",
  statePlaceholder: "Select a state",
  honeypot: "Leave this field empty",
  privacyLink: { label: "Privacy policy", href: "/privacy" },
  emailInstead: "You can also email us at",
  detailLabels: { email: "Email", phone: "Phone", location: "Office" },
  guidance: [
    {
      title: "Producers & brand owners",
      body: "Tell us about your brand, where it sells today and the markets you want to reach.",
    },
    {
      title: "Retail & hospitality",
      body: "Tell us about your business, where you are located and the categories you buy.",
    },
  ],
  errorSummary: "Please check the highlighted fields.",
  validation: {
    name: "Please enter your name.",
    company: "Please enter your company name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a shorter phone number.",
    inquiryType: "Please choose the option that describes you.",
    state: "Please choose a state.",
    message: "Please tell us a little about your inquiry.",
    consent: "Please confirm you are 21 or older and agree to the privacy policy.",
    tooLong: "This is too long.",
  },
  busy: "We are receiving a high volume of inquiries right now. Please try again shortly.",
} as const;

export const ageGate = {
  title: "Are you of legal drinking age?",
  body: "You must be 21 or older to enter this site.",
  confirm: "I am 21 or older",
  decline: "I am under 21",
  declineUrl: "https://www.responsibility.org/",
  legal: "By entering, you agree to our terms of use and privacy policy.",
  /** localStorage key and lifetime of the confirmation. */
  storageKey: "lld-age-confirmed",
  rememberDays: 30,
} as const;

export const footer = {
  /** Closing screen (the footer bookends the hero). */
  closing: {
    title: "Let's carry your legacy.",
    body: "Tell us about your wines and spirits, and where you want them to be.",
    cta: { label: "Partner with us", href: "/#contact" },
    image: { src: "/media/hero-poster.jpg", alt: "" },
  },
  tagline: "Wine & spirits distribution. Est. 2026.",
  responsibility: "Please enjoy responsibly.",
  ageNotice: "You must be of legal drinking age to visit this site.",
  legalLinks: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  copyright: `© ${brand.established} Liquid Legacy Distribution. All rights reserved.`,
  /** Agency credit (Arvin approved naming AlchemyDev). */
  credit: { prefix: "Designed and built by", name: "AlchemyDev", href: "https://alchemydev.io" },
  navHeading: "Company",
  contactHeading: "Contact",
  legalHeading: "Legal",
  /** The official crest with its lettering (crest-full.png) reads as the company name. */
  crestAlt: "Liquid Legacy Distribution",
} as const;

/** Legal pages (Privacy, Terms, Accessibility). The policy text itself lives in each page file. */
export const legalPages = {
  label: "Legal",
  updated: "Last updated: November 17, 2026",
  privacy: {
    title: "Privacy policy",
    description: "How Liquid Legacy Distribution collects, uses and protects information submitted through this website.",
  },
  terms: {
    title: "Terms of use",
    description: "The terms that apply to your use of the Liquid Legacy Distribution website.",
  },
  accessibility: {
    title: "Accessibility",
    description: "Our commitment to an accessible website, and how to tell us about a barrier.",
  },
} as const;

export const notFound = {
  label: "Error 404",
  title: "This page could not be found.",
  body: "The address may be mistyped, or the page may have moved. Everything we offer is on our home page.",
  cta: { label: "Return home", href: "/" },
} as const;

export const seo = {
  title: "Liquid Legacy Distribution | Wine & Spirits Distribution",
  description:
    "Liquid Legacy Distribution is a wine and spirits distributor connecting producers with retailers, restaurants and bars across the United States. Established 2026.",
} as const;
