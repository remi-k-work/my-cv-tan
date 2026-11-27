// The static page catalogue: the authored identity, copy and Markdown twin of every static route
// It is one declaration shared by HTML heads, Markdown twins, the sitemap and the AI indexes, so a
// route added here is a route every surface picks up; it imports only domain vocabulary

// services, features, and other libraries
import { Record } from "effect";
import { msg } from "gt-i18n";
import { pageField } from "./helpers";
import { absoluteUrl } from "./urls";

// types
import type { PageIdentity, PagePath, PageTitles, PreferredLanguage } from "./models";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./constants";
import { HOME_TITLE, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "./site";

export type StaticPageType = "overview" | "education" | "contact";

// A static page resolved for one reader: the localized copy the HTML head, Markdown twin and sitemap all publish
export interface StaticPageCopy extends PageIdentity {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly pageName: string;
  readonly intro: string;
}

// The authored copy for one language, before loader overrides
interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

// One catalogue entry: the page identity plus its per-language copy
interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly indexSummary: string;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

// Static page definitions shared between HTML heads and Markdown frontmatter
export const STATIC_PAGES = {
  [HOME_PATH]: {
    mdHref: "/index.md",
    label: msg("Home page"),
    type: "overview",
    indexSummary: "portfolio overview with experience and project lists.",
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
    label: msg("Education & Certificates"),
    type: "education",
    indexSummary: "schools, courses and certificates.",
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
    label: msg("Contact"),
    type: "contact",
    indexSummary: "contact form, location and social profiles.",
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

export const STATIC_PAGE_PATHS = Record.keys(STATIC_PAGES);

// Resolves localized static page copy, falling back to static strings if loader titles are missing
// The titles are a loader payload, so they are only as complete as the request that produced them
export const staticPageCopy = (pageTitles: Partial<PageTitles>, pagePath: PagePath, preferredLanguage: PreferredLanguage): StaticPageCopy => {
  const { mdHref, type, copy } = STATIC_PAGES[pagePath];
  const { heading, intro, title, description } = copy[preferredLanguage];

  return {
    path: pagePath,
    mdHref,
    type,
    pageName: pageField(pageTitles, pagePath, "heading", heading),
    title,
    intro: pageField(pageTitles, pagePath, "intro", intro),
    description,
    canonical: absoluteUrl(pagePath),
    preferredLanguage,
  };
};
