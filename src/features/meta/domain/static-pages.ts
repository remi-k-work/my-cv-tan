// Shared definitions and localized copy for static pages and their markdown twins.
import { Array, Record } from "effect";
import { pageField } from "@/domain/helpers";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";

// constants
import { CONTACT_MD_HREF, EDUCATION_MD_HREF, HOME_MD_HREF, HOME_TITLE, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "./constants";
import { absoluteUrl } from "./url";

type StaticPageType = "overview" | "education" | "contact";

export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

// Static page definitions shared between HTML heads and Markdown frontmatter.
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

// Static page paths for sitemaps and graph cross-links.
export const STATIC_PATHS: ReadonlyArray<PagePath> = Array.map(Record.keys(STATIC_PAGES), (path) => path as PagePath);

export const HOME_PATH: PagePath = "/";
export const EDUCATION_PATH: PagePath = "/education";
export const CONTACT_PATH: PagePath = "/contact";

// Resolves localized static page content and SEO summaries.
export const staticPageCopy = (pageTitles: PageTitles, pagePath: PagePath, preferredLanguage: PreferredLanguage): StaticPageCopy => {
  const { mdHref, type, copy } = STATIC_PAGES[pagePath];
  const { heading, intro, title, description } = copy[preferredLanguage];

  return {
    path: pagePath,
    mdHref,
    type,
    pageName: pageField(pageTitles, pagePath, "heading", heading),
    seoTitle: title,
    intro: pageField(pageTitles, pagePath, "intro", intro),
    description,
    canonical: absoluteUrl(pagePath),
    preferredLanguage,
  };
};
