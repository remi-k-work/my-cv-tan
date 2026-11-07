// Static page catalogue: the single source of truth for the site's three static pages
// (home, education, contact). Shared by HTML heads, Markdown twins, and the sitemap.

// services, features, and other libraries
import { pageField } from "@/domain/helpers";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { HOME_TITLE, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "./identity";
import { absoluteUrl } from "./urls";

// --- Page copy models ---

export type StaticPageType = "overview" | "education" | "contact";

// Localized identity shared by every static page surface (head, twin, JSON-LD).
export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

// Fully resolved copy for one static page in one language.
export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

// Static page definitions shared between HTML heads and Markdown frontmatter.
export const STATIC_PAGES = {
  [HOME_PATH]: {
    mdHref: "/index.md",
    label: "Home page",
    type: "overview",
    copy: {
      en: { heading: HOME_TITLE, intro: PERSON_DESCRIPTION, title: HOME_TITLE, description: SITE_DESCRIPTION },
      pl: {
        heading: "Programista stron internetowych w Rzeszowie",
        intro: "Ambitny samouk i programista stron internetowych. Tworzę nowoczesne aplikacje internetowe i ciągle się rozwijam.",
        title: "Programista stron internetowych w Rzeszowie",
        description: "Remi Forge to programista stron internetowych z Rzeszowa, który tworzy aplikacje z użyciem React, TypeScript i nowoczesnych technologii.",
      },
    },
  },
  [EDUCATION_PATH]: {
    mdHref: "/education.md",
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
  [CONTACT_PATH]: {
    mdHref: "/contact.md",
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

export const STATIC_PAGE_PATHS = Object.keys(STATIC_PAGES) as ReadonlyArray<keyof typeof STATIC_PAGES>;

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
