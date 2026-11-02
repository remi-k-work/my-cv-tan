// services, features, and other libraries
import { Array, Record } from "effect";
import { pageField } from "@/domain/helpers";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";

// constants
import { CONTACT_MD_HREF, EDUCATION_MD_HREF, HOME_MD_HREF, HOME_TITLE, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "./constants";
import { absoluteUrl } from "./url";

// The three static-page kinds
type StaticPageType = "overview" | "education" | "contact";

// Visible page name and summary, the pair every JSON-LD node and breadcrumb beside the page table
// reads. It lives here because the table is what produces it.
export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

// Everything one static page declares per language: visible copy plus authored search metadata.
interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

// Resolved static-page copy: visible copy plus authored search metadata. Heads and Markdown twins
// both consume this, so the HTML and .md documents cannot drift apart.
export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  // Search and share title is authored separately from the longer body heading
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

// Everything the static-page table declares per page. The per-language value is named above
// because the table is keyed by language: adding a locale is a "missing key" type error here instead
// of a silent positional mismatch.
//
// `label` is the GT dictionary key naming the page for a reader of a sibling twin. It lives in this
// table rather than in the Markdown twin graph because it describes the page, not the graph.
export interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

// Shared static-page settings keep the HTML head and the Markdown frontmatter aligned. Every
// per-language fact about a page lives in that page's own `copy` record, and the `mdHref` the twin
// routes serve is read off the same row the HTML head reads its twin link from.
export const STATIC_PAGES = {
  "/": {
    mdHref: HOME_MD_HREF,
    label: "Home page",
    type: "overview",
    copy: {
      en: { heading: HOME_TITLE, intro: PERSON_DESCRIPTION, title: HOME_TITLE, description: SITE_DESCRIPTION },
      pl: {
        heading: "Programista stron internetowych w Rzeszowie",
        intro: "Ambitny, samoukiem programista stron internetowych. Tworzę nowoczesne aplikacje internetowe i ciągle się rozwijam.",
        title: "Programista stron internetowych w Rzeszowie",
        description: "Remi Forge to programista stron internetowych z Rzeszowa, który tworzy aplikacje z użyciem React, TypeScript i nowoczesnych technologii.",
      },
    },
  },
  "/education": {
    mdHref: EDUCATION_MD_HREF,
    label: "Education & Certificates",
    type: "education",
    copy: {
      en: {
        heading: "Education",
        intro: "Education & certificates.",
        title: "Education & Certificates",
        description: "Explore Remi Forge's Interactive Media degree, computer science studies, and web development certificates.",
      },
      pl: {
        heading: "Wykształcenie",
        intro: "Wykształcenie i certyfikaty.",
        title: "Wykształcenie i certyfikaty",
        description: "Poznaj wykształcenie Remiego Forge: studia z informatyki, dyplom z mediów interaktywnych i certyfikaty.",
      },
    },
  },
  "/contact": {
    mdHref: CONTACT_MD_HREF,
    label: "Contact",
    type: "contact",
    copy: {
      en: {
        heading: "Contact",
        intro: "Get in touch via the contact form.",
        title: "Contact",
        description: "Contact Remi Forge in Rzeszów, Poland about web development, collaboration, or project opportunities.",
      },
      pl: {
        heading: "Kontakt",
        intro: "Skontaktuj się przez formularz kontaktowy.",
        title: "Kontakt",
        description: "Skontaktuj się z Remim Forge w sprawie tworzenia stron internetowych, współpracy lub projektów.",
      },
    },
  },
} as const satisfies Record<PagePath, StaticPageSettings>;

// The one enumeration of the static pages. The HTML head, the sitemap, the twin routes and the twins'
// own cross-links all walk it, so a page declared above is picked up everywhere at once.
export const STATIC_PATHS: ReadonlyArray<PagePath> = Array.map(Record.keys(STATIC_PAGES), (path) => path as PagePath);

// The three paths as named constants. Typed as `PagePath`, which the table above is checked against
// with `satisfies`, so a constant is a key of the table by construction.
export const HOME_PATH: PagePath = "/";
export const EDUCATION_PATH: PagePath = "/education";
export const CONTACT_PATH: PagePath = "/contact";

// Body copy can vary; SEO summaries stay stable, authored, and language-specific. Both the head and
// the twin read the same entry here, so neither surface re-decides which copy wins.
export const staticPageCopy = (pageTitles: PageTitles, pagePath: PagePath, preferredLanguage: PreferredLanguage): StaticPageCopy => {
  const { mdHref, type, copy } = STATIC_PAGES[pagePath];
  const { heading, intro, title, description } = copy[preferredLanguage];

  return {
    path: pagePath,
    mdHref,
    type,
    // A missing authored heading degrades into the page's own language rather than falling back to English
    pageName: pageField(pageTitles, pagePath, "heading", heading),
    seoTitle: title,
    intro: pageField(pageTitles, pagePath, "intro", intro),
    description,
    canonical: absoluteUrl(pagePath),
    preferredLanguage,
  };
};
