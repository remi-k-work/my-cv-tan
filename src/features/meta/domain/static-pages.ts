// Shared definitions and localized copy for static pages and their markdown twins.

// services, features, and other libraries
import { pageField } from "@/domain/helpers";
import { absoluteUrl } from "./helpers";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";
import type { StaticPageCopy, StaticPageSettings } from "./models";

// constants
import {
  CONTACT_MD_HREF,
  CONTACT_PATH,
  EDUCATION_MD_HREF,
  EDUCATION_PATH,
  HOME_MD_HREF,
  HOME_PATH,
  HOME_TITLE,
  PERSON_DESCRIPTION,
  SITE_DESCRIPTION,
} from "./constants";

// Static page definitions shared between HTML heads and Markdown frontmatter.
export const STATIC_PAGES = {
  [HOME_PATH]: {
    mdHref: HOME_MD_HREF,
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
  [CONTACT_PATH]: {
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
