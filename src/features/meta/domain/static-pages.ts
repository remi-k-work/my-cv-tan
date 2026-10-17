// services, features, and other libraries
import { pageField } from "@/domain/helpers";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";
import type { StaticPageCopy, StaticPageSettings } from "./models";

// constants
import { CONTACT_MD_HREF, EDUCATION_MD_HREF, HOME_MD_HREF, HOME_TITLE, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "./constants";
import { absoluteUrl } from "./url";

// Shared static-page settings keep the HTML head and Markdown frontmatter aligned
export const STATIC_PAGES = {
  "/": {
    mdHref: HOME_MD_HREF,
    fallbackHeading: HOME_TITLE,
    fallbackIntro: PERSON_DESCRIPTION,
    metadata: {
      en: { title: HOME_TITLE, description: SITE_DESCRIPTION },
      pl: {
        title: "Programista stron internetowych w Rzeszowie",
        description: "Remi Forge to programista stron internetowych z Rzeszowa, który tworzy aplikacje z użyciem React, TypeScript i nowoczesnych technologii.",
      },
    },
  },
  "/education": {
    mdHref: EDUCATION_MD_HREF,
    fallbackHeading: "Education",
    fallbackIntro: "Education & certificates.",
    metadata: {
      en: {
        title: "Education & Certificates",
        description: "Explore Remi Forge's Interactive Media degree, computer science studies, and web development certificates.",
      },
      pl: {
        title: "Wykształcenie i certyfikaty",
        description: "Poznaj wykształcenie Remiego Forge: studia z informatyki, dyplom z mediów interaktywnych i certyfikaty.",
      },
    },
  },
  "/contact": {
    mdHref: CONTACT_MD_HREF,
    fallbackHeading: "Contact",
    fallbackIntro: "Get in touch via the contact form.",
    metadata: {
      en: {
        title: "Contact",
        description: "Contact Remi Forge in Rzeszów, Poland about web development, collaboration, or project opportunities.",
      },
      pl: {
        title: "Kontakt",
        description: "Skontaktuj się z Remim Forge w sprawie tworzenia stron internetowych, współpracy lub projektów.",
      },
    },
  },
} as const satisfies Record<PagePath, StaticPageSettings>;

// Body copy can vary; SEO summaries stay stable, authored, and language-specific
export const staticPageCopy = (pageTitles: PageTitles, pagePath: PagePath, preferredLanguage: PreferredLanguage): StaticPageCopy => {
  const { fallbackHeading, fallbackIntro, metadata } = STATIC_PAGES[pagePath];
  const intro = pageField(pageTitles, pagePath, "intro", fallbackIntro);
  const localizedMetadata = metadata[preferredLanguage];

  return {
    heading: pageField(pageTitles, pagePath, "heading", fallbackHeading),
    seoTitle: localizedMetadata.title,
    intro,
    description: localizedMetadata.description,
    canonical: absoluteUrl(pagePath),
  };
};
